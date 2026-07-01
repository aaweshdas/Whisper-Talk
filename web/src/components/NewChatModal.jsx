import { useState } from "react";
import { XIcon, SearchIcon, UsersIcon } from "lucide-react";
import { useSocketStore } from "../lib/socket";
import { useUsers } from "../hooks/useUsers";

export function NewChatModal({ onStartChat, isPending, isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState("");
  const { onlineUsers } = useSocketStore();
  const { data: allUsers = [] } = useUsers();
  const isOnline = (id) => onlineUsers.has(id);

  const handleStartChat = (participantId) => {
    onStartChat(participantId);
    setSearchQuery("");
    onClose();
  };

  const searchResults = allUsers.filter((u) => {
    if (!searchQuery.trim()) return true; // Show all by default
    const query = searchQuery.toLowerCase();
    return (
      u.name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="whisper-modal-backdrop" onClick={onClose}>
      <div
        className="whisper-modal glass-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(139,92,246,0.15)",
                border: "1px solid rgba(139,92,246,0.25)",
              }}
            >
              <UsersIcon className="w-4 h-4" style={{ color: "#a78bfa" }} />
            </div>
            <h3 className="font-semibold" style={{ color: "#f1f5f9" }}>
              New Conversation
            </h3>
          </div>
          <button
            onClick={() => {
              setSearchQuery("");
              onClose();
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.07)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            }}
          >
            <XIcon className="w-4 h-4" style={{ color: "rgba(241,245,249,0.5)" }} />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="relative">
            <SearchIcon
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "rgba(241,245,249,0.3)" }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="whisper-input"
              style={{ paddingLeft: "2.5rem" }}
              autoFocus
            />
          </div>
        </div>

        {/* Results */}
        <div
          className="px-3 pb-4 overflow-y-auto"
          style={{ maxHeight: "320px" }}
        >
          {searchResults.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <SearchIcon
                  className="w-5 h-5"
                  style={{ color: "rgba(241,245,249,0.2)" }}
                />
              </div>
              <p className="text-sm" style={{ color: "rgba(241,245,249,0.4)" }}>
                No users found
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((u) => (
                <button
                  key={u._id}
                  onClick={() => handleStartChat(u._id)}
                  disabled={isPending}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all text-left"
                  style={{ cursor: isPending ? "not-allowed" : "pointer", border: "1px solid transparent" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                    e.currentTarget.style.border = "1px solid rgba(139,92,246,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                    e.currentTarget.style.border = "1px solid transparent";
                  }}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={u.avatar}
                      alt={u.name}
                      className="w-10 h-10 rounded-full object-cover"
                      style={{ border: "2px solid rgba(139,92,246,0.2)" }}
                    />
                    {isOnline(u._id) && (
                      <span
                        className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 online-dot"
                        style={{ background: "#10b981", borderColor: "#06060c" }}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p
                      className="font-medium text-sm truncate"
                      style={{ color: "#f1f5f9" }}
                    >
                      {u.name}
                    </p>
                    <p
                      className="text-xs truncate mt-0.5"
                      style={{ color: "rgba(241,245,249,0.4)" }}
                    >
                      {u.email}
                    </p>
                  </div>
                  {isOnline(u._id) && (
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{
                        background: "rgba(16,185,129,0.12)",
                        color: "#10b981",
                        border: "1px solid rgba(16,185,129,0.2)",
                      }}
                    >
                      Online
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
