import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../lib/axios";

export const useSendAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ chatId, formData }) => {
      const { data } = await axios.post(`/messages/${chatId}/attachment`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return data;
    },
    onSuccess: (newMessage) => {
      // Optimistically update the cache
      queryClient.setQueryData(["messages", newMessage.chat], (oldMessages) => {
        if (!oldMessages) return [newMessage];
        // Don't add duplicate if socket already added it
        if (oldMessages.find((m) => m._id === newMessage._id)) return oldMessages;
        return [...oldMessages, newMessage];
      });

      // Also update the chat list to show the new message as lastMessage
      queryClient.setQueryData(["chats"], (oldChats) => {
        if (!oldChats) return oldChats;
        return oldChats.map((chat) => {
          if (chat._id === newMessage.chat) {
            return {
              ...chat,
              lastMessage: newMessage,
              lastMessageAt: newMessage.createdAt,
            };
          }
          return chat;
        }).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));
      });
    },
  });
};
