import { app } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";
import { prisma } from "@dreamspos/database";

const server = app.listen(config.port, "0.0.0.0", () => {
  logger.info(`DreamsPOS API Server is running on port ${config.port} in ${config.env} mode.`);
  logger.info(`API Health endpoint: http://0.0.0.0:${config.port}/api/health`);
  if (config.env === "production" && config.jwt.secret.includes("default")) {
    logger.warn("WARNING: JWT_SECRET appears to use a default development value. Please ensure a strong JWT_SECRET is configured in production environment variables.");
  }
});

const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Gracefully shutting down DreamsPOS API Server...`);
  server.close(async () => {
    try {
      await prisma.$disconnect();
      logger.info("Database connection closed. Process exiting.");
      process.exit(0);
    } catch (err) {
      logger.error("Error during shutdown database disconnect:", err);
      process.exit(1);
    }
  });
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));
