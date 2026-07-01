import { useRef, useState } from "react";
import { SendIcon, SmileIcon, XIcon } from "lucide-react";
import EmojiPicker from "emoji-picker-react";

export function ChatInput({ value, onChange, onSubmit, disabled, replyTo, onCancelReply }) {
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef(null);

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    const pos = inputRef.current?.selectionStart ?? value.length;
    const next = value.slice(0, pos) + emoji + value.slice(pos);
    onChange({ target: { value: next } });
    setShowPicker(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled) onSubmit(e);
    }
  };

  return (
    <div
      className="px-4 pb-4 pt-2 flex flex-col gap-2"
      style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Reply preview */}
      {replyTo && (
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-xl"
          style={{
            background: "rgba(139,92,246,0.08)",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium mb-0.5" style={{ color: "#a78bfa" }}>
              ↩ Replying to {replyTo.sender?.name}
            </p>
            <p className="text-xs truncate" style={{ color: "rgba(241,245,249,0.6)" }}>
              {replyTo.text}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.08)" }}
          >
            <XIcon className="w-3 h-3" style={{ color: "rgba(241,245,249,0.5)" }} />
          </button>
        </div>
      )}

      {/* Input row */}
      <form
        onSubmit={onSubmit}
        className="flex items-center gap-3 p-2 rounded-2xl relative"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        {/* Emoji button */}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: showPicker
              ? "rgba(139,92,246,0.15)"
              : "transparent",
            border: showPicker
              ? "1px solid rgba(139,92,246,0.3)"
              : "1px solid transparent",
          }}
        >
          <SmileIcon
            className="w-5 h-5"
            style={{ color: showPicker ? "#a78bfa" : "rgba(241,245,249,0.4)" }}
          />
        </button>

        {/* Text input */}
        <textarea
          ref={inputRef}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message…"
          rows={1}
          className="flex-1 bg-transparent outline-none text-sm px-2 py-2 resize-none"
          style={{
            color: "#f1f5f9",
            caretColor: "#8b5cf6",
            maxHeight: "120px",
            lineHeight: "1.5",
          }}
        />

        {/* Send button */}
        <button
          type="submit"
          disabled={disabled}
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all"
          style={{
            background: disabled
              ? "rgba(139,92,246,0.15)"
              : "linear-gradient(135deg, #7c3aed, #4f46e5)",
            border: "1px solid rgba(139,92,246,0.3)",
            cursor: disabled ? "not-allowed" : "pointer",
            boxShadow: disabled ? "none" : "0 0 16px rgba(139,92,246,0.25)",
          }}
        >
          <SendIcon
            className="w-4 h-4 transition-transform"
            style={{
              color: disabled ? "rgba(241,245,249,0.25)" : "#fff",
              transform: disabled ? "none" : "rotate(-10deg)",
            }}
          />
        </button>

        {/* Emoji picker dropdown */}
        {showPicker && (
          <div
            className="absolute bottom-14 left-0 z-50 animate-scale-in"
            style={{ filter: "drop-shadow(0 8px 32px rgba(0,0,0,0.5))" }}
          >
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              theme="dark"
              skinTonesDisabled
              searchDisabled={false}
              width={320}
              height={380}
              lazyLoadEmojis
            />
          </div>
        )}
      </form>
    </div>
  );
}
