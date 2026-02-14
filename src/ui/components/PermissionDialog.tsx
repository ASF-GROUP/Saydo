import { Shield, Info } from "lucide-react";

const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "task:read": "Read your tasks, projects, and tags",
  "task:write": "Create, update, and delete tasks",
  "ui:panel": "Add panels to the sidebar",
  "ui:view": "Add custom views",
  "ui:status": "Add items to the status bar",
  commands: "Register keyboard commands",
  settings: "Access plugin settings",
  storage: "Store data locally",
  network: "Make network requests",
  "ai:provider": "Register a custom AI provider",
};

interface PermissionDialogProps {
  pluginName: string;
  permissions: string[];
  onApprove: (permissions: string[]) => void;
  onCancel: () => void;
}

export function PermissionDialog({
  pluginName,
  permissions,
  onApprove,
  onCancel,
}: PermissionDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="perm-dialog-title"
    >
      <div className="bg-surface rounded-lg shadow-xl max-w-md w-full mx-4 p-6 border border-border">
        <div className="flex items-center gap-2 mb-1">
          <Shield size={18} className="text-accent" />
          <h2 id="perm-dialog-title" className="text-lg font-semibold text-on-surface">
            Plugin Permissions
          </h2>
        </div>
        <p className="text-sm text-on-surface-muted mb-4">
          <span className="font-medium text-on-surface">{pluginName}</span> is requesting the
          following permissions:
        </p>

        <ul className="space-y-2 mb-6">
          {permissions.map((perm) => (
            <li key={perm} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 flex-shrink-0">
                <Info size={14} className="text-accent" />
              </span>
              <div>
                <span className="font-mono text-xs bg-surface-tertiary text-on-surface-secondary px-1 py-0.5 rounded">
                  {perm}
                </span>
                <span className="text-on-surface-secondary ml-1.5">
                  — {PERMISSION_DESCRIPTIONS[perm] ?? "Unknown permission"}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-on-surface-secondary hover:bg-surface-tertiary rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onApprove(permissions)}
            className="px-4 py-2 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover transition-colors"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
