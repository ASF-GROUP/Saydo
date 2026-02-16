/**
 * Execution context flowing through the LLM pipeline.
 * Carries the canonical request, provider capabilities, and metadata
 * that middleware can read/write.
 */

import type { LLMCapabilities } from "./capabilities.js";
import type { LLMRequest, LLMResponse, StreamEvent } from "../types.js";

export interface LLMExecutionContext {
  request: LLMRequest;
  providerName: string;
  capabilities: LLMCapabilities;
  /** Middleware scratch space — middleware can stash data here. */
  metadata: Map<string, unknown>;
  signal?: AbortSignal;
}

export type PipelineResult =
  | { mode: "complete"; response: LLMResponse }
  | { mode: "stream"; events: AsyncIterable<StreamEvent> };
