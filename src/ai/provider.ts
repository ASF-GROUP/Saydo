/**
 * Provider setup and default registry factory.
 * Creates the LLMProviderRegistry with all built-in providers registered.
 */

import { LLMProviderRegistry } from "./provider/registry.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("ai-provider");
import { openaiPlugin } from "./provider/adapters/openai.js";
import { anthropicPlugin } from "./provider/adapters/anthropic.js";
import { openrouterPlugin } from "./provider/adapters/openrouter.js";
import { ollamaPlugin } from "./provider/adapters/ollama.js";
import { lmstudioPlugin } from "./provider/adapters/lmstudio.js";
import { deepseekPlugin } from "./provider/adapters/deepseek.js";
import { geminiPlugin } from "./provider/adapters/gemini.js";
import { mistralPlugin } from "./provider/adapters/mistral.js";
import { kimiPlugin } from "./provider/adapters/kimi.js";
import { dashscopePlugin } from "./provider/adapters/dashscope.js";
import { groqPlugin } from "./provider/adapters/groq.js";
import { zaiPlugin } from "./provider/adapters/zai.js";
import { ToolRegistry } from "./tools/registry.js";
import { registerTaskCrudTools } from "./tools/builtin/task-crud.js";
import { registerQueryTasksTool } from "./tools/builtin/query-tasks.js";
import { registerAnalyzePatternsTool } from "./tools/builtin/analyze-patterns.js";
import {
  registerAnalyzeWorkloadTool,
  registerCheckOvercommitmentTool,
} from "./tools/builtin/analyze-workload.js";
import {
  registerSmartOrganizeTools,
  registerCheckDuplicatesTool,
} from "./tools/builtin/smart-organize.js";
import { registerEnergyRecommendationsTool } from "./tools/builtin/energy-recommendations.js";
import { registerProjectCrudTools } from "./tools/builtin/project-crud.js";
import { registerReminderTools } from "./tools/builtin/reminder-tools.js";
import { registerTaskBreakdownTool } from "./tools/builtin/task-breakdown.js";
import { registerTagCrudTools } from "./tools/builtin/tag-crud.js";
import { registerPlanMyDayTool, registerDailyReviewTool } from "./tools/builtin/daily-planning.js";
import { registerProductivityStatsTool } from "./tools/builtin/productivity-stats.js";
import { registerMemoryTools } from "./tools/builtin/memory-tools.js";
import { registerBulkOperationTools } from "./tools/builtin/bulk-operations.js";
import { registerTimeEstimationTools } from "./tools/builtin/time-estimation.js";
import { registerWeeklyReviewTool } from "./tools/builtin/weekly-review.js";
import { registerExtractTasksFromTextTool } from "./tools/builtin/extract-tasks-from-text.js";

/** Create a provider registry with all built-in providers. */
export function createDefaultRegistry(): LLMProviderRegistry {
  const registry = new LLMProviderRegistry();
  registry.register(openaiPlugin);
  registry.register(anthropicPlugin);
  registry.register(openrouterPlugin);
  registry.register(ollamaPlugin);
  registry.register(lmstudioPlugin);
  registry.register(deepseekPlugin);
  registry.register(geminiPlugin);
  registry.register(mistralPlugin);
  registry.register(kimiPlugin);
  registry.register(dashscopePlugin);
  registry.register(groqPlugin);
  registry.register(zaiPlugin);
  logger.info("LLM provider registry initialized", { providers: 12 });
  return registry;
}

/** Create a tool registry with all built-in tools. */
export function createDefaultToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  registerTaskCrudTools(registry);
  registerQueryTasksTool(registry);
  registerProjectCrudTools(registry);
  registerReminderTools(registry);
  registerAnalyzePatternsTool(registry);
  registerAnalyzeWorkloadTool(registry);
  registerCheckOvercommitmentTool(registry);
  registerSmartOrganizeTools(registry);
  registerCheckDuplicatesTool(registry);
  registerEnergyRecommendationsTool(registry);
  registerTaskBreakdownTool(registry);
  registerTagCrudTools(registry);
  registerPlanMyDayTool(registry);
  registerDailyReviewTool(registry);
  registerProductivityStatsTool(registry);
  registerMemoryTools(registry);
  registerBulkOperationTools(registry);
  registerTimeEstimationTools(registry);
  registerWeeklyReviewTool(registry);
  registerExtractTasksFromTextTool(registry);
  logger.info("Tool registry initialized", { tools: registry.size });
  return registry;
}
