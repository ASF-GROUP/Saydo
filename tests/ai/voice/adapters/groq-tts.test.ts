import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GroqTTSProvider } from "../../../../src/ai/voice/adapters/groq-tts.js";

describe("GroqTTSProvider", () => {
  let provider: GroqTTSProvider;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    provider = new GroqTTSProvider("test-key", "http://test/api/voice/synthesize");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("has correct id and name", () => {
    expect(provider.id).toBe("groq-tts");
    expect(provider.name).toBe("Groq (PlayAI)");
    expect(provider.needsApiKey).toBe(true);
  });

  it("isAvailable returns true when API key is set", async () => {
    expect(await provider.isAvailable()).toBe(true);
  });

  it("isAvailable returns false when API key is empty", async () => {
    const p = new GroqTTSProvider("");
    expect(await p.isAvailable()).toBe(false);
  });

  it("synthesizes text via fetch", async () => {
    const audioBuffer = new ArrayBuffer(100);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => audioBuffer,
    });

    const result = await provider.synthesize("hello");

    expect(result).toBe(audioBuffer);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://test/api/voice/synthesize",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": "test-key",
        },
      }),
    );
  });

  it("throws on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "Server error",
    });

    await expect(provider.synthesize("hello")).rejects.toThrow("Groq TTS error (500)");
  });

  it("getVoices returns hardcoded voice list", async () => {
    const voices = await provider.getVoices();
    expect(voices.length).toBeGreaterThan(0);
    expect(voices[0]).toHaveProperty("id");
    expect(voices[0]).toHaveProperty("name");
  });

  it("passes voice option in request body", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => new ArrayBuffer(0),
    });

    await provider.synthesize("test", { voice: "Celeste-PlayAI" });

    const body = JSON.parse((globalThis.fetch as any).mock.calls[0][1].body);
    expect(body.voice).toBe("Celeste-PlayAI");
    expect(body.model).toBe("playai-tts");
    expect(body.response_format).toBe("wav");
  });
});
