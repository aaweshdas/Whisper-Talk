import { create } from "zustand";
import { io } from "socket.io-client";
import { showMessageToast } from "../components/MessageToast";

const SOCKET_URL = import.meta.env.VITE_API_URL;

export const useSocketStore = create((set, get) => ({
  socket: null,
  onlineUsers: new Set(),
  typingUsers: new Map(), // chatId -> userId
  queryClient: null,
  activeChatId: null, // chatId the user currently has open; null = not in a chat

  setActiveChatId: (chatId) => set({ activeChatId: chatId }),

  // WebRTC Call State (always video+audio — no voice-only mode)
  incomingCall: null, // { from, name, avatar, signal }
  callState: "idle", // idle | calling | ringing | connected | ended
  remoteSignal: null,
  activeCallUserId: null,
  iceCandidates: [],

  connect: (token, queryClient, userId) => {
    const existingSocket = get().socket;
    if (existingSocket?.connected || !queryClient) return;
    if (existingSocket) existingSocket.disconnect();

    const socket = io(SOCKET_URL, { auth: { token } });

    socket.on("connect", () => {
      console.log("[socket] connected:", socket.id);
      if (userId) socket.emit("join", userId);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connect error:", err.message);
    });

    // Online presence
    socket.on("online-users", (userIds) => {
      set({ onlineUsers: new Set(Array.isArray(userIds) ? userIds : []) });
    });

    // Typing indicators (backend uses user-typing / user-stopped-typing)
    socket.on("user-typing", ({ chatId, userId }) => {
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.set(chatId, userId);
        return { typingUsers };
      });
    });
    socket.on("user-stopped-typing", ({ chatId }) => {
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.delete(chatId);
        return { typingUsers };
      });
    });
    // Legacy compat
    socket.on("typing", ({ userId, chatId, isTyping }) => {
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        if (isTyping) typingUsers.set(chatId, userId);
        else typingUsers.delete(chatId);
        return { typingUsers };
      });
    });

    // New message
    socket.on("new-message", (message) => {
      queryClient.setQueryData(["messages", message.chat], (old) => {
        if (!old) return [message];
        const filtered = old.filter((m) => !String(m._id).startsWith("temp-"));
        const exists = filtered.some((m) => m._id === message._id);
        return exists ? filtered : [...filtered, message];
      });

      queryClient.setQueryData(["chats"], (oldChats) =>
        oldChats?.map((chat) =>
          chat._id === message.chat
            ? {
                ...chat,
                lastMessage: {
                  _id: message._id,
                  text: message.deletedForEveryone ? "This message was deleted" : message.text,
                  sender: message.sender,
                  createdAt: message.createdAt,
                },
                lastMessageAt: message.createdAt,
              }
            : chat
        )
      );

      // Clear typing indicator
      set((state) => {
        const typingUsers = new Map(state.typingUsers);
        typingUsers.delete(message.chat);
        return { typingUsers };
      });

      // ── In-app toast notification ───────────────────────────────────────
      const senderId =
        typeof message.sender === "object"
          ? message.sender?._id
          : message.sender;

      // Only notify for messages from other users
      if (senderId === userId) return;

      // Determine delivery vs read status based on active chat
      if (get().activeChatId === message.chat) {
        get().socket?.emit("mark-read", { chatId: message.chat, userId });
      } else {
        get().socket?.emit("mark-delivered", { chatId: message.chat, userId, messageIds: [message._id] });
      }

      // Suppress toast if the user is currently viewing this exact conversation
      if (get().activeChatId === message.chat) return;

      // Check if chat is muted
      const chats = queryClient.getQueryData(["chats"]);
      const chat = chats?.find((c) => c._id === message.chat);
      if (chat?.isMuted) return;

      const senderName =
        typeof message.sender === "object"
          ? message.sender?.name ?? message.sender?.username ?? ""
          : "";

      // Show toast since they aren't looking at the chat
      showMessageToast({
        senderName,
        text: message.deletedForEveryone ? "This message was deleted" : message.text,
        chatId: message.chat,
      });
    });

    // Real-time reaction updates
    socket.on("message-reaction", ({ messageId, reactions }) => {
      queryClient.setQueriesData({ queryKey: ["messages"] }, (old) =>
        old?.map((m) => (m._id === messageId ? { ...m, reactions } : m))
      );
    });

    // Real-time message edits
    socket.on("message-edited", ({ messageId, text, editedAt }) => {
      queryClient.setQueriesData({ queryKey: ["messages"] }, (old) =>
        old?.map((m) => (m._id === messageId ? { ...m, text, editedAt } : m))
      );
    });

    // Real-time deletions
    socket.on("message-deleted", ({ messageId }) => {
      queryClient.setQueriesData({ queryKey: ["messages"] }, (old) =>
        old?.map((m) =>
          m._id === messageId
            ? { ...m, deletedForEveryone: true, text: "This message was deleted" }
            : m
        )
      );
    });

    // Messages read by other user
    socket.on("messages-read", ({ chatId, readBy }) => {
      queryClient.setQueryData(["messages", chatId], (old) =>
        old?.map((m) => {
          if (m.sender?._id === readBy) return m;
          const alreadyRead = m.readBy?.some((r) => r.user === readBy || r.user?._id === readBy);
          if (alreadyRead) return m;
          return {
            ...m,
            readBy: [...(m.readBy || []), { user: readBy, readAt: new Date().toISOString() }],
          };
        })
      );
      // Reset unread count
      queryClient.setQueryData(["chats"], (old) =>
        old?.map((c) => (c._id === chatId ? { ...c, unreadCount: 0 } : c))
      );
    });

    // Messages delivered to other user
    socket.on("messages-delivered", ({ chatId, deliveredTo, messageIds }) => {
      queryClient.setQueryData(["messages", chatId], (old) =>
        old?.map((m) => {
          if (!messageIds.includes(m._id)) return m;
          if (m.sender?._id === deliveredTo) return m;
          const alreadyDelivered = m.deliveredTo?.some((r) => r.user === deliveredTo || r.user?._id === deliveredTo);
          if (alreadyDelivered) return m;
          return {
            ...m,
            deliveredTo: [...(m.deliveredTo || []), { user: deliveredTo, deliveredAt: new Date().toISOString() }],
          };
        })
      );
    });

    // Chat-level updates (new message while chat not open)
    socket.on("chat-updated", ({ chatId, lastMessage, lastMessageAt, unreadIncrement }) => {
      queryClient.setQueryData(["chats"], (old) =>
        old?.map((c) =>
          c._id === chatId
            ? {
                ...c,
                lastMessage,
                lastMessageAt,
                unreadCount: (c.unreadCount || 0) + (unreadIncrement || 0),
              }
            : c
        )
      );
    });

    // ── WebRTC Signaling Events ──────────────────────────────────────────────
    socket.on("call-user", ({ from, name, avatar, signal, type }) => {
      set({ incomingCall: { from, name, avatar, signal, type }, callState: "ringing" });
    });

    socket.on("call-accepted", (signal) => {
      set({ callState: "connected", remoteSignal: signal });
    });

    socket.on("call-rejected", () => {
      set({ callState: "ended", activeCallUserId: null });
      setTimeout(() => set({ callState: "idle" }), 2000);
    });

    socket.on("call-ended", () => {
      set({ callState: "ended", incomingCall: null, activeCallUserId: null });
      setTimeout(() => set({ callState: "idle" }), 2000);
    });

    socket.on("webrtc-ice-candidate", (candidate) => {
      set((state) => ({ iceCandidates: [...state.iceCandidates, candidate] }));
    });

    set({ socket, queryClient });
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ socket: null, onlineUsers: new Set(), typingUsers: new Map(), queryClient: null });
    }
  },

  joinChat: (chatId) => get().socket?.emit("join-chat", chatId),
  leaveChat: (chatId) => get().socket?.emit("leave-chat", chatId),

  sendMessage: (chatId, text, currentUser, replyTo = null) => {
    const { socket, queryClient } = get();
    if (!socket?.connected || !queryClient) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      chat: chatId,
      sender: {
        _id: currentUser._id,
        name: currentUser.name || currentUser.fullName || currentUser.firstName || "You",
        email: currentUser.email || currentUser.primaryEmailAddress?.emailAddress || "",
        avatar: currentUser.avatar || currentUser.imageUrl,
      },
      text,
      replyTo: replyTo ? { _id: replyTo._id, text: replyTo.text, sender: replyTo.sender } : null,
      reactions: [],
      readBy: [],
      createdAt: new Date().toISOString(),
    };

    queryClient.setQueryData(["messages", chatId], (old) =>
      old ? [...old, optimisticMessage] : [optimisticMessage]
    );

    socket.emit("send-message", {
      chatId,
      text,
      senderId: currentUser._id,
      replyTo: replyTo?._id || null,
    });

    socket.once("socket-error", () => {
      queryClient.setQueryData(["messages", chatId], (old) =>
        old?.filter((m) => m._id !== tempId)
      );
    });
  },

  setTyping: (chatId, isTyping, userId) => {
    const s = get().socket;
    if (!s) return;
    if (isTyping) s.emit("typing-start", { chatId, userId });
    else s.emit("typing-stop", { chatId, userId });
  },

  reactToMessage: (messageId, chatId, emoji, userId) => {
    get().socket?.emit("react-message", { messageId, chatId, userId, emoji });
  },

  emitEditMessage: (messageId, chatId, text, editedAt) => {
    get().socket?.emit("edit-message", { messageId, chatId, text, editedAt });
  },

  emitDeleteMessage: (messageId, chatId, deleteFor) => {
    get().socket?.emit("delete-message", { messageId, chatId, deleteFor });
  },

  markRead: (chatId, userId) => {
    get().socket?.emit("mark-read", { chatId, userId });
  },

  markDelivered: (chatId, userId, messageIds) => {
    get().socket?.emit("mark-delivered", { chatId, userId, messageIds });
  },

  // ── WebRTC Actions (always video+audio) ──────────────────────────────────
  activeCallType: "video", // "video" | "voice"
  startCall: (userToCallId, type = "video") => {
    set({ callState: "calling", activeCallUserId: userToCallId, activeCallType: type, iceCandidates: [], remoteSignal: null });
  },

  initiateCall: (userToCall, signalData, currentUser, type = "video") => {
    get().socket?.emit("call-user", {
      userToCall,
      signalData,
      from: currentUser._id,
      name: currentUser.name || currentUser.fullName || currentUser.firstName || "You",
      avatar: currentUser.avatar || currentUser.imageUrl,
      type,
    });
  },

  answerCall: (to, signal) => {
    set({ callState: "connected", incomingCall: null, activeCallUserId: to, iceCandidates: [] });
    get().socket?.emit("answer-call", { to, signal });
  },

  rejectCall: (to) => {
    set({ incomingCall: null, callState: "idle" });
    if (to) get().socket?.emit("reject-call", { to });
  },

  endCall: (to) => {
    set({ callState: "idle", incomingCall: null, activeCallUserId: null, remoteSignal: null, iceCandidates: [] });
    if (to) get().socket?.emit("end-call", { to });
  },

  sendIceCandidate: (to, candidate) => {
    if (to) get().socket?.emit("webrtc-ice-candidate", { to, candidate });
  },

  clearCallState: () => {
     set({ callState: "idle", incomingCall: null, activeCallUserId: null, remoteSignal: null, iceCandidates: [] });
  }
}));
