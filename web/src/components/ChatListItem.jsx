import { formatDistanceToNow } from "date-fns";
import { useSocketStore } from "../lib/socket";

export function ChatListItem({ chat, otherParticipant, isSelected, onClick }) {
  const { onlineUsers } = useSocketStore();
  
  if (!otherParticipant) return null;
  const isOnline = onlineUsers.has(otherParticipant._id);

  return (
    <div
      onClick={onClick}
      className={`group w-full flex gap-3 p-3 mb-2 rounded-2xl cursor-pointer transition-all duration-300 border ${
        isSelected
          ? "bg-primary-500/15 border-primary-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]"
          : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
      }`}
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-medium overflow-hidden border-2 border-white/10 shadow-sm">
          {otherParticipant?.avatar ? (
            <img src={otherParticipant.avatar} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            otherParticipant?.name?.[0]?.toUpperCase() || "U"
          )}
        </div>
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-baseline mb-1">
          <h3 className={`text-sm font-semibold truncate ${isSelected ? "text-white drop-shadow-sm" : "text-slate-200"}`}>
            {otherParticipant?.name || "Unknown"}
          </h3>
          <span className="text-[11px] text-slate-400 whitespace-nowrap ml-2">
            {chat.updatedAt ? formatDistanceToNow(new Date(chat.updatedAt), { addSuffix: true }) : "New"}
          </span>
        </div>
        <div className="flex justify-between items-center pr-2">
          <p className={`text-[13px] truncate ${chat.unreadCount > 0 ? "text-white font-medium drop-shadow-sm" : "text-slate-400"}`}>
            {chat.lastMessage?.text || "Started a conversation"}
          </p>
          {chat.unreadCount > 0 && (
            <span className="shrink-0 ml-2 w-5 h-5 flex items-center justify-center bg-primary-500 text-white text-[10px] font-bold rounded-full shadow-sm">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
      
      {/* Remove the left line since the card highlight is obvious now */}
    </div>
  );
}
