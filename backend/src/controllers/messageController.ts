import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { Message } from "../models/Message";
import { Chat } from "../models/Chat";
import { Types } from "mongoose";
import { getIO } from "../utils/socket";

// ── GET messages for a chat ───────────────────────────────────────────────────
export async function getMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const messages = await Message.find({
      chat: chatId,
      deletedBy: { $ne: userId }, // hide "deleted for me" messages
    })
      .populate("sender", "name email avatar")
      .populate("replyTo", "text sender attachment")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Send a message ────────────────────────────────────────────────────────────────
export async function sendMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;
    const { text, replyTo } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: "Message text is required" });

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const message = await Message.create({
      chat: chatId,
      sender: userId,
      text: text.trim(),
      ...(replyTo ? { replyTo } : {}),
    });

    const populated = await message.populate("sender", "name email avatar");

    // Update chat's lastMessage and lastMessageAt
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt,
    });

    // Emit to all participants via Socket.io
    try {
      const io = getIO();
      chat.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("newMessage", populated);
      });
    } catch (_) {
      // socket not critical — message is already saved
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Send a message with attachment ────────────────────────────────────────────
export async function sendAttachment(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;
    const { text, replyTo } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: "Attachment file is required" });

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const attachmentUrl = `/uploads/${file.filename}`;

    const message = await Message.create({
      chat: chatId,
      sender: userId,
      text: text?.trim() || "",
      attachment: {
        url: attachmentUrl,
        type: file.mimetype,
        name: file.originalname,
      },
      ...(replyTo ? { replyTo } : {}),
    });

    const populated = await message.populate("sender", "name email avatar");

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      lastMessageAt: message.createdAt,
    });

    try {
      const io = getIO();
      chat.participants.forEach((participantId) => {
        io.to(participantId.toString()).emit("newMessage", populated);
      });
    } catch (_) {}

    res.status(201).json(populated);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── React to a message ────────────────────────────────────────────────────────
export async function reactToMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) return res.status(400).json({ message: "Emoji is required" });

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    const existing = message.reactions.find((r) => r.userId.toString() === userId);

    if (existing) {
      if (existing.emoji === emoji) {
        // Remove reaction (toggle off)
        message.reactions = message.reactions.filter((r) => r.userId.toString() !== userId);
      } else {
        // Update emoji
        existing.emoji = emoji;
      }
    } else {
      message.reactions.push({ userId: new Types.ObjectId(userId), emoji });
    }

    await message.save();
    await message.populate("sender", "name email avatar");

    res.json(message);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Edit a message ────────────────────────────────────────────────────────────
export async function editMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { messageId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) return res.status(400).json({ message: "Text is required" });

    const message = await Message.findOne({ _id: messageId, sender: userId });
    if (!message) return res.status(404).json({ message: "Message not found or not yours" });

    message.text = text.trim();
    message.editedAt = new Date();
    await message.save();
    await message.populate("sender", "name email avatar");

    res.json(message);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Delete a message ──────────────────────────────────────────────────────────
export async function deleteMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { messageId } = req.params;
    const { deleteFor } = req.body; // "me" | "everyone"

    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    if (deleteFor === "everyone") {
      if (message.sender.toString() !== userId) {
        return res.status(403).json({ message: "Cannot delete another user's message for everyone" });
      }
      message.deletedForEveryone = true;
      message.text = "This message was deleted";
    } else {
      // Delete for me only
      if (!message.deletedBy.some((id) => id.toString() === userId)) {
        message.deletedBy.push(new Types.ObjectId(userId));
      }
    }

    await message.save();
    res.json({ success: true, messageId, deleteFor });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Mark messages as read ─────────────────────────────────────────────────────
export async function markAsRead(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;

    // Mark all unread messages in this chat (not sent by me) as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        "readBy.user": { $ne: userId },
      },
      {
        $push: { readBy: { user: new Types.ObjectId(userId), readAt: new Date() } },
      }
    );

    // Reset unread count for this user in this chat
    await Chat.updateOne(
      { _id: chatId },
      { $set: { "unreadCounts.$[elem].count": 0 } },
      { arrayFilters: [{ "elem.user": new Types.ObjectId(userId) }] }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Search messages within a chat ─────────────────────────────────────────────
export async function searchMessages(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { chatId } = req.params;
    const q = (req.query.q as string)?.trim();

    if (!q) return res.json([]);

    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return res.status(404).json({ message: "Chat not found" });

    const messages = await Message.find({
      chat: chatId,
      deletedForEveryone: false,
      deletedBy: { $ne: userId },
      text: { $regex: q, $options: "i" },
    })
      .populate("sender", "name email avatar")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(messages);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ── Forward a message ─────────────────────────────────────────────────────────
export async function forwardMessage(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { messageId } = req.params;
    const { targetChatId } = req.body;

    const original = await Message.findById(messageId);
    if (!original || original.deletedForEveryone) {
      return res.status(404).json({ message: "Message not found" });
    }

    const targetChat = await Chat.findOne({ _id: targetChatId, participants: userId });
    if (!targetChat) return res.status(404).json({ message: "Target chat not found" });

    const forwarded = await Message.create({
      chat: targetChatId,
      sender: userId,
      text: original.text,
      attachment: original.attachment,
      isForwarded: true,
    });

    targetChat.lastMessage = forwarded._id;
    targetChat.lastMessageAt = new Date();
    await targetChat.save();

    await forwarded.populate("sender", "name email avatar");
    res.status(201).json(forwarded);
  } catch (error) {
    res.status(500);
    next(error);
  }
}
