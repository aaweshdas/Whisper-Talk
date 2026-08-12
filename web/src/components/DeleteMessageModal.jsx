import { TrashIcon, XIcon } from "lucide-react";

export function DeleteMessageModal({ message, isMe, onConfirm, onClose }) {
  if (!message) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-sm">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center border border-red-200 dark:border-red-900/50 shadow-sm">
              <TrashIcon className="w-4 h-4" />
            </div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">
              Delete Message
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm mb-6 text-slate-600 dark:text-slate-400 leading-relaxed">
            Are you sure you want to delete this message? This action cannot be undone.
          </p>

          <div className="flex flex-col gap-3">
            {isMe && (
              <button onClick={() => onConfirm("everyone")} className="btn-danger w-full py-2.5">
                Delete for Everyone
              </button>
            )}
            <button onClick={() => onConfirm("me")} className="btn-secondary w-full py-2.5">
              Delete for Me
            </button>
            <button 
              onClick={onClose} 
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-colors text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
