const test = require("node:test");
const assert = require("node:assert/strict");
const repository = require("../src/repositories/xin-xam.repository");
const { listXamCatalogForRequest } = require("../src/services/reflection.service");

test("configured original catalog draws from the exact full system pool, independent of topic", async (context) => {
  const originalList = repository.listCatalog;
  const originalUnified = repository.listUnifiedCatalog;
  const cards = Array.from({ length: 100 }, (_, index) => ({ stick_number: index + 1 }));
  const calls = [];
  repository.listCatalog = async (...args) => { calls.push(["exact", ...args]); return cards; };
  repository.listUnifiedCatalog = async (...args) => { calls.push(["unified", ...args]); return []; };
  context.after(() => {
    repository.listCatalog = originalList;
    repository.listUnifiedCatalog = originalUnified;
  });

  const first = await listXamCatalogForRequest({ region: "Toàn quốc", topic: "Gia đình" }, "NATIONWIDE", "TLTL_ORIGINAL_100_V1:1.0.1-draft");
  const second = await listXamCatalogForRequest({ region: "Toàn quốc", topic: "Công việc" }, "NATIONWIDE", "TLTL_ORIGINAL_100_V1:1.0.1-draft");
  assert.equal(first.length, 100);
  assert.equal(second.length, 100);
  assert.deepEqual(calls, [
    ["exact", "TLTL_ORIGINAL_100_V1:1.0.1-draft", "NATIONWIDE"],
    ["exact", "TLTL_ORIGINAL_100_V1:1.0.1-draft", "NATIONWIDE"],
  ]);
});

test("unset catalog routing preserves existing topic pools and regional behavior", async (context) => {
  const originalList = repository.listCatalog;
  const originalUnified = repository.listUnifiedCatalog;
  const calls = [];
  repository.listCatalog = async (...args) => { calls.push(["exact", ...args]); return []; };
  repository.listUnifiedCatalog = async (...args) => { calls.push(["unified", ...args]); return []; };
  context.after(() => {
    repository.listCatalog = originalList;
    repository.listUnifiedCatalog = originalUnified;
  });

  await listXamCatalogForRequest({ region: "Toàn quốc", topic: "Bình an" }, "NATIONWIDE", undefined);
  await listXamCatalogForRequest({ region: "Bắc Bộ", topic: "Công việc" }, "NORTH", "TLTL_ORIGINAL_100_V1:1.0.1-draft");
  assert.deepEqual(calls, [
    ["unified", "Bình an"],
    ["exact", "NORTH:Công việc", "NORTH"],
  ]);
});

test("original catalog stays unavailable until all 100 cards are published", async (context) => {
  const originalList = repository.listCatalog;
  repository.listCatalog = async () => Array.from({ length: 99 }, (_, index) => ({ stick_number: index + 1 }));
  context.after(() => { repository.listCatalog = originalList; });
  const cards = await listXamCatalogForRequest(
    { region: "Toàn quốc", topic: "Bình an" },
    "NATIONWIDE",
    "TLTL_ORIGINAL_100_V1:1.0.1-draft",
  );
  assert.deepEqual(cards, []);
});
