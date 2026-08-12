import { useEffect, useRef, useState } from "react";

/**
 * MessageToast
 *
 * Renders a single toast notification at the top of the screen.
 * Auto-dismisses after `duration` ms (default 4000).
 * The parent is responsible for removing it from the list.
 */
function MessageToast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false); // controls slide-in
  const [leaving, setLeaving] = useState(false); // controls slide-out
  const timerRef = useRef(null);

  useEffect(() => {
    // Trigger slide-in on mount
    const raf = requestAnimationFrame(() => setVisible(true));

    timerRef.current = setTimeout(() => dismiss(), toast.duration ?? 4000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timerRef.current);
    };
  }, []);

  function dismiss() {
    clearTimeout(timerRef.current);
    setLeaving(true);
    // Wait for slide-out animation then call onDismiss
    setTimeout(() => onDismiss(toast.id), 350);
  }

  const initial = (toast.senderName ?? "?")[0]?.toUpperCase() ?? "?";

  return (
    <div
      onClick={dismiss}
      style={{
        transform: visible && !leaving ? "translateY(0)" : "translateY(-110%)",
        opacity: visible && !leaving ? 1 : 0,
        transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
        pointerEvents: "auto",
        cursor: "pointer",
        position: "relative",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          padding: "16px 24px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #090918, #161040, #0a0b2e)",
          border: "2px solid #5d42f5",
          boxShadow: "0 0 25px rgba(93, 66, 245, 0.5), inset 0 0 20px rgba(0, 198, 255, 0.15)",
          minWidth: "320px",
          maxWidth: "420px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow ambient background */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "20%",
          width: "150%",
          height: "150%",
          background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 60%)",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none",
        }} />

        {/* Decorative Stars */}
        <div style={{ position: "absolute", top: "20%", left: "10%", width: 2, height: 2, background: "#fff", boxShadow: "0 0 4px 2px #fff", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "75%", left: "45%", width: 2, height: 2, background: "#00f2fe", boxShadow: "0 0 6px 2px #00f2fe", borderRadius: "50%" }} />
        <div style={{ position: "absolute", top: "30%", right: "25%", width: 1.5, height: 1.5, background: "#e100ff", boxShadow: "0 0 5px 2px #e100ff", borderRadius: "50%" }} />
        <div style={{ position: "absolute", bottom: "15%", right: "8%", width: 4, height: 4, background: "#fff", boxShadow: "0 0 6px 2px #fff", clipPath: "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)" }} />
        <div style={{ position: "absolute", top: "15%", right: "45%", width: 3, height: 3, background: "#fff", boxShadow: "0 0 5px 2px #fff", clipPath: "polygon(50% 0%, 60% 40%, 100% 50%, 60% 60%, 50% 100%, 40% 60%, 0% 50%, 40% 40%)" }} />

        {/* Planet Avatar */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "radial-gradient(circle at 30% 30%, #4facfe, #00f2fe, #5d42f5, #240b36)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 22,
            fontWeight: 800,
            color: "#fff",
            boxShadow: "0 0 20px rgba(0, 242, 254, 0.6), inset -4px -4px 10px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.4)"
          }}
        >
          <span style={{ zIndex: 3, textShadow: "0 0 8px rgba(255,255,255,0.8)" }}>{initial}</span>
          
          {/* Inner Ring */}
          <div style={{
            position: "absolute",
            inset: "-5px",
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#00f2fe",
            borderRightColor: "#00f2fe",
            transform: "rotate(45deg) scale(1.2, 0.35)",
            boxShadow: "0 0 12px #00f2fe",
            pointerEvents: "none",
            zIndex: 1
          }} />
          
          {/* Outer Ring */}
          <div style={{
            position: "absolute",
            inset: "-10px",
            borderRadius: "50%",
            border: "2px solid transparent",
            borderBottomColor: "#e100ff",
            borderLeftColor: "#e100ff",
            transform: "rotate(25deg) scale(1.2, 0.3)",
            boxShadow: "0 0 15px #e100ff",
            pointerEvents: "none",
            zIndex: 4
          }} />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 2 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: 15,
              color: "#fff",
              textShadow: "0 0 10px rgba(255,255,255,0.5), 0 0 20px rgba(0, 242, 254, 0.4)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              letterSpacing: "0.5px"
            }}
          >
            {toast.senderName || "Someone"}
          </p>
          <p
            style={{
              margin: "5px 0 0",
              fontSize: 13,
              color: "#b8c6db",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: 500
            }}
          >
            {toast.text}
          </p>
        </div>

        {/* Dismiss × */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          style={{
            position: "relative",
            zIndex: 2,
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: "50%",
            width: 28,
            height: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#fff",
            fontSize: 16,
            flexShrink: 0,
            backdropFilter: "blur(4px)",
            boxShadow: "0 0 10px rgba(255,255,255,0.1)",
            transition: "all 0.2s ease"
          }}
          aria-label="Dismiss"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.25)";
            e.currentTarget.style.boxShadow = "0 0 15px rgba(255,255,255,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.1)";
            e.currentTarget.style.boxShadow = "0 0 10px rgba(255,255,255,0.1)";
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}

/**
 * MessageToastContainer
 *
 * Mount this once at the app root. It subscribes to the toast state managed
 * via the simple imperative API below and renders a stacked list.
 */
export function MessageToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    // Register the global push function
    _pushToast = (toast) =>
      setToasts((prev) => [...prev, { ...toast, id: Date.now() + Math.random() }]);

    return () => { _pushToast = null; };
  }, []);

  const dismiss = (id) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {toasts.map((t) => (
        <MessageToast key={t.id} toast={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}

// ── Imperative API ────────────────────────────────────────────────────────
let _pushToast = null;

/**
 * showMessageToast({ senderName, text, chatId, duration? })
 *
 * Call this anywhere — no React context needed.
 */
export function showMessageToast({ senderName, text, chatId, duration = 4000 }) {
  _pushToast?.({ senderName, text, chatId, duration });
}
