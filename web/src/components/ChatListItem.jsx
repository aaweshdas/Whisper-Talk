import { formatDistanceToNow } from "date-fns";
import { useSocketStore } from "../lib/socket";

export function ChatListItem({ chat, otherParticipant, isSelected, onClick }) {
  const { onlineUsers } = useSocketStore();
  
  if (!otherParticipant) return null;
  const isOnline = onlineUsers.has(otherParticipant._id);

  return (
    <div
      onClick={onClick}
      className={`group w-full flex gap-3 p-3 rounded-xl cursor-pointer transition-all duration-200 border border-transparent ${
        isSelected
          ? "bg-white dark:bg-slate-800 shadow-sm border-slate-200 dark:border-slate-700"
          : "hover:bg-slate-100 dark:hover:bg-slate-800/50"
      }`}
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-medium overflow-hidden border border-slate-300 dark:border-slate-600">
          {otherParticipant?.avatar ? (
            <img src={otherParticipant.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            otherParticipant?.name?.[0]?.toUpperCase() || "U"
          )}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={`text-sm font-semibold truncate ${isSelected ? "text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-200"}`}>
            {otherParticipant?.name || "Unknown"}
          </h3>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap ml-2">
            {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true }) : "New"}
          </span>
        </div>
        <div className="flex justify-between items-center pr-2">
          <p className={`text-[13px] truncate ${chat.unreadCount > 0 ? "text-slate-900 dark:text-white font-medium" : "text-slate-500 dark:text-slate-400"}`}>
            {chat.lastMessage?.text || "Started a conversation"}
          </p>
          {chat.unreadCount > 0 && (
            <span className="shrink-0 ml-2 w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full shadow-sm">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
      
      {isSelected && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary-500 rounded-r-full" />
      )}
    </div>
  );
}
