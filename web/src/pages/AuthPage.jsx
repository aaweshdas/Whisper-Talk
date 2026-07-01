import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../lib/auth";
import { useGoogleLogin } from "@react-oauth/google";
import { SparklesIcon, Eye, EyeOff, User, Lock, ArrowRight, AlertCircle } from "lucide-react";

function InputField({ label, icon: Icon, type = "text", value, onChange, error, rightSlot }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: "rgba(241,245,249,0.55)" }}>
        {label}
      </label>
      <div className="relative flex items-center">
        <span
          className="absolute left-3 flex items-center justify-center"
          style={{ color: "rgba(241,245,249,0.35)" }}
        >
          <Icon className="w-4 h-4" />
        </span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          autoComplete="off"
          className="w-full pl-10 pr-10 py-3 rounded-xl text-sm outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: error
              ? "1px solid rgba(239,68,68,0.5)"
              : "1px solid rgba(255,255,255,0.08)",
            color: "#f1f5f9",
          }}
          onFocus={(e) => {
            if (!error)
              e.currentTarget.style.border = "1px solid rgba(124,58,237,0.6)";
          }}
          onBlur={(e) => {
            if (!error)
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.08)";
          }}
        />
        {rightSlot && (
          <span className="absolute right-3">{rightSlot}</span>
        )}
      </div>
      {error && (
        <span className="text-xs" style={{ color: "#f87171" }}>
          {error}
        </span>
      )}
    </div>
  );
}

// Google "G" SVG icon
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.707A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, googleLogin, status, error, clearError } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") navigate("/chat", { replace: true });
  }, [status, navigate]);

  function switchMode() {
    setIsLogin((v) => !v);
    setUsername("");
    setPassword("");
    setConfirm("");
    setFieldErrors({});
    clearError();
  }

  function validate() {
    const errs = {};
    if (!username.trim()) errs.username = "Username is required";
    else if (username.trim().length < 3) errs.username = "At least 3 characters";
    if (!password) errs.password = "Password is required";
    else if (password.length < 6) errs.password = "At least 6 characters";
    if (!isLogin && password !== confirm) errs.confirm = "Passwords do not match";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    clearError();
    if (isLogin) {
      await login(username, password);
    } else {
      await register(username, password);
    }
  }

  // Google OAuth — uses the implicit flow; returns a credential (ID token) directly
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      // useGoogleLogin with flow="implicit" returns an access_token, not an id_token.
      // We exchange it for user info and then send to our backend.
      // For id_token flow, use flow="auth-code" or GoogleLogin component.
      // Here we use the credential-based approach via the GoogleLogin button instead.
    },
    onError: () => {
      useAuthStore.setState({ error: "Google sign-in was cancelled or failed." });
    },
  });

  const isLoading = status === "loading";

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: "#06060c", color: "#f1f5f9" }}
    >
      {/* ── Ambient Orbs ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-10%",
          left: "-10%",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "-10%",
          right: "-10%",
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(79,70,229,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* ── Subtle grid ── */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* ── Card ── */}
      <div
        className="relative w-full max-w-sm mx-4 rounded-3xl p-8"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{
              background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
              boxShadow: "0 0 32px rgba(124,58,237,0.4)",
            }}
          >
            <SparklesIcon className="w-6 h-6 text-white" />
          </div>
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{
              background: "linear-gradient(135deg, #fff 40%, #a78bfa)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Whisper
          </h1>
          <p className="text-sm mt-1.5" style={{ color: "rgba(241,245,249,0.4)" }}>
            {isLogin ? "Welcome back. Sign in to continue." : "Create your account to get started."}
          </p>
        </div>

        {/* Tab toggle */}
        <div
          className="flex rounded-xl mb-6 p-1"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          {["Sign In", "Register"].map((label, i) => {
            const active = (i === 0) === isLogin;
            return (
              <button
                key={label}
                type="button"
                className="flex-1 py-2 text-sm font-semibold rounded-lg transition-all"
                style={{
                  background: active
                    ? "linear-gradient(135deg, #7c3aed, #4f46e5)"
                    : "transparent",
                  color: active ? "#fff" : "rgba(241,245,249,0.4)",
                  boxShadow: active ? "0 4px 12px rgba(124,58,237,0.3)" : "none",
                  cursor: "pointer",
                }}
                onClick={() => { if ((i === 0) !== isLogin) switchMode(); }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <InputField
            label="Username"
            icon={User}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={fieldErrors.username}
          />

          <InputField
            label="Password"
            icon={Lock}
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            rightSlot={
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{ color: "rgba(241,245,249,0.35)", cursor: "pointer" }}
              >
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />

          {!isLogin && (
            <InputField
              label="Confirm Password"
              icon={Lock}
              type={showConfirm ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              error={fieldErrors.confirm}
              rightSlot={
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  style={{ color: "rgba(241,245,249,0.35)", cursor: "pointer" }}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
            />
          )}

          {/* Server error */}
          {error && (
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
              style={{
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.2)",
                color: "#fca5a5",
              }}
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm text-white transition-all"
            style={{
              background: isLoading
                ? "rgba(124,58,237,0.4)"
                : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              boxShadow: isLoading ? "none" : "0 8px 24px rgba(124,58,237,0.35)",
              cursor: isLoading ? "not-allowed" : "pointer",
            }}
          >
            {isLoading ? (
              <span
                className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin"
              />
            ) : (
              <>
                {isLogin ? "Sign In" : "Create Account"}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          <span className="text-xs" style={{ color: "rgba(241,245,249,0.3)" }}>or continue with</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
        </div>

        {/* ── Google Button ── */}
        <GoogleSignInButton onSuccess={googleLogin} disabled={isLoading} />

        {/* Footer link */}
        <p className="text-center text-sm mt-6" style={{ color: "rgba(241,245,249,0.35)" }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={switchMode}
            className="font-semibold"
            style={{ color: "#a78bfa", cursor: "pointer", background: "none", border: "none" }}
          >
            {isLogin ? "Register" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
}

// ── Google Sign-In Button (uses credential callback — returns id_token directly) ──
import { GoogleLogin } from "@react-oauth/google";

function GoogleSignInButton({ onSuccess, disabled }) {
  return (
    <div style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? "none" : "auto" }}>
      <GoogleLogin
        onSuccess={async (credentialResponse) => {
          if (credentialResponse.credential) {
            await onSuccess(credentialResponse.credential);
          }
        }}
        onError={() => {
          useAuthStore.setState({ error: "Google sign-in failed. Please try again." });
        }}
        useOneTap={false}
        theme="filled_black"
        shape="rectangular"
        size="large"
        width="300"
        text="continue_with"
        logo_alignment="left"
      />
    </div>
  );
}
