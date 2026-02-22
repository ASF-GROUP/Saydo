import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockUpdateConfig = vi.fn().mockResolvedValue(undefined);
const mockRefreshConfig = vi.fn().mockResolvedValue(undefined);
const mockListAIProviders = vi.fn().mockResolvedValue([]);
const mockFetchModels = vi.fn().mockResolvedValue([]);

vi.mock("../../../src/ui/context/AIContext.js", () => ({
  useAIContext: () => ({
    config: { provider: "", model: "", baseUrl: "", hasApiKey: false },
    isConfigured: false,
    updateConfig: (...args: any[]) => mockUpdateConfig(...args),
    refreshConfig: (...args: any[]) => mockRefreshConfig(...args),
  }),
}));

vi.mock("../../../src/ui/api/index.js", () => ({
  api: {
    listAIProviders: (...args: any[]) => mockListAIProviders(...args),
    fetchModels: (...args: any[]) => mockFetchModels(...args),
    loadModel: vi.fn().mockResolvedValue(undefined),
  },
}));

import { AITab } from "../../../src/ui/views/settings/AITab.js";

describe("AITab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListAIProviders.mockResolvedValue([
      {
        name: "openai",
        displayName: "OpenAI",
        needsApiKey: true,
        optionalApiKey: false,
        showBaseUrl: false,
        defaultModel: "gpt-4o",
        defaultBaseUrl: "",
      },
      {
        name: "ollama",
        displayName: "Ollama",
        needsApiKey: false,
        optionalApiKey: false,
        showBaseUrl: true,
        defaultModel: "llama3",
        defaultBaseUrl: "http://localhost:11434",
      },
    ]);
    mockFetchModels.mockResolvedValue([]);
  });

  it("renders provider selector with None option", async () => {
    render(<AITab />);
    await waitFor(() => {
      expect(screen.getByText("Provider")).toBeDefined();
    });
    const select = screen.getByRole("combobox");
    expect(select).toBeDefined();
    expect(screen.getByText("None (disabled)")).toBeDefined();
  });

  it("loads provider list from API", async () => {
    render(<AITab />);
    await waitFor(() => {
      expect(screen.getByText("OpenAI")).toBeDefined();
    });
    expect(screen.getByText("Ollama")).toBeDefined();
  });

  it("shows API key input when provider needs it", async () => {
    render(<AITab />);
    await waitFor(() => {
      expect(screen.getByText("OpenAI")).toBeDefined();
    });
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "openai" } });
    await waitFor(() => {
      expect(screen.getByText("API Key")).toBeDefined();
    });
  });

  it("shows model input when provider is selected", async () => {
    render(<AITab />);
    await waitFor(() => {
      expect(screen.getByText("OpenAI")).toBeDefined();
    });
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "openai" } });
    await waitFor(() => {
      expect(screen.getByText("Model")).toBeDefined();
    });
  });

  it("shows save button when provider is selected", async () => {
    render(<AITab />);
    await waitFor(() => {
      expect(screen.getByText("OpenAI")).toBeDefined();
    });
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "openai" } });
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeDefined();
    });
  });

  it("calls updateConfig on save", async () => {
    render(<AITab />);
    await waitFor(() => {
      expect(screen.getByText("OpenAI")).toBeDefined();
    });
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "openai" } });
    await waitFor(() => {
      expect(screen.getByText("Save")).toBeDefined();
    });
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => {
      expect(mockUpdateConfig).toHaveBeenCalled();
    });
  });

  it("shows not configured status initially", async () => {
    render(<AITab />);
    // Select a provider to see the status text
    await waitFor(() => {
      expect(screen.getByText("OpenAI")).toBeDefined();
    });
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "openai" } });
    await waitFor(() => {
      expect(screen.getByText("Not configured")).toBeDefined();
    });
  });
});
