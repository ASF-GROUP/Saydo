/**
 * Audio utilities for voice integration.
 * WAV conversion, MediaRecorder wrapper, and audio playback.
 */

/** Convert Float32Array PCM samples to a WAV Blob. */
export function float32ToWav(samples: Float32Array, sampleRate: number): Blob {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = samples.length * (bitsPerSample / 8);
  const headerSize = 44;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  // RIFF header
  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, "WAVE");

  // fmt chunk
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, "data");
  view.setUint32(40, dataSize, true);

  // Convert float32 samples to int16
  let offset = headerSize;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const val = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, val, true);
    offset += 2;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/** MediaRecorder wrapper for push-to-talk fallback. */
export function createAudioRecorder(): {
  start: () => Promise<void>;
  stop: () => Promise<Blob>;
} {
  let mediaRecorder: MediaRecorder | null = null;
  let chunks: Blob[] = [];

  return {
    async start() {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunks = [];
      mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.start();
    },
    stop(): Promise<Blob> {
      return new Promise((resolve, reject) => {
        if (!mediaRecorder) {
          reject(new Error("Recorder not started"));
          return;
        }
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: "audio/webm" });
          // Stop all tracks to release the microphone
          mediaRecorder!.stream.getTracks().forEach((t) => t.stop());
          mediaRecorder = null;
          chunks = [];
          resolve(blob);
        };
        mediaRecorder.stop();
      });
    },
  };
}

/** Play an ArrayBuffer of audio data through the Web Audio API. Returns a promise that resolves when playback ends. */
export function playAudioBuffer(buffer: ArrayBuffer): Promise<void> {
  return new Promise((resolve, reject) => {
    const audioCtx = new AudioContext();
    audioCtx
      .decodeAudioData(buffer.slice(0))
      .then((audioBuffer) => {
        const source = audioCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioCtx.destination);
        source.onended = () => {
          audioCtx.close();
          resolve();
        };
        source.start(0);
      })
      .catch((err) => {
        audioCtx.close();
        reject(err);
      });
  });
}
