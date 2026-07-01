import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSocketStore } from "../lib/socket";
import { useAuthStore } from "../lib/auth";

export const useSocketConnection = (activeChatId) => {
  const { status, user, getToken } = useAuthStore();
  const isAuthenticated = status === "authenticated";
  const queryClient = useQueryClient();

  const { socket, connect, disconnect, joinChat, leaveChat, setActiveChatId } = useSocketStore();

  // Connect socket when authenticated; disconnect on logout
  useEffect(() => {
    if (isAuthenticated) {
      const token = getToken();
      if (token) connect(token, queryClient, user?._id);
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect, queryClient, user?._id, getToken]);

  // Join / leave chat rooms — also track which chat is active for toast suppression
  useEffect(() => {
    if (activeChatId && socket) {
      joinChat(activeChatId);
      setActiveChatId(activeChatId); // suppress notifications for this chat
      return () => {
        leaveChat(activeChatId);
        setActiveChatId(null);       // allow notifications again
      };
    }
  }, [activeChatId, socket, joinChat, leaveChat, setActiveChatId]);
};
