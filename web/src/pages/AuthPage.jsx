import { useState } from "react";
import { Link } from "react-router";
import { useAuthStore } from "../lib/auth";
import { MessageSquareIcon, ArrowRightIcon } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const { login, register, googleLogin, status, error, clearError } = useAuthStore();
  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  // App.jsx already redirects authenticated users away from /auth.
  // Do not add a useEffect here — it conflicts with router state and causes infinite loops.

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    if (isLogin) {
      await login(email, password);
    } else {
      await register(name, email, password);
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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950">
      
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-sm">
          <MessageSquareIcon className="w-5 h-5" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Whisper</h1>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-md card-standard p-8">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-1">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {isLogin ? "Enter your credentials to access your account" : "Sign up to start chatting with your team"}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm flex items-start gap-2">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="input-standard"
                placeholder="Jane Doe"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-standard"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-standard"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <>
                {isLogin ? "Sign in" : "Create account"}
                <ArrowRightIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Or continue with</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        <div className="mt-6 flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => {
              useAuthStore.setState({ error: "Google sign-in failed. Please try again." });
            }}
            shape="rectangular"
            theme="outline"
            text={isLogin ? "signin_with" : "signup_with"}
            size="large"
          />
        </div>

        <div className="mt-8 text-center text-sm">
          <span className="text-slate-500 dark:text-slate-400">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
          </span>
          <button
            onClick={toggleMode}
            className="font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {isLogin ? "Sign up" : "Sign in"}
          </button>
        </div>
      </div>

      <div className="mt-8 flex gap-4 text-sm font-medium text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Home</Link>
        <span>&middot;</span>
        <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Privacy</a>
        <span>&middot;</span>
        <a href="#" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">Terms</a>
      </div>
    </div>
  );
}
