import { useState } from "react";
import { XIcon, ForwardIcon } from "lucide-react";
import { useChats } from "../hooks/useChats";
import { useForwardMessage } from "../hooks/useMessages";

export function ForwardMessageModal({ message, onClose }) {
  const { data: chats } = useChats();
  const forwardMessage = useForwardMessage();
  const [selectedChatId, setSelectedChatId] = useState(null);

  const handleForward = () => {
    if (!selectedChatId) return;
    forwardMessage.mutate({ messageId: message._id, targetChatId: selectedChatId });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ForwardIcon className="w-5 h-5 text-primary-500" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Forward Message</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors p-1"
          >
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 max-h-64 overflow-y-auto border-b border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">Select Chat</p>
          <div className="space-y-1">
            {chats?.map((chat) => (
              <button
                key={chat._id}
                onClick={() => setSelectedChatId(chat._id)}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                  selectedChatId === chat._id
                    ? "bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800/50"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                  {chat.participant?.avatar ? (
                    <img src={chat.participant.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {chat.participant?.name?.[0]?.toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {chat.participant?.name || "Unknown"}
                </span>
              </button>
            ))}
            {chats?.length === 0 && (
              <p className="text-sm text-slate-500 text-center py-4">No recent chats to forward to.</p>
            )}
          </div>
        </div>

        <div className="p-4 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleForward}
            disabled={!selectedChatId || forwardMessage.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition-colors"
          >
            Forward
          </button>
        </div>
      </div>
    </div>
  );
}
