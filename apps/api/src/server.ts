import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { app } from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";
import { prisma } from "@dreamspos/database";

async function runMigrationsIfPossible(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    logger.warn("No DATABASE_URL set. Skipping automatic migrations.");
    return;
  }

  try {
    const rootDir = path.resolve(__dirname, "../../..");
    const schemaCandidates = [
      path.resolve(rootDir, "database/prisma/schema.prisma"),
      path.resolve(process.cwd(), "database/prisma/schema.prisma"),
      path.resolve(process.cwd(), "prisma/schema.prisma")
    ];

    const schemaPath = schemaCandidates.find((p) => fs.existsSync(p));
    if (!schemaPath) {
      logger.warn("Prisma schema file not found. Skipping automatic migration.");
      return;
    }

    logger.info(`Checking Prisma database migrations using schema: ${schemaPath}`);

    let prismaCli: string | null = null;
    const cliCandidates = [
      path.resolve(rootDir, "database/node_modules/prisma/build/index.js"),
      path.resolve(rootDir, "node_modules/prisma/build/index.js")
    ];
    for (const c of cliCandidates) {
      if (fs.existsSync(c)) {
        prismaCli = c;
        break;
      }
    }

    if (!prismaCli) {
      try {
        prismaCli = require.resolve("prisma/build/index.js", {
          paths: [path.resolve(rootDir, "database"), rootDir, process.cwd()]
        });
      } catch {
        // Fall back to npx
      }
    }

    const migrateCmd = prismaCli
      ? `"${process.execPath}" "${prismaCli}" migrate deploy --schema="${schemaPath}"`
      : `npx prisma migrate deploy --schema="${schemaPath}"`;

    logger.info(`Executing migration deploy: ${migrateCmd}`);
    const output = execSync(migrateCmd, {
      env: process.env,
      stdio: "pipe",
      encoding: "utf-8"
    });
    logger.info(`Prisma migration completed successfully:\n${output.trim()}`);
  } catch (err: any) {
    logger.error(`Database migration notice: ${err.message || err}`);
    if (err.stdout) logger.info(`Migration stdout: ${err.stdout}`);
    if (err.stderr) logger.warn(`Migration stderr: ${err.stderr}`);
  }
}

async function startServer() {
  await runMigrationsIfPossible();

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
}

startServer();
