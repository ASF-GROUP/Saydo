import { describe, it, expect } from "vitest";
import { float32ToWav } from "../../../src/ai/voice/audio-utils.js";

describe("float32ToWav", () => {
  it("produces a valid WAV header", () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1]);
    const blob = float32ToWav(samples, 16000);

    expect(blob.type).toBe("audio/wav");
    // WAV file: 44 byte header + 2 bytes per sample * 5 samples = 54 bytes
    expect(blob.size).toBe(54);
  });

  it("contains RIFF and WAVE markers", async () => {
    const samples = new Float32Array([0, 0]);
    const blob = float32ToWav(samples, 16000);
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);

    // "RIFF" at offset 0
    const riff = String.fromCharCode(
      view.getUint8(0),
      view.getUint8(1),
      view.getUint8(2),
      view.getUint8(3),
    );
    expect(riff).toBe("RIFF");

    // "WAVE" at offset 8
    const wave = String.fromCharCode(
      view.getUint8(8),
      view.getUint8(9),
      view.getUint8(10),
      view.getUint8(11),
    );
    expect(wave).toBe("WAVE");
  });

  it("sets correct sample rate in header", async () => {
    const samples = new Float32Array([0]);
    const blob = float32ToWav(samples, 44100);
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);

    // Sample rate at offset 24
    expect(view.getUint32(24, true)).toBe(44100);
  });

  it("sets correct data chunk size", async () => {
    const samples = new Float32Array(100);
    const blob = float32ToWav(samples, 16000);
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);

    // Data chunk size at offset 40 (num samples * 2 bytes per 16-bit sample)
    expect(view.getUint32(40, true)).toBe(200);
  });

  it("clamps sample values to [-1, 1]", async () => {
    const samples = new Float32Array([2.0, -2.0, 0.5]);
    const blob = float32ToWav(samples, 16000);
    const buffer = await blob.arrayBuffer();
    const view = new DataView(buffer);

    // First sample (clamped to 1.0 → 0x7FFF = 32767)
    expect(view.getInt16(44, true)).toBe(32767);
    // Second sample (clamped to -1.0 → -0x8000 = -32768)
    expect(view.getInt16(46, true)).toBe(-32768);
  });

  it("handles empty input", () => {
    const samples = new Float32Array(0);
    const blob = float32ToWav(samples, 16000);
    // Just the header
    expect(blob.size).toBe(44);
  });
});
