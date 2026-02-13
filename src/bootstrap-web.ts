import { createWebDb } from "./db/client-web.js";
import { runWebMigrations } from "./db/migrate-web.js";
import { createQueries } from "./db/queries.js";
import { TaskService } from "./core/tasks.js";
import { ProjectService } from "./core/projects.js";
import { TagService } from "./core/tags.js";
import { EventBus } from "./core/event-bus.js";
import { ChatManager } from "./ai/chat.js";
import { createDefaultRegistry } from "./ai/provider.js";
import type { AIProviderRegistry } from "./ai/provider-registry.js";
import { PluginSettingsManager } from "./plugins/settings.js";
import { CommandRegistry } from "./plugins/command-registry.js";
import { UIRegistry } from "./plugins/ui-registry.js";
import { loadDbFile, saveDbFile } from "./db/persistence.js";
import type { Queries } from "./db/queries.js";

export interface WebAppServices {
  taskService: TaskService;
  projectService: ProjectService;
  tagService: TagService;
  eventBus: EventBus;
  settingsManager: PluginSettingsManager;
  commandRegistry: CommandRegistry;
  uiRegistry: UIRegistry;
  chatManager: ChatManager;
  queries: Queries;
  aiProviderRegistry: AIProviderRegistry;
  save: () => void;
}

function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: unknown[]) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as unknown as T;
}

export async function bootstrapWeb(): Promise<WebAppServices> {
  const existingData = await loadDbFile();
  const { db, sqlite } = await createWebDb(existingData ?? undefined);
  runWebMigrations(sqlite);

  const queries = createQueries(db);
  const tagService = new TagService(queries);
  const projectService = new ProjectService(queries);
  const eventBus = new EventBus();
  const taskService = new TaskService(queries, tagService, eventBus);
  const settingsManager = new PluginSettingsManager(queries);
  const commandRegistry = new CommandRegistry();
  const uiRegistry = new UIRegistry();
  const chatManager = new ChatManager();
  const aiProviderRegistry = createDefaultRegistry();

  // Auto-save DB to Tauri FS after mutations (debounced)
  const save = debounce(() => {
    saveDbFile(sqlite.export()).catch((err) =>
      console.error("[bootstrap-web] Failed to save DB:", err),
    );
  }, 500);

  eventBus.on("task:create", save);
  eventBus.on("task:complete", save);
  eventBus.on("task:update", save);
  eventBus.on("task:delete", save);

  // Flush DB to disk on window close
  window.addEventListener("beforeunload", () => {
    saveDbFile(sqlite.export()).catch(() => {});
  });

  return {
    taskService,
    projectService,
    tagService,
    eventBus,
    settingsManager,
    commandRegistry,
    uiRegistry,
    chatManager,
    queries,
    aiProviderRegistry,
    save,
  };
}
