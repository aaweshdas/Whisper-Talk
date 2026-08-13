import { VideoIcon, PhoneIcon, MoreVerticalIcon, InfoIcon } from "lucide-react";
import { useSocketStore } from "../lib/socket";
import { useCurrentUser } from "../hooks/useCurrentUser";

export function ChatHeader({ chat, user, chatId, onToggleInfo }) {
  const { startGroupCall, joinGroupCall, activeGroupCalls, onlineUsers, typingUsers } = useSocketStore();
  const { data: currentUser } = useCurrentUser();

  const activeCall = activeGroupCalls[chatId];
  const isInCall = activeCall?.participants?.includes(currentUser?._id);
  const isCallActive = !!activeCall;

  const handleStartCall = () => {
    startGroupCall(chatId, "video");
  };

  const handleJoinCall = () => {
    joinGroupCall(chatId);
  };

  const isOnline = onlineUsers.has(user?._id);
  const isTyping = typingUsers.get(chatId) === user?._id;

  const formatLastSeen = (dateString) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Offline";
    
    const now = new Date();
    const isToday = date.getDate() === now.getDate() && 
                    date.getMonth() === now.getMonth() && 
                    date.getFullYear() === now.getFullYear();
                    
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (isToday) {
      return `Last seen today at ${timeStr}`;
    }
    
    const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    return `Last seen ${dateStr} at ${timeStr}`;
  };

  return (
    <div className="h-24 px-6 flex items-center justify-between bg-slate-900/60 backdrop-blur-xl border-b border-white/5 z-10 sticky top-0 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-medium overflow-hidden border-2 border-white/10 shadow-sm shrink-0">
          {chat?.isGroupChat ? (
            chat.groupAvatar ? (
              <img src={chat.groupAvatar} alt={chat.chatName} className="w-full h-full object-cover" />
            ) : (
              chat.chatName?.[0]?.toUpperCase() || "G"
            )
          ) : user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name?.[0]?.toUpperCase() || "U"
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg text-white leading-tight drop-shadow-sm">
            {chat?.isGroupChat ? chat.chatName : (user?.name || "Unknown User")}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {chat?.isGroupChat ? (
              <span className="text-xs font-medium text-slate-400">
                {chat.participants?.length || 0} participants
              </span>
            ) : isTyping ? (
              <>
                <span className="text-xs font-medium text-primary-500 italic">Typing...</span>
              </>
            ) : isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-medium text-slate-300">Online</span>
              </>
            ) : (
              <span className="text-xs font-medium text-slate-400">
                {formatLastSeen(user?.lastSeen)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {chat?.isGroupChat && (
          isCallActive && !isInCall ? (
            <button 
              onClick={handleJoinCall}
              className="px-4 py-2 rounded-xl flex items-center gap-2 text-white bg-emerald-500 hover:bg-emerald-600 font-medium transition-colors shadow-lg shadow-emerald-500/20 animate-pulse"
            >
              <VideoIcon className="w-4 h-4" />
              <span>Join Call</span>
            </button>
          ) : (
            <button 
              onClick={handleStartCall}
              disabled={isInCall}
              className="px-4 py-2 rounded-xl flex items-center gap-2 text-white bg-primary-500 hover:bg-primary-600 font-medium transition-colors shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <VideoIcon className="w-4 h-4" />
              <span>{isInCall ? "In Call" : "Group Call"}</span>
            </button>
          )
        )}
        {/* 1-on-1 calls have been removed as per user request */}
        <div className="w-px h-6 bg-white/10 mx-2 hidden sm:block"></div>
        <button 
          onClick={onToggleInfo}
          className="w-10 h-10 hidden sm:flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <InfoIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={onToggleInfo}
          className="w-10 h-10 sm:hidden flex items-center justify-center rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <MoreVerticalIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
