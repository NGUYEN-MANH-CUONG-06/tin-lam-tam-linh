const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const fs = require("node:fs");
const path = require("node:path");
const { X509Certificate } = require("node:crypto");
const env = require("./env");

function createPrismaClient(connectionString = env.DATABASE_URL) {
  const databaseUrl = new URL(connectionString);
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(databaseUrl.hostname);
  let ssl;
  if (env.DATABASE_SSL_ROOT_CERT) {
    const certificatePath = path.isAbsolute(env.DATABASE_SSL_ROOT_CERT)
      ? env.DATABASE_SSL_ROOT_CERT
      : path.resolve(__dirname, "../../", env.DATABASE_SSL_ROOT_CERT);
    const ca = fs.readFileSync(certificatePath);
    const certificate = new X509Certificate(ca);
    const now = Date.now();
    if (!certificate.ca || now < Date.parse(certificate.validFrom) || now > Date.parse(certificate.validTo)) {
      throw new Error("DATABASE_SSL_ROOT_CERT must be a valid, current CA certificate.");
    }
    ssl = { ca, rejectUnauthorized: true };
  } else if (!localHost && !(databaseUrl.searchParams.get("sslmode") === "verify-full" && databaseUrl.searchParams.has("sslrootcert"))) {
    throw new Error("Remote PostgreSQL requires a CA certificate and hostname verification.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString, ...(ssl ? { ssl } : {}) }) });
}

module.exports = createPrismaClient;
