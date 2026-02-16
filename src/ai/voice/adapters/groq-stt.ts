/**
 * Groq STT adapter using Whisper via OpenAI-compatible API.
 * Proxied through vite middleware to avoid CORS.
 */

import type { STTProviderPlugin, STTOptions } from "../interface.js";

export class GroqSTTProvider implements STTProviderPlugin {
  readonly id = "groq-stt";
  readonly name = "Groq (Whisper)";
  readonly needsApiKey = true;

  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = "/api/voice/transcribe") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async transcribe(audio: Blob, opts?: STTOptions): Promise<string> {
    const formData = new FormData();
    formData.append("file", audio, "audio.wav");
    formData.append("model", opts?.model ?? "whisper-large-v3-turbo");
    if (opts?.language) {
      formData.append("language", opts.language);
    }

    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: { "X-Api-Key": this.apiKey },
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Groq STT error (${res.status}): ${text}`);
    }

    const data = await res.json();
    return data.text ?? "";
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
