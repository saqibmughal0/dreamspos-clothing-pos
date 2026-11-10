import { app } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";

app.listen(config.port, "0.0.0.0", () => {
  logger.info(`DreamsPOS API Server is running on port ${config.port} in ${config.env} mode.`);
  logger.info(`API Health endpoint: http://127.0.0.1:${config.port}/api/health`);
});
