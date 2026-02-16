import { useState } from "react";
import {
  Settings as SettingsIcon,
  Palette,
  Bot,
  Puzzle,
  Keyboard,
  Database,
  Info,
  FileText,
} from "lucide-react";
import { GeneralTab } from "./settings/GeneralTab.js";
import { AITab } from "./settings/AITab.js";
import { PluginsTab } from "./settings/PluginsTab.js";
import { TemplatesTab } from "./settings/TemplatesTab.js";
import { KeyboardTab } from "./settings/KeyboardTab.js";
import { DataTab } from "./settings/DataTab.js";
import { AboutTab } from "./settings/AboutTab.js";
import type { SettingsTab } from "./settings/types.js";

export type { SettingsTab };

interface SettingsProps {
  activeTab?: SettingsTab;
  onActiveTabChange?: (tab: SettingsTab) => void;
}

const TABS: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: "general", label: "General", icon: <Palette className="w-4 h-4" /> },
  { id: "ai", label: "AI Assistant", icon: <Bot className="w-4 h-4" /> },
  { id: "plugins", label: "Plugins", icon: <Puzzle className="w-4 h-4" /> },
  { id: "templates", label: "Templates", icon: <FileText className="w-4 h-4" /> },
  { id: "keyboard", label: "Keyboard", icon: <Keyboard className="w-4 h-4" /> },
  { id: "data", label: "Data", icon: <Database className="w-4 h-4" /> },
  { id: "about", label: "About", icon: <Info className="w-4 h-4" /> },
];

export function Settings({ activeTab: controlledActiveTab, onActiveTabChange }: SettingsProps) {
  const [internalActiveTab, setInternalActiveTab] = useState<SettingsTab>("general");
  const activeTab = controlledActiveTab ?? internalActiveTab;

  const handleTabChange = (tab: SettingsTab) => {
    if (controlledActiveTab === undefined) {
      setInternalActiveTab(tab);
    }
    onActiveTabChange?.(tab);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2 text-on-surface">
        <SettingsIcon className="w-6 h-6" />
        Settings
      </h1>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-on-surface-secondary hover:text-on-surface hover:bg-surface-secondary"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "general" && <GeneralTab />}
      {activeTab === "ai" && <AITab />}
      {activeTab === "plugins" && <PluginsTab />}
      {activeTab === "templates" && <TemplatesTab />}
      {activeTab === "keyboard" && <KeyboardTab />}
      {activeTab === "data" && <DataTab />}
      {activeTab === "about" && <AboutTab />}
    </div>
  );
}
