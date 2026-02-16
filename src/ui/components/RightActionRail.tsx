import { Focus } from "lucide-react";

interface RightActionRailProps {
  chatOpen: boolean;
  onToggleChat: () => void;
  onFocusMode: () => void;
}

function RailTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute right-full top-1/2 z-50 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-xs text-on-surface opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    >
      {label}
    </span>
  );
}

function RobotIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 3h6" />
      <path d="M12 3v2" />
      <rect x="4" y="7" width="16" height="11" rx="3" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="15" cy="12" r="1" />
      <path d="M9 16h6" />
      <path d="M2 11v3" />
      <path d="M22 11v3" />
    </svg>
  );
}

export function RightActionRail({ chatOpen, onToggleChat, onFocusMode }: RightActionRailProps) {
  return (
    <aside
      aria-label="Quick tools"
      className="w-14 border-l border-border bg-surface-secondary flex flex-col items-center justify-start gap-3 pt-4"
    >
      <button
        onClick={onToggleChat}
        aria-label={chatOpen ? "Close AI chat" : "Open AI chat"}
        aria-pressed={chatOpen}
        className={`group relative w-11 h-11 rounded-lg border flex items-center justify-center transition-colors ${
          chatOpen
            ? "border-accent/50 bg-accent/10 text-accent"
            : "border-transparent text-on-surface-secondary hover:text-on-surface hover:bg-surface-tertiary"
        }`}
      >
        <RobotIcon className="w-5 h-5" />
        <RailTooltip label="AI Chat" />
      </button>

      <button
        onClick={onFocusMode}
        aria-label="Enter focus mode"
        className="group relative w-11 h-11 rounded-lg border border-transparent flex items-center justify-center text-on-surface-secondary hover:text-on-surface hover:bg-surface-tertiary transition-colors"
      >
        <Focus size={19} />
        <RailTooltip label="Focus Mode" />
      </button>
    </aside>
  );
}
