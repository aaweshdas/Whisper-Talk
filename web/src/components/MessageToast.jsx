import { useEffect, useRef, useState } from "react";

/**
 * MessageToast
 *
 * Renders a single toast notification at the top of the screen.
 * Auto-dismisses after `duration` ms (default 4000).
 * The parent is responsible for removing it from the list.
 */
function MessageToast({ toast, onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
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
        width: "500px",
        height: "140px", // Fixed height to match the banner aspect ratio
        display: "flex",
        alignItems: "center",
        filter: "drop-shadow(0 10px 20px rgba(139, 92, 246, 0.4))",
      }}
    >
      {/* Background Image Banner */}
      <img
        src="/toast-bg.png"
        alt="Notification Background"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "fill", // stretch perfectly to the container bounds
          zIndex: 1,
        }}
        onError={(e) => {
          // Fallback if image fails to load
          e.target.style.display = "none";
          e.target.parentElement.style.background = "#0f172a";
          e.target.parentElement.style.border = "1px solid #6366f1";
          e.target.parentElement.style.borderRadius = "16px";
        }}
      />

      {/* Content Container (Layered on top of image) */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", width: "100%", alignItems: "center" }}>
        
        {/* Avatar placed directly over the blue glowing planet on the left */}
        <div
          style={{
            marginLeft: "28px", // Adjusted to place right over the planet
            width: "56px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            fontWeight: 900,
            color: "#ffffff",
            textShadow: "0 0 15px rgba(255,255,255,1), 0 0 30px rgba(0, 198, 255, 1)",
          }}
        >
          {initial}
        </div>

        {/* Text Area placed inside the rectangular frame of the image */}
        <div style={{ flex: 1, marginLeft: "45px", paddingRight: "20px" }}>
          <p
            style={{
              margin: 0,
              fontWeight: 800,
              fontSize: "17px",
              color: "#ffffff",
              textShadow: "0 2px 4px rgba(0,0,0,1), 0 0 10px rgba(139, 92, 246, 0.8)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {toast.senderName || "Someone"}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "14px",
              color: "#e2e8f0",
              fontWeight: 500,
              textShadow: "0 1px 3px rgba(0,0,0,1)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {toast.text}
          </p>
        </div>

        {/* Close Button on the right */}
        <button
          onClick={(e) => { e.stopPropagation(); dismiss(); }}
          style={{
            marginRight: "20px",
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.3)",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#ffffff",
            fontSize: "16px",
            backdropFilter: "blur(4px)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
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
