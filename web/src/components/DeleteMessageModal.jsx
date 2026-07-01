import { TrashIcon, XIcon } from "lucide-react";

export function DeleteMessageModal({ message, isMe, onConfirm, onClose }) {
  if (!message) return null;

  return (
    <div className="whisper-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="whisper-modal glass-panel px-6 py-5"
        style={{ maxWidth: "420px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
              }}
            >
              <TrashIcon className="w-4 h-4" style={{ color: "#f87171" }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>
              Delete Message
            </p>
          </div>
          <button onClick={onClose}>
            <XIcon className="w-4 h-4" style={{ color: "rgba(241,245,249,0.4)" }} />
          </button>
        </div>

        <p className="text-sm mb-5" style={{ color: "rgba(241,245,249,0.55)", lineHeight: "1.6" }}>
          Are you sure you want to delete this message?
        </p>

        <div className="flex flex-col gap-2">
          {isMe && (
            <button
              onClick={() => onConfirm("everyone")}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "rgba(239,68,68,0.12)",
                border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.12)";
              }}
            >
              Delete for Everyone
            </button>
          )}
          <button
            onClick={() => onConfirm("me")}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(241,245,249,0.7)",
            }}
          >
            Delete for Me
          </button>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{
              background: "transparent",
              border: "1px solid transparent",
              color: "rgba(241,245,249,0.4)",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
