import { create } from "zustand";
import api from "./axios";

const TOKEN_KEY = "whisper_jwt";

function saveToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Auth Store ────────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  status: "loading", // "loading" | "authenticated" | "unauthenticated"
  error: null,

  // ── Restore session on page load ─────────────────────────────────────────
  restoreSession: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ status: "unauthenticated", token: null, user: null });
      return;
    }
    try {
      const { data } = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      set({ token, user: data, status: "authenticated", error: null });
    } catch {
      clearToken();
      set({ status: "unauthenticated", token: null, user: null });
    }
  },

  // ── Register ─────────────────────────────────────────────────────────────
  register: async (name, email, password) => {
    set({ status: "loading", error: null });
    try {
      const { data } = await api.post("/auth/register", { name, email, password });
      saveToken(data.token);
      set({ token: data.token, user: data.user, status: "authenticated", error: null });
    } catch (err) {
      const msg = err.response?.data?.message ?? "Registration failed";
      set({ status: "unauthenticated", error: msg });
    }
  },

  // ── Login ────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ status: "loading", error: null });
    try {
      // First try with the real email the user typed
      const { data } = await api.post("/auth/login", { email, password });
      saveToken(data.token);
      set({ token: data.token, user: data.user, status: "authenticated", error: null });
    } catch (firstErr) {
      // Fallback: accounts created before the email fix were stored with a fake @whisper.app address
      try {
        const legacyEmail = `${email.trim().toLowerCase().replace(/[@.\s]+/g, "_")}@whisper.app`;
        const { data } = await api.post("/auth/login", { email: legacyEmail, password });
        saveToken(data.token);
        set({ token: data.token, user: data.user, status: "authenticated", error: null });
      } catch {
        const msg = firstErr.response?.data?.message ?? "Invalid email or password";
        set({ status: "unauthenticated", error: msg });
      }
    }
  },

  // ── Google OAuth ─────────────────────────────────────────────────────────
  googleLogin: async (googleIdToken) => {
    set({ status: "loading", error: null });
    try {
      const { data } = await api.post("/auth/google", { idToken: googleIdToken });
      saveToken(data.token);
      set({ token: data.token, user: data.user, status: "authenticated", error: null });
    } catch (err) {
      const msg = err.response?.data?.message ?? "Google sign-in failed";
      set({ status: "unauthenticated", error: msg });
    }
  },

  // ── Logout ───────────────────────────────────────────────────────────────
  logout: () => {
    clearToken();
    set({ token: null, user: null, status: "unauthenticated", error: null });
  },

  clearError: () => set({ error: null }),

  // Helper: raw token for socket auth
  getToken: () => get().token ?? getStoredToken(),
}));
