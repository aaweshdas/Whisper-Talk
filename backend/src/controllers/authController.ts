import type { NextFunction, Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { User } from "../models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client();

function signToken(userId: string) {
  return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: "30d" });
}

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────

export async function getMe(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password)
      return res.status(400).json({ message: "Name, username, email and password are required" });

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(409).json({ message: "Email already in use" });

    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(409).json({ message: "Username already in use" });

    const hashed = await bcrypt.hash(password, 12);
    const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=F4A261&color=fff&size=200`;

    const user = await User.create({
      name,
      username,
      email,
      password: hashed,
      avatar,
      authProvider: "email",
    });

    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: { _id: user._id, name: user.name, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ─── POST /api/auth/login ─────────────────────────────────────────────────────

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { emailOrUsername, password } = req.body; // emailOrUsername handles both
    if (!emailOrUsername || !password) return res.status(400).json({ message: "Email/Username and password are required" });

    const user = await User.findOne({
      $or: [{ email: emailOrUsername }, { username: emailOrUsername }],
      authProvider: "email",
    }).select("+password");

    if (!user || !user.password) return res.status(401).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken(user._id.toString());
    res.json({ token, user: { _id: user._id, name: user.name, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (error) {
    res.status(500);
    next(error);
  }
}

// ─── POST /api/auth/google ────────────────────────────────────────────────────
//
// Flow:
//  1. Client sends a Google ID token (from google_sign_in SDK or Google Identity JS).
//  2. We verify it against GOOGLE_CLIENT_ID.
//  3. If a user with this googleId exists → sign them in.
//  4. If the email already belongs to an email/password account → 409 conflict.
//  5. Otherwise → create a brand-new user with authProvider="google".

export async function googleAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: "idToken is required" });

    // Verify the token against our server client ID
    // We split by comma in case multiple client IDs are provided (e.g. Web and Android)
    const audiences = process.env.GOOGLE_CLIENT_ID?.split(",").map(id => id.trim()) || [];
    
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: audiences,
    });

    const payload = ticket.getPayload();
    if (!payload) return res.status(401).json({ message: "Invalid Google token" });

    const { sub: googleId, email, name, picture } = payload;

    // ── Case 1: Returning Google user ────────────────────────────────────────
    let user = await User.findOne({ googleId });
    if (user) {
      const token = signToken(user._id.toString());
      return res.json({ token, user: { _id: user._id, name: user.name, email: user.email, avatar: user.avatar } });
    }

    // ── Case 2: Email already registered with another provider ───────────────
    if (email) {
      const existingByEmail = await User.findOne({ email });
      if (existingByEmail) {
        return res.status(409).json({
          message: `This email is already registered with ${existingByEmail.authProvider} login. Please sign in with that method instead.`,
        });
      }
    }

    // ── Case 3: New user — create account ────────────────────────────────────
    
    // Auto-generate a safe username from the email
    const baseUsername = email!.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
    let uniqueUsername = baseUsername;
    let counter = 1;
    while (await User.findOne({ username: uniqueUsername })) {
      uniqueUsername = `${baseUsername}${counter}`;
      counter++;
    }

    user = await User.create({
      googleId,
      email: email!,
      username: uniqueUsername,
      name: name || email!.split("@")[0],
      avatar: picture || "",
      authProvider: "google",
    });

    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: { _id: user._id, name: user.name, username: user.username, email: user.email, avatar: user.avatar } });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
}
