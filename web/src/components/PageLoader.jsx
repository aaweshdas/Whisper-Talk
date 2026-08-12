function PageLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center h-screen w-screen relative overflow-hidden"
      style={{ background: "#06060c" }}
    >
      {/* Background gradient blobs */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 40%, rgba(99,102,241,0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(139,92,246,0.06) 0%, transparent 60%)",
        }}
      />

      {/* Animated pulse rings behind logo */}
      <div className="relative flex items-center justify-center mb-8">
        {/* Outermost ring */}
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: 120,
            height: 120,
            border: "1px solid rgba(139,92,246,0.15)",
            animationDuration: "2.5s",
          }}
        />
        {/* Middle ring */}
        <div
          className="absolute rounded-full animate-ping"
          style={{
            width: 96,
            height: 96,
            border: "1px solid rgba(99,102,241,0.2)",
            animationDuration: "2s",
            animationDelay: "0.3s",
          }}
        />

        {/* Logo container */}
        <div
          className="relative z-10 w-20 h-20 rounded-2xl overflow-hidden flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))",
            border: "1px solid rgba(139,92,246,0.3)",
            boxShadow:
              "0 0 0 1px rgba(139,92,246,0.1), 0 8px 32px rgba(99,102,241,0.2), 0 0 80px rgba(139,92,246,0.1)",
            backdropFilter: "blur(20px)",
          }}
        >
          <img
            src="/logo.jpg"
            alt="Whisper"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(1.2) saturate(1.1)" }}
          />
        </div>
      </div>

      {/* Brand name */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: "#fff", letterSpacing: "-0.02em" }}
        >
          Whisper
        </h1>
        <p
          className="text-xs font-medium tracking-widest uppercase"
          style={{ color: "rgba(139,92,246,0.6)", letterSpacing: "0.25em" }}
        >
          Secure · Real-time · Private
        </p>
      </div>

      {/* Animated progress bar */}
      <div
        className="w-40 h-0.5 rounded-full overflow-hidden"
        style={{ background: "rgba(139,92,246,0.1)" }}
      >
        <div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)",
            backgroundSize: "200% 100%",
            animation: "shimmer 1.5s ease-in-out infinite",
          }}
        />
      </div>

      {/* Bottom tagline */}
      <p
        className="absolute bottom-10 text-xs"
        style={{ color: "rgba(255,255,255,0.2)", letterSpacing: "0.05em" }}
      >
        Connecting you securely...
      </p>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}

export default PageLoader;
