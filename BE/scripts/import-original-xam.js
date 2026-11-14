const fs = require("node:fs");
const path = require("node:path");
const env = require("../src/config/env");
const { planOriginalImport, toOriginalDraftRecord } = require("../src/services/original-xam-catalog");

async function main() {
  const apply = process.argv.includes("--apply");
  const file = path.resolve(__dirname, "../data/xin-xam/tltl-original-100-v1.json");
  const dataset = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!apply) {
    const report = planOriginalImport(dataset);
    const { actions, ...summary } = report;
    const actionCounts = actions.reduce((counts, action) => ({ ...counts, [action.operation]: (counts[action.operation] || 0) + 1 }), {});
    console.log(JSON.stringify({ mode: "DRY_RUN_NO_DATABASE", ...summary, actionCounts }, null, 2));
    if (!report.importEligible) process.exitCode = 1;
    return;
  }

  const databaseUrl = process.env.DATABASE_URL || "";
  const testDatabaseUrl = process.env.TEST_DATABASE_URL || "";
  if (env.NODE_ENV !== "test" || !testDatabaseUrl || databaseUrl !== testDatabaseUrl) {
    throw new Error("Original xam import apply requires NODE_ENV=test and DATABASE_URL exactly equal to TEST_DATABASE_URL.");
  }
  const createPrismaClient = require("../src/config/create-prisma-client");
  const client = createPrismaClient(testDatabaseUrl);
  try {
    await client.$transaction(async (tx) => {
      const xamType = `${dataset.systemId}:${dataset.datasetVersion}`;
      const existing = await tx.xin_xam.findMany({ where: { xam_type: xamType }, select: { stick_number: true, editorial_metadata: true } });
      const existingByNumber = new Map(existing.map((record) => [record.stick_number, { fingerprint: record.editorial_metadata?.fingerprint }]));
      const report = planOriginalImport(dataset, existingByNumber);
      if (!report.importEligible) throw new Error(`Original xam import rejected: ${report.errors.join("; ")}`);
      for (const row of dataset.records) {
        if (existingByNumber.has(row.id)) continue;
        await tx.xin_xam.create({ data: toOriginalDraftRecord(row, dataset) });
      }
    });
    console.log("Test-only original xam drafts imported.");
  } finally {
    await client.$disconnect();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
