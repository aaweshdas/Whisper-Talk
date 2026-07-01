import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";

export type AuthRequest = Request & {
  userId?: string;
};

/**
 * Protects routes using our own JWT (signed with JWT_SECRET).
 *
 * All clients — Flutter mobile and the React web app — now authenticate via
 * the custom JWT issued at /api/auth/register and /api/auth/login.
 * The former Clerk fallback path has been removed since the web client was
 * migrated to JWT-based auth.
 *
 * Token format:  Authorization: Bearer <jwt>
 * JWT payload:   { userId: string }
 */
export const protectRoute = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized — no token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    req.userId = user._id.toString();
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized — invalid or expired token" });
  }
};
