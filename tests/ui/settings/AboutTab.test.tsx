import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  ExternalLink: (props: any) => <svg data-testid="external-link" {...props} />,
  Bug: (props: any) => <svg data-testid="bug-icon" {...props} />,
  MessageSquarePlus: (props: any) => <svg data-testid="feature-icon" {...props} />,
}));

vi.mock("../../../src/utils/tauri.js", () => ({
  isTauri: () => false,
}));

vi.mock("../../../src/config/defaults.js", () => ({
  APP_VERSION: "1.0.0",
}));

const mockGetStorageInfo = vi.fn();
const mockExportAllData = vi.fn();
const mockListPlugins = vi.fn();

vi.mock("../../../src/ui/api/index.js", () => ({
  api: {
    getStorageInfo: (...args: any[]) => mockGetStorageInfo(...args),
    exportAllData: (...args: any[]) => mockExportAllData(...args),
    listPlugins: (...args: any[]) => mockListPlugins(...args),
  },
}));

import { AboutTab } from "../../../src/ui/views/settings/AboutTab.js";

describe("AboutTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetStorageInfo.mockResolvedValue({ mode: "sqlite" });
    mockExportAllData.mockResolvedValue({ tasks: [1, 2, 3] });
    mockListPlugins.mockResolvedValue([1, 2]);
  });

  it("renders app name and version", async () => {
    render(<AboutTab />);
    expect(screen.getByText(/ASF Saydo/)).toBeDefined();
    expect(screen.getByText("v1.0.0")).toBeDefined();
  });

  it("renders app description", () => {
    render(<AboutTab />);
    expect(screen.getByText(/AI-native task manager/)).toBeDefined();
  });

  it("renders feedback links", () => {
    render(<AboutTab />);
    expect(screen.getByText("Report a Bug")).toBeDefined();
    expect(screen.getByText("Request a Feature")).toBeDefined();
  });

  it("renders bug report link with correct href", () => {
    render(<AboutTab />);
    const link = screen.getByText("Report a Bug").closest("a");
    expect(link?.getAttribute("href")).toContain("issues/new");
    expect(link?.getAttribute("href")).toContain("bug");
  });

  it("renders open source credits section", () => {
    render(<AboutTab />);
    expect(screen.getByText("Open Source Credits")).toBeDefined();
  });

  it("renders credit categories", () => {
    render(<AboutTab />);
    expect(screen.getByText("AI & Machine Learning")).toBeDefined();
    expect(screen.getByText("Frontend")).toBeDefined();
    expect(screen.getByText("Database & Storage")).toBeDefined();
  });

  it("renders individual credits with links", () => {
    render(<AboutTab />);
    expect(screen.getByText("React")).toBeDefined();
    expect(screen.getByText("Vitest")).toBeDefined();
    expect(screen.getByText("Tailwind CSS")).toBeDefined();
  });

  it("renders system info after loading", async () => {
    render(<AboutTab />);
    await waitFor(() => {
      expect(screen.getByText("System Info")).toBeDefined();
    });
    expect(screen.getByText("SQLite")).toBeDefined();
  });

  it("renders footer with ASF mention", () => {
    render(<AboutTab />);
    expect(screen.getByText("AI Strategic Forum")).toBeDefined();
    expect(screen.getByText(/Licensed under MIT/)).toBeDefined();
  });
});
