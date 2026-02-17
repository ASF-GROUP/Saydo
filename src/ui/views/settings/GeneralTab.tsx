import { useState, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { themeManager } from "../../themes/manager.js";
import { api } from "../../api/index.js";
import { useGeneralSettings, type GeneralSettings } from "../../context/SettingsContext.js";
import { DEFAULT_PROJECT_COLORS } from "../../../config/defaults.js";

// ── Reusable sub-components (local to this file) ──

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface-secondary p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            value === opt.value
              ? "bg-accent text-white shadow-sm"
              : "text-on-surface-secondary hover:text-on-surface"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function ColorSwatchPicker({
  colors,
  value,
  onChange,
}: {
  colors: readonly string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {colors.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          aria-label={`Accent color ${color}`}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            value === color ? "ring-2 ring-offset-2 ring-offset-surface ring-on-surface" : "hover:scale-110"
          }`}
          style={{ backgroundColor: color }}
        >
          {value === color && <Check size={14} className="text-white drop-shadow" />}
        </button>
      ))}
    </div>
  );
}

function SettingRow({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-on-surface">{label}</p>
        {description && <p className="text-xs text-on-surface-muted">{description}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SettingSelect<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as T)}
      className="px-3 py-1.5 text-sm border border-border rounded-lg bg-surface text-on-surface"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function Toggle({
  enabled,
  onToggle,
  disabled,
}: {
  enabled: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
        enabled ? "bg-accent" : "bg-surface-tertiary"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
          enabled ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

// ── Main component ──

export function GeneralTab() {
  const { settings, loaded, updateSetting } = useGeneralSettings();
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrent());

  const handleThemeChange = (themeId: string) => {
    themeManager.setTheme(themeId);
    setCurrentTheme(themeId);
  };

  if (!loaded) return null;

  const now = new Date();

  return (
    <div className="space-y-8">
      {/* ── Appearance ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-on-surface">Appearance</h2>
        <div className="space-y-4 max-w-md">
          <SettingRow label="Theme" description="Choose light, dark, or match your system">
            <SegmentedControl
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
              value={currentTheme}
              onChange={handleThemeChange}
            />
          </SettingRow>

          <div>
            <p className="text-sm text-on-surface mb-2">Accent color</p>
            <ColorSwatchPicker
              colors={DEFAULT_PROJECT_COLORS}
              value={settings.accent_color}
              onChange={(color) => updateSetting("accent_color", color)}
            />
          </div>

          <SettingRow label="Density" description="Adjust UI spacing">
            <SegmentedControl
              options={[
                { value: "compact" as const, label: "Compact" },
                { value: "default" as const, label: "Default" },
                { value: "comfortable" as const, label: "Comfortable" },
              ]}
              value={settings.density}
              onChange={(v) => updateSetting("density", v)}
            />
          </SettingRow>
        </div>
      </section>

      {/* ── Date & Time ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-on-surface">Date &amp; Time</h2>
        <div className="space-y-4 max-w-md">
          <SettingRow label="Week starts on">
            <SettingSelect
              value={settings.week_start}
              onChange={(v) => updateSetting("week_start", v)}
              options={[
                { value: "sunday", label: "Sunday" },
                { value: "monday", label: "Monday" },
                { value: "saturday", label: "Saturday" },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Date format"
            description={dateFormatPreview(settings.date_format, now)}
          >
            <SettingSelect
              value={settings.date_format}
              onChange={(v) => updateSetting("date_format", v)}
              options={[
                { value: "relative", label: "Relative" },
                { value: "short", label: "Short" },
                { value: "long", label: "Long" },
                { value: "iso", label: "ISO" },
              ]}
            />
          </SettingRow>

          <SettingRow
            label="Time format"
            description={settings.time_format === "12h" ? "e.g. 2:30 PM" : "e.g. 14:30"}
          >
            <SegmentedControl
              options={[
                { value: "12h" as const, label: "12-hour" },
                { value: "24h" as const, label: "24-hour" },
              ]}
              value={settings.time_format}
              onChange={(v) => updateSetting("time_format", v)}
            />
          </SettingRow>
        </div>
      </section>

      {/* ── Task Behavior ── */}
      <section>
        <h2 className="text-lg font-semibold mb-3 text-on-surface">Task Behavior</h2>
        <div className="space-y-4 max-w-md">
          <SettingRow label="Default priority" description="Applied when creating tasks without an explicit priority">
            <SettingSelect
              value={settings.default_priority}
              onChange={(v) => updateSetting("default_priority", v)}
              options={[
                { value: "none", label: "None" },
                { value: "p1", label: "P1 — Urgent" },
                { value: "p2", label: "P2 — High" },
                { value: "p3", label: "P3 — Medium" },
                { value: "p4", label: "P4 — Low" },
              ]}
            />
          </SettingRow>

          <SettingRow label="Confirm before deleting" description="Show a confirmation dialog when deleting tasks">
            <Toggle
              enabled={settings.confirm_delete === "true"}
              onToggle={() =>
                updateSetting("confirm_delete", settings.confirm_delete === "true" ? "false" : "true")
              }
            />
          </SettingRow>

          <SettingRow label="Start screen" description="Default view when opening the app">
            <SettingSelect
              value={settings.start_view}
              onChange={(v) => updateSetting("start_view", v)}
              options={[
                { value: "inbox", label: "Inbox" },
                { value: "today", label: "Today" },
                { value: "upcoming", label: "Upcoming" },
              ]}
            />
          </SettingRow>
        </div>
      </section>

      {/* ── Notifications (existing) ── */}
      <NotificationSettings />
    </div>
  );
}

function dateFormatPreview(format: GeneralSettings["date_format"], now: Date): string {
  switch (format) {
    case "relative":
      return `e.g. Today, Tomorrow, Jan 15`;
    case "short":
      return `e.g. ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    case "long":
      return `e.g. ${now.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;
    case "iso": {
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, "0");
      const d = String(now.getDate()).padStart(2, "0");
      return `e.g. ${y}-${m}-${d}`;
    }
    default:
      return "";
  }
}

function NotificationSettings() {
  const [browserEnabled, setBrowserEnabled] = useState(false);
  const [toastEnabled, setToastEnabled] = useState(true);
  const [defaultOffset, setDefaultOffset] = useState("0");
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | "unsupported">(
    "Notification" in window ? Notification.permission : "unsupported",
  );
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      api.getAppSetting("notif_browser"),
      api.getAppSetting("notif_toast"),
      api.getAppSetting("notif_default_offset"),
    ]).then(([browser, toast, offset]) => {
      if (browser !== null) setBrowserEnabled(browser === "true");
      if (toast !== null) setToastEnabled(toast === "true");
      if (offset !== null) setDefaultOffset(offset);
      setLoaded(true);
    });
  }, []);

  const handleBrowserToggle = async () => {
    if (!browserEnabled && permissionStatus !== "granted") {
      const result = await Notification.requestPermission();
      setPermissionStatus(result);
      if (result !== "granted") return;
    }
    const next = !browserEnabled;
    setBrowserEnabled(next);
    await api.setAppSetting("notif_browser", String(next));
  };

  const handleToastToggle = async () => {
    const next = !toastEnabled;
    setToastEnabled(next);
    await api.setAppSetting("notif_toast", String(next));
  };

  const handleOffsetChange = async (value: string) => {
    setDefaultOffset(value);
    await api.setAppSetting("notif_default_offset", value);
  };

  if (!loaded) return null;

  return (
    <section>
      <h2 className="text-lg font-semibold mb-3 text-on-surface flex items-center gap-2">
        <Bell className="w-5 h-5" />
        Notifications
      </h2>
      <div className="space-y-4 max-w-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-on-surface">Browser notifications</p>
            <p className="text-xs text-on-surface-muted">
              Show system notifications when reminders are due
            </p>
          </div>
          <Toggle
            enabled={browserEnabled}
            onToggle={handleBrowserToggle}
            disabled={permissionStatus === "unsupported"}
          />
        </div>
        {permissionStatus === "denied" && (
          <p className="text-xs text-warning">
            Browser notifications are blocked. Update your browser settings to allow notifications.
          </p>
        )}
        {permissionStatus === "unsupported" && (
          <p className="text-xs text-on-surface-muted">
            Browser notifications are not supported in this environment.
          </p>
        )}

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-on-surface">In-app toast notifications</p>
            <p className="text-xs text-on-surface-muted">
              Show toast messages inside the app for reminders
            </p>
          </div>
          <Toggle enabled={toastEnabled} onToggle={handleToastToggle} />
        </div>

        <div>
          <label className="block text-sm text-on-surface mb-1">Default reminder offset</label>
          <select
            value={defaultOffset}
            onChange={(e) => handleOffsetChange(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-lg bg-surface text-on-surface"
          >
            <option value="0">At time of event</option>
            <option value="5">5 minutes before</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
            <option value="60">1 hour before</option>
          </select>
          <p className="text-xs text-on-surface-muted mt-1">
            When setting a reminder from a due date, offset it by this amount.
          </p>
        </div>
      </div>
    </section>
  );
}
