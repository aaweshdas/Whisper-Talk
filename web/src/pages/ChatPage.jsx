import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useSocketStore } from "../lib/socket";
import { useSocketConnection } from "../hooks/useSocketConnection";
import { useAuthStore } from "../lib/auth";
import {
  SparklesIcon,
  MessageSquareIcon,
  PlusIcon,
  InboxIcon,
  ArchiveIcon,
  PinIcon,
  LogOut,
} from "lucide-react";

import { useChats, useGetOrCreateChat, useTogglePinChat, useToggleArchiveChat, useToggleMuteChat } from "../hooks/useChats";
import { useMessages, useMarkAsRead, useReactToMessage, useEditMessage, useDeleteMessage, useSearchMessages } from "../hooks/useMessages";
import { ChatListItem } from "../components/ChatListItem";
import { ChatHeader } from "../components/ChatHeader";
import { MessageBubble } from "../components/MessageBubble";
import { ChatInput } from "../components/ChatInput";
import { ChatInfoPanel } from "../components/ChatInfoPanel";
import { SearchBar } from "../components/SearchBar";
import { EditMessageModal } from "../components/EditMessageModal";
import { DeleteMessageModal } from "../components/DeleteMessageModal";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { NewChatModal } from "../components/NewChatModal";
import { VideoCallModal } from "../components/VideoCallModal";

function ChatPage() {
  const { data: currentUser } = useCurrentUser();
  const { logout } = useAuthStore();

  const [searchParams, setSearchParams] = useSearchParams();
  const activeChatId = searchParams.get("chat");

  const [messageInput, setMessageInput] = useState("");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [deletingMessage, setDeletingMessage] = useState(null);
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [sidebarFilter, setSidebarFilter] = useState("all"); // all | pinned | archived

  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const messageRefs = useRef({}); // _id -> DOM ref
  const typingTimeoutRef = useRef(null);

  const { socket, setTyping, sendMessage, emitEditMessage, emitDeleteMessage, markRead } = useSocketStore();

  useSocketConnection(activeChatId);

  // ── Data ────────────────────────────────────────────────────────────────────
  const { data: allChats = [], isLoading: chatsLoading } = useChats();
  const { data: messages = [], isLoading: messagesLoading } = useMessages(activeChatId);
  const startChatMutation = useGetOrCreateChat();
  const markAsReadMutation = useMarkAsRead();
  const reactMutation = useReactToMessage();
  const editMutation = useEditMessage();
  const deleteMutation = useDeleteMessage();
  const searchMutation = useSearchMessages(activeChatId);
  const togglePinMutation = useTogglePinChat();
  const toggleArchiveMutation = useToggleArchiveChat();
  const toggleMuteMutation = useToggleMuteChat();

  // ── Filtered chat list ────────────────────────────────────────────────────
  const chats = allChats.filter((c) => {
    if (sidebarFilter === "pinned") return c.isPinned;
    if (sidebarFilter === "archived") return c.isArchived;
    return !c.isArchived;
  });

  const activeChat = allChats.find((c) => c._id === activeChatId);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTo({
        top: messagesContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [activeChatId, messages?.length]);

  // ── Mark as read when chat becomes active ────────────────────────────────
  useEffect(() => {
    if (activeChatId && currentUser?._id) {
      markAsReadMutation.mutate(activeChatId);
      markRead(activeChatId, currentUser._id);
    }
  }, [activeChatId, currentUser?._id]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleStartChat = (participantId) => {
    startChatMutation.mutate(participantId, {
      onSuccess: (chat) => setSearchParams({ chat: chat._id }),
    });
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageInput.trim() || !activeChatId || !socket || !currentUser) return;
    const text = messageInput.trim();
    sendMessage(activeChatId, text, currentUser, replyTo);
    setMessageInput("");
    setReplyTo(null);
    setTyping(activeChatId, false, currentUser._id);
  };

  const handleTyping = (e) => {
    setMessageInput(e.target.value);
    if (!activeChatId || !currentUser) return;
    setTyping(activeChatId, true, currentUser._id);
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(activeChatId, false, currentUser._id);
    }, 2000);
  };

  const handleReact = (messageId, emoji) => {
    reactMutation.mutate({ messageId, chatId: activeChatId, emoji });
  };

  const handleEditConfirm = (text) => {
    if (!editingMessage) return;
    editMutation.mutate(
      { messageId: editingMessage._id, chatId: activeChatId, text },
      {
        onSuccess: ({ data }) => {
          emitEditMessage(data._id, activeChatId, data.text, data.editedAt);
          setEditingMessage(null);
        },
      }
    );
  };

  const handleDeleteConfirm = (deleteFor) => {
    if (!deletingMessage) return;
    deleteMutation.mutate(
      { messageId: deletingMessage._id, chatId: activeChatId, deleteFor },
      {
        onSuccess: () => {
          emitDeleteMessage(deletingMessage._id, activeChatId, deleteFor);
          setDeletingMessage(null);
        },
      }
    );
  };

  const handleSearch = useCallback(
    (q) => {
      searchMutation.mutate(q, {
        onSuccess: (results) => setSearchResults(results),
      });
    },
    [searchMutation]
  );

  const handleJumpTo = (messageId) => {
    const el = messageRefs.current[messageId];
    if (el && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      const scrollPos = el.offsetTop - container.offsetTop - container.clientHeight / 2 + el.clientHeight / 2;
      container.scrollTo({ top: scrollPos, behavior: "smooth" });
      el.style.outline = "2px solid rgba(139,92,246,0.5)";
      el.style.borderRadius = "18px";
      el.style.transition = "outline 0.3s ease";
      setTimeout(() => {
        el.style.outline = "none";
      }, 2000);
    }
    setShowSearch(false);
    setSearchResults([]);
  };

  return (
    <div className="h-screen w-screen relative flex overflow-hidden" style={{ background: "#06060c" }}>
      {/* Ambient Orbs */}
      <div className="glow-orb-violet opacity-20" style={{ top: "-10%", left: "-8%" }} />
      <div className="glow-orb-cyan opacity-15" style={{ bottom: "-10%", right: "-8%" }} />

      {/* Grid */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.012) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Main container */}
      <div className="relative z-10 flex w-full h-full md:p-5">
        <div
          className="flex w-full h-full md:rounded-3xl overflow-hidden"
          style={{
            background: "rgba(10,10,22,0.65)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          {/* ━━━━ SIDEBAR ━━━━ */}
          <aside
            className="w-72 lg:w-80 flex flex-col flex-shrink-0"
            style={{
              borderRight: "1px solid rgba(255,255,255,0.07)",
              background: "rgba(0,0,0,0.25)",
            }}
          >
            {/* Sidebar Header */}
            <div
              className="px-5 py-5 flex flex-col gap-4"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
            >
              {/* Brand + Avatar */}
              <div className="flex items-center justify-between">
                <Link to="/chat" className="flex items-center gap-2.5 group">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      boxShadow: "0 0 16px rgba(124,58,237,0.3)",
                    }}
                  >
                    <SparklesIcon className="w-4 h-4 text-white" />
                  </div>
                  <span
                    className="font-bold text-lg tracking-tight"
                    style={{
                      background: "linear-gradient(135deg, #fff 40%, #a78bfa)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    Whisper
                  </span>
                </Link>
                {/* User avatar + logout */}
                <div className="flex items-center gap-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white select-none"
                    style={{
                      background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      boxShadow: "0 0 12px rgba(124,58,237,0.35)",
                    }}
                    title={currentUser?.username}
                  >
                    {currentUser?.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <button
                    onClick={logout}
                    title="Sign out"
                    className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
                    style={{
                      color: "rgba(241,245,249,0.45)",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.07)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = "#f87171";
                      e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                      e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(241,245,249,0.45)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                    }}
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* New Conversation */}
              <button
                onClick={() => setIsNewChatModalOpen(true)}
                className="gradient-btn w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ cursor: "pointer" }}
              >
                <PlusIcon className="w-4 h-4" />
                New Conversation
              </button>
            </div>

            {/* Filter tabs */}
            <div
              className="flex items-center gap-1 px-3 py-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
            >
              {[
                { key: "all", label: "All" },
                { key: "pinned", label: "Pinned", icon: <PinIcon className="w-3 h-3" /> },
                { key: "archived", label: "Archived", icon: <ArchiveIcon className="w-3 h-3" /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setSidebarFilter(tab.key)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background:
                      sidebarFilter === tab.key
                        ? "rgba(139,92,246,0.15)"
                        : "transparent",
                    color:
                      sidebarFilter === tab.key
                        ? "#a78bfa"
                        : "rgba(241,245,249,0.4)",
                    border:
                      sidebarFilter === tab.key
                        ? "1px solid rgba(139,92,246,0.25)"
                        : "1px solid transparent",
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Chat list */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
              {chatsLoading && (
                <div className="flex items-center justify-center py-16">
                  <div className="loader-ring" />
                </div>
              )}
              {chats.length === 0 && !chatsLoading && <NoConversationsUI />}
              {chats.map((chat) => (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  isActive={activeChatId === chat._id}
                  onClick={() => setSearchParams({ chat: chat._id })}
                />
              ))}
            </div>
          </aside>

          {/* ━━━━ MAIN CHAT AREA ━━━━ */}
          <main
            className="flex-1 flex flex-col min-w-0"
            style={{ background: "rgba(6,6,18,0.3)" }}
          >
            {activeChatId && activeChat ? (
              <>
                <ChatHeader
                  participant={activeChat.participant}
                  chatId={activeChatId}
                  isMuted={activeChat.isMuted}
                  onToggleMute={() => toggleMuteMutation.mutate(activeChatId)}
                  onToggleInfo={() => setShowInfoPanel((v) => !v)}
                  onToggleSearch={() => {
                    setShowSearch((v) => !v);
                    setSearchResults([]);
                  }}
                />

                {/* Search bar */}
                {showSearch && (
                  <SearchBar
                    results={searchResults}
                    onSearch={handleSearch}
                    onClose={() => { setShowSearch(false); setSearchResults([]); }}
                    onJumpTo={handleJumpTo}
                    isSearching={searchMutation.isPending}
                  />
                )}

                {/* Messages */}
                <div
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto px-6 py-6 space-y-3"
                >
                  {messagesLoading && (
                    <div className="flex items-center justify-center h-full">
                      <div className="loader-ring" />
                    </div>
                  )}

                  {messages.length === 0 && !messagesLoading && <NoMessagesUI />}

                  {messages.map((msg) => (
                    <div
                      key={msg._id}
                      ref={(el) => {
                        if (el) messageRefs.current[msg._id] = el;
                      }}
                    >
                      <MessageBubble
                        message={msg}
                        currentUser={currentUser}
                        onReply={(m) => setReplyTo(m)}
                        onEdit={(m) => setEditingMessage(m)}
                        onDelete={(m) => setDeletingMessage(m)}
                        onReact={handleReact}
                      />
                    </div>
                  ))}

                  <div ref={messagesEndRef} />
                </div>

                <ChatInput
                  value={messageInput}
                  onChange={handleTyping}
                  onSubmit={handleSend}
                  disabled={!messageInput.trim()}
                  replyTo={replyTo}
                  onCancelReply={() => setReplyTo(null)}
                />
              </>
            ) : (
              <NoChatSelectedUI />
            )}
          </main>

          {/* ━━━━ INFO PANEL ━━━━ */}
          {showInfoPanel && activeChatId && activeChat && (
            <ChatInfoPanel
              participant={activeChat.participant}
              chatId={activeChatId}
              isPinned={activeChat.isPinned}
              isArchived={activeChat.isArchived}
              isMuted={activeChat.isMuted}
              onTogglePin={() => togglePinMutation.mutate(activeChatId)}
              onToggleArchive={() => toggleArchiveMutation.mutate(activeChatId)}
              onToggleMute={() => toggleMuteMutation.mutate(activeChatId)}
              onClose={() => setShowInfoPanel(false)}
            />
          )}
        </div>
      </div>

      {/* Modals */}
      <NewChatModal
        onStartChat={handleStartChat}
        isPending={startChatMutation.isPending}
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
      />

      {editingMessage && (
        <EditMessageModal
          message={editingMessage}
          onConfirm={handleEditConfirm}
          onClose={() => setEditingMessage(null)}
        />
      )}

      {deletingMessage && (
        <DeleteMessageModal
          message={deletingMessage}
          isMe={deletingMessage.sender?._id === currentUser?._id}
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeletingMessage(null)}
        />
      )}

      <VideoCallModal />
    </div>
  );
}

export default ChatPage;

/* ── Empty States ── */

function NoConversationsUI() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.15)" }}
      >
        <InboxIcon className="w-5 h-5" style={{ color: "rgba(167,139,250,0.6)" }} />
      </div>
      <p className="text-sm font-medium" style={{ color: "rgba(241,245,249,0.6)" }}>
        No conversations yet
      </p>
      <p className="text-xs mt-1 max-w-[160px]" style={{ color: "rgba(241,245,249,0.3)" }}>
        Tap New Conversation to start messaging.
      </p>
    </div>
  );
}

function NoMessagesUI() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center mb-5"
        style={{
          background: "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.18)",
          boxShadow: "0 0 32px rgba(139,92,246,0.1)",
        }}
      >
        <MessageSquareIcon className="w-7 h-7" style={{ color: "#a78bfa" }} />
      </div>
      <p className="font-semibold" style={{ color: "#f1f5f9" }}>
        Start the conversation
      </p>
      <p className="text-sm mt-2 max-w-sm leading-relaxed" style={{ color: "rgba(241,245,249,0.4)" }}>
        Say hi — Whisper messages are end-to-end encrypted and delivered instantly.
      </p>
    </div>
  );
}

function NoChatSelectedUI() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center px-8 relative overflow-hidden">
      <div
        className="absolute w-80 h-80 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div className="relative z-10 flex flex-col items-center">
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6"
          style={{
            background: "linear-gradient(135deg, rgba(124,58,237,0.18), rgba(79,70,229,0.18))",
            border: "1px solid rgba(139,92,246,0.25)",
            boxShadow: "0 0 40px rgba(139,92,246,0.1)",
          }}
        >
          <MessageSquareIcon className="w-10 h-10" style={{ color: "#a78bfa" }} />
        </div>
        <h2
          className="text-2xl font-bold mb-3"
          style={{
            background: "linear-gradient(135deg, #fff 40%, #a78bfa)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Welcome to Whisper
        </h2>
        <p className="max-w-xs leading-relaxed text-sm" style={{ color: "rgba(241,245,249,0.4)" }}>
          Select a conversation from the sidebar, or tap{" "}
          <span style={{ color: "#a78bfa", fontWeight: 600 }}>New Conversation</span>{" "}
          to find and message your friends.
        </p>
      </div>
    </div>
  );
}
