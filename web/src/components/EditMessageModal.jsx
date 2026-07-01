import { useState, useEffect, useRef } from "react";
import { PencilIcon, XIcon } from "lucide-react";

export function EditMessageModal({ message, onConfirm, onClose }) {
  const [text, setText] = useState(message?.text || "");
  const inputRef = useRef(null);

  useEffect(() => {
    setText(message?.text || "");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [message]);

  if (!message) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || text.trim() === message.text) return onClose();
    onConfirm(text.trim());
  };

  return (
    <div className="whisper-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className="whisper-modal glass-panel px-6 py-5"
        style={{ maxWidth: "440px" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.25)",
              }}
            >
              <PencilIcon className="w-4 h-4" style={{ color: "#a78bfa" }} />
            </div>
            <p className="font-semibold text-sm" style={{ color: "#f1f5f9" }}>
              Edit Message
            </p>
          </div>
          <button onClick={onClose}>
            <XIcon className="w-4 h-4" style={{ color: "rgba(241,245,249,0.4)" }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="whisper-input resize-none"
            style={{ lineHeight: "1.6" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm transition-all"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(241,245,249,0.6)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="gradient-btn px-4 py-2 rounded-xl text-sm text-white font-medium"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
