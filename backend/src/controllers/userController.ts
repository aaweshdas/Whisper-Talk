import type { Response, NextFunction } from "express";
import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";

export async function getUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;

    const users = await User.find({ _id: { $ne: userId } })
      .select("name email avatar")
      .limit(50);

    res.json(users);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function searchUsers(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId;
    const q = (req.query.q as string)?.trim();

    if (!q) return res.json([]);

    const regex = new RegExp(q, "i");
    const users = await User.find({
      _id: { $ne: userId },
      $or: [{ name: regex }, { email: regex }],
    })
      .select("name email avatar")
      .limit(20);

    res.json(users);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

export async function updateUserProfile(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const userId = req.userId!;
    const { name } = req.body;
    const file = req.file;

    const updateData: any = {};
    if (name?.trim()) {
      updateData.name = name.trim();
    }
    if (file) {
      updateData.avatar = `/uploads/${file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      select: "-password",
    });

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    res.json(updatedUser);
  } catch (error) {
    res.status(500);
    next(error);
  }
}
