import { PinIcon, BellOffIcon } from "lucide-react";
import { formatTime } from "../lib/utils";
import { useSocketStore } from "../lib/socket";

export function ChatListItem({ chat, isActive, onClick }) {
  const { onlineUsers, typingUsers } = useSocketStore();
  const isOnline = onlineUsers.has(chat.participant?._id);
  const isTyping = !!typingUsers.get(chat._id);
  const unread = chat.unreadCount || 0;

  const lastText = chat.lastMessage?.deletedForEveryone
    ? "This message was deleted"
    : chat.lastMessage?.text || "No messages yet";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
      style={{
        background: isActive ? "rgba(139,92,246,0.14)" : "transparent",
        border: isActive
          ? "1px solid rgba(139,92,246,0.28)"
          : "1px solid transparent",
        boxShadow: isActive
          ? "0 0 0 1px rgba(139,92,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05)"
          : "none",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.border = "1px solid rgba(255,255,255,0.07)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.border = "1px solid transparent";
        }
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={
            chat.participant?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.participant?.name || "U")}&background=7c3aed&color=fff`
          }
          alt={chat.participant?.name}
          className="w-11 h-11 rounded-full object-cover"
          style={{ border: "2px solid rgba(139,92,246,0.2)" }}
        />
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 online-dot"
            style={{ background: "#10b981", borderColor: "#06060c" }}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-semibold text-sm truncate flex items-center gap-1.5"
            style={{ color: isActive ? "#c4b5fd" : "#f1f5f9" }}
          >
            {chat.isPinned && (
              <PinIcon className="w-3 h-3 flex-shrink-0" style={{ color: "#a78bfa" }} />
            )}
            {chat.participant?.name || "Unknown"}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {chat.isMuted && (
              <BellOffIcon className="w-3 h-3" style={{ color: "rgba(241,245,249,0.25)" }} />
            )}
            {chat.lastMessageAt && (
              <span className="text-[10px]" style={{ color: "rgba(241,245,249,0.35)" }}>
                {formatTime(chat.lastMessageAt)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 mt-0.5">
          <p
            className="text-xs truncate flex-1"
            style={{
              color: isTyping
                ? "#a78bfa"
                : unread > 0
                ? "#e2e8f0"
                : "rgba(241,245,249,0.4)",
              fontStyle: isTyping ? "italic" : "normal",
              fontWeight: unread > 0 ? 500 : 400,
            }}
          >
            {isTyping ? "typing..." : lastText}
          </p>

          {/* Unread badge */}
          {unread > 0 && !isActive && (
            <span
              className="flex-shrink-0 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                color: "#fff",
              }}
            >
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
