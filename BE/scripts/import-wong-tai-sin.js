const fs = require("node:fs");
const path = require("node:path");
const env = require("../src/config/env");
const { planImport, toDraftRecord } = require("../src/services/wong-tai-sin-catalog");

async function main() {
  const apply = process.argv.includes("--apply");
  const manifestArg = process.argv.find((argument) => argument.startsWith("--manifest="))?.slice("--manifest=".length);
  const manifestName = manifestArg || "wong-tai-sin-100.json";
  const dataRoot = path.resolve(__dirname, "../data/xin-xam");
  const file = path.resolve(dataRoot, manifestName);
  if (!file.startsWith(`${dataRoot}${path.sep}`)) throw new Error("Manifest must be inside BE/data/xin-xam.");
  const catalog = JSON.parse(fs.readFileSync(file, "utf8"));
  const options = { systemId: catalog.systemId, versionField: catalog.datasetVersion ? "datasetVersion" : "catalogVersion" };
  if (!apply) {
    const report = planImport(catalog, new Map(), options);
    console.log(JSON.stringify({ mode: "DRY_RUN_NO_DATABASE", ...report }, null, 2));
    if (!report.importEligible) process.exitCode = 1;
    return;
  }

  const databaseUrl = process.env.DATABASE_URL || "";
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || "";
  if (env.NODE_ENV !== "test" || !testDatabaseUrl || databaseUrl !== testDatabaseUrl) {
    throw new Error("Import apply requires NODE_ENV=test and DATABASE_URL exactly equal to TEST_DATABASE_URL.");
  }
  const createPrismaClient = require("../src/config/create-prisma-client");
  const client = createPrismaClient(testDatabaseUrl);
  try {
    await client.$transaction(async (tx) => {
      const datasetVersion = catalog.datasetVersion || catalog.catalogVersion;
      const xamType = `${catalog.systemId}:${datasetVersion}`;
      const existing = await tx.xin_xam.findMany({ where: { xam_type: xamType }, select: { stick_number: true, editorial_metadata: true } });
      const existingByNumber = new Map(existing.map((record) => [record.stick_number, { fingerprint: record.editorial_metadata?.fingerprint }]));
      const report = planImport(catalog, existingByNumber, options);
      if (!report.importEligible) throw new Error(`Import rejected: ${report.errors.join("; ")}`);
      for (const record of catalog.records) {
        if (existingByNumber.has(record.stickNumber)) continue;
        await tx.xin_xam.create({ data: toDraftRecord({ ...record, systemId: catalog.systemId, editionId: catalog.editionId, datasetVersion }) });
      }
    });
    console.log("Test-only xam draft import completed.");
  } finally {
    await client.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
