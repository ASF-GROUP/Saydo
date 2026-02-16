/**
 * Groq TTS adapter using PlayAI TTS via OpenAI-compatible API.
 * Proxied through vite middleware to avoid CORS.
 */

import type { TTSProviderPlugin, TTSOptions, Voice } from "../interface.js";

const GROQ_VOICES: Voice[] = [
  { id: "Arista-PlayAI", name: "Arista" },
  { id: "Atlas-PlayAI", name: "Atlas" },
  { id: "Basil-PlayAI", name: "Basil" },
  { id: "Briggs-PlayAI", name: "Briggs" },
  { id: "Calista-PlayAI", name: "Calista" },
  { id: "Celeste-PlayAI", name: "Celeste" },
  { id: "Cheyenne-PlayAI", name: "Cheyenne" },
  { id: "Chip-PlayAI", name: "Chip" },
  { id: "Cillian-PlayAI", name: "Cillian" },
  { id: "Deedee-PlayAI", name: "Deedee" },
  { id: "Fritz-PlayAI", name: "Fritz" },
  { id: "Gail-PlayAI", name: "Gail" },
  { id: "Indigo-PlayAI", name: "Indigo" },
  { id: "Mamaw-PlayAI", name: "Mamaw" },
  { id: "Mason-PlayAI", name: "Mason" },
  { id: "Mikail-PlayAI", name: "Mikail" },
  { id: "Mitch-PlayAI", name: "Mitch" },
  { id: "Nia-PlayAI", name: "Nia" },
  { id: "Quinn-PlayAI", name: "Quinn" },
  { id: "Thunder-PlayAI", name: "Thunder" },
];

export class GroqTTSProvider implements TTSProviderPlugin {
  readonly id = "groq-tts";
  readonly name = "Groq (PlayAI)";
  readonly needsApiKey = true;

  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl = "/api/voice/synthesize") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async synthesize(text: string, opts?: TTSOptions): Promise<ArrayBuffer> {
    const res = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": this.apiKey,
      },
      body: JSON.stringify({
        model: "playai-tts",
        input: text,
        voice: opts?.voice ?? "Fritz-PlayAI",
        response_format: "wav",
        speed: opts?.speed,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Groq TTS error (${res.status}): ${errText}`);
    }

    return res.arrayBuffer();
  }

  async getVoices(): Promise<Voice[]> {
    return GROQ_VOICES;
  }

  async isAvailable(): Promise<boolean> {
    return !!this.apiKey;
  }
}
