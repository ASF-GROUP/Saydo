/**
 * Voice state management context.
 * Manages STT/TTS providers, voice mode, and voice state.
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { VoiceProviderRegistry } from "../../ai/voice/registry.js";
import { createDefaultVoiceRegistry } from "../../ai/voice/provider.js";
import type { STTProviderPlugin, TTSProviderPlugin, Voice } from "../../ai/voice/interface.js";
import { BrowserTTSProvider } from "../../ai/voice/adapters/browser-tts.js";
import { playAudioBuffer } from "../../ai/voice/audio-utils.js";

export type VoiceMode = "off" | "push-to-talk" | "vad";

export interface VoiceSettings {
  sttProviderId: string;
  ttsProviderId: string;
  voiceMode: VoiceMode;
  ttsEnabled: boolean;
  autoSend: boolean;
  ttsVoice: string;
  groqApiKey: string;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  sttProviderId: "browser-stt",
  ttsProviderId: "browser-tts",
  voiceMode: "push-to-talk",
  ttsEnabled: false,
  autoSend: true,
  ttsVoice: "",
  groqApiKey: "",
};

const STORAGE_KEY = "docket-voice-settings";

function loadSettings(): VoiceSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: VoiceSettings): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

interface VoiceContextValue {
  settings: VoiceSettings;
  updateSettings: (patch: Partial<VoiceSettings>) => void;
  registry: VoiceProviderRegistry;
  sttProvider: STTProviderPlugin | undefined;
  ttsProvider: TTSProviderPlugin | undefined;
  ttsVoices: Voice[];
  isListening: boolean;
  isTranscribing: boolean;
  isSpeaking: boolean;
  startListening: () => void;
  stopListening: () => void;
  speak: (text: string) => Promise<void>;
  cancelSpeech: () => void;
  transcribeAudio: (audio: Blob) => Promise<string>;
}

const VoiceContext = createContext<VoiceContextValue | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<VoiceSettings>(loadSettings);
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsVoices, setTTSVoices] = useState<Voice[]>([]);
  const speechCancelledRef = useRef(false);

  // Build registry whenever groqApiKey changes
  const [registry, setRegistry] = useState<VoiceProviderRegistry>(() =>
    createDefaultVoiceRegistry({ groqApiKey: settings.groqApiKey || undefined }),
  );

  useEffect(() => {
    setRegistry(createDefaultVoiceRegistry({ groqApiKey: settings.groqApiKey || undefined }));
  }, [settings.groqApiKey]);

  const sttProvider = registry.getSTT(settings.sttProviderId);
  const ttsProvider = registry.getTTS(settings.ttsProviderId);

  // Fetch TTS voices when provider changes
  useEffect(() => {
    if (ttsProvider?.getVoices) {
      ttsProvider.getVoices().then(setTTSVoices).catch(() => setTTSVoices([]));
    } else {
      setTTSVoices([]);
    }
  }, [ttsProvider]);

  const updateSettings = useCallback((patch: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const startListening = useCallback(() => {
    setIsListening(true);
  }, []);

  const stopListening = useCallback(() => {
    setIsListening(false);
  }, []);

  const transcribeAudio = useCallback(
    async (audio: Blob): Promise<string> => {
      if (!sttProvider) throw new Error("No STT provider configured");
      setIsTranscribing(true);
      try {
        // Browser STT can't transcribe blobs — this path is for Groq/API-based STT
        return await sttProvider.transcribe(audio);
      } finally {
        setIsTranscribing(false);
      }
    },
    [sttProvider],
  );

  const speak = useCallback(
    async (text: string) => {
      if (!ttsProvider || !settings.ttsEnabled) return;
      speechCancelledRef.current = false;
      setIsSpeaking(true);
      try {
        // BrowserTTSProvider handles playback internally via synthesize()
        if (ttsProvider instanceof BrowserTTSProvider) {
          await ttsProvider.speakDirect(text, { voice: settings.ttsVoice || undefined });
        } else {
          const buffer = await ttsProvider.synthesize(text, {
            voice: settings.ttsVoice || undefined,
          });
          if (!speechCancelledRef.current && buffer.byteLength > 0) {
            await playAudioBuffer(buffer);
          }
        }
      } finally {
        setIsSpeaking(false);
      }
    },
    [ttsProvider, settings.ttsEnabled, settings.ttsVoice],
  );

  const cancelSpeech = useCallback(() => {
    speechCancelledRef.current = true;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        settings,
        updateSettings,
        registry,
        sttProvider,
        ttsProvider,
        ttsVoices,
        isListening,
        isTranscribing,
        isSpeaking,
        startListening,
        stopListening,
        speak,
        cancelSpeech,
        transcribeAudio,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoiceContext(): VoiceContextValue {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error("useVoiceContext must be used within a VoiceProvider");
  }
  return context;
}
