import { loadEnv } from "./config/env.js";
import { createLogger } from "./utils/logger.js";
import { bootstrap } from "./bootstrap.js";

const env = loadEnv();
const logger = createLogger(env.LOG_LEVEL);

logger.info("ASF Docket starting...");

const services = bootstrap();

logger.info("Database initialized, services ready.");

// Load plugins — failures don't crash the app
try {
  await services.pluginLoader.loadAll();
  const loaded = services.pluginLoader.getAll().filter((p) => p.enabled);
  logger.info(`Plugins loaded: ${loaded.length}`);
} catch (err) {
  logger.error(`Plugin loading failed: ${err instanceof Error ? err.message : err}`);
}

// TODO: Start UI or CLI based on context

export { env, logger, services };
