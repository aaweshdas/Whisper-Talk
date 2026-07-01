import { useNavigate } from "react-router";
import {
  ArrowRightIcon,
  SparklesIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  ZapIcon,
  LockIcon,
} from "lucide-react";

function HomePage() {
  const navigate = useNavigate();
  return (
    <div
      className="min-h-screen w-full relative flex flex-col overflow-hidden"
      style={{ background: "#06060c", color: "#f1f5f9" }}
    >
      {/* ── Ambient Orbs ── */}
      <div className="glow-orb-violet" style={{ top: "5%", left: "-5%" }} />
      <div className="glow-orb-cyan" style={{ bottom: "10%", right: "-5%" }} />
      <div className="glow-orb-indigo" style={{ top: "55%", left: "60%" }} />

      {/* ── Subtle grid overlay ── */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━ NAVBAR ━━━━━━━━━━━━━━━━━━━━━━ */}
      <header
        className="w-full sticky top-0 z-30"
        style={{
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(6,6,12,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        }}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                boxShadow: "0 0 20px rgba(124,58,237,0.35)",
              }}
            >
              <SparklesIcon className="w-4.5 h-4.5 text-white" />
            </div>
            <span
              className="text-xl font-bold tracking-tight"
              style={{
                background: "linear-gradient(135deg, #fff 40%, #a78bfa)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Whisper
            </span>
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/auth")}
              className="px-4 py-2 text-sm font-medium rounded-lg transition-all"
              style={{ color: "rgba(241,245,249,0.65)", cursor: "pointer", background: "none", border: "none" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#f1f5f9")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(241,245,249,0.65)")}
            >
              Sign In
            </button>

            <button
              onClick={() => navigate("/auth")}
              className="gradient-btn flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white"
              style={{ cursor: "pointer" }}
            >
              Get Started
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━ HERO ━━━━━━━━━━━━━━━━━━━━━━━ */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-6 flex flex-col lg:flex-row items-center justify-center gap-16 py-20 relative z-10">
        {/* LEFT: Copy */}
        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left max-w-lg">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-mono uppercase tracking-widest"
            style={{
              background: "rgba(139,92,246,0.1)",
              border: "1px solid rgba(139,92,246,0.2)",
              color: "#a78bfa",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: "#a78bfa",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            />
            Secure Real-Time Messaging
          </div>

          {/* Headline */}
          <h1
            className="text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.08] tracking-tight"
            style={{ color: "#f1f5f9" }}
          >
            Messaging
            <br />
            <span className="gradient-text">reimagined.</span>
          </h1>

          <p
            className="mt-6 text-lg leading-relaxed max-w-md"
            style={{ color: "rgba(241,245,249,0.5)" }}
          >
            Blazing-fast, encrypted conversations with real-time presence. Built
            for the next generation of communicators.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={() => navigate("/auth")}
              className="gradient-btn group flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-white font-bold text-sm"
              style={{ cursor: "pointer" }}
            >
              Start Chatting Free
              <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => navigate("/auth")}
              className="flex items-center gap-2 px-7 py-3.5 rounded-2xl font-semibold text-sm transition-all"
              style={{
                color: "rgba(241,245,249,0.6)",
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.07)";
                e.currentTarget.style.color = "#f1f5f9";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "rgba(241,245,249,0.6)";
              }}
            >
              <LockIcon className="w-4 h-4" />
              Sign In
            </button>
          </div>

          {/* Social proof */}
          <div
            className="mt-10 flex items-center gap-4 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div className="flex -space-x-3">
              {[
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop",
                "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop",
              ].map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt="user"
                  className="w-8 h-8 rounded-full object-cover"
                  style={{
                    border: "2px solid #06060c",
                    boxShadow: "0 0 0 1px rgba(139,92,246,0.25)",
                  }}
                />
              ))}
            </div>
            <p className="text-sm" style={{ color: "rgba(241,245,249,0.45)" }}>
              Join{" "}
              <span style={{ color: "#c4b5fd", fontWeight: 600 }}>10,000+</span>{" "}
              users chatting daily
            </p>
          </div>
        </div>

        {/* RIGHT: Mock chat card */}
        <div className="flex-1 w-full flex items-center justify-center">
          <div className="relative w-full max-w-sm">
            {/* Glow behind card */}
            <div
              className="absolute -inset-6 rounded-3xl pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at center, rgba(124,58,237,0.18) 0%, transparent 70%)",
                filter: "blur(20px)",
              }}
            />

            {/* Card */}
            <div
              className="relative glass-panel rounded-3xl overflow-hidden"
              style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
            >
              {/* Window chrome */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/70" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <div className="w-3 h-3 rounded-full bg-green-500/70" />
                </div>
                <div
                  className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono"
                  style={{
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.2)",
                    color: "#10b981",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                  end-to-end encrypted
                </div>
              </div>

              {/* Fake chat */}
              <div className="px-5 py-5 space-y-4">
                {/* Received */}
                <div className="flex items-end gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    style={{ border: "1.5px solid rgba(139,92,246,0.25)" }}
                    alt=""
                  />
                  <div
                    className="max-w-[78%] px-4 py-2.5 rounded-2xl text-sm"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "18px 18px 18px 4px",
                      color: "#e2e8f0",
                    }}
                  >
                    Hey! Have you seen the new Whisper redesign? 🚀
                    <div
                      className="text-[10px] mt-1"
                      style={{ color: "rgba(241,245,249,0.35)" }}
                    >
                      10:42 AM
                    </div>
                  </div>
                </div>

                {/* Sent */}
                <div className="flex justify-end">
                  <div
                    className="max-w-[78%] px-4 py-2.5 text-sm"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      border: "1px solid rgba(139,92,246,0.3)",
                      borderRadius: "18px 18px 4px 18px",
                      boxShadow: "0 4px 16px rgba(124,58,237,0.22)",
                      color: "#fff",
                    }}
                  >
                    Just did! The dark glass look is so clean 🔥
                    <div
                      className="text-[10px] mt-1 text-right"
                      style={{ color: "rgba(255,255,255,0.5)" }}
                    >
                      10:43 AM
                    </div>
                  </div>
                </div>

                {/* Received again */}
                <div className="flex items-end gap-2.5">
                  <img
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop"
                    className="w-7 h-7 rounded-full object-cover flex-shrink-0"
                    style={{ border: "1.5px solid rgba(139,92,246,0.25)" }}
                    alt=""
                  />
                  <div
                    className="max-w-[78%] px-4 py-2.5 rounded-2xl text-sm"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "18px 18px 18px 4px",
                      color: "#e2e8f0",
                    }}
                  >
                    Let's build something great together 💬
                    <div
                      className="text-[10px] mt-1"
                      style={{ color: "rgba(241,245,249,0.35)" }}
                    >
                      10:43 AM
                    </div>
                  </div>
                </div>
              </div>

              {/* Input row */}
              <div
                className="px-5 py-4"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                <div
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  <span
                    className="flex-1 text-sm"
                    style={{ color: "rgba(241,245,249,0.25)" }}
                  >
                    Type a message...
                  </span>
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      boxShadow: "0 0 12px rgba(124,58,237,0.3)",
                    }}
                  >
                    <ArrowRightIcon className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━ FEATURES ━━━━━━━━━━━━━━━━━━━━━━ */}
      <footer
        className="w-full relative z-10"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: ZapIcon,
              color: "#a78bfa",
              bg: "rgba(139,92,246,0.1)",
              border: "rgba(139,92,246,0.2)",
              title: "Sub-50ms Latency",
              desc: "Socket-powered messaging delivers your words instantly, every time.",
            },
            {
              icon: ShieldCheckIcon,
              color: "#67e8f9",
              bg: "rgba(6,182,212,0.1)",
              border: "rgba(6,182,212,0.2)",
              title: "Privacy First",
              desc: "JWT-secured sessions keep your identity and messages safe — no third-party dependencies.",
            },
            {
              icon: MessageSquareIcon,
              color: "#6ee7b7",
              bg: "rgba(16,185,129,0.1)",
              border: "rgba(16,185,129,0.2)",
              title: "Unlimited Chats",
              desc: "Connect with anyone, anywhere—no limits, no paywalls.",
            },
          ].map(({ icon: Icon, color, bg, border, title, desc }, i) => (
            <div
              key={i}
              className="flex items-start gap-4 p-5 rounded-2xl transition-all"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.border = `1px solid ${border}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.02)";
                e.currentTarget.style.border = "1px solid rgba(255,255,255,0.06)";
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div>
                <h3 className="font-semibold text-sm mb-1" style={{ color: "#f1f5f9" }}>
                  {title}
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(241,245,249,0.45)" }}>
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
