/** Built-in theme definitions. */

export interface Theme {
  id: string;
  name: string;
  type: "light" | "dark";
  cssFile?: string;
}

export interface CustomTheme {
  id: string;
  name: string;
  type: "light" | "dark";
  variables: Record<string, string>;
}

export const BUILT_IN_THEMES: Theme[] = [
  { id: "light", name: "Light", type: "light", cssFile: "light.css" },
  { id: "dark", name: "Dark", type: "dark", cssFile: "dark.css" },
];

export const THEME_VARIABLES = [
  { key: "--color-surface", label: "Surface", group: "Background" },
  { key: "--color-surface-secondary", label: "Secondary Surface", group: "Background" },
  { key: "--color-surface-tertiary", label: "Tertiary Surface", group: "Background" },
  { key: "--color-on-surface", label: "Text", group: "Text" },
  { key: "--color-on-surface-secondary", label: "Secondary Text", group: "Text" },
  { key: "--color-on-surface-muted", label: "Muted Text", group: "Text" },
  { key: "--color-border", label: "Border", group: "UI" },
  { key: "--color-accent", label: "Accent", group: "UI" },
  { key: "--color-accent-hover", label: "Accent Hover", group: "UI" },
  { key: "--color-success", label: "Success", group: "Status" },
  { key: "--color-warning", label: "Warning", group: "Status" },
  { key: "--color-error", label: "Error", group: "Status" },
  { key: "--color-priority-1", label: "Priority 1 (Urgent)", group: "Priority" },
  { key: "--color-priority-2", label: "Priority 2 (High)", group: "Priority" },
  { key: "--color-priority-3", label: "Priority 3 (Medium)", group: "Priority" },
  { key: "--color-priority-4", label: "Priority 4 (Low)", group: "Priority" },
  { key: "--radius-sm", label: "Small Radius", group: "Layout" },
  { key: "--radius-md", label: "Medium Radius", group: "Layout" },
  { key: "--radius-lg", label: "Large Radius", group: "Layout" },
] as const;
