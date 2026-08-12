import { useState } from "react";
import { format } from "date-fns";
import { Edit2Icon, Trash2Icon, MoreHorizontalIcon, CheckCheckIcon, CheckIcon, SmileIcon, ClockIcon } from "lucide-react";
import { useEditMessage, useDeleteMessage, useReactToMessage } from "../hooks/useMessages";
import { EditMessageModal } from "./EditMessageModal";
import { DeleteMessageModal } from "./DeleteMessageModal";
import { ForwardMessageModal } from "./ForwardMessageModal";
import { useSocketStore } from "../lib/socket";
import { ReplyIcon, ForwardIcon } from "lucide-react";

export function MessageBubble({ message, isMe, showAvatar, showName, user, onReply }) {
  const [isHovered, setIsHovered] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);
  
  const [showReactions, setShowReactions] = useState(false);
  
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const reactMessage = useReactToMessage();
  const emitDeleteMessage = useSocketStore((state) => state.emitDeleteMessage);

  const handleReact = (emoji) => {
    reactMessage.mutate({ chatId: message.chat, messageId: message._id, emoji });
    setShowReactions(false);
  };

  const handleEdit = (newText) => {
    if (newText !== message.text) editMessage.mutate({ messageId: message._id, text: newText });
    setIsEditing(false);
  };

  const handleDelete = (type) => {
    deleteMessage.mutate({ messageId: message._id, chatId: message.chat, deleteFor: type });
    emitDeleteMessage(message._id, message.chat, type);
    setIsDeleting(false);
  };

  return (
    <div 
      className={`flex w-full ${isMe ? "justify-end" : "justify-start"} group relative`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setShowOptions(false); }}
    >
      <div className={`flex max-w-[85%] gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        
        {/* Avatar (Only for other users) */}
        {!isMe && (
          showAvatar ? (
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex-shrink-0 flex items-center justify-center text-slate-700 dark:text-slate-300 font-medium overflow-hidden mt-auto mb-1 border border-slate-300 dark:border-slate-600 shadow-sm">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.name?.[0]?.toUpperCase() || "U"
              )}
            </div>
          ) : (
            <div className="w-8 flex-shrink-0" />
          )
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} min-w-[120px]`}>
          {showName && (
            <div className="flex items-center gap-2 mb-1 px-1">
              <span className="text-[11px] font-medium text-slate-300">
                {user?.name || "Unknown"}
              </span>
            </div>
          )}

          <div className="relative group/bubble flex items-center">
            
            {/* Options Menu */}
            {(isHovered || showOptions || showReactions) && (
              <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 ${isMe ? "right-full mr-2" : "left-full ml-2"}`}>
                
                <div className="relative">
                  <button 
                    onClick={() => { setShowReactions(!showReactions); setShowOptions(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                  >
                    <SmileIcon className="w-4 h-4" />
                  </button>
                  {showReactions && (
                    <div className={`absolute z-10 top-full mt-1 ${isMe ? "right-0" : "left-0"} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-full px-2 py-1 flex gap-1`}>
                      {["👍", "❤️", "😂", "😮", "😢"].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReact(emoji)}
                          className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-lg"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button 
                    onClick={() => { setShowOptions(!showOptions); setShowReactions(false); }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 shadow-sm transition-colors"
                  >
                    <MoreHorizontalIcon className="w-4 h-4" />
                  </button>
                  {showOptions && (
                    <div className={`absolute z-10 top-full mt-1 ${isMe ? "right-0" : "left-0"} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-lg rounded-lg py-1 w-36 overflow-hidden`}>
                      {isMe && (
                        <button 
                          onClick={() => { setIsEditing(true); setShowOptions(false); }}
                          className="w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                        >
                          <Edit2Icon className="w-4 h-4 text-slate-500" />
                          Edit
                        </button>
                      )}
                      <button 
                        onClick={() => { onReply?.(message); setShowOptions(false); }}
                        className="w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <ReplyIcon className="w-4 h-4 text-slate-500" />
                        Reply
                      </button>
                      <button 
                        onClick={() => { setIsForwarding(true); setShowOptions(false); }}
                        className="w-full px-3 py-2 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                      >
                        <ForwardIcon className="w-4 h-4 text-slate-500" />
                        Forward
                      </button>
                      <button 
                        onClick={() => { setIsDeleting(true); setShowOptions(false); }}
                        className="w-full px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                      >
                        <Trash2Icon className="w-4 h-4 text-red-500" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bubble */}
            <div 
              className={`px-3 py-1.5 rounded-2xl shadow-sm text-[15px] leading-relaxed relative ${
                message.deletedForEveryone
                  ? "bg-slate-100 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 italic border border-slate-200 dark:border-slate-700"
                  : isMe
                    ? "bg-primary-600 text-white rounded-br-sm"
                    : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-sm"
              }`}
            >
              <div className="pr-16 pb-3 min-w-0 break-words">
                {message.replyTo && !message.deletedForEveryone && (
                  <div 
                    className={`mb-2 pl-2 border-l-2 text-xs rounded p-1.5 opacity-90 ${
                      isMe 
                        ? "border-white/40 bg-white/10 text-white/90" 
                        : "border-primary-500 bg-slate-50 dark:bg-slate-900/50 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <p className="font-semibold mb-0.5">{message.replyTo.sender?.name || "User"}</p>
                    <p className="truncate max-w-[200px]">{message.replyTo.text}</p>
                  </div>
                )}
                {message.isForwarded && !message.deletedForEveryone && (
                  <div className="flex items-center gap-1 mb-1 opacity-70 text-[10px] font-medium uppercase tracking-wider">
                    <ForwardIcon className="w-3 h-3" />
                    Forwarded
                  </div>
                )}
                {message.attachment && !message.deletedForEveryone && (
                  <div className="mb-2">
                    {message.attachment.type.startsWith("image/") ? (
                      <img 
                        src={`http://localhost:3001${message.attachment.url}`} 
                        alt="attachment" 
                        className="max-w-[200px] sm:max-w-[300px] rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => window.open(`http://localhost:3001${message.attachment.url}`, '_blank')}
                      />
                    ) : (
                      <a 
                        href={`http://localhost:3001${message.attachment.url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2 rounded bg-slate-100/10 hover:bg-slate-100/20 transition-colors border border-slate-200/20"
                      >
                        <div className="w-8 h-8 flex items-center justify-center bg-slate-200/20 rounded">
                          <span className="text-xs font-bold uppercase">{message.attachment.name.split('.').pop()}</span>
                        </div>
                        <span className="text-sm font-medium truncate max-w-[150px]">{message.attachment.name}</span>
                      </a>
                    )}
                  </div>
                )}
                {message.deletedForEveryone ? "This message was deleted" : message.text}
                
                {!message.deletedForEveryone && message.isEdited && (
                  <span className="text-[10px] opacity-70 ml-2 inline-block font-medium">(edited)</span>
                )}
              </div>

              {/* Timestamp & Ticks (Inside bubble) */}
              <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] opacity-75">
                <span>{format(new Date(message.createdAt), "h:mm a")}</span>
                {isMe && !message.deletedForEveryone && (
                  <>
                    {String(message._id).startsWith("temp-") ? (
                      <ClockIcon className="w-3.5 h-3.5" />
                    ) : message.readBy?.length > 0 ? (
                      <CheckCheckIcon className="w-3.5 h-3.5 text-blue-200" />
                    ) : message.deliveredTo?.length > 0 ? (
                      <CheckCheckIcon className="w-3.5 h-3.5" />
                    ) : (
                      <CheckIcon className="w-3.5 h-3.5" />
                    )}
                  </>
                )}
              </div>

              {/* Reactions display */}
              {!message.deletedForEveryone && message.reactions?.length > 0 && (
                <div className={`absolute -bottom-3 ${isMe ? "right-2" : "left-2"} flex gap-1 z-10`}>
                  {Object.entries(
                    message.reactions.reduce((acc, r) => {
                      acc[r.emoji] = (acc[r.emoji] || 0) + 1;
                      return acc;
                    }, {})
                  ).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => handleReact(emoji)}
                      className="flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-sm text-xs hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span>{emoji}</span>
                      <span className="text-slate-500 dark:text-slate-400 font-medium">{count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {isEditing && (
        <EditMessageModal message={message} onConfirm={handleEdit} onClose={() => setIsEditing(false)} />
      )}
      {isDeleting && (
        <DeleteMessageModal message={message} isMe={isMe} onConfirm={handleDelete} onClose={() => setIsDeleting(false)} />
      )}
      {isForwarding && (
        <ForwardMessageModal message={message} onClose={() => setIsForwarding(false)} />
      )}
    </div>
  );
}
