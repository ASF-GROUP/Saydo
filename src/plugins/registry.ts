import { z } from "zod";

const RegistryEntry = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  author: z.string(),
  version: z.string(),
  repository: z.string(),
  tags: z.array(z.string()),
  minDocketVersion: z.string(),
});

const _RegistrySchema = z.object({
  version: z.number(),
  description: z.string(),
  lastUpdated: z.string(),
  plugins: z.array(RegistryEntry),
});

export type RegistryEntry = z.infer<typeof RegistryEntry>;
export type Registry = z.infer<typeof _RegistrySchema>;

/**
 * Plugin registry client — fetches and parses the community plugin directory.
 */
export class PluginRegistry {
  constructor(private registryPath: string) {}

  /** Load the registry from a local JSON file. */
  async loadLocal(): Promise<RegistryEntry[]> {
    // TODO: Read and parse this.registryPath
    void this.registryPath;
    return [];
  }

  /** Fetch the registry from a remote URL. */
  async fetchRemote(_url: string): Promise<RegistryEntry[]> {
    // TODO: Fetch, parse, validate
    return [];
  }

  /** Search plugins by keyword. */
  search(plugins: RegistryEntry[], query: string): RegistryEntry[] {
    const q = query.toLowerCase();
    return plugins.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some((t) => t.includes(q)),
    );
  }
}
