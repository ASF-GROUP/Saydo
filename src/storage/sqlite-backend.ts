import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type * as schema from "../db/schema.js";
import { createQueries } from "../db/queries.js";
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

/**
 * SQLite backend — thin wrapper that delegates to the existing createQueries() function.
 * Satisfies IStorage so services can use either backend interchangeably.
 */
export class SQLiteBackend implements IStorage {
  private q: ReturnType<typeof createQueries>;

  constructor(db: BaseSQLiteDatabase<"sync", any, typeof schema>) {
    this.q = createQueries(db);
  }

  // ── Tasks ──

  listTasks(): TaskRow[] {
    return this.q.listTasks() as unknown as TaskRow[];
  }

  getTask(id: string): TaskRow[] {
    return this.q.getTask(id) as unknown as TaskRow[];
  }

  insertTask(task: TaskRow): MutationResult {
    return this.q.insertTask(task as any);
  }

  insertTaskWithId(task: TaskRow): MutationResult {
    return this.q.insertTaskWithId(task as any);
  }

  updateTask(id: string, data: Partial<TaskRow>): MutationResult {
    return this.q.updateTask(id, data as any);
  }

  deleteTask(id: string): MutationResult {
    return this.q.deleteTask(id);
  }

  deleteManyTasks(ids: string[]): MutationResult {
    return this.q.deleteManyTasks(ids);
  }

  updateManyTasks(ids: string[], data: Partial<TaskRow>): MutationResult {
    return this.q.updateManyTasks(ids, data as any);
  }

  listTasksDueForReminder(beforeTime: string): TaskRow[] {
    return this.q.listTasksDueForReminder(beforeTime) as unknown as TaskRow[];
  }

  // ── Task-Tag Relations ──

  getTaskTags(taskId: string): TaskTagJoin[] {
    return this.q.getTaskTags(taskId) as unknown as TaskTagJoin[];
  }

  listAllTaskTags(): TaskTagJoin[] {
    return this.q.listAllTaskTags() as unknown as TaskTagJoin[];
  }

  insertTaskTag(taskId: string, tagId: string): MutationResult {
    return this.q.insertTaskTag(taskId, tagId);
  }

  deleteTaskTags(taskId: string): MutationResult {
    return this.q.deleteTaskTags(taskId);
  }

  deleteManyTaskTags(taskIds: string[]): MutationResult {
    return this.q.deleteManyTaskTags(taskIds);
  }

  // ── Projects ──

  listProjects(): ProjectRow[] {
    return this.q.listProjects() as unknown as ProjectRow[];
  }

  getProject(id: string): ProjectRow[] {
    return this.q.getProject(id) as unknown as ProjectRow[];
  }

  getProjectByName(name: string): ProjectRow[] {
    return this.q.getProjectByName(name) as unknown as ProjectRow[];
  }

  insertProject(project: ProjectRow): MutationResult {
    return this.q.insertProject(project as any);
  }

  updateProject(id: string, data: Partial<ProjectRow>): MutationResult {
    return this.q.updateProject(id, data as any);
  }

  deleteProject(id: string): MutationResult {
    return this.q.deleteProject(id);
  }

  // ── Tags ──

  listTags(): TagRow[] {
    return this.q.listTags() as unknown as TagRow[];
  }

  getTagByName(name: string): TagRow[] {
    return this.q.getTagByName(name) as unknown as TagRow[];
  }

  insertTag(tag: TagRow): MutationResult {
    return this.q.insertTag(tag as any);
  }

  deleteTag(id: string): MutationResult {
    return this.q.deleteTag(id);
  }

  // ── Plugin Settings ──

  loadPluginSettings(pluginId: string): PluginSettingsRow | undefined {
    return this.q.loadPluginSettings(pluginId) as PluginSettingsRow | undefined;
  }

  savePluginSettings(pluginId: string, settings: string): void {
    this.q.savePluginSettings(pluginId, settings);
  }

  // ── App Settings ──

  getAppSetting(key: string): AppSettingRow | undefined {
    return this.q.getAppSetting(key) as AppSettingRow | undefined;
  }

  setAppSetting(key: string, value: string): void {
    this.q.setAppSetting(key, value);
  }

  deleteAppSetting(key: string): MutationResult {
    return this.q.deleteAppSetting(key);
  }

  // ── Chat Messages ──

  listChatMessages(sessionId: string): ChatMessageRow[] {
    return this.q.listChatMessages(sessionId) as unknown as ChatMessageRow[];
  }

  insertChatMessage(msg: ChatMessageRow): MutationResult {
    return this.q.insertChatMessage(msg as any);
  }

  deleteChatSession(sessionId: string): MutationResult {
    return this.q.deleteChatSession(sessionId);
  }

  getLatestSessionId(): { sessionId: string } | undefined {
    return this.q.getLatestSessionId();
  }

  listChatSessions(): ChatSessionInfo[] {
    const rows = this.q.listChatSessions();
    return rows.map((row) => {
      // Derive title from first user message or stored override
      const override = this.q.getAppSetting(`chat_session_title:${row.sessionId}`);
      let title = override?.value ?? "";
      if (!title) {
        const firstMsg = this.q.getFirstUserMessage(row.sessionId);
        title = firstMsg?.content?.slice(0, 40) ?? "New chat";
      }
      return {
        sessionId: row.sessionId,
        title,
        createdAt: row.createdAt ?? new Date().toISOString(),
        messageCount: row.messageCount,
      };
    });
  }

  renameChatSession(sessionId: string, title: string): void {
    this.q.setAppSetting(`chat_session_title:${sessionId}`, title);
  }

  // ── Plugin Permissions ──

  getPluginPermissions(pluginId: string): string[] | null {
    return this.q.getPluginPermissions(pluginId);
  }

  setPluginPermissions(pluginId: string, permissions: string[]): void {
    this.q.setPluginPermissions(pluginId, permissions);
  }

  deletePluginPermissions(pluginId: string): MutationResult {
    return this.q.deletePluginPermissions(pluginId);
  }

  // ── Task Templates ──

  listTemplates(): TemplateRow[] {
    return this.q.listTemplates() as unknown as TemplateRow[];
  }

  getTemplate(id: string): TemplateRow | undefined {
    return this.q.getTemplate(id) as TemplateRow | undefined;
  }

  insertTemplate(template: TemplateRow): MutationResult {
    return this.q.insertTemplate(template as any);
  }

  updateTemplate(id: string, data: Partial<TemplateRow>): MutationResult {
    return this.q.updateTemplate(id, data as any);
  }

  deleteTemplate(id: string): MutationResult {
    return this.q.deleteTemplate(id);
  }

  // ── Sections ──

  listSections(projectId: string): SectionRow[] {
    return this.q.listSections(projectId) as unknown as SectionRow[];
  }

  getSection(id: string): SectionRow | undefined {
    return this.q.getSection(id) as SectionRow | undefined;
  }

  insertSection(section: SectionRow): MutationResult {
    return this.q.insertSection(section as any);
  }

  updateSection(id: string, data: Partial<SectionRow>): MutationResult {
    return this.q.updateSection(id, data as any);
  }

  deleteSection(id: string): MutationResult {
    return this.q.deleteSection(id);
  }

  // ── Task Comments ──

  listTaskComments(taskId: string): TaskCommentRow[] {
    return this.q.listTaskComments(taskId) as unknown as TaskCommentRow[];
  }

  insertTaskComment(comment: TaskCommentRow): MutationResult {
    return this.q.insertTaskComment(comment as any);
  }

  updateTaskComment(id: string, data: Partial<TaskCommentRow>): MutationResult {
    return this.q.updateTaskComment(id, data as any);
  }

  deleteTaskComment(id: string): MutationResult {
    return this.q.deleteTaskComment(id);
  }

  // ── Task Activity ──

  listTaskActivity(taskId: string): TaskActivityRow[] {
    return this.q.listTaskActivity(taskId) as unknown as TaskActivityRow[];
  }

  insertTaskActivity(activity: TaskActivityRow): MutationResult {
    return this.q.insertTaskActivity(activity as any);
  }

  // ── Daily Stats ──

  getDailyStat(date: string): DailyStatRow | undefined {
    return this.q.getDailyStat(date) as DailyStatRow | undefined;
  }

  upsertDailyStat(stat: DailyStatRow): MutationResult {
    return this.q.upsertDailyStat(stat as any);
  }

  listDailyStats(startDate: string, endDate: string): DailyStatRow[] {
    return this.q.listDailyStats(startDate, endDate) as unknown as DailyStatRow[];
  }

  // ── Task Relations ──

  listTaskRelations(): TaskRelationRow[] {
    return this.q.listTaskRelations() as unknown as TaskRelationRow[];
  }

  getTaskRelations(taskId: string): TaskRelationRow[] {
    return this.q.getTaskRelations(taskId) as unknown as TaskRelationRow[];
  }

  insertTaskRelation(relation: TaskRelationRow): MutationResult {
    return this.q.insertTaskRelation(relation as any);
  }

  deleteTaskRelation(taskId: string, relatedTaskId: string): MutationResult {
    return this.q.deleteTaskRelation(taskId, relatedTaskId);
  }

  deleteAllTaskRelations(taskId: string): MutationResult {
    return this.q.deleteAllTaskRelations(taskId);
  }

  // ── AI Memories ──

  listAiMemories(): AiMemoryRow[] {
    return this.q.listAiMemories() as unknown as AiMemoryRow[];
  }

  insertAiMemory(row: AiMemoryRow): void {
    this.q.insertAiMemory(row as any);
  }

  updateAiMemory(id: string, content: string, category: AiMemoryRow["category"]): void {
    this.q.updateAiMemory(id, content, category);
  }

  deleteAiMemory(id: string): MutationResult {
    return this.q.deleteAiMemory(id);
  }
}
