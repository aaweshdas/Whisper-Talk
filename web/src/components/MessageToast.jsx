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
        transition: "transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
        pointerEvents: "auto",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "14px 16px",
          borderRadius: "20px",
          background: "rgba(12, 12, 28, 0.92)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(139, 92, 246, 0.35)",
          boxShadow:
            "0 4px 24px rgba(139,92,246,0.18), 0 8px 32px rgba(0,0,0,0.5)",
          minWidth: "280px",
          maxWidth: "380px",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: 16,
            fontWeight: 700,
            color: "#fff",
            boxShadow: "0 0 12px rgba(124,58,237,0.4)",
          }}
        >
          {initial}
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 13,
              color: "#f1f5f9",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {toast.senderName || "Someone"}
          </p>
          <p
            style={{
              margin: "3px 0 0",
              fontSize: 12,
              color: "rgba(241,245,249,0.55)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {toast.text}
          </p>
        </div>

        {/* Dismiss × */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          style={{
            background: "rgba(255,255,255,0.07)",
            border: "none",
            borderRadius: "50%",
            width: 26,
            height: 26,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(241,245,249,0.5)",
            fontSize: 14,
            flexShrink: 0,
            lineHeight: 1,
          }}
          aria-label="Dismiss"
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
