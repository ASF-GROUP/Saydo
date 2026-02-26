/**
 * ToolContext factory — extracts services from AppServices
 * to create a ToolContext for tool execution.
 */

import type { AppServices } from "../bootstrap.js";
import type { ToolContext } from "../ai/tools/types.js";

/** Build a ToolContext from the bootstrapped AppServices. */
export function createToolContext(services: AppServices): ToolContext {
  return {
    taskService: services.taskService,
    projectService: services.projectService,
    tagService: services.tagService,
    statsService: services.statsService,
  };
}
