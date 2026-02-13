import { z } from "zod";

export const SettingDefinition = z.discriminatedUnion("type", [
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.literal("text"),
    default: z.string(),
    description: z.string().optional(),
    placeholder: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.literal("number"),
    default: z.number(),
    description: z.string().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  }),
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.literal("boolean"),
    default: z.boolean(),
    description: z.string().optional(),
  }),
  z.object({
    id: z.string(),
    name: z.string(),
    type: z.literal("select"),
    default: z.string(),
    description: z.string().optional(),
    options: z.array(z.string()),
  }),
]);

export const PluginManifest = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  version: z.string(),
  author: z.string(),
  description: z.string(),
  main: z.string(),
  minDocketVersion: z.string(),
  permissions: z.array(z.string()).optional().default([]),
  settings: z.array(SettingDefinition).optional().default([]),
  repository: z.string().url().optional(),
  license: z.string().optional(),
  keywords: z.array(z.string()).optional().default([]),
  dependencies: z.record(z.string()).optional(),
});

export type PluginManifest = z.infer<typeof PluginManifest>;
export type SettingDefinition = z.infer<typeof SettingDefinition>;

export const VALID_PERMISSIONS = [
  "task:read",
  "task:write",
  "ui:panel",
  "ui:view",
  "ui:status",
  "commands",
  "settings",
  "storage",
  "network",
  "ai:provider",
] as const;

export type Permission = (typeof VALID_PERMISSIONS)[number];
