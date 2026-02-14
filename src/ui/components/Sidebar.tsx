import { useState } from "react";
import {
  Inbox,
  CalendarDays,
  Clock,
  Settings,
  Puzzle,
  MessageSquare,
  ChevronDown,
  ChevronRight,
  Focus,
} from "lucide-react";
import type { Project } from "../../core/types.js";
import type { PanelInfo, ViewInfo } from "../api.js";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string, id?: string) => void;
  projects: Project[];
  selectedProjectId: string | null;
  panels?: PanelInfo[];
  pluginViews?: ViewInfo[];
  selectedPluginViewId?: string | null;
  onToggleChat?: () => void;
  chatOpen?: boolean;
  onFocusMode?: () => void;
}

const NAV_ITEMS = [
  { id: "inbox", label: "Inbox", icon: Inbox },
  { id: "today", label: "Today", icon: CalendarDays },
  { id: "upcoming", label: "Upcoming", icon: Clock },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "plugin-store", label: "Plugin Store", icon: Puzzle },
];

export function Sidebar({
  currentView,
  onNavigate,
  projects,
  selectedProjectId,
  panels = [],
  pluginViews = [],
  selectedPluginViewId,
  onToggleChat,
  chatOpen,
  onFocusMode,
}: SidebarProps) {
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  return (
    <aside
      aria-label="Main navigation"
      className="w-sidebar border-r border-border bg-surface-secondary flex flex-col overflow-auto"
    >
      <div className="px-5 py-4">
        <h2 className="text-lg font-bold text-on-surface tracking-tight">Docket</h2>
      </div>
      <nav aria-label="Views" className="flex-1 px-3">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => onNavigate(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors ${
                    isActive
                      ? "bg-accent/10 text-accent font-medium"
                      : "text-on-surface-secondary hover:bg-surface-tertiary hover:text-on-surface"
                  }`}
                >
                  <Icon size={18} strokeWidth={isActive ? 2.25 : 1.75} />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>

        {projects.length > 0 && (
          <>
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex items-center gap-1 text-xs font-semibold text-on-surface-muted uppercase tracking-wider mt-6 mb-2 px-3 w-full text-left hover:text-on-surface-secondary transition-colors"
            >
              {projectsExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              Projects
            </button>
            {projectsExpanded && (
              <ul className="space-y-0.5">
                {projects.map((project) => {
                  const isActive = currentView === "project" && selectedProjectId === project.id;
                  return (
                    <li key={project.id}>
                      <button
                        onClick={() => onNavigate("project", project.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors ${
                          isActive
                            ? "bg-accent/10 text-accent font-medium"
                            : "text-on-surface-secondary hover:bg-surface-tertiary hover:text-on-surface"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: project.color }}
                        />
                        {project.name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}

        {panels.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider mt-6 mb-2 px-3">
              Plugins
            </h3>
            <div className="space-y-2 px-3">
              {panels.map((panel) => (
                <div
                  key={panel.id}
                  className="p-2 rounded-md bg-surface-tertiary border border-border"
                >
                  <div className="flex items-center gap-1 text-xs font-medium text-on-surface-secondary mb-1">
                    <span>{panel.icon}</span>
                    <span>{panel.title}</span>
                  </div>
                  {panel.content && (
                    <p className="text-xs text-on-surface-muted whitespace-pre-wrap">
                      {panel.content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {pluginViews.length > 0 && (
          <>
            <h3 className="text-xs font-semibold text-on-surface-muted uppercase tracking-wider mt-6 mb-2 px-3">
              Plugin Views
            </h3>
            <ul className="space-y-0.5">
              {pluginViews.map((view) => {
                const isActive = currentView === "plugin-view" && selectedPluginViewId === view.id;
                return (
                  <li key={view.id}>
                    <button
                      onClick={() => onNavigate("plugin-view", view.id)}
                      aria-current={isActive ? "page" : undefined}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-3 transition-colors ${
                        isActive
                          ? "bg-accent/10 text-accent font-medium"
                          : "text-on-surface-secondary hover:bg-surface-tertiary hover:text-on-surface"
                      }`}
                    >
                      <span>{view.icon}</span>
                      {view.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>
      {(onFocusMode || onToggleChat) && (
        <div className="px-3 pb-3 pt-2 space-y-1">
          {onFocusMode && (
            <button
              onClick={onFocusMode}
              aria-label="Enter focus mode"
              className="w-full px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors text-on-surface-secondary hover:bg-surface-tertiary hover:text-on-surface"
            >
              <Focus size={18} strokeWidth={1.75} />
              Focus Mode
            </button>
          )}
          {onToggleChat && (
            <button
              onClick={onToggleChat}
              aria-label={chatOpen ? "Close AI chat panel" : "Open AI chat panel"}
              aria-pressed={chatOpen}
              className={`w-full px-3 py-2 rounded-lg text-sm flex items-center gap-3 transition-colors ${
                chatOpen
                  ? "bg-accent/10 text-accent font-medium"
                  : "text-on-surface-secondary hover:bg-surface-tertiary hover:text-on-surface"
              }`}
            >
              <MessageSquare size={18} strokeWidth={chatOpen ? 2.25 : 1.75} />
              AI Chat
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
