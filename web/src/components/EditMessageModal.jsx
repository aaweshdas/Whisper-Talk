import { useState, useEffect, useRef } from "react";
import { PencilIcon, XIcon } from "lucide-react";

export function EditMessageModal({ message, onConfirm, onClose }) {
  const [text, setText] = useState(message?.text || "");
  const inputRef = useRef(null);

  useEffect(() => {
    setText(message?.text || "");
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [message]);

  if (!message) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || text.trim() === message.text) return onClose();
    onConfirm(text.trim());
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-md">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center border border-slate-200 dark:border-slate-700 shadow-sm">
              <PencilIcon className="w-4 h-4" />
            </div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">
              Edit Message
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="input-standard resize-none mb-6"
            style={{ lineHeight: "1.6" }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
