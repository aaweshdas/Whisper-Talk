import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../lib/axios";

// Token is auto-attached by the axios interceptor in lib/axios.js — no need
// to pass it manually to every request.

// ── Fetch all chats ───────────────────────────────────────────────────────────
export const useChats = () =>
  useQuery({
    queryKey: ["chats"],
    queryFn: async () => {
      const res = await api.get("/chats");
      return res.data;
    },
  });

// ── Get or create a 1:1 chat ──────────────────────────────────────────────────
export const useGetOrCreateChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (participantId) => {
      const res = await api.get(`/chats/${participantId}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["chats"] }),
  });
};

// ── Pin / unpin a chat ────────────────────────────────────────────────────────
export const useTogglePinChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId) => {
      const res = await api.patch(`/chats/${chatId}/pin`);
      return { ...res.data, chatId };
    },
    onSuccess: ({ chatId, isPinned }) => {
      queryClient.setQueryData(["chats"], (old) =>
        old?.map((c) => (c._id === chatId ? { ...c, isPinned } : c))
      );
    },
  });
};

// ── Archive / unarchive a chat ────────────────────────────────────────────────
export const useToggleArchiveChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId) => {
      const res = await api.patch(`/chats/${chatId}/archive`);
      return { ...res.data, chatId };
    },
    onSuccess: ({ chatId, isArchived }) => {
      queryClient.setQueryData(["chats"], (old) =>
        old?.map((c) => (c._id === chatId ? { ...c, isArchived } : c))
      );
    },
  });
};

// ── Mute / unmute a chat ──────────────────────────────────────────────────────
export const useToggleMuteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId) => {
      const res = await api.patch(`/chats/${chatId}/mute`);
      return { ...res.data, chatId };
    },
    onSuccess: ({ chatId, isMuted }) => {
      queryClient.setQueryData(["chats"], (old) =>
        old?.map((c) => (c._id === chatId ? { ...c, isMuted } : c))
      );
    },
  });
};
