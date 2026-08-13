import mongoose, { Schema, type Document } from "mongoose";

export interface IMutedEntry {
  user: mongoose.Types.ObjectId;
  until: Date | null; // null = forever
}

export interface IChat extends Document {
  participants: mongoose.Types.ObjectId[];
  isGroupChat?: boolean;
  chatName?: string;
  groupAdmin?: mongoose.Types.ObjectId;
  groupAvatar?: string;
  lastMessage?: mongoose.Types.ObjectId;
  lastMessageAt?: Date;
  pinnedBy: mongoose.Types.ObjectId[];
  archivedBy: mongoose.Types.ObjectId[];
  mutedBy: IMutedEntry[];
  unreadCounts: { user: mongoose.Types.ObjectId; count: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const MutedSchema = new Schema<IMutedEntry>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    until: { type: Date, default: null },
  },
  { _id: false }
);

const ChatSchema = new Schema<IChat>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    isGroupChat: { type: Boolean, default: false },
    chatName: { type: String, trim: true },
    groupAdmin: { type: Schema.Types.ObjectId, ref: "User" },
    groupAvatar: { type: String, default: "" },
    lastMessage: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    lastMessageAt: { type: Date, default: Date.now },
    pinnedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    archivedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    mutedBy: { type: [MutedSchema], default: [] },
    unreadCounts: {
      type: [
        {
          user: { type: Schema.Types.ObjectId, ref: "User" },
          count: { type: Number, default: 0 },
        },
      ],
      default: [],
      _id: false,
    },
  },
  { timestamps: true }
);

ChatSchema.index({ participants: 1 });
ChatSchema.index({ lastMessageAt: -1 });

export const Chat = mongoose.model("Chat", ChatSchema);
