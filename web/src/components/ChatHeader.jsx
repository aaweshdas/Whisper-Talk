import { SearchIcon, BellIcon, BellOffIcon, InfoIcon, VideoIcon } from "lucide-react";
import { useSocketStore } from "../lib/socket";

export function ChatHeader({ participant, chatId, isMuted, onToggleMute, onToggleInfo, onToggleSearch }) {
  const { onlineUsers, typingUsers, startCall } = useSocketStore();
  const isOnline = onlineUsers.has(participant?._id);
  const typingUserId = typingUsers.get(chatId);
  const isTyping = typingUserId && typingUserId === participant?._id;

  return (
    <div
      className="flex items-center gap-4 px-6 py-4 border-b"
      style={{
        borderColor: "rgba(255,255,255,0.07)",
        background: "rgba(6,6,18,0.5)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        <img
          src={
            participant?.avatar ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(participant?.name || "U")}&background=7c3aed&color=fff`
          }
          alt={participant?.name}
          className="w-10 h-10 rounded-full object-cover"
          style={{ border: "2px solid rgba(139,92,246,0.3)" }}
        />
        {isOnline && (
          <span
            className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 online-dot"
            style={{ background: "#10b981", borderColor: "#06060c" }}
          />
        )}
      </div>

      {/* Name + Status */}
      <div className="flex-1 min-w-0">
        <h2 className="font-semibold text-sm truncate" style={{ color: "#f1f5f9" }}>
          {participant?.name}
        </h2>
        <div className="flex items-center gap-2 mt-0.5">
          {isTyping ? (
            <span className="flex items-center gap-1.5">
              <span className="flex items-center gap-0.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </span>
              <span className="text-xs" style={{ color: "#a78bfa" }}>
                typing
              </span>
            </span>
          ) : (
            <span
              className="text-xs font-medium"
              style={{ color: isOnline ? "#10b981" : "rgba(241,245,249,0.35)" }}
            >
              {isOnline ? "Active now" : "Offline"}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {/* Video Call */}
        <HeaderButton onClick={() => startCall(participant._id)} title="Start Video Call">
          <VideoIcon className="w-4 h-4" />
        </HeaderButton>

        {/* Search */}
        <HeaderButton onClick={onToggleSearch} title="Search messages">
          <SearchIcon className="w-4 h-4" />
        </HeaderButton>

        {/* Mute */}
        <HeaderButton onClick={onToggleMute} title={isMuted ? "Unmute" : "Mute notifications"}>
          {isMuted ? (
            <BellOffIcon className="w-4 h-4" style={{ color: "#a78bfa" }} />
          ) : (
            <BellIcon className="w-4 h-4" />
          )}
        </HeaderButton>

        {/* Info panel */}
        <HeaderButton onClick={onToggleInfo} title="Chat info">
          <InfoIcon className="w-4 h-4" />
        </HeaderButton>
      </div>
    </div>
  );
}

function HeaderButton({ children, onClick, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        color: "rgba(241,245,249,0.5)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(139,92,246,0.12)";
        e.currentTarget.style.borderColor = "rgba(139,92,246,0.25)";
        e.currentTarget.style.color = "#a78bfa";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
        e.currentTarget.style.color = "rgba(241,245,249,0.5)";
      }}
    >
      {children}
    </button>
  );
}
