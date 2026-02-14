import type { TaskTemplate, CreateTemplateInput, UpdateTemplateInput } from "./types.js";
import type { IStorage, TemplateRow } from "../storage/interface.js";
import type { TaskService } from "./tasks.js";
import { generateId } from "../utils/ids.js";
import { NotFoundError } from "./errors.js";

/**
 * TemplateService — manages reusable task templates with {{variable}} substitution.
 */
export class TemplateService {
  constructor(
    private storage: IStorage,
    private taskService: TaskService,
  ) {}

  async create(input: CreateTemplateInput): Promise<TaskTemplate> {
    const now = new Date().toISOString();
    const id = generateId();

    const row: TemplateRow = {
      id,
      name: input.name,
      title: input.title,
      description: input.description ?? null,
      priority: input.priority ?? null,
      tags: JSON.stringify(input.tags ?? []),
      projectId: input.projectId ?? null,
      recurrence: input.recurrence ?? null,
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    };

    this.storage.insertTemplate(row);

    return this.rowToTemplate(row);
  }

  async list(): Promise<TaskTemplate[]> {
    const rows = this.storage.listTemplates();
    return rows.map((r) => this.rowToTemplate(r));
  }

  async get(id: string): Promise<TaskTemplate | null> {
    const row = this.storage.getTemplate(id);
    return row ? this.rowToTemplate(row) : null;
  }

  async update(id: string, input: UpdateTemplateInput): Promise<TaskTemplate> {
    const existing = this.storage.getTemplate(id);
    if (!existing) throw new NotFoundError("Template", id);

    const now = new Date().toISOString();
    const data: Partial<TemplateRow> = { updatedAt: now };

    if (input.name !== undefined) data.name = input.name;
    if (input.title !== undefined) data.title = input.title;
    if (input.description !== undefined) data.description = input.description ?? null;
    if (input.priority !== undefined) data.priority = input.priority ?? null;
    if (input.tags !== undefined) data.tags = JSON.stringify(input.tags);
    if (input.projectId !== undefined) data.projectId = input.projectId ?? null;
    if (input.recurrence !== undefined) data.recurrence = input.recurrence ?? null;

    this.storage.updateTemplate(id, data);

    const updated = this.storage.getTemplate(id)!;
    return this.rowToTemplate(updated);
  }

  async delete(id: string): Promise<boolean> {
    const result = this.storage.deleteTemplate(id);
    return result.changes > 0;
  }

  /**
   * Instantiate a template: create a task from a template with variable substitution.
   * Variables in title/description use {{name}} syntax.
   */
  async instantiate(
    templateId: string,
    variables?: Record<string, string>,
  ): Promise<ReturnType<TaskService["create"]>> {
    const template = await this.get(templateId);
    if (!template) throw new NotFoundError("Template", templateId);

    let title = template.title;
    let description = template.description;

    // Replace {{variable}} placeholders
    if (variables) {
      for (const [key, value] of Object.entries(variables)) {
        const pattern = new RegExp(`\\{\\{${key}\\}\\}`, "g");
        title = title.replace(pattern, value);
        if (description) {
          description = description.replace(pattern, value);
        }
      }
    }

    return this.taskService.create({
      title,
      description,
      priority: template.priority,
      tags: template.tags,
      projectId: template.projectId,
      recurrence: template.recurrence,
      dueTime: false,
    });
  }

  private rowToTemplate(row: TemplateRow): TaskTemplate {
    return {
      id: row.id,
      name: row.name,
      title: row.title,
      description: row.description,
      priority: row.priority,
      tags: row.tags ? JSON.parse(row.tags) : [],
      projectId: row.projectId,
      recurrence: row.recurrence,
      sortOrder: row.sortOrder,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }
}
