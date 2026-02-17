import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useVoiceCall, type UseVoiceCallOptions } from "../../../src/ui/hooks/useVoiceCall.js";

function createMockOptions(overrides: Partial<UseVoiceCallOptions> = {}): UseVoiceCallOptions {
  return {
    speak: vi.fn().mockResolvedValue(undefined),
    cancelSpeech: vi.fn(),
    isSpeaking: false,
    isStreaming: false,
    messages: [],
    ttsAvailable: true,
    setVoiceCallMode: vi.fn(),
    ...overrides,
  };
}

describe("useVoiceCall", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("starts in idle state", () => {
    const opts = createMockOptions();
    const { result } = renderHook(() => useVoiceCall(opts));

    expect(result.current.callState).toBe("idle");
    expect(result.current.isCallActive).toBe(false);
    expect(result.current.callDuration).toBe(0);
    expect(result.current.vadEnabled).toBe(false);
  });

  it("startCall transitions to greeting and speaks greeting", () => {
    const opts = createMockOptions();
    const { result } = renderHook(() => useVoiceCall(opts));

    act(() => {
      result.current.startCall();
    });

    expect(result.current.callState).toBe("greeting");
    expect(result.current.isCallActive).toBe(true);
    expect(opts.speak).toHaveBeenCalledWith("Hey! What can I help you with today?");
    expect(opts.setVoiceCallMode).toHaveBeenCalledWith(true);
  });

  it("skips greeting and goes to listening when TTS unavailable", () => {
    const opts = createMockOptions({ ttsAvailable: false });
    const { result } = renderHook(() => useVoiceCall(opts));

    act(() => {
      result.current.startCall();
    });

    expect(result.current.callState).toBe("listening");
    expect(opts.speak).not.toHaveBeenCalled();
  });

  it("transitions from greeting to listening when TTS finishes", () => {
    const opts = createMockOptions({ isSpeaking: true });
    const { result, rerender } = renderHook((props) => useVoiceCall(props), {
      initialProps: opts,
    });

    act(() => {
      result.current.startCall();
    });
    expect(result.current.callState).toBe("greeting");

    // TTS finishes speaking
    rerender({ ...opts, isSpeaking: false });

    expect(result.current.callState).toBe("listening");
  });

  it("transitions from listening to processing when streaming starts", () => {
    const opts = createMockOptions({ ttsAvailable: false });
    const { result, rerender } = renderHook((props) => useVoiceCall(props), {
      initialProps: opts,
    });

    act(() => {
      result.current.startCall();
    });
    expect(result.current.callState).toBe("listening");

    // AI starts streaming
    rerender({ ...opts, isStreaming: true });

    expect(result.current.callState).toBe("processing");
  });

  it("transitions from processing to speaking when streaming ends", () => {
    const opts = createMockOptions({
      ttsAvailable: false,
      isStreaming: true,
      messages: [{ role: "assistant", content: "I created the task." }],
    });
    const { result, rerender } = renderHook((props) => useVoiceCall(props), {
      initialProps: { ...opts, isStreaming: false },
    });

    // Start call and move to listening
    act(() => {
      result.current.startCall();
    });

    // Move to processing
    rerender({ ...opts, isStreaming: true });
    expect(result.current.callState).toBe("processing");

    // AI finishes streaming, TTS should be available for this test
    rerender({
      ...opts,
      isStreaming: false,
      ttsAvailable: true,
      messages: [{ role: "assistant", content: "I created the task." }],
    });

    expect(result.current.callState).toBe("speaking");
    expect(opts.speak).toHaveBeenCalledWith("I created the task.");
  });

  it("transitions from speaking to listening when TTS finishes (the loop)", () => {
    const opts = createMockOptions({ isSpeaking: true, ttsAvailable: false });
    const { result, rerender } = renderHook((props) => useVoiceCall(props), {
      initialProps: opts,
    });

    // Start call → listening (no TTS)
    act(() => {
      result.current.startCall();
    });

    // Force into speaking state by simulating the full flow
    // Move to processing
    rerender({ ...opts, isStreaming: true });
    rerender({
      ...opts,
      isStreaming: false,
      ttsAvailable: true,
      isSpeaking: true,
      messages: [{ role: "assistant", content: "Done." }],
    });

    expect(result.current.callState).toBe("speaking");

    // TTS finishes
    rerender({
      ...opts,
      isStreaming: false,
      ttsAvailable: true,
      isSpeaking: false,
      messages: [{ role: "assistant", content: "Done." }],
    });

    expect(result.current.callState).toBe("listening");
  });

  it("endCall resets to idle and cancels speech", () => {
    const opts = createMockOptions({ ttsAvailable: false });
    const { result } = renderHook(() => useVoiceCall(opts));

    act(() => {
      result.current.startCall();
    });
    expect(result.current.isCallActive).toBe(true);

    act(() => {
      result.current.endCall();
    });

    expect(result.current.callState).toBe("idle");
    expect(result.current.isCallActive).toBe(false);
    expect(opts.cancelSpeech).toHaveBeenCalled();
    expect(opts.setVoiceCallMode).toHaveBeenCalledWith(false);
  });

  it("endCall during processing cancels and resets", () => {
    const opts = createMockOptions({ ttsAvailable: false });
    const { result, rerender } = renderHook((props) => useVoiceCall(props), {
      initialProps: opts,
    });

    act(() => {
      result.current.startCall();
    });

    // Move to processing
    rerender({ ...opts, isStreaming: true });
    expect(result.current.callState).toBe("processing");

    act(() => {
      result.current.endCall();
    });

    expect(result.current.callState).toBe("idle");
    expect(opts.cancelSpeech).toHaveBeenCalled();
  });

  it("double startCall is a no-op", () => {
    const opts = createMockOptions();
    const { result } = renderHook(() => useVoiceCall(opts));

    act(() => {
      result.current.startCall();
    });
    act(() => {
      result.current.startCall();
    });

    // speak should only be called once (for the greeting)
    expect(opts.speak).toHaveBeenCalledTimes(1);
  });

  it("call duration increments while call is active", () => {
    const opts = createMockOptions({ ttsAvailable: false });
    const { result } = renderHook(() => useVoiceCall(opts));

    act(() => {
      result.current.startCall();
    });

    expect(result.current.callDuration).toBe(0);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.callDuration).toBeGreaterThanOrEqual(3);
  });

  it("call duration resets on endCall", () => {
    const opts = createMockOptions({ ttsAvailable: false });
    const { result } = renderHook(() => useVoiceCall(opts));

    act(() => {
      result.current.startCall();
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current.callDuration).toBeGreaterThanOrEqual(5);

    act(() => {
      result.current.endCall();
    });

    expect(result.current.callDuration).toBe(0);
  });

  it("vadEnabled is true only during listening state", () => {
    const opts = createMockOptions({ ttsAvailable: false });
    const { result, rerender } = renderHook((props) => useVoiceCall(props), {
      initialProps: opts,
    });

    // idle
    expect(result.current.vadEnabled).toBe(false);

    // listening
    act(() => {
      result.current.startCall();
    });
    expect(result.current.vadEnabled).toBe(true);

    // processing
    rerender({ ...opts, isStreaming: true });
    expect(result.current.vadEnabled).toBe(false);
  });

  it("falls back to listening if streaming ends with no assistant content", () => {
    const opts = createMockOptions({
      ttsAvailable: false,
      messages: [],
    });
    const { result, rerender } = renderHook((props) => useVoiceCall(props), {
      initialProps: opts,
    });

    act(() => {
      result.current.startCall();
    });

    // Move to processing
    rerender({ ...opts, isStreaming: true });
    expect(result.current.callState).toBe("processing");

    // Streaming ends but no messages
    rerender({ ...opts, isStreaming: false, messages: [], ttsAvailable: true });

    expect(result.current.callState).toBe("listening");
  });

  it("falls back to listening if TTS fails during greeting", async () => {
    vi.useRealTimers();
    const speak = vi.fn().mockRejectedValue(new Error("TTS failed"));
    const opts = createMockOptions({ speak });
    const { result } = renderHook(() => useVoiceCall(opts));

    await act(async () => {
      result.current.startCall();
      // Let the rejected promise settle
      await new Promise((r) => setTimeout(r, 10));
    });

    expect(result.current.callState).toBe("listening");
  });
});
