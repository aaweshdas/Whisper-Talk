import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MessageSquarePlusIcon, XIcon, SearchIcon, Loader2Icon } from "lucide-react";
import api from "../lib/axios";
import { useChats } from "../hooks/useChats";

export function NewChatModal({ onClose, onSelect }) {
  const [search, setSearch] = useState("");
  const { data: chats, refetch: refetchChats } = useChats();

  const { data: users, isLoading } = useQuery({
    queryKey: ["users", search],
    queryFn: async () => {
      if (!search) return [];
      const res = await api.get(`/users/search?q=${search}`);
      return res.data;
    },
    enabled: search.length > 0,
  });

  const handleCreateChat = async (userId) => {
    try {
      const res = await api.post("/chats", { participantId: userId });
      await refetchChats();
      onSelect(res.data._id);
    } catch (err) {
      console.error("Failed to create chat", err);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-md h-[500px] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
              <MessageSquarePlusIcon className="w-4 h-4" />
            </div>
            <h2 className="font-semibold text-slate-900 dark:text-white">New Conversation</h2>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-standard pl-9"
              autoFocus
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2">
          {!search ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-6 text-center">
              <SearchIcon className="w-8 h-8 mb-3 opacity-20" />
              <p className="text-sm">Search for colleagues to start a new chat.</p>
            </div>
          ) : isLoading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2Icon className="w-6 h-6 text-primary-500 animate-spin" />
            </div>
          ) : users?.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 p-6 text-center">
              <p className="text-sm">No users found matching "{search}".</p>
            </div>
          ) : (
            <div className="space-y-1">
              {users?.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleCreateChat(user._id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 font-medium overflow-hidden shrink-0 border border-slate-300 dark:border-slate-600 shadow-sm">
                    {user.avatar ? (
                      <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user.name[0].toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
