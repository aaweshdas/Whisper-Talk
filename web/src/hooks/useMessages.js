import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";
import { useCurrentUser } from "./useCurrentUser";

// Token is auto-attached by the axios interceptor in lib/axios.js

// ── Fetch messages for a chat ─────────────────────────────────────────────────
export const useMessages = (chatId) =>
  useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      const res = await api.get(`/messages/${chatId}`);
      return res.data;
    },
    enabled: !!chatId,
  });

// ── Send a message ────────────────────────────────────────────────────────────────
export const useSendMessage = (chatId) => {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();

  return useMutation({
    mutationFn: async ({ text, replyTo }) => {
      const res = await api.post(`/messages/${chatId}`, { text, replyTo });
      return res.data;
    },
    onMutate: async ({ text, replyTo }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["messages", chatId] });

      // Snapshot the previous value
      const previousMessages = queryClient.getQueryData(["messages", chatId]);

      // Optimistically update to the new value
      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        _id: tempId,
        chat: chatId,
        sender: {
          _id: currentUser?._id || "me",
          name: currentUser?.name || "You",
          email: currentUser?.email || "",
          avatar: currentUser?.avatar || "",
        },
        text,
        replyTo: replyTo ? { _id: replyTo, text: "Replying..." } : null,
        reactions: [],
        readBy: [],
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return [optimisticMessage];
        return [...old, optimisticMessage];
      });

      return { previousMessages, tempId };
    },
    onError: (err, newTodo, context) => {
      // Rollback on error
      if (context?.previousMessages) {
        queryClient.setQueryData(["messages", chatId], context.previousMessages);
      }
    },
    onSuccess: (newMessage, variables, context) => {
      // Replace optimistic message with the real one from the server
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (!old) return [newMessage];
        // Replace the temp message
        return old.map((m) => m._id === context?.tempId ? newMessage : m);
      });
      queryClient.invalidateQueries({ queryKey: ["chats"] });
    },
  });
};


// ── Mark as read ──────────────────────────────────────────────────────────────
export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId) => {
      await api.post(`/messages/${chatId}/read`);
    },
    onSuccess: (_, chatId) => {
      queryClient.setQueryData(["chats"], (old) =>
        old?.map((c) => (c._id === chatId ? { ...c, unreadCount: 0 } : c))
      );
    },
  });
};

// ── React to a message ─────────────────────────────────────────────────────────
export const useReactToMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, chatId, emoji }) => {
      const res = await api.post(`/messages/${messageId}/react`, { emoji });
      return { data: res.data, chatId };
    },
    onSuccess: ({ data, chatId }) => {
      queryClient.setQueryData(["messages", chatId], (old) =>
        old?.map((m) => (m._id === data._id ? { ...m, reactions: data.reactions } : m))
      );
    },
  });
};

// ── Edit a message ────────────────────────────────────────────────────────────
export const useEditMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, chatId, text }) => {
      const res = await api.patch(`/messages/${messageId}`, { text });
      return { data: res.data, chatId };
    },
    onSuccess: ({ data, chatId }) => {
      queryClient.setQueryData(["messages", chatId], (old) =>
        old?.map((m) =>
          m._id === data._id ? { ...m, text: data.text, editedAt: data.editedAt } : m
        )
      );
    },
  });
};

// ── Delete a message ──────────────────────────────────────────────────────────
export const useDeleteMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ messageId, chatId, deleteFor }) => {
      await api.delete(`/messages/${messageId}`, { data: { deleteFor } });
      return { messageId, chatId, deleteFor };
    },
    onSuccess: ({ messageId, chatId, deleteFor }) => {
      queryClient.setQueryData(["messages", chatId], (old) => {
        if (deleteFor === "everyone") {
          return old?.map((m) =>
            m._id === messageId
              ? { ...m, deletedForEveryone: true, text: "This message was deleted" }
              : m
          );
        }
        return old?.filter((m) => m._id !== messageId);
      });
    },
  });
};

// ── Search messages ───────────────────────────────────────────────────────────
export const useSearchMessages = (chatId) =>
  useMutation({
    mutationFn: async (q) => {
      const res = await api.get(`/messages/${chatId}/search`, { params: { q } });
      return res.data;
    },
  });

// ── Forward a message ─────────────────────────────────────────────────────────
export const useForwardMessage = () => {
  return useMutation({
    mutationFn: async ({ messageId, targetChatId }) => {
      const res = await api.post(`/messages/${messageId}/forward`, { targetChatId });
      return res.data;
    }
  });
};
