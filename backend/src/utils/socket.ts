import { Server, type Socket } from "socket.io";
import type { Server as HttpServer } from "http";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import { Types } from "mongoose";

// ── In-memory online user map ─────────────────────────────────────────────────
let _io: Server | null = null;
const onlineUsers = new Map<string, Set<string>>(); // userId → Set of socketIds

export function getIO(): Server {
  if (!_io) throw new Error("Socket.io not initialized");
  return _io;
}

export function initializeSocket(httpServer: HttpServer) {
  const allowedSocketOrigins = [
    "http://localhost:5173",
    "http://localhost:8081",
    "https://whisper-talk-five.vercel.app",
    ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(",").map(u => u.trim()) : []),
    ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",").map(u => u.trim()) : []),
  ].filter(Boolean);

  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedSocketOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Socket CORS: origin ${origin} not allowed`));
      },
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    // ── JOIN ─────────────────────────────────────────────────────────────────
    socket.on("join", (userId: string) => {
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, new Set());
      }
      onlineUsers.get(userId)!.add(socket.id);
      socket.join(userId); // personal room
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });

    // ── JOIN CHAT ─────────────────────────────────────────────────────────────
    socket.on("join-chat", (chatId: string) => {
      socket.join(chatId);
    });

    socket.on("leave-chat", (chatId: string) => {
      socket.leave(chatId);
    });

    // ── SEND MESSAGE ─────────────────────────────────────────────────────────
    socket.on(
      "send-message",
      async (data: { chatId: string; senderId: string; text: string; replyTo?: string }) => {
        try {
          const { chatId, senderId, text, replyTo } = data;
          if (!chatId || !senderId || !text?.trim()) return;

          const chat = await Chat.findOne({ _id: chatId, participants: senderId }).lean();
          if (!chat) return;

          // FAST PATH: Fetch minimal sender info and broadcast immediately to eliminate perceived latency
          const mongoose = require("mongoose");
          const User = require("../models/User").User;
          const sender = await User.findById(senderId).select("name email avatar").lean();
          
          const messageId = new mongoose.Types.ObjectId();
          const now = new Date();
          
          // Construct the optimistic payload
          const fastMsg = {
            _id: messageId,
            chat: chatId,
            sender: sender,
            text: text.trim(),
            replyTo: replyTo ? { _id: replyTo } : null,
            createdAt: now,
            deletedForEveryone: false
          };

          // Broadcast immediately to ALL participants (including sender for cross-device sync)
          chat.participants.forEach((p: any) => {
            io.to(p.toString()).emit("new-message", fastMsg);
          });

          // SLOW PATH: Save to database asynchronously in the background
          const msg = await Message.create({
            _id: messageId,
            chat: chatId,
            sender: senderId,
            text: text.trim(),
            replyTo: replyTo ? new Types.ObjectId(replyTo) : null,
            readBy: [{ user: new Types.ObjectId(senderId), readAt: now }],
            deliveredTo: [{ user: new Types.ObjectId(senderId), deliveredAt: now }],
            createdAt: now,
          });

          // Increment unread for other participants
          const others = chat.participants.filter((p: any) => p.toString() !== senderId);
          await Chat.updateOne(
            { _id: chatId },
            {
              $set: { lastMessage: messageId, lastMessageAt: now },
            }
          );
          
          // Update unread counts individually
          for (const otherId of others) {
            await Chat.updateOne(
              { _id: chatId, "unreadCounts.user": otherId },
              { $inc: { "unreadCounts.$.count": 1 } }
            );
            // If they didn't have an unread count entry, push it
            await Chat.updateOne(
              { _id: chatId, "unreadCounts.user": { $ne: otherId } },
              { $push: { unreadCounts: { user: otherId, count: 1 } } }
            );
          }

          // Update chats in sidebar for offline users
          for (const otherId of others) {
            io.to(otherId.toString()).emit("chat-updated", {
              chatId,
              lastMessage: msg,
              lastMessageAt: chat.lastMessageAt,
              unreadIncrement: 1,
            });
          }
        } catch (err) {
          console.error("[socket] send-message error:", err);
        }
      }
    );

    // ── TYPING ───────────────────────────────────────────────────────────────
    socket.on("typing-start", ({ chatId, userId }: { chatId: string; userId: string }) => {
      socket.to(chatId).emit("user-typing", { chatId, userId });
    });

    socket.on("typing-stop", ({ chatId, userId }: { chatId: string; userId: string }) => {
      socket.to(chatId).emit("user-stopped-typing", { chatId, userId });
    });

    // ── REACT TO MESSAGE ─────────────────────────────────────────────────────
    socket.on("react-message", async (data: { messageId: string; userId: string; emoji: string }) => {
      try {
        const { messageId, userId, emoji } = data;
        const message = await Message.findById(messageId).populate("sender", "name email avatar");
        if (!message) return;

        io.to(message.chat.toString()).emit("message-reaction", {
          messageId,
          reactions: message.reactions,
        });
      } catch (err) {
        console.error("[socket] react-message error:", err);
      }
    });

    // ── EDIT MESSAGE ─────────────────────────────────────────────────────────
    socket.on("edit-message", async (data: { messageId: string; chatId: string; text: string; editedAt: string }) => {
      io.to(data.chatId).emit("message-edited", {
        messageId: data.messageId,
        text: data.text,
        editedAt: data.editedAt,
      });
    });

    // ── DELETE MESSAGE ────────────────────────────────────────────────────────
    socket.on(
      "delete-message",
      (data: { messageId: string; chatId: string; deleteFor: "me" | "everyone" }) => {
        if (data.deleteFor === "everyone") {
          io.to(data.chatId).emit("message-deleted", {
            messageId: data.messageId,
            chatId: data.chatId,
          });
        } else {
          socket.emit("message-deleted-for-me", { messageId: data.messageId });
        }
      }
    );

    // ── MARK READ ────────────────────────────────────────────────────────────
    socket.on("mark-read", async (data: { chatId: string; userId: string }) => {
      try {
        const { chatId, userId } = data;

        await Message.updateMany(
          { chat: chatId, sender: { $ne: userId }, "readBy.user": { $ne: userId } },
          { $push: { readBy: { user: new Types.ObjectId(userId), readAt: new Date() } } }
        );

        await Chat.updateOne(
          { _id: chatId },
          { $set: { "unreadCounts.$[elem].count": 0 } },
          { arrayFilters: [{ "elem.user": new Types.ObjectId(userId) }] }
        );

        // Tell the chat that messages were read
        socket.to(chatId).emit("messages-read", { chatId, readBy: userId });
        
        // Also inform users directly in case they don't have the chat open
        const chat = await Chat.findById(chatId);
        if (chat) {
           chat.participants.forEach((p) => {
             io.to(p.toString()).emit("messages-read", { chatId, readBy: userId });
           });
        }
      } catch (err) {
        console.error("[socket] mark-read error:", err);
      }
    });
    
    // ── MARK DELIVERED ────────────────────────────────────────────────────────
    socket.on("mark-delivered", async (data: { messageIds: string[]; userId: string; chatId: string }) => {
      try {
        const { messageIds, userId, chatId } = data;
        if (!messageIds || messageIds.length === 0) return;

        await Message.updateMany(
          { _id: { $in: messageIds }, "deliveredTo.user": { $ne: userId } },
          { $push: { deliveredTo: { user: new Types.ObjectId(userId), deliveredAt: new Date() } } }
        );
        
        const chat = await Chat.findById(chatId);
        if (chat) {
           chat.participants.forEach((p) => {
             io.to(p.toString()).emit("messages-delivered", { messageIds, deliveredTo: userId, chatId });
           });
        }
      } catch (err) {
        console.error("[socket] mark-delivered error:", err);
      }
    });

    // ── VIDEO CALLING WEBRTC SIGNALING ───────────────────────────────────────
    socket.on("call-user", (data: { userToCall: string; signalData: any; from: string; name: string; avatar: string; type: string }) => {
      io.to(data.userToCall).emit("call-user", {
        signal: data.signalData,
        from: data.from,
        name: data.name,
        avatar: data.avatar,
        type: data.type
      });
    });

    socket.on("answer-call", (data: { to: string; signal: any }) => {
      io.to(data.to).emit("call-accepted", data.signal);
    });

    socket.on("reject-call", (data: { to: string }) => {
      io.to(data.to).emit("call-rejected");
    });

    socket.on("end-call", (data: { to: string }) => {
      io.to(data.to).emit("call-ended");
    });

    socket.on("webrtc-ice-candidate", (data: { to: string; candidate: any }) => {
      io.to(data.to).emit("webrtc-ice-candidate", data.candidate);
    });

    // ── DISCONNECT ────────────────────────────────────────────────────────────
    socket.on("disconnect", async () => {
      for (const [uid, socketIds] of onlineUsers.entries()) {
        if (socketIds.has(socket.id)) {
          socketIds.delete(socket.id);
          
          if (socketIds.size === 0) {
            onlineUsers.delete(uid);
            try {
              const User = require("../models/User").User;
              await User.findByIdAndUpdate(uid, { lastSeen: new Date() });
            } catch (err) {
              console.error("[socket] update lastSeen error:", err);
            }
          }
          break;
        }
      }
      io.emit("online-users", Array.from(onlineUsers.keys()));
    });
  });

  _io = io;
  return io;
}
