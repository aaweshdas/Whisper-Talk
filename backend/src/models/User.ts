import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  avatar: string;
  password?: string;
  googleId?: string;
  authProvider: "email" | "google";
  blockedUsers: mongoose.Types.ObjectId[];
  bio?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    avatar: { type: String, default: "" },
    password: { type: String, select: false },
    googleId: { type: String, unique: true, sparse: true },
    authProvider: { type: String, enum: ["email", "google"], default: "email" },
    blockedUsers: [{ type: Schema.Types.ObjectId, ref: "User" }],
    bio: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
