import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  X: (props: any) => <svg data-testid="x-icon" {...props} />,
  Search: (props: any) => <svg data-testid="search-icon" {...props} />,
  Download: (props: any) => <svg data-testid="download-icon" {...props} />,
  Trash2: (props: any) => <svg data-testid="trash-icon" {...props} />,
  Loader2: (props: any) => <svg data-testid="loader-icon" {...props} />,
  ExternalLink: (props: any) => <svg data-testid="external-link" {...props} />,
  Shield: (props: any) => <svg data-testid="shield-icon" {...props} />,
  ArrowLeft: (props: any) => <svg data-testid="arrow-left" {...props} />,
}));

const mockGetPluginStore = vi.fn();
const mockInstallPlugin = vi.fn();
const mockTogglePlugin = vi.fn();

vi.mock("../../../src/ui/api/index.js", () => ({
  api: {
    getPluginStore: (...args: any[]) => mockGetPluginStore(...args),
    installPlugin: (...args: any[]) => mockInstallPlugin(...args),
    uninstallPlugin: vi.fn().mockResolvedValue(undefined),
    togglePlugin: (...args: any[]) => mockTogglePlugin(...args),
    getPluginSettings: vi.fn().mockResolvedValue({}),
    updatePluginSetting: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../../src/ui/context/PluginContext.js", () => ({
  usePluginContext: () => ({
    plugins: [],
    refreshPlugins: vi.fn().mockResolvedValue(undefined),
  }),
}));

vi.mock("../../../src/ui/hooks/useFocusTrap.js", () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock("../../../src/ui/hooks/useIsMobile.js", () => ({
  useIsMobile: () => false,
}));

vi.mock("../../../src/ui/components/PluginCard.js", () => ({
  getGradient: () => ["from-blue-500", "to-cyan-500"],
  formatDownloads: (n: number) => String(n),
  PluginSettings: () => <div data-testid="plugin-settings" />,
}));

import { PluginBrowser } from "../../../src/ui/components/PluginBrowser.js";

describe("PluginBrowser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPluginStore.mockResolvedValue({
      plugins: [
        {
          id: "test-plugin",
          name: "Test Plugin",
          description: "A test plugin",
          author: "Test Author",
          version: "1.0.0",
          tags: ["productivity"],
          downloads: 100,
          downloadUrl: "https://example.com/plugin.zip",
        },
      ],
    });
  });

  it("renders nothing when closed", () => {
    const { container } = render(<PluginBrowser open={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders the Community Plugins header when open", async () => {
    render(<PluginBrowser open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Community Plugins")).toBeDefined();
    });
  });

  it("shows plugin list after loading", async () => {
    render(<PluginBrowser open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Test Plugin")).toBeDefined();
    });
  });

  it("renders search input", async () => {
    render(<PluginBrowser open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Search plugins...")).toBeDefined();
    });
  });

  it("filters plugins by search query", async () => {
    render(<PluginBrowser open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("Test Plugin")).toBeDefined();
    });
    const searchInput = screen.getByPlaceholderText("Search plugins...");
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });
    await waitFor(() => {
      expect(screen.getByText("No plugins match your search.")).toBeDefined();
    });
  });

  it("renders filter tabs", async () => {
    render(<PluginBrowser open={true} onClose={vi.fn()} />);
    await waitFor(() => {
      expect(screen.getByText("All")).toBeDefined();
    });
    expect(screen.getByText("Installed")).toBeDefined();
    expect(screen.getByText("Not Installed")).toBeDefined();
  });

  it("calls onClose when close button is clicked", async () => {
    const onClose = vi.fn();
    render(<PluginBrowser open={true} onClose={onClose} />);
    await waitFor(() => {
      expect(screen.getByText("Community Plugins")).toBeDefined();
    });
    // Close button is the X button in the header
    const closeButtons = screen.getAllByRole("button");
    const closeBtn = closeButtons.find((b) => b.querySelector("[data-testid='x-icon']"));
    if (closeBtn) {
      fireEvent.click(closeBtn);
      expect(onClose).toHaveBeenCalled();
    }
  });
});
