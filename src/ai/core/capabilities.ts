/**
 * LLM capability declarations and model descriptors.
 * Providers report what their models can do; middleware uses this
 * to guard against unsupported operations.
 */

export interface LLMCapabilities {
  streaming: boolean;
  toolCalling: boolean;
  vision: boolean;
  structuredOutput: boolean;
  maxContextLength?: number;
}

export interface ModelDescriptor {
  id: string;
  label: string;
  capabilities: LLMCapabilities;
  loaded: boolean;
}

export const DEFAULT_CAPABILITIES: LLMCapabilities = {
  streaming: true,
  toolCalling: true,
  vision: false,
  structuredOutput: false,
};
