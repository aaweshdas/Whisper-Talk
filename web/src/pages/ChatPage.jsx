import { useEffect, useState, useRef } from "react";
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
import { GroupCallModal } from "../components/GroupCallModal";
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
  const messagesEndRef = useRef(null);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChats = chats?.filter((c) => {
    if (!searchQuery) return true;
    const other = c.participant;  // backend shape: { participant: User }
    return other?.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (!isAuthenticated) return null;

  return (
    <div 
      className="h-screen w-full flex overflow-hidden font-sans bg-cover bg-center bg-no-repeat bg-slate-950"
      style={{ backgroundImage: `url('/bg.png')` }}
    >
      <div className="flex-1 flex overflow-hidden lg:p-4 gap-4">
        
        {/* ── FAR-LEFT RAIL (Icons only) ── */}
        <nav className="w-16 flex-shrink-0 flex flex-col items-center py-6 gap-6 bg-black/40 backdrop-blur-xl lg:rounded-3xl border border-white/20 shadow-2xl z-20">
          <button onClick={() => setShowSettings(true)} className="relative group focus:outline-none transition-all">
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-medium overflow-hidden border-2 border-transparent group-hover:border-primary-500 transition-all shadow-md">
              {currentUser?.avatar ? (
                <img src={currentUser.avatar} alt="Me" className="w-full h-full object-cover" />
              ) : (
                currentUser?.name?.[0]?.toUpperCase() || "U"
              )}
            </div>
            <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </button>
          
          <div className="flex flex-col gap-4 w-full px-2 mt-4">
            <button
              onClick={() => setShowNewChat(true)}
              className="w-full aspect-square flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="New Chat"
            >
              <MessageSquarePlusIcon className="w-6 h-6" />
            </button>
            <button
              onClick={toggleTheme}
              className="w-full aspect-square flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Toggle Theme"
            >
              {theme === "dark" ? <SunIcon className="w-6 h-6" /> : <MoonIcon className="w-6 h-6" />}
            </button>
          </div>
          
          <div className="mt-auto flex flex-col w-full px-2">
            <button
              onClick={handleLogout}
              className="w-full aspect-square flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Logout"
            >
              <LogOutIcon className="w-6 h-6" />
            </button>
          </div>
        </nav>

        {/* ── SIDEBAR (Chats List) ── */}
        <aside className="w-80 flex-shrink-0 flex flex-col bg-black/40 backdrop-blur-xl lg:rounded-3xl border border-white/20 shadow-2xl z-10 overflow-hidden">
          
          {/* Header */}
          <div className="h-24 px-6 flex items-end pb-4">
            <h2 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm">Messages</h2>
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
      <main className="flex-1 flex flex-col relative min-w-0 bg-black/40 backdrop-blur-xl lg:rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
        {activeChatId && activeChat ? (
          <>
            <ChatHeader 
              chat={activeChat}
              user={activeChatUser} 
              chatId={activeChatId}
              onToggleInfo={() => setShowInfoPanel(!showInfoPanel)} 
            />
            
            <div className="flex-1 flex overflow-hidden relative">
              <div className="flex-1 flex flex-col bg-transparent relative">
                <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-1 relative">
                  {messages?.map((msg, idx) => {
                    const isMe = (msg.sender?._id ?? msg.sender) === currentUser?._id;
                    
                    const prevMsg = messages[idx - 1];
                    const nextMsg = messages[idx + 1];
                    const prevIsSame = prevMsg && (prevMsg.sender?._id ?? prevMsg.sender) === (msg.sender?._id ?? msg.sender);
                    const nextIsSame = nextMsg && (nextMsg.sender?._id ?? nextMsg.sender) === (msg.sender?._id ?? msg.sender);
                    
                    const showAvatar = !isMe && !nextIsSame;
                    const showName = !isMe && !prevIsSame;
                    const isFirstInGroup = !prevIsSame;

                    return (
                      <div key={msg._id} className={isFirstInGroup && idx !== 0 ? "mt-4" : ""}>
                        <MessageBubble 
                          message={msg} 
                          isMe={isMe} 
                          showAvatar={showAvatar}
                          showName={showName}
                          user={isMe ? currentUser : activeChatUser}
                          onReply={setReplyingTo}
                        />
                      </div>
                    );
                  })}
                  {!messages?.length && (
                    <div className="flex flex-col items-center justify-center h-full text-slate-300 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <MessageSquareIcon className="w-6 h-6 opacity-40 text-white" />
                      </div>
                      <p className="text-sm font-medium">This is the beginning of your chat history.</p>
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-32 shrink-0 w-full" />
                </div>
                {/* Floating Island Input */}
                <div className="absolute bottom-6 left-0 right-0 px-6 pointer-events-none">
                  <div className="max-w-4xl mx-auto pointer-events-auto bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 p-2">
                    <ChatInput 
                      chatId={activeChatId} 
                      replyingTo={replyingTo} 
                      onCancelReply={() => setReplyingTo(null)} 
                    />
                  </div>
                </div>
              </div>

              {showInfoPanel && (
                <div className="w-72 md:w-80 border-l border-white/10 bg-black/40 backdrop-blur-xl flex-shrink-0 flex flex-col overflow-y-auto transition-all">
                  <ChatInfoPanel user={activeChatUser} chat={activeChat} chatId={activeChatId} onClose={() => setShowInfoPanel(false)} />
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-transparent">
            <div className="text-center space-y-6 max-w-md px-6 bg-slate-900/60 p-8 rounded-3xl backdrop-blur-xl shadow-2xl border border-white/10">
              <div className="w-20 h-20 bg-black/40 rounded-2xl mx-auto flex items-center justify-center shadow-inner border border-white/10 overflow-hidden">
                <img src="/logo.jpg" alt="Whisper Logo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Whisper</h2>
                <p className="text-slate-300 text-sm leading-relaxed">
                  Select a conversation from the sidebar to start messaging, or create a new one to connect with your team.
                </p>
              </div>
              <button 
                onClick={() => setShowNewChat(true)}
                className="bg-primary-500 hover:bg-primary-600 text-white shadow-lg shadow-primary-500/20 font-medium rounded-xl px-6 py-3 transition-all duration-200 active:scale-95 mt-2"
              >
                Start a New Conversation
              </button>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* ── MODALS ── */}
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} onSelect={(id) => { 
        setActiveChatId(id); 
        useSocketStore.getState().setActiveChatId(id);
        setShowNewChat(false); 
      }} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <GroupCallModal />
    </div>
  );
}
