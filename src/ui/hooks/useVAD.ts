/**
 * React hook wrapping @ricky0123/vad-web for voice activity detection.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { float32ToWav } from "../../ai/voice/audio-utils.js";

interface UseVADProps {
  onSpeechStart?: () => void;
  onSpeechEnd?: (audio: Blob) => void;
  enabled: boolean;
}

interface UseVADReturn {
  isListening: boolean;
  isSpeaking: boolean;
  start: () => Promise<void>;
  stop: () => void;
  isSupported: boolean;
}

export function useVAD({ onSpeechStart, onSpeechEnd, enabled }: UseVADProps): UseVADReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const vadRef = useRef<any>(null);
  const onSpeechStartRef = useRef(onSpeechStart);
  const onSpeechEndRef = useRef(onSpeechEnd);

  // Keep callback refs up to date
  onSpeechStartRef.current = onSpeechStart;
  onSpeechEndRef.current = onSpeechEnd;

  const start = useCallback(async () => {
    if (vadRef.current) return;

    try {
      const { MicVAD } = await import("@ricky0123/vad-web");
      const vad = await MicVAD.new({
        onSpeechStart: () => {
          setIsSpeaking(true);
          onSpeechStartRef.current?.();
        },
        onSpeechEnd: (audio: Float32Array) => {
          setIsSpeaking(false);
          const wavBlob = float32ToWav(audio, 16000);
          onSpeechEndRef.current?.(wavBlob);
        },
      });

      vadRef.current = vad;
      vad.start();
      setIsListening(true);
    } catch {
      setIsSupported(false);
    }
  }, []);

  const stop = useCallback(() => {
    if (vadRef.current) {
      vadRef.current.pause();
      vadRef.current.destroy();
      vadRef.current = null;
    }
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  // Auto-start/stop when enabled changes
  useEffect(() => {
    if (enabled) {
      start();
    } else {
      stop();
    }
    return () => {
      stop();
    };
  }, [enabled, start, stop]);

  return { isListening, isSpeaking, start, stop, isSupported };
}
