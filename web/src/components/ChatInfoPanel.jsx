import { useState, useEffect } from "react";
import { XIcon, BellIcon, FileIcon, ImageIcon, LinkIcon, SearchIcon, Loader2Icon } from "lucide-react";
import { useMessages, useSearchMessages } from "../hooks/useMessages";
import { useMuteChat } from "../hooks/useMuteChat";
import { format } from "date-fns";

export function ChatInfoPanel({ user, chatId, onClose }) {
  const { data: messages } = useMessages(chatId);
  const searchMessages = useSearchMessages(chatId);
  const muteChat = useMuteChat();
  const [searchQuery, setSearchQuery] = useState("");
  const linksCount = messages?.filter(m => m.text?.match(/https?:\/\/[^\s]+/))?.length || 0;
  const mediaCount = messages?.filter(m => m.attachment?.type?.startsWith('image/'))?.length || 0;
  const filesCount = messages?.filter(m => m.attachment && !m.attachment.type.startsWith('image/'))?.length || 0;

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const timeout = setTimeout(() => {
        searchMessages.mutate(searchQuery);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery]);

  if (!user) return null;

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900/50">
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0">
        <span className="font-semibold text-slate-900 dark:text-white">Details</span>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 flex flex-col items-center border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-medium overflow-hidden border-4 border-white dark:border-slate-950 shadow-sm mb-4">
          {user?.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl">{user?.name?.[0]?.toUpperCase() || "U"}</span>
          )}
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">{user.name}</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{user.email}</p>
        
        <div className="flex gap-2">
          <button 
            onClick={() => muteChat.mutate(chatId)}
            className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${
              user.isMuted ? "text-primary-600 dark:text-primary-400" : "text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400"
            }`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              user.isMuted ? "bg-primary-50 dark:bg-primary-900/20" : "bg-slate-100 dark:bg-slate-800"
            }`}>
              {user.isMuted ? (
                <BellIcon className="w-4 h-4 fill-current" />
              ) : (
                <BellIcon className="w-4 h-4" />
              )}
            </div>
            <span className="text-xs font-medium">{user.isMuted ? "Unmute" : "Mute"}</span>
          </button>
        </div>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-6">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search in chat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {!searchQuery ? (
          <>
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 px-2">Shared Content</h4>
            <div className="space-y-1">
              <SharedItem icon={<ImageIcon className="w-4 h-4" />} label="Media" count={mediaCount} />
              <SharedItem icon={<FileIcon className="w-4 h-4" />} label="Files" count={filesCount} />
              <SharedItem icon={<LinkIcon className="w-4 h-4" />} label="Links" count={linksCount} />
            </div>
          </>
        ) : (
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2">Search Results</h4>
            {searchMessages.isPending ? (
              <div className="flex justify-center p-4">
                <Loader2Icon className="w-5 h-5 text-primary-500 animate-spin" />
              </div>
            ) : searchMessages.data?.length > 0 ? (
              searchMessages.data.map((msg) => (
                <div key={msg._id} className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{msg.sender?.name}</span>
                    <span className="text-[10px] text-slate-500">{format(new Date(msg.createdAt), "MMM d, h:mm a")}</span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-2">{msg.text}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500 text-center py-4">No messages found matching "{searchQuery}".</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SharedItem({ icon, label, count }) {
  return (
    <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/50 transition-colors group">
      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
        <div className="w-8 h-8 rounded flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm group-hover:border-slate-300 dark:group-hover:border-slate-600">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">{count}</span>
    </button>
  );
}
