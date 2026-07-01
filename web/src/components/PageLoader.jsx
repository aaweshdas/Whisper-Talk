import { SparklesIcon } from "lucide-react";

function PageLoader() {
  return (
    <div
      className="flex flex-col items-center justify-center h-screen w-screen relative overflow-hidden"
      style={{ background: "#06060c" }}
    >
      {/* Ambient orbs */}
      <div className="glow-orb-violet top-[10%] left-[5%] opacity-40" />
      <div className="glow-orb-cyan bottom-[15%] right-[5%] opacity-30" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Logo mark */}
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(79,70,229,0.25))",
            border: "1px solid rgba(139,92,246,0.3)",
            boxShadow: "0 0 32px rgba(139,92,246,0.2)",
          }}
        >
          <SparklesIcon className="w-8 h-8" style={{ color: "#a78bfa" }} />
        </div>

        {/* Spinner */}
        <div className="loader-ring" />

        <p
          className="text-sm font-medium tracking-widest uppercase"
          style={{ color: "rgba(167,139,250,0.7)", letterSpacing: "0.2em" }}
        >
          Loading
        </p>
      </div>
    </div>
  );
}

export default PageLoader;
