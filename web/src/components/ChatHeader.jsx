import { VideoIcon, PhoneIcon, MoreVerticalIcon, InfoIcon } from "lucide-react";
import { useSocketStore } from "../lib/socket";
import { useCurrentUser } from "../hooks/useCurrentUser";

export function ChatHeader({ user, chatId, onToggleInfo }) {
  const { startCall, onlineUsers, typingUsers } = useSocketStore();
  const { data: currentUser } = useCurrentUser();

  const handleVideoCall = () => {
    startCall(user._id);
  };

  const isOnline = onlineUsers.has(user?._id);
  const isTyping = typingUsers.get(chatId) === user?._id;

  return (
    <div className="h-16 px-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/80 dark:bg-slate-950/80 backdrop-blur-md sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-medium overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm shrink-0">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            user?.name?.[0]?.toUpperCase() || "U"
          )}
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-slate-900 dark:text-white leading-tight">
            {user?.name || "Unknown User"}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {isTyping ? (
              <>
                <span className="text-xs font-medium text-primary-500 italic">Typing...</span>
              </>
            ) : isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Online</span>
              </>
            ) : (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Offline</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <button 
          onClick={handleVideoCall}
          className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:text-slate-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20 transition-colors"
        >
          <VideoIcon className="w-5 h-5" />
        </button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>
        <button 
          onClick={onToggleInfo}
          className="w-9 h-9 hidden sm:flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        >
          <InfoIcon className="w-5 h-5" />
        </button>
        <button 
          onClick={onToggleInfo}
          className="w-9 h-9 sm:hidden flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        >
          <MoreVerticalIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
