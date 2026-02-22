import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  Puzzle: (props: any) => <svg data-testid="puzzle-icon" {...props} />,
  Search: (props: any) => <svg data-testid="search-icon" {...props} />,
}));

const mockRefreshPlugins = vi.fn().mockResolvedValue(undefined);
const mockRefreshViews = vi.fn().mockResolvedValue(undefined);
const mockRefreshPanels = vi.fn().mockResolvedValue(undefined);
const mockRefreshStatusBar = vi.fn().mockResolvedValue(undefined);
const mockRefreshCommands = vi.fn().mockResolvedValue(undefined);
const mockTogglePlugin = vi.fn().mockResolvedValue(undefined);

vi.mock("../../../src/ui/context/PluginContext.js", () => ({
  usePluginContext: () => ({
    plugins: [
      {
        id: "pomodoro",
        name: "Pomodoro Timer",
        description: "Focus timer",
        author: "ASF",
        version: "1.0.0",
        enabled: true,
        builtin: true,
        permissions: [],
        settings: [],
      },
      {
        id: "community-plugin",
        name: "Community Plugin",
        description: "A community plugin",
        author: "User",
        version: "0.1.0",
        enabled: false,
        builtin: false,
        permissions: ["tasks:read"],
        settings: [],
      },
    ],
    refreshPlugins: (...args: any[]) => mockRefreshPlugins(...args),
    refreshViews: (...args: any[]) => mockRefreshViews(...args),
    refreshPanels: (...args: any[]) => mockRefreshPanels(...args),
    refreshStatusBar: (...args: any[]) => mockRefreshStatusBar(...args),
    refreshCommands: (...args: any[]) => mockRefreshCommands(...args),
  }),
}));

vi.mock("../../../src/ui/api/index.js", () => ({
  api: {
    togglePlugin: (...args: any[]) => mockTogglePlugin(...args),
    approvePluginPermissions: vi.fn().mockResolvedValue(undefined),
    revokePluginPermissions: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../src/ui/components/PluginCard.js", () => ({
  PluginCard: ({ plugin, onToggle }: any) => (
    <div data-testid={`plugin-card-${plugin.id}`}>
      <span>{plugin.name}</span>
      {onToggle && (
        <button data-testid={`toggle-${plugin.id}`} onClick={onToggle}>
          Toggle
        </button>
      )}
    </div>
  ),
}));

vi.mock("../../../src/ui/components/PluginBrowser.js", () => ({
  PluginBrowser: ({ open }: any) => (open ? <div data-testid="plugin-browser">Browser</div> : null),
}));

vi.mock("../../../src/ui/components/PermissionDialog.js", () => ({
  PermissionDialog: () => <div data-testid="permission-dialog">Permission Dialog</div>,
}));

import { PluginsTab } from "../../../src/ui/views/settings/PluginsTab.js";

describe("PluginsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders built-in plugins section", () => {
    render(<PluginsTab />);
    expect(screen.getByText("Built-in Extensions")).toBeDefined();
    expect(screen.getByText("Pomodoro Timer")).toBeDefined();
  });

  it("renders community plugins section", () => {
    render(<PluginsTab />);
    expect(screen.getByText("Community Plugins")).toBeDefined();
    expect(screen.getByText("Community Plugin")).toBeDefined();
  });

  it("renders search input", () => {
    render(<PluginsTab />);
    expect(screen.getByPlaceholderText("Search plugins...")).toBeDefined();
  });

  it("filters plugins by search query", () => {
    render(<PluginsTab />);
    const searchInput = screen.getByPlaceholderText("Search plugins...");
    fireEvent.change(searchInput, { target: { value: "Pomodoro" } });
    expect(screen.getByText("Pomodoro Timer")).toBeDefined();
    expect(screen.queryByText("Community Plugin")).toBeNull();
  });

  it("shows no results message for non-matching search", () => {
    render(<PluginsTab />);
    const searchInput = screen.getByPlaceholderText("Search plugins...");
    fireEvent.change(searchInput, { target: { value: "xyznonexistent" } });
    expect(screen.getByText("No plugins match your search.")).toBeDefined();
  });

  it("renders browse community plugins button", () => {
    render(<PluginsTab />);
    expect(screen.getByText("Browse Community Plugins")).toBeDefined();
  });

  it("opens plugin browser on button click", async () => {
    render(<PluginsTab />);
    fireEvent.click(screen.getByText("Browse Community Plugins"));
    await waitFor(() => {
      expect(screen.getByTestId("plugin-browser")).toBeDefined();
    });
  });

  it("calls toggle on built-in plugin", async () => {
    render(<PluginsTab />);
    fireEvent.click(screen.getByTestId("toggle-pomodoro"));
    await waitFor(() => {
      expect(mockTogglePlugin).toHaveBeenCalledWith("pomodoro");
    });
  });
});
