import mongoose, { Schema, type Document } from "mongoose";

export interface IReaction {
  userId: mongoose.Types.ObjectId;
  emoji: string;
}

export interface IReadReceipt {
  user: mongoose.Types.ObjectId;
  readAt: Date;
}

export interface IMessage extends Document {
  chat: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  text: string;
  replyTo?: mongoose.Types.ObjectId;
  attachment?: {
    url: string;
    type: string;
    name: string;
  };
  reactions: IReaction[];
  readBy: IReadReceipt[];
  deletedForEveryone: boolean;
  deletedBy: mongoose.Types.ObjectId[];
  editedAt?: Date;
  isForwarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReactionSchema = new Schema<IReaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    emoji: { type: String, required: true },
  },
  { _id: false }
);

const ReadReceiptSchema = new Schema<IReadReceipt>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    chat: { type: Schema.Types.ObjectId, ref: "Chat", required: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: false, trim: true },
    replyTo: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    attachment: {
      url: { type: String },
      type: { type: String },
      name: { type: String },
    },
    reactions: { type: [ReactionSchema], default: [] },
    readBy: { type: [ReadReceiptSchema], default: [] },
    deletedForEveryone: { type: Boolean, default: false },
    deletedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    editedAt: { type: Date, default: null },
    isForwarded: { type: Boolean, default: false },
  },
  { timestamps: true }
);

MessageSchema.index({ chat: 1, createdAt: 1 });
MessageSchema.index({ chat: 1, "readBy.user": 1 });

export const Message = mongoose.model("Message", MessageSchema);
