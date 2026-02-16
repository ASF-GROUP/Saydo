/**
 * Browser TTS adapter wrapping the Web Speech Synthesis API.
 * Free, no API key required. Default/fallback TTS provider.
 */

import type { TTSProviderPlugin, TTSOptions, Voice } from "../interface.js";

export class BrowserTTSProvider implements TTSProviderPlugin {
  readonly id = "browser-tts";
  readonly name = "Browser (Speech Synthesis)";
  readonly needsApiKey = false;

  /**
   * Synthesize text using the browser's SpeechSynthesis API.
   * Returns an empty ArrayBuffer since browser TTS plays audio directly.
   * Use speakDirect() for actual playback.
   */
  async synthesize(text: string, opts?: TTSOptions): Promise<ArrayBuffer> {
    // Browser Speech Synthesis doesn't produce an ArrayBuffer.
    // We play directly via speakDirect(). This method exists to satisfy the interface.
    await this.speakDirect(text, opts);
    return new ArrayBuffer(0);
  }

  /** Speak text directly through the browser's speech synthesis. */
  speakDirect(text: string, opts?: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error("SpeechSynthesis not supported"));
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      if (opts?.voice) {
        const voices = window.speechSynthesis.getVoices();
        const match = voices.find((v) => v.voiceURI === opts.voice || v.name === opts.voice);
        if (match) utterance.voice = match;
      }

      if (opts?.speed) utterance.rate = opts.speed;

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(new Error(`Speech synthesis error: ${e.error}`));

      window.speechSynthesis.speak(utterance);
    });
  }

  async getVoices(): Promise<Voice[]> {
    if (!window.speechSynthesis) return [];

    // Voices may load asynchronously
    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      voices = await new Promise<SpeechSynthesisVoice[]>((resolve) => {
        window.speechSynthesis.onvoiceschanged = () => {
          resolve(window.speechSynthesis.getVoices());
        };
        // Fallback timeout in case event never fires
        setTimeout(() => resolve(window.speechSynthesis.getVoices()), 500);
      });
    }

    return voices.map((v) => ({ id: v.voiceURI, name: `${v.name} (${v.lang})` }));
  }

  async isAvailable(): Promise<boolean> {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }
}
