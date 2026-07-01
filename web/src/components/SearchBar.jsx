import { useState, useEffect } from "react";
import { SearchIcon, XIcon } from "lucide-react";
import { formatTime } from "../lib/utils";

export function SearchBar({ results = [], onSearch, onClose, onJumpTo, isSearching }) {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = setTimeout(() => {
      if (query.trim().length >= 2) onSearch(query);
    }, 350);
    return () => clearTimeout(t);
  }, [query, onSearch]);

  return (
    <div
      className="flex flex-col border-b"
      style={{
        borderColor: "rgba(255,255,255,0.07)",
        background: "rgba(6,6,18,0.6)",
        backdropFilter: "blur(16px)",
      }}
    >
      {/* Input row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <SearchIcon className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(167,139,250,0.6)" }} />
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search messages…"
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: "#f1f5f9", caretColor: "#8b5cf6" }}
        />
        <button onClick={onClose}>
          <XIcon className="w-4 h-4" style={{ color: "rgba(241,245,249,0.4)" }} />
        </button>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div
          className="overflow-y-auto max-h-52 border-t"
          style={{ borderColor: "rgba(255,255,255,0.05)" }}
        >
          {results.map((msg) => (
            <button
              key={msg._id}
              onClick={() => onJumpTo(msg._id)}
              className="w-full flex items-start gap-3 px-4 py-3 text-left transition-all"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(139,92,246,0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent";
              }}
            >
              <img
                src={
                  msg.sender?.avatar ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(msg.sender?.name || "U")}&background=7c3aed&color=fff`
                }
                alt={msg.sender?.name}
                className="w-7 h-7 rounded-full object-cover flex-shrink-0 mt-0.5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium truncate" style={{ color: "#a78bfa" }}>
                    {msg.sender?.name}
                  </p>
                  <p className="text-[10px] flex-shrink-0" style={{ color: "rgba(241,245,249,0.3)" }}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
                <p className="text-xs truncate mt-0.5" style={{ color: "rgba(241,245,249,0.6)" }}>
                  {msg.text}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isSearching && query.length >= 2 && results.length === 0 && (
        <p className="text-xs px-4 py-3" style={{ color: "rgba(241,245,249,0.35)" }}>
          No messages found for &ldquo;{query}&rdquo;
        </p>
      )}
    </div>
  );
}
