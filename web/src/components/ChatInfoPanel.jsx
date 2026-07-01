import { XIcon, BellIcon, BellOffIcon, ArchiveIcon, PinIcon, UserIcon } from "lucide-react";

export function ChatInfoPanel({
  participant,
  chatId,
  isPinned,
  isArchived,
  isMuted,
  onTogglePin,
  onToggleArchive,
  onToggleMute,
  onClose,
}) {
  return (
    <aside
      className="w-72 flex flex-col flex-shrink-0 animate-fade-in-up overflow-y-auto"
      style={{
        borderLeft: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(0,0,0,0.2)",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <span className="text-sm font-semibold" style={{ color: "#f1f5f9" }}>
          Chat Info
        </span>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <XIcon className="w-4 h-4" style={{ color: "rgba(241,245,249,0.5)" }} />
        </button>
      </div>

      {/* Participant card */}
      <div className="flex flex-col items-center px-5 py-8 gap-3">
        <div className="relative">
          <img
            src={
              participant?.avatar ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(participant?.name || "U")}&background=7c3aed&color=fff&size=96`
            }
            alt={participant?.name}
            className="w-20 h-20 rounded-full object-cover"
            style={{ border: "3px solid rgba(139,92,246,0.35)" }}
          />
        </div>
        <div className="text-center">
          <p className="font-semibold text-base" style={{ color: "#f1f5f9" }}>
            {participant?.name}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(241,245,249,0.4)" }}>
            {participant?.email}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 space-y-2">
        <SectionLabel>Chat Options</SectionLabel>

        <InfoAction
          icon={<PinIcon className="w-4 h-4" />}
          label={isPinned ? "Unpin Chat" : "Pin Chat"}
          active={isPinned}
          onClick={onTogglePin}
        />
        <InfoAction
          icon={<BellIcon className="w-4 h-4" />}
          label={isMuted ? "Unmute Notifications" : "Mute Notifications"}
          active={isMuted}
          icon2={isMuted ? <BellOffIcon className="w-4 h-4" /> : <BellIcon className="w-4 h-4" />}
          onClick={onToggleMute}
        />
        <InfoAction
          icon={<ArchiveIcon className="w-4 h-4" />}
          label={isArchived ? "Unarchive Chat" : "Archive Chat"}
          active={isArchived}
          onClick={onToggleArchive}
        />
      </div>

      {/* Profile info */}
      <div className="px-4 mt-6">
        <SectionLabel>About</SectionLabel>
        <div
          className="rounded-xl px-4 py-3 mt-2"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex items-start gap-3">
            <UserIcon className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#a78bfa" }} />
            <div>
              <p className="text-[11px] font-medium mb-0.5" style={{ color: "rgba(167,139,250,0.7)" }}>
                Name
              </p>
              <p className="text-sm" style={{ color: "#f1f5f9" }}>
                {participant?.name}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider px-1 mb-2" style={{ color: "rgba(241,245,249,0.3)" }}>
      {children}
    </p>
  );
}

function InfoAction({ icon, icon2, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-all"
      style={{
        background: active ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)",
        border: active
          ? "1px solid rgba(139,92,246,0.25)"
          : "1px solid rgba(255,255,255,0.06)",
        color: active ? "#a78bfa" : "rgba(241,245,249,0.7)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.06)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        }
      }}
    >
      <span style={{ color: active ? "#a78bfa" : "rgba(167,139,250,0.6)" }}>
        {icon2 || icon}
      </span>
      {label}
    </button>
  );
}
