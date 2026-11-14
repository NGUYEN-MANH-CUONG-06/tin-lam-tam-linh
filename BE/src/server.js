const app = require("./app");
const env = require("./config/env");
const prisma = require("./config/prisma");
const logger = require("./utils/logger");

let server;
// Trigger nodemon reload: 2026-10-13
async function start() {
  if (env.TLTL_DEMO_AUTO_PUBLISH) {
    logger.info("Starting stateless demo mode without a database connection");
  } else {
    await prisma.$queryRaw`SELECT 1`;
  }
  server = app.listen(env.PORT, () => {
    logger.info(`API listening on port ${env.PORT}`);
  });
}

async function shutdown(signal) {
  logger.info(`Received ${signal}; shutting down`);
  if (server) await new Promise((resolve) => server.close(resolve));
  await prisma.$disconnect();
  process.exit(0);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

start().catch(async (error) => {
  logger.error("Server failed to start", { message: error.message, stack: error.stack });
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
