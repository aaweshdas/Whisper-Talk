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
        transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
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
          padding: "24px 32px 24px 140px", // Huge left padding to clear the planet
          borderRadius: "16px",
          // Force the background to stretch to fit the toast's borders so the frame looks right
          background: "url('/toast-bg.png') center / 100% 100% no-repeat",
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 20px rgba(139, 92, 246, 0.4)",
          minWidth: "400px",
          maxWidth: "500px",
          minHeight: "100px",
          position: "relative",
          overflow: "visible", 
          border: "none", // Remove CSS border since the image has a drawn glowing border
        }}
      >
        {/* We place the sender's initial precisely over the core of the glowing planet */}
        <div
          style={{
            position: "absolute",
            left: "8%", // Center over the planet
            top: "50%",
            transform: "translateY(-50%)",
            width: 48,
            height: 48,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 26,
            fontWeight: 900,
            color: "#fff",
            textShadow: "0 0 10px rgba(0,0,0,1), 0 0 20px rgba(0, 198, 255, 1)",
            pointerEvents: "none",
          }}
        >
          {initial}
        </div>

        {/* Text Area */}
        <div style={{ flex: 1, minWidth: 0, position: "relative", zIndex: 2 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: 15,
              color: "#fff",
              textShadow: "0 2px 4px rgba(0,0,0,0.8), 0 0 10px rgba(255,255,255,0.3)",
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
              color: "#e2e8f0",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              fontWeight: 500,
              textShadow: "0 1px 2px rgba(0,0,0,0.8)"
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
            background: "rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.3)",
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
            backdropFilter: "blur(8px)",
            boxShadow: "0 0 10px rgba(0,0,0,0.5)",
            transition: "all 0.2s ease",
            marginLeft: "8px",
          }}
          aria-label="Dismiss"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.6)";
            e.currentTarget.style.boxShadow = "0 0 15px rgba(255,255,255,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(0,0,0,0.4)";
            e.currentTarget.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
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
