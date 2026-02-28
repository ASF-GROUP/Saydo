import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";
import { parseTaskFile, serializeTaskFile, taskFilename, slugify } from "./markdown-utils.js";
import { StorageError } from "../core/errors.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("storage-md");
import type {
  IStorage,
  TaskRow,
  ProjectRow,
  TagRow,
  TaskTagJoin,
  PluginSettingsRow,
  AppSettingRow,
  ChatMessageRow,
  ChatSessionInfo,
  TemplateRow,
  SectionRow,
  TaskCommentRow,
  TaskActivityRow,
  DailyStatRow,
  TaskRelationRow,
  AiMemoryRow,
  MutationResult,
} from "./interface.js";

const OK: MutationResult = { changes: 1 };
const NOOP: MutationResult = { changes: 0 };

/**
 * Markdown storage backend — stores tasks as .md files with YAML frontmatter.
 * Reads are served from in-memory indexes; writes update both index and disk.
 */
export class MarkdownBackend implements IStorage {
  private basePath: string;

  // In-memory indexes
  private taskIndex = new Map<
    string,
    { row: TaskRow; filePath: string; description: string | null }
  >();
  private projectIndex = new Map<string, { row: ProjectRow; dirPath: string }>();
  private tagIndex = new Map<string, TagRow>();
  private taskTagIndex = new Map<string, Set<string>>(); // taskId → Set<tagId>
  private appSettings = new Map<string, AppSettingRow>();
  private pluginSettingsMap = new Map<string, PluginSettingsRow>();
  private pluginPermissions = new Map<string, string[]>();
  private chatMessages = new Map<string, ChatMessageRow[]>(); // sessionId → messages
  private templateIndex = new Map<string, TemplateRow>();
  private sectionIndex = new Map<string, SectionRow>();
  private taskCommentIndex = new Map<string, TaskCommentRow[]>(); // taskId → comments
  private taskActivityIndex = new Map<string, TaskActivityRow[]>(); // taskId → activities
  private dailyStatIndex = new Map<string, DailyStatRow>(); // date → stat
  private taskRelationList: TaskRelationRow[] = [];
  private aiMemoryIndex = new Map<string, AiMemoryRow>();

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  /** Scan directory tree, parse all files, build in-memory indexes. */
  initialize(): void {
    logger.info("Initializing markdown backend", { basePath: this.basePath });
    // Ensure base directories exist
    const dirs = [
      path.join(this.basePath, "inbox"),
      path.join(this.basePath, "projects"),
      path.join(this.basePath, "_plugins"),
      path.join(this.basePath, "_chat"),
    ];
    for (const dir of dirs) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        throw new StorageError(`create directory ${dir}`, err instanceof Error ? err : undefined);
      }
    }

    // 1. Read _tags.yaml
    this.loadTags();

    // 2. Read projects/*/_project.yaml
    this.loadProjects();

    // 3. Read all .md files in inbox/ and projects/*/
    this.loadTasks();

    // 4. Read _settings.yaml
    this.loadAppSettings();

    // 5. Read _plugins/*.yaml
    this.loadPluginData();

    // 6. Read _chat/*.yaml
    this.loadChatData();

    // 7. Read _templates.yaml
    this.loadTemplates();

    // 8. Read _sections.yaml
    this.loadSections();

    // 9. Read _daily_stats.yaml
    this.loadDailyStatsFile();

    // 10. Read _task_meta/*.yaml
    this.loadTaskMeta();

    // 11. Read _task_relations.yaml
    this.loadTaskRelations();

    // 12. Read _ai_memories.json
    this.loadAiMemories();

    logger.info("Markdown backend ready", {
      tasks: this.taskIndex.size,
      projects: this.projectIndex.size,
      tags: this.tagIndex.size,
    });
  }

  // ── Tasks ──

  listTasks(): TaskRow[] {
    return Array.from(this.taskIndex.values()).map((e) => e.row);
  }

  getTask(id: string): TaskRow[] {
    const entry = this.taskIndex.get(id);
    return entry ? [entry.row] : [];
  }

  insertTask(task: TaskRow): MutationResult {
    const description = task.description;
    const dir = this.getTaskDir(task.projectId);
    const filename = taskFilename(task.title, task.id);
    const filePath = path.join(dir, filename);

    // Get tag names for frontmatter
    const tagNames = this.getTagNamesForTask(task.id);
    const content = serializeTaskFile(task, task.title, description, tagNames);
    try {
      fs.writeFileSync(filePath, content, "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }

    this.taskIndex.set(task.id, { row: { ...task, description: null }, filePath, description });
    return OK;
  }

  insertTaskWithId(task: TaskRow): MutationResult {
    return this.insertTask(task);
  }

  updateTask(id: string, data: Partial<TaskRow>): MutationResult {
    const entry = this.taskIndex.get(id);
    if (!entry) return NOOP;

    const oldRow = entry.row;
    const newRow = { ...oldRow, ...data };
    let newDescription = entry.description;
    if ("description" in data) {
      newDescription = data.description ?? null;
    }
    let newFilePath = entry.filePath;

    // If title changed → rename file
    const titleChanged = data.title && data.title !== oldRow.title;
    // If projectId changed → move file
    const projectChanged = "projectId" in data && data.projectId !== oldRow.projectId;

    if (titleChanged || projectChanged) {
      // Remove old file
      if (fs.existsSync(entry.filePath)) {
        fs.unlinkSync(entry.filePath);
      }
      const dir = this.getTaskDir(newRow.projectId);
      const filename = taskFilename(newRow.title, id);
      newFilePath = path.join(dir, filename);
    }

    // Get tag names and rewrite file
    const tagNames = this.getTagNamesForTask(id);
    const content = serializeTaskFile(newRow, newRow.title, newDescription, tagNames);
    try {
      fs.mkdirSync(path.dirname(newFilePath), { recursive: true });
      fs.writeFileSync(newFilePath, content, "utf-8");
    } catch (err) {
      throw new StorageError(`write ${newFilePath}`, err instanceof Error ? err : undefined);
    }

    this.taskIndex.set(id, { row: newRow, filePath: newFilePath, description: newDescription });
    return OK;
  }

  deleteTask(id: string): MutationResult {
    const entry = this.taskIndex.get(id);
    if (!entry) return NOOP;

    try {
      if (fs.existsSync(entry.filePath)) {
        fs.unlinkSync(entry.filePath);
      }
    } catch (err) {
      throw new StorageError(`delete ${entry.filePath}`, err instanceof Error ? err : undefined);
    }
    this.taskIndex.delete(id);
    this.taskTagIndex.delete(id);
    return OK;
  }

  deleteManyTasks(ids: string[]): MutationResult {
    let changes = 0;
    for (const id of ids) {
      if (this.deleteTask(id).changes > 0) changes++;
    }
    return { changes };
  }

  updateManyTasks(ids: string[], data: Partial<TaskRow>): MutationResult {
    let changes = 0;
    for (const id of ids) {
      if (this.updateTask(id, data).changes > 0) changes++;
    }
    return { changes };
  }

  listTasksDueForReminder(beforeTime: string): TaskRow[] {
    const results: TaskRow[] = [];
    for (const entry of this.taskIndex.values()) {
      if (
        entry.row.remindAt &&
        entry.row.remindAt <= beforeTime &&
        entry.row.status === "pending"
      ) {
        results.push(entry.row);
      }
    }
    return results;
  }

  // ── Task-Tag Relations ──

  getTaskTags(taskId: string): TaskTagJoin[] {
    const tagIds = this.taskTagIndex.get(taskId);
    if (!tagIds) return [];

    const results: TaskTagJoin[] = [];
    for (const tagId of tagIds) {
      const tag = this.tagIndex.get(tagId);
      if (tag) {
        results.push({
          task_tags: { taskId, tagId },
          tags: tag,
        });
      }
    }
    return results;
  }

  insertTaskTag(taskId: string, tagId: string): MutationResult {
    let set = this.taskTagIndex.get(taskId);
    if (!set) {
      set = new Set();
      this.taskTagIndex.set(taskId, set);
    }
    set.add(tagId);

    // Rewrite the task file to include updated tags
    this.rewriteTaskFile(taskId);
    return OK;
  }

  deleteTaskTags(taskId: string): MutationResult {
    const had = this.taskTagIndex.has(taskId);
    this.taskTagIndex.delete(taskId);

    // Rewrite the task file to remove tags from frontmatter
    this.rewriteTaskFile(taskId);
    return had ? OK : NOOP;
  }

  listAllTaskTags(): TaskTagJoin[] {
    const results: TaskTagJoin[] = [];
    for (const [taskId, tagIds] of this.taskTagIndex) {
      for (const tagId of tagIds) {
        const tag = this.tagIndex.get(tagId);
        if (tag) results.push({ task_tags: { taskId, tagId }, tags: tag });
      }
    }
    return results;
  }

  deleteManyTaskTags(taskIds: string[]): MutationResult {
    let changes = 0;
    for (const taskId of taskIds) {
      if (this.deleteTaskTags(taskId).changes > 0) changes++;
    }
    return { changes };
  }

  // ── Projects ──

  listProjects(): ProjectRow[] {
    return Array.from(this.projectIndex.values()).map((e) => e.row);
  }

  getProject(id: string): ProjectRow[] {
    const entry = this.projectIndex.get(id);
    return entry ? [entry.row] : [];
  }

  getProjectByName(name: string): ProjectRow[] {
    for (const entry of this.projectIndex.values()) {
      if (entry.row.name === name) return [entry.row];
    }
    return [];
  }

  insertProject(project: ProjectRow): MutationResult {
    const dirName = slugify(project.name) || project.id;
    const dirPath = path.join(this.basePath, "projects", dirName);

    const meta: Record<string, unknown> = {
      id: project.id,
      color: project.color,
      icon: project.icon,
      parentId: project.parentId,
      isFavorite: project.isFavorite,
      viewStyle: project.viewStyle,
      sortOrder: project.sortOrder,
      archived: project.archived,
      createdAt: project.createdAt,
    };
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      fs.writeFileSync(path.join(dirPath, "_project.yaml"), YAML.stringify(meta), "utf-8");
    } catch (err) {
      throw new StorageError(`write project ${dirPath}`, err instanceof Error ? err : undefined);
    }

    this.projectIndex.set(project.id, { row: project, dirPath });
    return OK;
  }

  updateProject(id: string, data: Partial<ProjectRow>): MutationResult {
    const entry = this.projectIndex.get(id);
    if (!entry) return NOOP;

    const newRow = { ...entry.row, ...data };
    const meta: Record<string, unknown> = {
      id: newRow.id,
      name: newRow.name,
      color: newRow.color,
      icon: newRow.icon,
      parentId: newRow.parentId,
      isFavorite: newRow.isFavorite,
      viewStyle: newRow.viewStyle,
      sortOrder: newRow.sortOrder,
      archived: newRow.archived,
      createdAt: newRow.createdAt,
    };
    try {
      fs.writeFileSync(path.join(entry.dirPath, "_project.yaml"), YAML.stringify(meta), "utf-8");
    } catch (err) {
      throw new StorageError(
        `write project ${entry.dirPath}`,
        err instanceof Error ? err : undefined,
      );
    }

    this.projectIndex.set(id, { row: newRow, dirPath: entry.dirPath });
    return OK;
  }

  deleteProject(id: string): MutationResult {
    const entry = this.projectIndex.get(id);
    if (!entry) return NOOP;

    // Move project tasks to inbox
    for (const [taskId, taskEntry] of this.taskIndex) {
      if (taskEntry.row.projectId === id) {
        this.updateTask(taskId, { projectId: null });
      }
    }

    // Remove project directory
    try {
      if (fs.existsSync(entry.dirPath)) {
        fs.rmSync(entry.dirPath, { recursive: true, force: true });
      }
    } catch (err) {
      throw new StorageError(
        `delete project ${entry.dirPath}`,
        err instanceof Error ? err : undefined,
      );
    }
    this.projectIndex.delete(id);
    return OK;
  }

  // ── Tags ──

  listTags(): TagRow[] {
    return Array.from(this.tagIndex.values());
  }

  getTagByName(name: string): TagRow[] {
    for (const tag of this.tagIndex.values()) {
      if (tag.name === name) return [tag];
    }
    return [];
  }

  insertTag(tag: TagRow): MutationResult {
    this.tagIndex.set(tag.id, tag);
    this.persistTags();
    return OK;
  }

  deleteTag(id: string): MutationResult {
    const had = this.tagIndex.has(id);
    this.tagIndex.delete(id);
    this.persistTags();
    return had ? OK : NOOP;
  }

  // ── Plugin Settings ──

  loadPluginSettings(pluginId: string): PluginSettingsRow | undefined {
    return this.pluginSettingsMap.get(pluginId);
  }

  savePluginSettings(pluginId: string, settings: string): void {
    const now = new Date().toISOString();
    const row: PluginSettingsRow = { pluginId, settings, updatedAt: now };
    this.pluginSettingsMap.set(pluginId, row);

    const filePath = path.join(this.basePath, "_plugins", `${pluginId}.yaml`);
    try {
      fs.writeFileSync(filePath, YAML.stringify({ settings, updatedAt: now }), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  // ── App Settings ──

  getAppSetting(key: string): AppSettingRow | undefined {
    return this.appSettings.get(key);
  }

  setAppSetting(key: string, value: string): void {
    const now = new Date().toISOString();
    this.appSettings.set(key, { key, value, updatedAt: now });
    this.persistAppSettings();
  }

  deleteAppSetting(key: string): MutationResult {
    const had = this.appSettings.has(key);
    this.appSettings.delete(key);
    this.persistAppSettings();
    return had ? OK : NOOP;
  }

  // ── Chat Messages ──

  listChatMessages(sessionId: string): ChatMessageRow[] {
    return this.chatMessages.get(sessionId) ?? [];
  }

  insertChatMessage(msg: ChatMessageRow): MutationResult {
    let messages = this.chatMessages.get(msg.sessionId);
    if (!messages) {
      messages = [];
      this.chatMessages.set(msg.sessionId, messages);
    }
    messages.push(msg);
    this.persistChatSession(msg.sessionId);
    return OK;
  }

  deleteChatSession(sessionId: string): MutationResult {
    const had = this.chatMessages.has(sessionId);
    this.chatMessages.delete(sessionId);

    const filePath = path.join(this.basePath, "_chat", `${sessionId}.yaml`);
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (err) {
      throw new StorageError(`delete ${filePath}`, err instanceof Error ? err : undefined);
    }
    return had ? OK : NOOP;
  }

  getLatestSessionId(): { sessionId: string } | undefined {
    // Find the session with the most recent message
    let latest: { sessionId: string; time: string } | undefined;
    for (const [sessionId, messages] of this.chatMessages) {
      if (messages.length === 0) continue;
      const lastMsg = messages[messages.length - 1];
      if (!latest || lastMsg.createdAt > latest.time) {
        latest = { sessionId, time: lastMsg.createdAt };
      }
    }
    return latest ? { sessionId: latest.sessionId } : undefined;
  }

  listChatSessions(): ChatSessionInfo[] {
    const sessions: ChatSessionInfo[] = [];
    for (const [sessionId, messages] of this.chatMessages) {
      if (messages.length === 0) continue;
      const override = this.getAppSetting(`chat_session_title:${sessionId}`);
      let title = override?.value ?? "";
      if (!title) {
        const firstUserMsg = messages.find((m) => m.role === "user");
        title = firstUserMsg?.content?.slice(0, 40) ?? "New chat";
      }
      sessions.push({
        sessionId,
        title,
        createdAt: messages[0].createdAt,
        messageCount: messages.length,
      });
    }
    sessions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sessions;
  }

  renameChatSession(sessionId: string, title: string): void {
    this.setAppSetting(`chat_session_title:${sessionId}`, title);
  }

  // ── Plugin Permissions ──

  getPluginPermissions(pluginId: string): string[] | null {
    return this.pluginPermissions.get(pluginId) ?? null;
  }

  setPluginPermissions(pluginId: string, permissions: string[]): void {
    this.pluginPermissions.set(pluginId, permissions);
    this.persistPluginPermissions();
  }

  deletePluginPermissions(pluginId: string): MutationResult {
    const had = this.pluginPermissions.has(pluginId);
    this.pluginPermissions.delete(pluginId);
    this.persistPluginPermissions();
    return had ? OK : NOOP;
  }

  // ── Task Templates ──

  listTemplates(): TemplateRow[] {
    return Array.from(this.templateIndex.values());
  }

  getTemplate(id: string): TemplateRow | undefined {
    return this.templateIndex.get(id);
  }

  insertTemplate(template: TemplateRow): MutationResult {
    this.templateIndex.set(template.id, template);
    this.persistTemplates();
    return OK;
  }

  updateTemplate(id: string, data: Partial<TemplateRow>): MutationResult {
    const existing = this.templateIndex.get(id);
    if (!existing) return NOOP;
    this.templateIndex.set(id, { ...existing, ...data });
    this.persistTemplates();
    return OK;
  }

  deleteTemplate(id: string): MutationResult {
    const had = this.templateIndex.has(id);
    this.templateIndex.delete(id);
    this.persistTemplates();
    return had ? OK : NOOP;
  }

  // ── Sections ──

  listSections(projectId: string): SectionRow[] {
    return Array.from(this.sectionIndex.values()).filter((s) => s.projectId === projectId);
  }

  getSection(id: string): SectionRow | undefined {
    return this.sectionIndex.get(id);
  }

  insertSection(section: SectionRow): MutationResult {
    this.sectionIndex.set(section.id, section);
    this.persistSections();
    return OK;
  }

  updateSection(id: string, data: Partial<SectionRow>): MutationResult {
    const existing = this.sectionIndex.get(id);
    if (!existing) return NOOP;
    this.sectionIndex.set(id, { ...existing, ...data });
    this.persistSections();
    return OK;
  }

  deleteSection(id: string): MutationResult {
    const had = this.sectionIndex.has(id);
    this.sectionIndex.delete(id);
    // Clear sectionId on tasks that referenced this section
    for (const [taskId, entry] of this.taskIndex) {
      if ((entry.row as any).sectionId === id) {
        this.updateTask(taskId, { sectionId: null } as any);
      }
    }
    this.persistSections();
    return had ? OK : NOOP;
  }

  // ── Task Comments ──

  listTaskComments(taskId: string): TaskCommentRow[] {
    return this.taskCommentIndex.get(taskId) ?? [];
  }

  insertTaskComment(comment: TaskCommentRow): MutationResult {
    let comments = this.taskCommentIndex.get(comment.taskId);
    if (!comments) {
      comments = [];
      this.taskCommentIndex.set(comment.taskId, comments);
    }
    comments.push(comment);
    this.persistTaskMeta(comment.taskId);
    return OK;
  }

  updateTaskComment(id: string, data: Partial<TaskCommentRow>): MutationResult {
    for (const [taskId, comments] of this.taskCommentIndex) {
      const idx = comments.findIndex((c) => c.id === id);
      if (idx >= 0) {
        comments[idx] = { ...comments[idx], ...data };
        this.persistTaskMeta(taskId);
        return OK;
      }
    }
    return NOOP;
  }

  deleteTaskComment(id: string): MutationResult {
    for (const [taskId, comments] of this.taskCommentIndex) {
      const idx = comments.findIndex((c) => c.id === id);
      if (idx >= 0) {
        comments.splice(idx, 1);
        this.persistTaskMeta(taskId);
        return OK;
      }
    }
    return NOOP;
  }

  // ── Task Activity ──

  listTaskActivity(taskId: string): TaskActivityRow[] {
    return this.taskActivityIndex.get(taskId) ?? [];
  }

  insertTaskActivity(activity: TaskActivityRow): MutationResult {
    let activities = this.taskActivityIndex.get(activity.taskId);
    if (!activities) {
      activities = [];
      this.taskActivityIndex.set(activity.taskId, activities);
    }
    activities.push(activity);
    this.persistTaskMeta(activity.taskId);
    return OK;
  }

  // ── Daily Stats ──

  getDailyStat(date: string): DailyStatRow | undefined {
    return this.dailyStatIndex.get(date);
  }

  upsertDailyStat(stat: DailyStatRow): MutationResult {
    this.dailyStatIndex.set(stat.date, stat);
    this.persistDailyStats();
    return OK;
  }

  listDailyStats(startDate: string, endDate: string): DailyStatRow[] {
    const results: DailyStatRow[] = [];
    for (const stat of this.dailyStatIndex.values()) {
      if (stat.date >= startDate && stat.date <= endDate) {
        results.push(stat);
      }
    }
    return results.sort((a, b) => a.date.localeCompare(b.date));
  }

  // ── Task Relations ──

  listTaskRelations(): TaskRelationRow[] {
    return [...this.taskRelationList];
  }

  getTaskRelations(taskId: string): TaskRelationRow[] {
    return this.taskRelationList.filter(
      (r) => r.taskId === taskId || r.relatedTaskId === taskId,
    );
  }

  insertTaskRelation(relation: TaskRelationRow): MutationResult {
    this.taskRelationList.push({ ...relation });
    this.persistTaskRelations();
    return OK;
  }

  deleteTaskRelation(taskId: string, relatedTaskId: string): MutationResult {
    const idx = this.taskRelationList.findIndex(
      (r) => r.taskId === taskId && r.relatedTaskId === relatedTaskId,
    );
    if (idx < 0) return NOOP;
    this.taskRelationList.splice(idx, 1);
    this.persistTaskRelations();
    return OK;
  }

  deleteAllTaskRelations(taskId: string): MutationResult {
    const before = this.taskRelationList.length;
    this.taskRelationList = this.taskRelationList.filter(
      (r) => r.taskId !== taskId && r.relatedTaskId !== taskId,
    );
    const removed = before - this.taskRelationList.length;
    if (removed > 0) this.persistTaskRelations();
    return { changes: removed };
  }

  // ── AI Memories ──

  listAiMemories(): AiMemoryRow[] {
    return Array.from(this.aiMemoryIndex.values());
  }

  insertAiMemory(row: AiMemoryRow): void {
    this.aiMemoryIndex.set(row.id, row);
    this.persistAiMemories();
  }

  updateAiMemory(id: string, content: string, category: AiMemoryRow["category"]): void {
    const existing = this.aiMemoryIndex.get(id);
    if (!existing) return;
    this.aiMemoryIndex.set(id, { ...existing, content, category, updatedAt: new Date().toISOString() });
    this.persistAiMemories();
  }

  deleteAiMemory(id: string): MutationResult {
    const had = this.aiMemoryIndex.has(id);
    this.aiMemoryIndex.delete(id);
    this.persistAiMemories();
    return had ? OK : NOOP;
  }

  // ── Private helpers ──

  private persistAiMemories(): void {
    const memories = Array.from(this.aiMemoryIndex.values());
    const filePath = path.join(this.basePath, "_ai_memories.json");
    try {
      fs.writeFileSync(filePath, JSON.stringify(memories, null, 2), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  private persistSections(): void {
    const sections = Array.from(this.sectionIndex.values());
    const filePath = path.join(this.basePath, "_sections.yaml");
    try {
      fs.writeFileSync(filePath, YAML.stringify(sections), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  private persistTaskMeta(taskId: string): void {
    const comments = this.taskCommentIndex.get(taskId) ?? [];
    const activities = this.taskActivityIndex.get(taskId) ?? [];
    if (comments.length === 0 && activities.length === 0) return;
    const metaDir = path.join(this.basePath, "_task_meta");
    try {
      fs.mkdirSync(metaDir, { recursive: true });
    } catch {
      // directory may already exist
    }
    const filePath = path.join(metaDir, `${taskId}.yaml`);
    try {
      fs.writeFileSync(filePath, YAML.stringify({ comments, activities }), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  private persistDailyStats(): void {
    const stats = Array.from(this.dailyStatIndex.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
    const filePath = path.join(this.basePath, "_daily_stats.yaml");
    try {
      fs.writeFileSync(filePath, YAML.stringify(stats), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  private persistTaskRelations(): void {
    const filePath = path.join(this.basePath, "_task_relations.yaml");
    try {
      fs.writeFileSync(filePath, YAML.stringify(this.taskRelationList), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  private getTaskDir(projectId: string | null): string {
    if (!projectId) return path.join(this.basePath, "inbox");

    const projEntry = this.projectIndex.get(projectId);
    if (projEntry) return projEntry.dirPath;

    // Fallback to inbox if project not found
    return path.join(this.basePath, "inbox");
  }

  private getTagNamesForTask(taskId: string): string[] {
    const tagIds = this.taskTagIndex.get(taskId);
    if (!tagIds) return [];
    const names: string[] = [];
    for (const tagId of tagIds) {
      const tag = this.tagIndex.get(tagId);
      if (tag) names.push(tag.name);
    }
    return names;
  }

  private rewriteTaskFile(taskId: string): void {
    const entry = this.taskIndex.get(taskId);
    if (!entry) return;

    const tagNames = this.getTagNamesForTask(taskId);
    const content = serializeTaskFile(entry.row, entry.row.title, entry.description, tagNames);
    try {
      fs.writeFileSync(entry.filePath, content, "utf-8");
    } catch (err) {
      throw new StorageError(`write ${entry.filePath}`, err instanceof Error ? err : undefined);
    }
  }

  private persistTags(): void {
    const tags = Array.from(this.tagIndex.values()).sort((a, b) => a.name.localeCompare(b.name));
    const filePath = path.join(this.basePath, "_tags.yaml");
    try {
      fs.writeFileSync(filePath, YAML.stringify(tags), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  private persistAppSettings(): void {
    const obj: Record<string, { value: string; updatedAt: string }> = {};
    for (const [key, row] of [...this.appSettings.entries()].sort((a, b) =>
      a[0].localeCompare(b[0]),
    )) {
      obj[key] = { value: row.value, updatedAt: row.updatedAt };
    }
    const filePath = path.join(this.basePath, "_settings.yaml");
    try {
      fs.writeFileSync(filePath, YAML.stringify(obj), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  private persistPluginPermissions(): void {
    const obj: Record<string, string[]> = {};
    for (const [id, perms] of this.pluginPermissions) {
      obj[id] = perms;
    }
    const filePath = path.join(this.basePath, "_plugins", "permissions.yaml");
    try {
      fs.writeFileSync(filePath, YAML.stringify(obj), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  private persistChatSession(sessionId: string): void {
    const messages = this.chatMessages.get(sessionId);
    if (!messages) return;
    const filePath = path.join(this.basePath, "_chat", `${sessionId}.yaml`);
    try {
      fs.writeFileSync(filePath, YAML.stringify(messages), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  private persistTemplates(): void {
    const templates = Array.from(this.templateIndex.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    const filePath = path.join(this.basePath, "_templates.yaml");
    try {
      fs.writeFileSync(filePath, YAML.stringify(templates), "utf-8");
    } catch (err) {
      throw new StorageError(`write ${filePath}`, err instanceof Error ? err : undefined);
    }
  }

  // ── Loading ──

  private loadTags(): void {
    const filePath = path.join(this.basePath, "_tags.yaml");
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const tags = YAML.parse(content);
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        this.tagIndex.set(tag.id, tag as TagRow);
      }
    }
  }

  private loadProjects(): void {
    const projectsDir = path.join(this.basePath, "projects");
    if (!fs.existsSync(projectsDir)) return;

    const entries = fs.readdirSync(projectsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const dirPath = path.join(projectsDir, entry.name);
      const metaPath = path.join(dirPath, "_project.yaml");
      if (!fs.existsSync(metaPath)) continue;

      const content = fs.readFileSync(metaPath, "utf-8");
      const meta = YAML.parse(content);
      const row: ProjectRow = {
        id: meta.id,
        name: entry.name, // directory name
        color: meta.color ?? "#3b82f6",
        icon: meta.icon ?? null,
        parentId: meta.parentId ?? null,
        isFavorite: meta.isFavorite ?? false,
        viewStyle: meta.viewStyle ?? "list",
        sortOrder: meta.sortOrder ?? 0,
        archived: meta.archived ?? false,
        createdAt: meta.createdAt ?? new Date().toISOString(),
      };

      // Store the original name from the directory
      if (meta.name) {
        row.name = meta.name;
      }

      this.projectIndex.set(row.id, { row, dirPath });
    }
  }

  private loadTasks(): void {
    // Load tasks from inbox/
    this.loadTasksFromDir(path.join(this.basePath, "inbox"), null);

    // Load tasks from each project directory
    for (const [projectId, entry] of this.projectIndex) {
      this.loadTasksFromDir(entry.dirPath, projectId);
    }
  }

  private loadTasksFromDir(dirPath: string, projectId: string | null): void {
    if (!fs.existsSync(dirPath)) return;

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".md"));
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const { task, tagNames } = parseTaskFile(content, projectId);

      if (!task.id) continue; // Skip files without an ID

      this.taskIndex.set(task.id, {
        row: { ...task, description: null },
        filePath,
        description: task.description,
      });

      // Resolve tag names to IDs
      const tagIds = new Set<string>();
      for (const tagName of tagNames) {
        for (const [tagId, tag] of this.tagIndex) {
          if (tag.name === tagName) {
            tagIds.add(tagId);
            break;
          }
        }
      }
      if (tagIds.size > 0) {
        this.taskTagIndex.set(task.id, tagIds);
      }
    }
  }

  private loadAppSettings(): void {
    const filePath = path.join(this.basePath, "_settings.yaml");
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const obj = YAML.parse(content);
    if (obj && typeof obj === "object") {
      for (const [key, val] of Object.entries(obj)) {
        const entry = val as { value: string; updatedAt: string };
        this.appSettings.set(key, { key, value: entry.value, updatedAt: entry.updatedAt });
      }
    }
  }

  private loadPluginData(): void {
    const pluginsDir = path.join(this.basePath, "_plugins");
    if (!fs.existsSync(pluginsDir)) return;

    // Load plugin settings
    const files = fs.readdirSync(pluginsDir).filter((f) => f.endsWith(".yaml"));
    for (const file of files) {
      if (file === "permissions.yaml") continue;
      const pluginId = file.replace(".yaml", "");
      const filePath = path.join(pluginsDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const data = YAML.parse(content);
      if (data) {
        this.pluginSettingsMap.set(pluginId, {
          pluginId,
          settings: data.settings ?? "{}",
          updatedAt: data.updatedAt ?? new Date().toISOString(),
        });
      }
    }

    // Load plugin permissions
    const permPath = path.join(pluginsDir, "permissions.yaml");
    if (fs.existsSync(permPath)) {
      const content = fs.readFileSync(permPath, "utf-8");
      const obj = YAML.parse(content);
      if (obj && typeof obj === "object") {
        for (const [id, perms] of Object.entries(obj)) {
          this.pluginPermissions.set(id, perms as string[]);
        }
      }
    }
  }

  private loadTemplates(): void {
    const filePath = path.join(this.basePath, "_templates.yaml");
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const templates = YAML.parse(content);
    if (Array.isArray(templates)) {
      for (const t of templates) {
        this.templateIndex.set(t.id, t as TemplateRow);
      }
    }
  }

  private loadChatData(): void {
    const chatDir = path.join(this.basePath, "_chat");
    if (!fs.existsSync(chatDir)) return;

    const files = fs.readdirSync(chatDir).filter((f) => f.endsWith(".yaml"));
    for (const file of files) {
      const sessionId = file.replace(".yaml", "");
      const filePath = path.join(chatDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const messages = YAML.parse(content);
      if (Array.isArray(messages)) {
        this.chatMessages.set(sessionId, messages as ChatMessageRow[]);
      }
    }
  }

  private loadSections(): void {
    const filePath = path.join(this.basePath, "_sections.yaml");
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const sections = YAML.parse(content);
    if (Array.isArray(sections)) {
      for (const s of sections) {
        this.sectionIndex.set(s.id, s as SectionRow);
      }
    }
  }

  private loadDailyStatsFile(): void {
    const filePath = path.join(this.basePath, "_daily_stats.yaml");
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const stats = YAML.parse(content);
    if (Array.isArray(stats)) {
      for (const s of stats) {
        this.dailyStatIndex.set(s.date, s as DailyStatRow);
      }
    }
  }

  private loadTaskMeta(): void {
    const metaDir = path.join(this.basePath, "_task_meta");
    if (!fs.existsSync(metaDir)) return;

    const files = fs.readdirSync(metaDir).filter((f) => f.endsWith(".yaml"));
    for (const file of files) {
      const taskId = file.replace(".yaml", "");
      const filePath = path.join(metaDir, file);
      const content = fs.readFileSync(filePath, "utf-8");
      const data = YAML.parse(content);
      if (data) {
        if (Array.isArray(data.comments)) {
          this.taskCommentIndex.set(taskId, data.comments as TaskCommentRow[]);
        }
        if (Array.isArray(data.activities)) {
          this.taskActivityIndex.set(taskId, data.activities as TaskActivityRow[]);
        }
      }
    }
  }

  private loadTaskRelations(): void {
    const filePath = path.join(this.basePath, "_task_relations.yaml");
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const relations = YAML.parse(content);
    if (Array.isArray(relations)) {
      this.taskRelationList = relations as TaskRelationRow[];
    }
  }

  private loadAiMemories(): void {
    const filePath = path.join(this.basePath, "_ai_memories.json");
    if (!fs.existsSync(filePath)) return;

    const content = fs.readFileSync(filePath, "utf-8");
    const memories = JSON.parse(content);
    if (Array.isArray(memories)) {
      for (const m of memories) {
        this.aiMemoryIndex.set(m.id, m as AiMemoryRow);
      }
    }
  }
}
