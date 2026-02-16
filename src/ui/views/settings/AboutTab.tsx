import { useState } from "react";
import { isTauri } from "../../../utils/tauri.js";

export function AboutTab() {
  const [updateStatus, setUpdateStatus] = useState<
    "idle" | "checking" | "available" | "up-to-date" | "error"
  >("idle");
  const [updateVersion, setUpdateVersion] = useState("");
  const isTauriApp = isTauri();

  const handleCheckUpdate = async () => {
    setUpdateStatus("checking");
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        setUpdateStatus("available");
        setUpdateVersion(update.version);
      } else {
        setUpdateStatus("up-to-date");
      }
    } catch {
      setUpdateStatus("error");
    }
  };

  const handleInstallUpdate = async () => {
    try {
      const { check } = await import("@tauri-apps/plugin-updater");
      const update = await check();
      if (update) {
        await update.downloadAndInstall();
        const { relaunch } = await import("@tauri-apps/plugin-process");
        await relaunch();
      }
    } catch {
      setUpdateStatus("error");
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3 text-on-surface">About</h2>
      <div className="space-y-4 max-w-md">
        <div className="flex items-center gap-3">
          <img src="/images/logo-192.png" alt="Docket logo" className="w-12 h-12" />
          <div>
            <p className="text-sm font-semibold text-on-surface">
              ASF Docket <span className="font-mono text-on-surface-muted font-normal">v1.0.0</span>
            </p>
            <p className="text-xs text-on-surface-muted">
              Open-source, AI-native task manager with an Obsidian-style plugin system.
            </p>
          </div>
        </div>
        {isTauriApp && (
          <div className="mt-3">
            <button
              onClick={handleCheckUpdate}
              disabled={updateStatus === "checking"}
              className="px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-surface-secondary disabled:opacity-50"
            >
              {updateStatus === "checking" ? "Checking..." : "Check for Updates"}
            </button>
            {updateStatus === "available" && (
              <div className="mt-2">
                <p className="text-sm text-success">Update available: v{updateVersion}</p>
                <button
                  onClick={handleInstallUpdate}
                  className="mt-1 px-3 py-1.5 text-sm bg-accent text-white rounded-lg hover:bg-accent-hover"
                >
                  Install and Restart
                </button>
              </div>
            )}
            {updateStatus === "up-to-date" && (
              <p className="mt-2 text-sm text-on-surface-muted">You're up to date!</p>
            )}
            {updateStatus === "error" && (
              <p className="mt-2 text-sm text-error">Update check failed.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
