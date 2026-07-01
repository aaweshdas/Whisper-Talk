import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { Chat } from "../models/Chat";
import { Types } from "mongoose";

// ── Format a chat document for API response ───────────────────────────────────
function formatChat(chat: any, userId: string) {
  const otherParticipant = chat.participants.find((p: any) => p._id.toString() !== userId);
  const isPinned = chat.pinnedBy?.some((id: any) => id.toString() === userId);
  const isArchived = chat.archivedBy?.some((id: any) => id.toString() === userId);
  const mutedEntry = chat.mutedBy?.find((m: any) => m.user.toString() === userId);
  const isMuted = !!mutedEntry && (!mutedEntry.until || new Date(mutedEntry.until) > new Date());
  const unreadEntry = chat.unreadCounts?.find((u: any) => u.user.toString() === userId);

  return {
    _id: chat._id,
    participant: otherParticipant ?? null,
    lastMessage: chat.lastMessage,
    lastMessageAt: chat.lastMessageAt,
    createdAt: chat.createdAt,
    isPinned,
    isArchived,
    isMuted,
    unreadCount: unreadEntry?.count || 0,
  };
}

// ── Get all chats ─────────────────────────────────────────────────────────────
export async function getChats(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;

    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name email avatar")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "name" } })
      .sort({ lastMessageAt: -1 });

    const formatted = chats.map((chat) => formatChat(chat, userId));

    // Sort: pinned first, then by lastMessageAt
    formatted.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });

    res.json(formatted);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Get or create a chat ──────────────────────────────────────────────────────
export async function getOrCreateChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { participantId } = req.params;

    if (!participantId) return res.status(400).json({ message: "Participant ID is required" });
    if (!Types.ObjectId.isValid(participantId)) return res.status(400).json({ message: "Invalid participant ID" });
    if (userId === participantId) return res.status(400).json({ message: "Cannot create chat with yourself" });

    let chat = await Chat.findOne({ participants: { $all: [userId, participantId] } })
      .populate("participants", "name email avatar")
      .populate({ path: "lastMessage", populate: { path: "sender", select: "name" } });

    if (!chat) {
      const newChat = new Chat({ participants: [userId, participantId] });
      await newChat.save();
      chat = await newChat.populate("participants", "name email avatar");
    }

    res.json(formatChat(chat, userId));
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Pin / unpin a chat ────────────────────────────────────────────────────────
export async function togglePinChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isPinned = chat.pinnedBy.some((id) => id.toString() === userId);
    if (isPinned) {
      chat.pinnedBy = chat.pinnedBy.filter((id) => id.toString() !== userId);
    } else {
      chat.pinnedBy.push(new Types.ObjectId(userId));
    }

    await chat.save();
    res.json({ isPinned: !isPinned });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Archive / unarchive a chat ────────────────────────────────────────────────
export async function toggleArchiveChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const isArchived = chat.archivedBy.some((id) => id.toString() === userId);
    if (isArchived) {
      chat.archivedBy = chat.archivedBy.filter((id) => id.toString() !== userId);
    } else {
      chat.archivedBy.push(new Types.ObjectId(userId));
    }

    await chat.save();
    res.json({ isArchived: !isArchived });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Mute / unmute a chat ──────────────────────────────────────────────────────
export async function toggleMuteChat(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const muteIndex = chat.mutedBy.findIndex((m) => m.user.toString() === userId);
    if (muteIndex >= 0) {
      chat.mutedBy.splice(muteIndex, 1);
    } else {
      chat.mutedBy.push({ user: new Types.ObjectId(userId), until: null });
    }

    await chat.save();
    res.json({ isMuted: muteIndex < 0 });
  } catch (error) {
    res.status(500);
    next(error);
  }
}
