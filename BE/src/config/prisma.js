const env = require("./env");
const createPrismaClient = require("./create-prisma-client");

const globalKey = "__tinLamTamLinhPrisma";
const prisma = globalThis[globalKey] || createPrismaClient(env.DATABASE_URL);

if (env.NODE_ENV !== "production") globalThis[globalKey] = prisma;

module.exports = prisma;
