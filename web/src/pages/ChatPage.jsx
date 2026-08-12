import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "../lib/auth";
import { useSocketStore } from "../lib/socket";
import { useQueryClient } from "@tanstack/react-query";
import { useChats } from "../hooks/useChats";
import { useMessages } from "../hooks/useMessages";
import { useCurrentUser } from "../hooks/useCurrentUser";

import { LogOutIcon, MessageSquarePlusIcon, MessageSquareIcon, MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";
import { ChatListItem } from "../components/ChatListItem";
import { ChatHeader } from "../components/ChatHeader";
import { ChatInfoPanel } from "../components/ChatInfoPanel";
import { MessageBubble } from "../components/MessageBubble";
import { ChatInput } from "../components/ChatInput";
import { SearchBar } from "../components/SearchBar";
import { NewChatModal } from "../components/NewChatModal";
import { VideoCallModal } from "../components/VideoCallModal";
import { SettingsModal } from "../components/SettingsModal";

export function ChatPage() {
  const { status, logout, token } = useAuthStore();
  const isAuthenticated = status === "authenticated";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { connect, disconnect, activeCallUserId, callState, incomingCall } = useSocketStore();
  const { data: chats, isLoading: isChatsLoading } = useChats();
  const { data: currentUser } = useCurrentUser();

  const { theme, toggleTheme } = useTheme();

  const [activeChatId, setActiveChatId] = useState(null);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showInfoPanel, setShowInfoPanel] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) navigate("/auth");
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (token && currentUser?._id) {
      connect(token, queryClient, currentUser._id);
    }
    return () => disconnect();
  }, [token, currentUser?._id]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const activeChat = chats?.find((c) => c._id === activeChatId);
  const activeChatUser = activeChat?.participant;  // backend returns { participant: User } not participants[]
  const { data: messages } = useMessages(activeChatId);

  const filteredChats = chats?.filter((c) => {
    if (!searchQuery) return true;
    const other = c.participant;  // backend shape: { participant: User }
    return other?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isAuthenticated) return null;

  return (
    <div className="h-screen w-full flex overflow-hidden bg-white dark:bg-slate-950 font-sans">
      
      {/* ── SIDEBAR (Chats List) ── */}
      <aside className="w-80 md:w-96 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        
        {/* Sidebar Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setShowSettings(true)} className="relative group focus:outline-none rounded-full ring-offset-2 ring-offset-slate-50 dark:ring-offset-slate-900 focus-visible:ring-2 focus-visible:ring-primary-500 transition-all">
              <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-medium overflow-hidden border border-slate-300 dark:border-slate-700 shadow-sm group-hover:ring-2 group-hover:ring-primary-500/50 transition-all">
                {currentUser?.avatar ? (
                  <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
                ) : (
                  currentUser?.name?.[0]?.toUpperCase() || "U"
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-50 dark:border-slate-900" />
            </button>
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[120px]">
              {currentUser?.name || "Loading..."}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowNewChat(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              title="New Chat"
            >
              <MessageSquarePlusIcon className="w-5 h-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {theme === "dark" ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={handleLogout}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOutIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-3">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Chats List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 space-y-1">
          {isChatsLoading ? (
            <div className="flex flex-col gap-2 p-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-3 items-center animate-pulse p-2">
                  <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/2" />
                    <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredChats?.length > 0 ? (
            filteredChats.map((chat) => {
              const otherParticipant = chat.participant;  // backend shape: { participant: User }
              const isSelected = activeChatId === chat._id;
              return (
                <ChatListItem
                  key={chat._id}
                  chat={chat}
                  otherParticipant={otherParticipant}
                  isSelected={isSelected}
                  onClick={() => {
                    setActiveChatId(chat._id);
                    useSocketStore.getState().setActiveChatId(chat._id);
                  }}
                />
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <MessageSquarePlusIcon className="w-5 h-5 opacity-50" />
              </div>
              <p className="text-sm">No conversations found.</p>
            </div>
          )}
        </div>
      </aside>

      {/* ── MAIN CONTENT (Chat Area) ── */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-white dark:bg-slate-950">
        {activeChatId && activeChatUser ? (
          <>
            <ChatHeader 
              user={activeChatUser} 
              chatId={activeChatId}
              onToggleInfo={() => setShowInfoPanel(!showInfoPanel)} 
            />
            
            <div className="flex-1 flex overflow-hidden relative">
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                  {messages?.map((msg, idx) => {
                    const isMe = (msg.sender?._id ?? msg.sender) === currentUser?._id;
                    const showAvatar = idx === messages.length - 1 || (messages[idx + 1]?.sender?._id ?? messages[idx + 1]?.sender) !== (msg.sender?._id ?? msg.sender);
                    return (
                      <MessageBubble 
                        key={msg._id} 
                        message={msg} 
                        isMe={isMe} 
                        showAvatar={showAvatar}
                        user={isMe ? currentUser : activeChatUser}
                        onReply={setReplyingTo}
                      />
                    );
                  })}
                  {!messages?.length && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800">
                        <MessageSquareIcon className="w-6 h-6 opacity-40" />
                      </div>
                      <p className="text-sm">This is the beginning of your chat history.</p>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                  <ChatInput 
                    chatId={activeChatId} 
                    replyingTo={replyingTo} 
                    onCancelReply={() => setReplyingTo(null)} 
                  />
                </div>
              </div>

              {/* Info Panel Sliding from right */}
              {showInfoPanel && (
                <div className="w-72 md:w-80 border-l border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex-shrink-0 flex flex-col overflow-y-auto transition-all">
                  <ChatInfoPanel user={activeChatUser} chatId={activeChatId} onClose={() => setShowInfoPanel(false)} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="text-center space-y-6 max-w-md px-6">
              <div className="w-20 h-20 bg-white dark:bg-slate-900 rounded-2xl mx-auto flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-800">
                <MessageSquareIcon className="w-8 h-8 text-primary-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Whisper</h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                  Select a conversation from the sidebar to start messaging, or create a new one to connect with your team.
                </p>
              </div>
              <button 
                onClick={() => setShowNewChat(true)}
                className="btn-primary mt-2"
              >
                Start a New Conversation
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── MODALS ── */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onSelect={(id) => { 
        setActiveChatId(id); 
        useSocketStore.getState().setActiveChatId(id);
        setShowNewChat(false); 
      }} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <VideoCallModal />
    </div>
  );
}
