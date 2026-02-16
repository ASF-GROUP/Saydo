/**
 * Browser STT adapter wrapping the Web Speech API.
 * Free, no API key required. Default/fallback STT provider.
 */

import type { STTProviderPlugin, STTOptions } from "../interface.js";

export class BrowserSTTProvider implements STTProviderPlugin {
  readonly id = "browser-stt";
  readonly name = "Browser (Web Speech API)";
  readonly needsApiKey = false;

  async transcribe(audio: Blob, opts?: STTOptions): Promise<string> {
    // Web Speech API doesn't accept audio blobs — it records from the microphone directly.
    // This method is only called by the push-to-talk / VAD path which records audio.
    // For Browser STT, we use the live recognition approach instead.
    // This path is a no-op; the live recognition is handled by startLiveRecognition().
    void audio;
    void opts;
    throw new Error(
      "Browser STT does not support transcribing audio blobs. Use startLiveRecognition() instead.",
    );
  }

  /** Start live recognition from the microphone. Returns a promise with the transcript. */
  startLiveRecognition(opts?: STTOptions): Promise<string> {
    return new Promise((resolve, reject) => {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        reject(new Error("SpeechRecognition not supported in this browser"));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = opts?.language ?? "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onend = () => {
        // If onresult hasn't fired, resolve with empty string
        resolve("");
      };

      recognition.start();
    });
  }

  async isAvailable(): Promise<boolean> {
    return (
      typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
    );
  }
}
