/**
 * Built-in CRUD tools for project management.
 * Registers: create_project, list_projects, get_project, update_project, delete_project
 */

import type { ToolRegistry } from "../registry.js";

export function registerProjectCrudTools(registry: ToolRegistry): void {
  registry.register(
    {
      name: "create_project",
      description:
        "Create a new project for organizing tasks. Returns the created project with its ID.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Project name (required)" },
          color: {
            type: "string",
            description:
              'Hex color code for the project (e.g. "#22c55e"). Defaults to blue.',
          },
        },
        required: ["name"],
      },
    },
    async (args, ctx) => {
      const project = await ctx.projectService.create(
        args.name as string,
        args.color as string | undefined,
      );
      return JSON.stringify({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          color: project.color,
          archived: project.archived,
        },
      });
    },
  );

  registry.register(
    {
      name: "list_projects",
      description:
        "List all projects. By default excludes archived projects unless includeArchived is true.",
      parameters: {
        type: "object",
        properties: {
          includeArchived: {
            type: "boolean",
            description: "Include archived projects (default: false)",
          },
        },
      },
    },
    async (args, ctx) => {
      const all = await ctx.projectService.list();
      const includeArchived = (args.includeArchived as boolean) ?? false;
      const projects = includeArchived
        ? all
        : all.filter((p) => !p.archived);
      return JSON.stringify({
        count: projects.length,
        projects: projects.map((p) => ({
          id: p.id,
          name: p.name,
          color: p.color,
          archived: p.archived,
        })),
      });
    },
  );

  registry.register(
    {
      name: "get_project",
      description:
        "Get a single project by ID or name. Provide either projectId or name.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "The project ID to look up",
          },
          name: {
            type: "string",
            description: "The project name to look up",
          },
        },
      },
    },
    async (args, ctx) => {
      let project = null;
      if (args.projectId) {
        project = await ctx.projectService.get(args.projectId as string);
      } else if (args.name) {
        project = await ctx.projectService.getByName(args.name as string);
      } else {
        return JSON.stringify({
          error: "Provide either projectId or name",
        });
      }
      if (!project) {
        return JSON.stringify({ error: "Project not found" });
      }
      return JSON.stringify({
        project: {
          id: project.id,
          name: project.name,
          color: project.color,
          icon: project.icon,
          archived: project.archived,
          createdAt: project.createdAt,
        },
      });
    },
  );

  registry.register(
    {
      name: "update_project",
      description:
        "Update an existing project. Can change name, color, or archived status.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "The ID of the project to update",
          },
          name: { type: "string", description: "New project name" },
          color: { type: "string", description: "New hex color code" },
          archived: {
            type: "boolean",
            description: "Set to true to archive, false to unarchive",
          },
        },
        required: ["projectId"],
      },
    },
    async (args, ctx) => {
      const { projectId, ...updates } = args;
      const project = await ctx.projectService.update(
        projectId as string,
        updates as { name?: string; color?: string; archived?: boolean },
      );
      if (!project) {
        return JSON.stringify({ error: "Project not found" });
      }
      return JSON.stringify({
        success: true,
        project: {
          id: project.id,
          name: project.name,
          color: project.color,
          archived: project.archived,
        },
      });
    },
  );

  registry.register(
    {
      name: "delete_project",
      description:
        "Permanently delete a project. Tasks assigned to this project will have their projectId set to null.",
      parameters: {
        type: "object",
        properties: {
          projectId: {
            type: "string",
            description: "The ID of the project to delete",
          },
        },
        required: ["projectId"],
      },
    },
    async (args, ctx) => {
      const deleted = await ctx.projectService.delete(
        args.projectId as string,
      );
      return JSON.stringify({ success: true, deleted });
    },
  );
}
