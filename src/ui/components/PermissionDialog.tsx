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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-lg font-semibold mb-1">Plugin Permissions</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          <span className="font-medium text-gray-700 dark:text-gray-200">{pluginName}</span> is
          requesting the following permissions:
        </p>

        <ul className="space-y-2 mb-6">
          {permissions.map((perm) => (
            <li key={perm} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 text-xs">
                i
              </span>
              <div>
                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded">
                  {perm}
                </span>
                <span className="text-gray-600 dark:text-gray-400 ml-1.5">
                  — {PERMISSION_DESCRIPTIONS[perm] ?? "Unknown permission"}
                </span>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => onApprove(permissions)}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
