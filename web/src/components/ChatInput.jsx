import { useState, useRef } from "react";
import { useSendMessage } from "../hooks/useMessages";
import { useSendAttachment } from "../hooks/useSendAttachment";
import { SendIcon, PaperclipIcon, SmileIcon } from "lucide-react";
import EmojiPicker from "emoji-picker-react";
import { useSocketStore } from "../lib/socket";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { XIcon } from "lucide-react";

export function ChatInput({ chatId, replyingTo, onCancelReply }) {
  const [text, setText] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const isSubmittingRef = useRef(false);

  const sendMessage = useSendMessage(chatId);
  const sendAttachment = useSendAttachment();
  const { setTyping, sendMessage: socketSendMessage } = useSocketStore();
  const { data: currentUser } = useCurrentUser();

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (currentUser?._id) {
      setTyping(chatId, true, currentUser._id);
      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        setTyping(chatId, false, currentUser._id);
      }, 2000);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || isSubmittingRef.current || !currentUser) return;
    
    // Use the extremely fast WebSocket connection instead of HTTP POST
    socketSendMessage(chatId, text, currentUser, replyingTo);
    
    setText("");
    setShowEmoji(false);
    if (onCancelReply) onCancelReply();
  };

  const handleEmojiClick = (emojiObj) => {
    setText((prev) => prev + emojiObj.emoji);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("attachment", file);
      if (text.trim()) {
        formData.append("text", text.trim());
      }
      if (replyingTo?._id) {
        formData.append("replyTo", replyingTo._id);
      }

      await sendAttachment.mutateAsync({ chatId, formData });
      setText("");
      if (onCancelReply) onCancelReply();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative">
      {replyingTo && (
        <div className="mb-2 p-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-2 shadow-sm">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1 truncate">
              Replying to {replyingTo.sender?.name || "User"}
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
              {replyingTo.text}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {showEmoji && (
        <div className="absolute bottom-full right-0 mb-2 z-20 shadow-xl rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
          <EmojiPicker onEmojiClick={handleEmojiClick} theme="auto" />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-slate-900/40 border border-white/10 rounded-xl p-1 shadow-inner focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-500 transition-all backdrop-blur-md">
        <div className="flex gap-1 p-1">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            accept="image/*,.pdf,.txt"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-9 h-9 flex flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
              isUploading ? "text-primary-500 animate-pulse" : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <PaperclipIcon className="w-5 h-5" />
          </button>
        </div>

        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Message..."
          className="flex-1 max-h-32 min-h-[44px] bg-transparent border-0 resize-none py-2.5 px-2 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-0 leading-relaxed"
          style={{ lineHeight: "1.5" }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />

        <div className="flex gap-1 p-1">
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={`w-9 h-9 flex flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
              showEmoji ? "text-primary-400 bg-primary-900/20" : "text-slate-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <SmileIcon className="w-5 h-5" />
          </button>
          
          <button
            type="submit"
            disabled={!text.trim() || sendMessage.isPending}
            className="w-9 h-9 flex flex-shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
