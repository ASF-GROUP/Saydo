import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GroqSTTProvider } from "../../../../src/ai/voice/adapters/groq-stt.js";

describe("GroqSTTProvider", () => {
  let provider: GroqSTTProvider;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    provider = new GroqSTTProvider("test-key", "http://test/api/voice/transcribe");
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("has correct id and name", () => {
    expect(provider.id).toBe("groq-stt");
    expect(provider.name).toBe("Groq (Whisper)");
    expect(provider.needsApiKey).toBe(true);
  });

  it("isAvailable returns true when API key is set", async () => {
    expect(await provider.isAvailable()).toBe(true);
  });

  it("isAvailable returns false when API key is empty", async () => {
    const p = new GroqSTTProvider("");
    expect(await p.isAvailable()).toBe(false);
  });

  it("transcribes audio via fetch", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ text: "hello world" }),
    });

    const blob = new Blob(["audio data"], { type: "audio/wav" });
    const result = await provider.transcribe(blob);

    expect(result).toBe("hello world");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "http://test/api/voice/transcribe",
      expect.objectContaining({
        method: "POST",
        headers: { "X-Api-Key": "test-key" },
      }),
    );
  });

  it("throws on non-ok response", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => "Unauthorized",
    });

    const blob = new Blob(["audio data"], { type: "audio/wav" });
    await expect(provider.transcribe(blob)).rejects.toThrow("Groq STT error (401)");
  });
});
