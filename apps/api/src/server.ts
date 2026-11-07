import { app } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";

app.listen(config.port, () => {
  logger.info(`DreamsPOS API Server is running on port ${config.port} in ${config.env} mode.`);
  logger.info(`API Health endpoint: http://localhost:${config.port}/api/health`);
});
