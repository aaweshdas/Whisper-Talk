import { useState, useRef, useEffect } from "react";
import {
  SmileIcon,
  ReplyIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  CheckCheckIcon,
  ForwardIcon,
} from "lucide-react";
import { formatTime } from "../lib/utils";

const QUICK_EMOJIS = ["❤️", "😂", "😮", "😢", "😡", "👍"];

export function MessageBubble({
  message,
  currentUser,
  onReply,
  onEdit,
  onDelete,
  onReact,
}) {
  const isMe = message.sender?._id === currentUser?._id;
  const isDeleted = message.deletedForEveryone;

  const [showMenu, setShowMenu] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);
  const bubbleRef = useRef(null);

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu && !showEmojiBar) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
        setShowEmojiBar(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showMenu, showEmojiBar]);

  const handleContextMenu = (e) => {
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  // Reaction summary: group by emoji
  const reactionGroups = (message.reactions || []).reduce((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});
  const myReaction = (message.reactions || []).find(
    (r) => r.userId === currentUser?._id || r.userId?._id === currentUser?._id
  )?.emoji;

  // Read receipts: show double-check if any OTHER user has read
  const isRead = (message.readBy || []).some(
    (r) => (r.user?._id || r.user) !== currentUser?._id
  );

  return (
    <div
      className={`group flex items-end gap-2.5 animate-fade-in-up ${
        isMe ? "flex-row-reverse" : "flex-row"
      }`}
      onContextMenu={handleContextMenu}
    >
      {/* Avatar */}
      {!isMe && (
        <img
          src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || "U")}&background=7c3aed&color=fff`}
          alt={message.sender?.name}
          className="w-7 h-7 rounded-full object-cover flex-shrink-0 mb-5"
          style={{ border: "1.5px solid rgba(139,92,246,0.25)" }}
        />
      )}

      <div className="flex flex-col max-w-sm relative" ref={bubbleRef}>
        {/* Reply reference */}
        {message.replyTo && !isDeleted && (
          <div
            className="mb-1 px-3 py-1.5 rounded-xl text-xs truncate"
            style={{
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.2)",
              color: "rgba(167,139,250,0.9)",
              maxWidth: "100%",
            }}
          >
            <span style={{ color: "rgba(167,139,250,0.6)", fontSize: "10px" }}>
              ↩ Replying to
            </span>
            <p className="truncate mt-0.5">{message.replyTo.text}</p>
          </div>
        )}

        {/* Forward badge */}
        {message.isForwarded && !isDeleted && (
          <div className="flex items-center gap-1 mb-1" style={{ opacity: 0.5 }}>
            <ForwardIcon className="w-3 h-3" style={{ color: "#a78bfa" }} />
            <span className="text-[10px]" style={{ color: "#a78bfa" }}>
              Forwarded
            </span>
          </div>
        )}

        {/* Bubble */}
        <div
          className="px-4 py-2.5 relative"
          style={
            isDeleted
              ? {
                  background: "rgba(255,255,255,0.03)",
                  border: "1px dashed rgba(255,255,255,0.12)",
                  borderRadius: "18px",
                  opacity: 0.6,
                }
              : isMe
              ? {
                  background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                  border: "1px solid rgba(139,92,246,0.35)",
                  boxShadow: "0 4px 16px rgba(124,58,237,0.2)",
                  borderRadius: "18px 18px 4px 18px",
                }
              : {
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                  borderRadius: "18px 18px 18px 4px",
                }
          }
        >
          {isDeleted ? (
            <p
              className="text-sm italic"
              style={{ color: "rgba(241,245,249,0.35)" }}
            >
              This message was deleted
            </p>
          ) : (
            <p
              className="text-sm leading-relaxed whitespace-pre-wrap break-words"
              style={{ color: isMe ? "#fff" : "#e2e8f0" }}
            >
              {message.text}
            </p>
          )}

          {/* Time + edited + read */}
          <div
            className="flex items-center justify-end gap-1.5 mt-1.5"
            style={{ color: isMe ? "rgba(255,255,255,0.5)" : "rgba(241,245,249,0.3)" }}
          >
            {message.editedAt && !isDeleted && (
              <span className="text-[10px] italic">edited</span>
            )}
            <span className="text-[10px]">{formatTime(message.createdAt)}</span>
            {isMe && !isDeleted && (
              <span className="ml-0.5">
                {isRead ? (
                  <CheckCheckIcon className="w-3 h-3 text-violet-400" />
                ) : (
                  <CheckIcon className="w-3 h-3" style={{ color: "rgba(255,255,255,0.4)" }} />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Reaction bar */}
        {Object.keys(reactionGroups).length > 0 && (
          <div
            className={`flex items-center gap-1 mt-1 flex-wrap ${
              isMe ? "justify-end" : "justify-start"
            }`}
          >
            {Object.entries(reactionGroups).map(([emoji, count]) => (
              <button
                key={emoji}
                onClick={() => !isDeleted && onReact?.(message._id, emoji)}
                className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1 transition-all"
                style={{
                  background:
                    myReaction === emoji
                      ? "rgba(139,92,246,0.25)"
                      : "rgba(255,255,255,0.06)",
                  border:
                    myReaction === emoji
                      ? "1px solid rgba(139,92,246,0.4)"
                      : "1px solid rgba(255,255,255,0.1)",
                }}
              >
                {emoji}
                {count > 1 && (
                  <span style={{ color: "rgba(241,245,249,0.6)" }}>{count}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Hover action bar */}
      {!isDeleted && (
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity mb-6"
          style={{ flexShrink: 0 }}
        >
          <button
            onClick={() => setShowEmojiBar(!showEmojiBar)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            title="React"
          >
            <SmileIcon className="w-3.5 h-3.5" style={{ color: "rgba(167,139,250,0.8)" }} />
          </button>
          <button
            onClick={() => onReply?.(message)}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            title="Reply"
          >
            <ReplyIcon className="w-3.5 h-3.5" style={{ color: "rgba(167,139,250,0.8)" }} />
          </button>
          {isMe && (
            <>
              <button
                onClick={() => onEdit?.(message)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                title="Edit"
              >
                <PencilIcon className="w-3.5 h-3.5" style={{ color: "rgba(167,139,250,0.8)" }} />
              </button>
              <button
                onClick={() => onDelete?.(message)}
                className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
                title="Delete"
              >
                <TrashIcon className="w-3.5 h-3.5" style={{ color: "rgba(239,68,68,0.7)" }} />
              </button>
            </>
          )}
        </div>
      )}

      {/* Floating emoji picker */}
      {showEmojiBar && !isDeleted && (
        <div
          ref={menuRef}
          className="absolute z-50 flex items-center gap-1.5 px-3 py-2 rounded-2xl animate-scale-in"
          style={{
            bottom: "calc(100% + 8px)",
            [isMe ? "right" : "left"]: "0",
            background: "rgba(10,10,22,0.95)",
            border: "1px solid rgba(255,255,255,0.1)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          }}
        >
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => {
                onReact?.(message._id, emoji);
                setShowEmojiBar(false);
              }}
              className="text-xl hover:scale-125 transition-transform"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Right-click context menu */}
      {showMenu && !isDeleted && (
        <ContextMenu
          ref={menuRef}
          pos={menuPos}
          isMe={isMe}
          onReply={() => { onReply?.(message); setShowMenu(false); }}
          onEdit={() => { onEdit?.(message); setShowMenu(false); }}
          onDelete={() => { onDelete?.(message); setShowMenu(false); }}
          onReact={(e) => { onReact?.(message._id, e); setShowMenu(false); }}
          onClose={() => setShowMenu(false)}
        />
      )}
    </div>
  );
}

function ContextMenu({ pos, isMe, onReply, onEdit, onDelete, onReact, ref }) {
  const style = {
    position: "fixed",
    top: Math.min(pos.y, window.innerHeight - 260),
    left: Math.min(pos.x, window.innerWidth - 200),
    zIndex: 100,
    background: "rgba(10,10,22,0.97)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "16px",
    backdropFilter: "blur(20px)",
    boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
    padding: "8px",
    minWidth: "180px",
    animation: "scale-in 0.15s ease-out",
  };

  const item = (icon, label, onClick, danger = false) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all"
      style={{
        color: danger ? "#f87171" : "rgba(241,245,249,0.85)",
        background: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? "rgba(239,68,68,0.1)"
          : "rgba(139,92,246,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div style={style} ref={ref}>
      {/* Quick reactions */}
      <div className="flex items-center gap-1.5 px-3 py-2 mb-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        {QUICK_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => onReact(e)}
            className="text-lg hover:scale-125 transition-transform"
          >
            {e}
          </button>
        ))}
      </div>
      {item(<ReplyIcon className="w-4 h-4" />, "Reply", onReply)}
      {isMe && item(<PencilIcon className="w-4 h-4" />, "Edit", onEdit)}
      {isMe && item(<TrashIcon className="w-4 h-4" />, "Delete", onDelete, true)}
    </div>
  );
}
