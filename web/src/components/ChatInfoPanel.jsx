import { useState, useEffect } from "react";
import { XIcon, BellIcon, FileIcon, ImageIcon, LinkIcon, SearchIcon, Loader2Icon, ArrowLeftIcon, DownloadIcon } from "lucide-react";
import { useMessages, useSearchMessages } from "../hooks/useMessages";
import { useMuteChat } from "../hooks/useMuteChat";
import { format } from "date-fns";
import { useSocketStore } from "../lib/socket";

export function ChatInfoPanel({ user, chat, chatId, onClose }) {
  const { data: messages } = useMessages(chatId);
  const searchMessages = useSearchMessages(chatId);
  const muteChat = useMuteChat();
  const { onlineUsers } = useSocketStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterView, setFilterView] = useState(null); // 'media', 'files', 'links'

  const links = messages?.filter(m => m.text?.match(/https?:\/\/[^\s]+/)) || [];
  const media = messages?.filter(m => m.attachment?.type?.startsWith('image/')) || [];
  const files = messages?.filter(m => m.attachment && !m.attachment.type.startsWith('image/')) || [];

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const timeout = setTimeout(() => {
        searchMessages.mutate(searchQuery);
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery]);

  if (!user || !chat) return null;

  const isMuted = chat?.isMuted;

  return (
    <div className="h-full flex flex-col bg-transparent text-white">
      <div className="h-16 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-white/5 backdrop-blur-sm sticky top-0">
        <div className="flex items-center gap-3">
          {filterView && (
            <button onClick={() => setFilterView(null)} className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors">
              <ArrowLeftIcon className="w-5 h-5" />
            </button>
          )}
          <span className="font-semibold text-white">
            {filterView === 'media' ? 'Media' : filterView === 'files' ? 'Files' : filterView === 'links' ? 'Links' : 'Details'}
          </span>
        </div>
        <button 
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {!filterView ? (
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col items-center border-b border-white/10">
            <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-medium overflow-hidden border-4 border-white/10 shadow-sm mb-4">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{user?.name?.[0]?.toUpperCase() || "U"}</span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">{user.name}</h3>
            <p className="text-sm text-slate-400 mb-2">{user.email}</p>
            
            <div className="flex items-center gap-1.5 mb-5">
              {onlineUsers.has(user._id) ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="text-xs font-medium text-emerald-400">Online</span>
                </>
              ) : (
                <span className="text-xs font-medium text-slate-400">
                  {(() => {
                    const dateString = user.lastSeen;
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
                  })()}
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => muteChat.mutate(chatId)}
                className={`flex flex-col items-center gap-1.5 p-2 rounded-lg transition-colors ${
                  isMuted ? "text-primary-400" : "text-slate-400 hover:text-primary-400"
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  isMuted ? "bg-primary-500/20" : "bg-white/5 border border-white/10"
                }`}>
                  {isMuted ? (
                    <BellIcon className="w-4 h-4 fill-current" />
                  ) : (
                    <BellIcon className="w-4 h-4" />
                  )}
                </div>
                <span className="text-xs font-medium">{isMuted ? "Unmute" : "Mute"}</span>
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="mb-6">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search in chat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all shadow-sm backdrop-blur-md"
                />
              </div>
            </div>

            {!searchQuery ? (
              <>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">Shared Content</h4>
                <div className="space-y-1">
                  <SharedItem icon={<ImageIcon className="w-4 h-4" />} label="Media" count={media.length} onClick={() => setFilterView('media')} />
                  <SharedItem icon={<FileIcon className="w-4 h-4" />} label="Files" count={files.length} onClick={() => setFilterView('files')} />
                  <SharedItem icon={<LinkIcon className="w-4 h-4" />} label="Links" count={links.length} onClick={() => setFilterView('links')} />
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Search Results</h4>
                {searchMessages.isPending ? (
                  <div className="flex justify-center p-4">
                    <Loader2Icon className="w-5 h-5 text-primary-500 animate-spin" />
                  </div>
                ) : searchMessages.data?.length > 0 ? (
                  searchMessages.data.map((msg) => (
                    <div key={msg._id} className="p-3 bg-black/40 rounded-xl shadow-sm border border-white/10">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs font-semibold text-white">{msg.sender?.name}</span>
                        <span className="text-[10px] text-slate-400">{format(new Date(msg.createdAt), "MMM d, h:mm a")}</span>
                      </div>
                      <p className="text-sm text-slate-300 line-clamp-2">{msg.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 text-center py-4">No messages found matching "{searchQuery}".</p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          {filterView === 'media' && (
            <div className="grid grid-cols-2 gap-2">
              {media.length > 0 ? media.map((msg) => (
                <div key={msg._id} className="aspect-square rounded-xl overflow-hidden bg-black/40 border border-white/10 relative group">
                  <img src={msg.attachment.url} alt="Media" className="w-full h-full object-cover" />
                  <a href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <SearchIcon className="w-5 h-5" />
                  </a>
                </div>
              )) : (
                <div className="col-span-2 text-center text-slate-500 py-8 text-sm">No media shared yet.</div>
              )}
            </div>
          )}
          {filterView === 'files' && (
            <div className="space-y-2">
              {files.length > 0 ? files.map((msg) => (
                <a key={msg._id} href={msg.attachment.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 p-3 bg-black/40 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <FileIcon className="w-5 h-5 text-slate-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{msg.attachment.name}</p>
                    <p className="text-[10px] text-slate-400">{format(new Date(msg.createdAt), "MMM d, yyyy")}</p>
                  </div>
                  <DownloadIcon className="w-4 h-4 text-slate-400" />
                </a>
              )) : (
                <div className="text-center text-slate-500 py-8 text-sm">No files shared yet.</div>
              )}
            </div>
          )}
          {filterView === 'links' && (
            <div className="space-y-2">
              {links.length > 0 ? links.map((msg) => {
                const urlMatch = msg.text.match(/https?:\/\/[^\s]+/);
                const url = urlMatch ? urlMatch[0] : '#';
                return (
                  <a key={msg._id} href={url} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 p-3 bg-black/40 border border-white/10 rounded-xl hover:bg-white/5 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      <LinkIcon className="w-4 h-4 text-slate-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white line-clamp-1 break-all">{url}</p>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{msg.text}</p>
                    </div>
                  </a>
                );
              }) : (
                <div className="text-center text-slate-500 py-8 text-sm">No links shared yet.</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SharedItem({ icon, label, count, onClick }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-white/10 transition-colors group">
      <div className="flex items-center gap-3 text-slate-300">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 border border-white/10 shadow-sm group-hover:border-white/20">
          {icon}
        </div>
        <span className="text-sm font-medium text-white">{label}</span>
      </div>
      <span className="text-xs text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">{count}</span>
    </button>
  );
}
