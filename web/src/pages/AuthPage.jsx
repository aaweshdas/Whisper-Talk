import { useState } from "react";
import { Link } from "react-router";
import { useAuthStore } from "../lib/auth";
import { MessageSquareIcon, ArrowRightIcon, ShieldCheckIcon, ZapIcon, SparklesIcon } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { login, register, googleLogin, status, error, clearError } = useAuthStore();
  const isLoading = status === "loading";

  // App.jsx already redirects authenticated users away from /auth.
  // Do not add a useEffect here — it conflicts with router state and causes infinite loops.

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (isLogin) {
      await login(emailOrUsername, password);
    } else {
      await register(name, username, email, password);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    clearError();
    if (credentialResponse.credential) {
      await googleLogin(credentialResponse.credential);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    clearError();
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-slate-950 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: `url('/bg.png')` }}>
      
      {/* ── LEFT PANEL (Branding & Info) ── */}
      <div className="hidden lg:flex flex-col flex-1 p-12 relative overflow-hidden justify-between">
        {/* Top Branding */}
        <Link to="/" className="flex items-center gap-3 z-10 w-fit">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg">
            <img src="/logo.jpg" alt="Whisper Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">Whisper</span>
        </Link>

        {/* Content */}
        <div className="z-10 max-w-xl bg-black/50 p-10 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-8 shadow-sm">
            <SparklesIcon className="w-4 h-4 text-primary-400" />
            <span>Whisper 2.0 is here</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.1] drop-shadow-2xl">
            Communicate <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-indigo-400">without limits.</span>
          </h1>
          <p className="text-xl text-slate-200 mb-10 leading-relaxed font-light drop-shadow-md">
            Join the most secure, lowest-latency communication platform built for modern teams and global workspaces.
          </p>

          <div className="space-y-8">
            <FeatureRow 
              icon={<ShieldCheckIcon className="w-6 h-6 text-emerald-400" />}
              title="End-to-End Encrypted"
              desc="Your messages, voice calls, and video streams are secured with military-grade encryption protocols."
            />
            <FeatureRow 
              icon={<ZapIcon className="w-6 h-6 text-amber-400" />}
              title="Ultra-Low Latency"
              desc="Powered by WebRTC and WebSockets for instantaneous messaging and crystal clear real-time calls."
            />
          </div>
        </div>

        {/* Footer info */}
        <div className="z-10 text-sm font-medium text-slate-400/80 flex gap-6">
          <Link to="/" className="hover:text-white transition-colors">Return to Home</Link>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>

      {/* ── RIGHT PANEL (Auth Form) ── */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10 w-full lg:max-w-xl xl:max-w-2xl bg-black/40 backdrop-blur-3xl border-l border-white/10 shadow-2xl">
        <div className="w-full max-w-md">
          
          {/* Mobile Header (Hidden on Desktop) */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-black/40 border border-white/10 flex items-center justify-center backdrop-blur-md shadow-lg">
              <img src="/logo.jpg" alt="Whisper Logo" className="w-full h-full object-cover" />
            </div>
            <span className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">Whisper</span>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
              {isLogin ? "Welcome back" : "Create your account"}
            </h2>
            <p className="text-slate-400">
              {isLogin ? "Enter your credentials to securely access your workspace." : "Join thousands of users communicating seamlessly."}
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-start gap-3 backdrop-blur-md shadow-lg">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all backdrop-blur-md shadow-inner"
                    placeholder="Jane Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all backdrop-blur-md shadow-inner"
                    placeholder="janedoe"
                  />
                </div>
              </div>
            )}

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all backdrop-blur-md shadow-inner"
                  placeholder="jane@example.com"
                />
              </div>
            )}

            {isLogin && (
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Username or Email</label>
                <input
                  type="text"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all backdrop-blur-md shadow-inner"
                  placeholder="janedoe or jane@example.com"
                />
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                {isLogin && (
                  <a href="#" className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors">Forgot password?</a>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all backdrop-blur-md shadow-inner"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-xl px-4 py-3.5 mt-4 flex items-center justify-center gap-2 transition-all shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] disabled:opacity-70 disabled:cursor-not-allowed group"
            >
              {isLoading ? (
                <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              ) : (
                <>
                  {isLogin ? "Sign In to Workspace" : "Create Workspace Account"}
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">Or continue with</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <div className="mt-8 flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => {
                useAuthStore.setState({ error: "Google sign-in failed. Please try again." });
              }}
              shape="rectangular"
              theme="filled_black"
              text={isLogin ? "signin_with" : "signup_with"}
              size="large"
            />
          </div>

          <div className="mt-10 text-center text-sm">
            <span className="text-slate-400">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button
              onClick={toggleMode}
              className="font-medium text-primary-400 hover:text-primary-300 transition-colors ml-1"
            >
              {isLogin ? "Create an account" : "Sign in instead"}
            </button>
          </div>
          
          <div className="mt-12 flex lg:hidden justify-center gap-4 text-xs font-medium text-slate-500">
            <Link to="/" className="hover:text-slate-400 transition-colors">Home</Link>
            <span>&middot;</span>
            <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a>
            <span>&middot;</span>
            <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
          </div>

        </div>
      </div>
    </div>
  );
}

function FeatureRow({ icon, title, desc }) {
  return (
    <div className="flex gap-4">
      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-lg">
        {icon}
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-1 drop-shadow-sm">{title}</h3>
        <p className="text-slate-300 font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
