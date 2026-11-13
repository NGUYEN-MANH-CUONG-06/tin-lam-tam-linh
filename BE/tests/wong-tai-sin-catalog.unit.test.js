const test = require("node:test");
const assert = require("node:assert/strict");
const { GRADE_COUNTS, SYSTEM_ID, validateCatalog, planImport, toDraftRecord } = require("../src/services/wong-tai-sin-catalog");

function verifiedFixture() {
  const grades = Object.entries(GRADE_COUNTS).flatMap(([grade, count]) => Array(count).fill(grade));
  return { systemId: SYSTEM_ID, catalogVersion: "test-1", expectedCount: 100, records: grades.map((grade, index) => ({
    systemId: SYSTEM_ID, catalogVersion: "test-1", stickNumber: index + 1, title: `Fixture ${index + 1}`,
    poem: `Synthetic test poem ${index + 1}`, grade, fingerprint: index.toString(16).padStart(64, "0"),
    verificationStatus: "VERIFIED", rightsStatus: "CLEARED", rightsEvidence: "fixture-only authorization",
    provenance: { sources: [{ url: `https://fixture.invalid/${index + 1}`, verified: true }] },
  })) };
}

test("empty research manifest is explicitly not production importable", () => {
  const manifest = require("../data/xin-xam/wong-tai-sin-100.json");
  const report = validateCatalog(manifest);
  assert.equal(report.importEligible, false);
  assert.equal(report.coverage, "0/100");
  assert.deepEqual(planImport(manifest).actions, []);
});

test("complete fixture validates exact IDs, provenance, rights and grade totals", () => {
  const report = validateCatalog(verifiedFixture());
  assert.equal(report.valid, true, report.errors.join("; "));
  assert.equal(report.coverage, "100/100");
});

test("catalog rejects duplicate IDs, unverified sources and uncleared rights", () => {
  const catalog = verifiedFixture();
  catalog.records[1].stickNumber = 1;
  catalog.records[2].provenance.sources[0].verified = false;
  catalog.records[3].rightsStatus = "NEEDS_PERMISSION";
  const report = validateCatalog(catalog);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("duplicated")));
  assert.ok(report.errors.some((error) => error.includes("not verified")));
  assert.ok(report.errors.some((error) => error.includes("rights clearance")));
});

test("import planning is idempotent and fails closed on changed records", () => {
  const catalog = verifiedFixture();
  const existing = new Map([[1, { fingerprint: catalog.records[0].fingerprint }]]);
  const plan = planImport(catalog, existing);
  assert.equal(plan.importEligible, true);
  assert.equal(plan.actions[0].operation, "NOOP");
  assert.equal(plan.actions[1].operation, "CREATE_DRAFT");
  existing.set(2, { fingerprint: "different" });
  assert.equal(planImport(catalog, existing).importEligible, false);
});

test("Guanyin CTC research manifest reports coverage but remains blocked from import", () => {
  const manifest = require("../data/xin-xam/guanyin-100-hk-ctc.json");
  const options = { systemId: manifest.systemId, versionField: "datasetVersion" };
  const report = validateCatalog(manifest, options);
  assert.equal(report.coverage, "0/100");
  assert.equal(report.importEligible, false);
  assert.deepEqual(planImport(manifest, new Map(), options).actions, []);
});

test("generic catalog import preserves system and dataset version in draft metadata", () => {
  const systemId = "GUANYIN_100_HK_CTC";
  const datasetVersion = "test-edition-1";
  const grades = [...Array(34).fill("上籤"), ...Array(46).fill("中籤"), ...Array(20).fill("下籤")];
  const catalog = {
    systemId, editionId: "CTC_HONG_KONG_CURRENT", datasetVersion, expectedCount: 100,
    records: grades.map((grade, index) => ({
      systemId, editionId: "CTC_HONG_KONG_CURRENT", datasetVersion, stickNumber: index + 1,
      title: `Synthetic fixture ${index + 1}`, poem: `Synthetic poem ${index + 1}`, grade,
      fingerprint: index.toString(16).padStart(64, "0"), verificationStatus: "VERIFIED",
      rightsStatus: "LICENSED", rightsEvidence: "fixture only",
      provenance: { sources: [{ url: `https://fixture.invalid/${index + 1}`, verified: true }] },
    })),
  };
  const options = { systemId, versionField: "datasetVersion" };
  assert.equal(validateCatalog(catalog, options).importEligible, true);
  const record = toDraftRecord(catalog.records[0]);
  assert.equal(record.xam_type, `${systemId}:${datasetVersion}`);
  assert.equal(record.editorial_metadata.editionId, "CTC_HONG_KONG_CURRENT");
  assert.equal(record.active, false);
  assert.equal(record.verified, false);
});

test("Wong Tai Sin draft mapping does not persist undefined edition metadata", () => {
  const record = toDraftRecord(verifiedFixture().records[0]);
  assert.equal(record.xam_type, `${SYSTEM_ID}:test-1`);
  assert.equal(Object.hasOwn(record.editorial_metadata, "editionId"), false);
});
