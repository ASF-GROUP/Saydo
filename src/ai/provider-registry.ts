import type { AIProvider } from "./provider.js";
import type { AIProviderConfig } from "./types.js";

export interface ProviderRegistration {
  name: string;
  displayName: string;
  needsApiKey: boolean;
  defaultModel: string;
  defaultBaseUrl?: string;
  showBaseUrl?: boolean;
  factory: (config: AIProviderConfig) => AIProvider;
  pluginId: string | null; // null = built-in
}

/**
 * Registry for AI providers.
 * Built-in providers are registered at startup; plugins can add custom providers.
 */
export class AIProviderRegistry {
  private providers = new Map<string, ProviderRegistration>();

  register(reg: ProviderRegistration): void {
    if (this.providers.has(reg.name)) {
      throw new Error(`AI provider "${reg.name}" is already registered`);
    }
    this.providers.set(reg.name, reg);
  }

  unregister(name: string): void {
    this.providers.delete(name);
  }

  unregisterByPlugin(pluginId: string): void {
    for (const [name, reg] of this.providers) {
      if (reg.pluginId === pluginId) {
        this.providers.delete(name);
      }
    }
  }

  get(name: string): ProviderRegistration | undefined {
    return this.providers.get(name);
  }

  getAll(): ProviderRegistration[] {
    return Array.from(this.providers.values());
  }

  createProvider(config: AIProviderConfig): AIProvider {
    const reg = this.providers.get(config.provider);
    if (!reg) {
      throw new Error(`Unknown AI provider: ${config.provider}`);
    }
    if (reg.needsApiKey && !config.apiKey) {
      throw new Error(`${reg.displayName} requires an API key`);
    }
    return reg.factory(config);
  }
}
