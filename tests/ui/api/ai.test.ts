import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/utils/tauri.js", () => ({
  isTauri: () => false,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  listAIProviders,
  fetchModels,
  loadModel,
  unloadModel,
  getAIConfig,
  updateAIConfig,
  sendChatMessage,
  getChatMessages,
  clearChat,
  listChatSessions,
  renameChatSession,
  deleteChatSession,
  switchChatSession,
  createNewChatSession,
} from "../../../src/ui/api/ai.js";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// listAIProviders
// ---------------------------------------------------------------------------
describe("listAIProviders", () => {
  it("GETs /api/ai/providers", async () => {
    const providers = [
      {
        name: "openai",
        displayName: "OpenAI",
        needsApiKey: true,
        defaultModel: "gpt-4o",
        pluginId: null,
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(providers),
    });

    const result = await listAIProviders();

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/providers");
    expect(result).toEqual(providers);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Provider registry failed" }),
    });

    await expect(listAIProviders()).rejects.toThrow("Provider registry failed");
  });
});

// ---------------------------------------------------------------------------
// fetchModels
// ---------------------------------------------------------------------------
describe("fetchModels", () => {
  it("GETs /api/ai/providers/:name/models", async () => {
    const models = [{ id: "gpt-4o", label: "GPT-4o", loaded: false }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ models }),
    });

    const result = await fetchModels("openai");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/api/ai/providers/openai/models");
    expect(url).not.toContain("baseUrl");
    expect(result).toEqual(models);
  });

  it("appends baseUrl param when provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ models: [] }),
    });

    await fetchModels("lmstudio", "http://localhost:1234/v1");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("baseUrl=");
    expect(url).toContain("localhost");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Model fetch failed" }),
    });

    await expect(fetchModels("bad")).rejects.toThrow("Model fetch failed");
  });
});

// ---------------------------------------------------------------------------
// loadModel
// ---------------------------------------------------------------------------
describe("loadModel", () => {
  it("POSTs to /api/ai/providers/:name/models/load", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await loadModel("lmstudio", "llama-3.1", "http://localhost:1234/v1");

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/providers/lmstudio/models/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1", baseUrl: "http://localhost:1234/v1" }),
    });
  });

  it("sends undefined baseUrl when not provided", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await loadModel("lmstudio", "llama-3.1");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("llama-3.1");
    expect(body.baseUrl).toBeUndefined();
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Load failed" }),
    });

    await expect(loadModel("lmstudio", "bad-model")).rejects.toThrow("Load failed");
  });
});

// ---------------------------------------------------------------------------
// unloadModel
// ---------------------------------------------------------------------------
describe("unloadModel", () => {
  it("POSTs to /api/ai/providers/:name/models/unload", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await unloadModel("lmstudio", "llama-3.1", "http://localhost:1234/v1");

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/providers/lmstudio/models/unload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: "llama-3.1", baseUrl: "http://localhost:1234/v1" }),
    });
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Unload failed" }),
    });

    await expect(unloadModel("lmstudio", "model")).rejects.toThrow("Unload failed");
  });
});

// ---------------------------------------------------------------------------
// getAIConfig
// ---------------------------------------------------------------------------
describe("getAIConfig", () => {
  it("GETs /api/ai/config", async () => {
    const config = {
      provider: "openai",
      model: "gpt-4o",
      baseUrl: null,
      hasApiKey: true,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(config),
    });

    const result = await getAIConfig();

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/config");
    expect(result).toEqual(config);
  });
});

// ---------------------------------------------------------------------------
// updateAIConfig
// ---------------------------------------------------------------------------
describe("updateAIConfig", () => {
  it("PUTs to /api/ai/config with config object", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await updateAIConfig({ provider: "anthropic", apiKey: "sk-ant-xxx" });

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "anthropic", apiKey: "sk-ant-xxx" }),
    });
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Config update failed" }),
    });

    await expect(updateAIConfig({ provider: "bad" })).rejects.toThrow("Config update failed");
  });
});

// ---------------------------------------------------------------------------
// sendChatMessage
// ---------------------------------------------------------------------------
describe("sendChatMessage", () => {
  it("POSTs to /api/ai/chat and returns response body", async () => {
    const mockBody = new ReadableStream();
    mockFetch.mockResolvedValueOnce({
      body: mockBody,
    });

    const result = await sendChatMessage("Hello AI");

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Hello AI", voiceCall: undefined }),
    });
    expect(result).toBe(mockBody);
  });

  it("passes voiceCall option", async () => {
    const mockBody = new ReadableStream();
    mockFetch.mockResolvedValueOnce({
      body: mockBody,
    });

    await sendChatMessage("Voice input", { voiceCall: true });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.voiceCall).toBe(true);
  });

  it("returns null body when response has no body", async () => {
    mockFetch.mockResolvedValueOnce({
      body: null,
    });

    const result = await sendChatMessage("test");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// getChatMessages
// ---------------------------------------------------------------------------
describe("getChatMessages", () => {
  it("GETs /api/ai/messages", async () => {
    const messages = [
      { role: "user", content: "Hi" },
      { role: "assistant", content: "Hello!" },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(messages),
    });

    const result = await getChatMessages();

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/messages");
    expect(result).toEqual(messages);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Failed to get messages" }),
    });

    await expect(getChatMessages()).rejects.toThrow("Failed to get messages");
  });
});

// ---------------------------------------------------------------------------
// clearChat
// ---------------------------------------------------------------------------
describe("clearChat", () => {
  it("POSTs to /api/ai/clear", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await clearChat();

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/clear", {
      method: "POST",
    });
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Clear failed" }),
    });

    await expect(clearChat()).rejects.toThrow("Clear failed");
  });
});

// ---------------------------------------------------------------------------
// listChatSessions
// ---------------------------------------------------------------------------
describe("listChatSessions", () => {
  it("GETs /api/ai/sessions", async () => {
    const sessions = [
      { sessionId: "s1", title: "Chat 1", createdAt: "2026-01-01", messageCount: 5 },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(sessions),
    });

    const result = await listChatSessions();

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/sessions");
    expect(result).toEqual(sessions);
  });
});

// ---------------------------------------------------------------------------
// renameChatSession
// ---------------------------------------------------------------------------
describe("renameChatSession", () => {
  it("PUTs to /api/ai/sessions/:id/title", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await renameChatSession("s1", "New Title");

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/sessions/s1/title", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Title" }),
    });
  });

  it("encodes session id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await renameChatSession("id with spaces", "Title");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe("/api/ai/sessions/id%20with%20spaces/title");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Rename failed" }),
    });

    await expect(renameChatSession("s1", "x")).rejects.toThrow("Rename failed");
  });
});

// ---------------------------------------------------------------------------
// deleteChatSession
// ---------------------------------------------------------------------------
describe("deleteChatSession", () => {
  it("DELETEs /api/ai/sessions/:id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteChatSession("s1");

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/sessions/s1", {
      method: "DELETE",
    });
  });

  it("encodes session id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteChatSession("id/special");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe("/api/ai/sessions/id%2Fspecial");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Delete failed" }),
    });

    await expect(deleteChatSession("s1")).rejects.toThrow("Delete failed");
  });
});

// ---------------------------------------------------------------------------
// switchChatSession
// ---------------------------------------------------------------------------
describe("switchChatSession", () => {
  it("POSTs to /api/ai/sessions/:id/switch", async () => {
    const messages = [{ role: "user", content: "Old message" }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(messages),
    });

    const result = await switchChatSession("s1");

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/sessions/s1/switch", {
      method: "POST",
    });
    expect(result).toEqual(messages);
  });

  it("encodes session id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    });

    await switchChatSession("id with spaces");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe("/api/ai/sessions/id%20with%20spaces/switch");
  });
});

// ---------------------------------------------------------------------------
// createNewChatSession
// ---------------------------------------------------------------------------
describe("createNewChatSession", () => {
  it("POSTs to /api/ai/sessions/new and returns sessionId", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ sessionId: "new-sess-1" }),
    });

    const result = await createNewChatSession();

    expect(mockFetch).toHaveBeenCalledWith("/api/ai/sessions/new", {
      method: "POST",
    });
    expect(result).toBe("new-sess-1");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Session creation failed" }),
    });

    await expect(createNewChatSession()).rejects.toThrow("Session creation failed");
  });
});
