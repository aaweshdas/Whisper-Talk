import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "../lib/axios";

export const useMuteChat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chatId) => {
      const { data } = await axios.patch(`/chats/${chatId}/mute`);
      return { chatId, ...data };
    },
    onSuccess: ({ chatId, isMuted }) => {
      queryClient.setQueryData(["chats"], (oldChats) => {
        if (!oldChats) return oldChats;
        return oldChats.map((chat) => 
          chat._id === chatId ? { ...chat, isMuted } : chat
        );
      });
      queryClient.setQueryData(["chat", chatId], (oldChat) => {
        if (!oldChat) return oldChat;
        return { ...oldChat, isMuted };
      });
    },
  });
};
