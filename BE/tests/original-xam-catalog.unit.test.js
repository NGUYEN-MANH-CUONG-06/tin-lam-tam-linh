const test = require("node:test");
const assert = require("node:assert/strict");
const dataset = require("../data/xin-xam/tltl-original-100-v1.json");
const { validateOriginalCatalog, planOriginalImport, toOriginalDraftRecord, fingerprint } = require("../src/services/original-xam-catalog");
const { selectUniformXamCard } = require("../src/services/xin-xam-algorithm");

test("original Xin Xam dataset has 100 distinct, complete four-line drafts", () => {
  const report = validateOriginalCatalog(dataset);
  assert.equal(report.valid, true, report.errors.join("; "));
  assert.equal(report.coverage, "100/100");
  assert.equal(report.uniqueTitles, 100);
  assert.equal(report.uniquePoems, 100);
  assert.equal(report.uniquePoemLines, 400);
  assert.deepEqual({ ...report.grades }, { "THUẬN": 41, "BÌNH": 34, "CẨN TRỌNG": 25 });
  assert.ok(dataset.records.every((row) => row.contentType === "ORIGINAL" && row.reviewStatus === "DRAFT"));
  assert.equal(dataset.authorship.humanApproved, false);
});

test("validator rejects duplicate IDs, poems, lines and missing meaning", () => {
  const broken = structuredClone(dataset);
  broken.records[1].id = broken.records[0].id;
  broken.records[1].poem = broken.records[0].poem;
  broken.records[2].centralMeaning = "";
  const report = validateOriginalCatalog(broken);
  assert.equal(report.valid, false);
  assert.ok(report.errors.some((error) => error.includes("id is duplicated")));
  assert.ok(report.errors.some((error) => error.includes("poem duplicates")));
  assert.ok(report.errors.some((error) => error.includes("centralMeaning is required")));
});

test("draft import is idempotent, versioned and never publishable by default", () => {
  const report = planOriginalImport(dataset);
  assert.equal(report.importEligible, true);
  assert.equal(report.actions.length, 100);
  const first = dataset.records[0];
  const existing = new Map([[first.id, { fingerprint: fingerprint(first) }]]);
  assert.equal(planOriginalImport(dataset, existing).actions[0].operation, "NOOP");
  existing.set(first.id, { fingerprint: "changed" });
  assert.equal(planOriginalImport(dataset, existing).importEligible, false);

  const draft = toOriginalDraftRecord(first, dataset);
  assert.equal(draft.xam_type, "TLTL_ORIGINAL_100_V1:1.0.1-draft");
  assert.equal(draft.editorial_status, "DRAFT");
  assert.equal(draft.active, false);
  assert.equal(draft.verified, false);
  assert.equal(draft.source, null);
  assert.equal(draft.editorial_metadata.reviewStatus, "DRAFT");
});

test("approved catalog draw path remains uniform across all 100 cards", () => {
  const cards = dataset.records.map((row) => ({ id: `card-${row.id}`, stick_number: row.id }));
  const chosen = new Set();
  for (let index = 0; index < 100; index += 1) {
    const card = selectUniformXamCard(cards, (exclusiveMax) => {
      assert.equal(exclusiveMax, 100);
      return index;
    });
    chosen.add(card.stick_number);
  }
  assert.equal(chosen.size, 100);
});
