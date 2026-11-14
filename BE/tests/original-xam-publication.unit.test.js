const test = require("node:test");
const assert = require("node:assert/strict");
const dataset = require("../data/xin-xam/tltl-original-100-v1.json");
const { toOriginalDraftRecord } = require("../src/services/original-xam-catalog");
const { hasCompleteXamContent, isOriginalXamMetadata, markOriginalXamApproved, isPublishableXamCard } = require("../../shared/xin-xam-publication.mjs");
const { schemas } = require("../src/validators/content-editor.validator");
const { editorialContentHash } = require("../src/services/editorial-content-hash");

test("original xam follows a separate human approval path without a false external source", () => {
  const draft = toOriginalDraftRecord(dataset.records[0], dataset);
  assert.equal(draft.source, null);
  assert.equal(isOriginalXamMetadata(draft.editorial_metadata), true);
  assert.equal(hasCompleteXamContent({
    poem: draft.poem,
    interpretations: [draft.meaning, draft.advice],
    source: draft.source,
    editorial_metadata: draft.editorial_metadata,
  }), true);
  assert.equal(isPublishableXamCard({ ...draft, verified: true, active: true, editorial_status: "PUBLISHED" }), false);

  const approvedMetadata = markOriginalXamApproved(draft.editorial_metadata);
  const published = { ...draft, editorial_metadata: approvedMetadata, verified: true, active: true, editorial_status: "PUBLISHED" };
  assert.equal(approvedMetadata.reviewStatus, "APPROVED");
  assert.equal(approvedMetadata.humanApproved, true);
  assert.equal(isPublishableXamCard({ ...published, interpretations: [published.meaning, published.advice] }), true);
  assert.equal(isOriginalXamMetadata({ ...draft.editorial_metadata, systemId: "GUANYIN_100_HK_CTC" }), false);
});

test("editorial submission accepts original grade and does not require a fake source URL", () => {
  const row = dataset.records[0];
  const input = {
    editorialStatus: "IN_REVIEW",
    reviewNote: "Nội dung nguyên tác cần người duyệt xem lại.",
    expectedUpdatedAt: new Date().toISOString(),
    source: "",
    region: "NATIONWIDE",
    category: dataset.systemId,
    stick_number: row.id,
    xam_type: `${dataset.systemId}:${dataset.datasetVersion}`,
    name: row.title,
    fortune_level: row.grade,
    poem: row.poem,
    meaning: row.centralMeaning,
    advice: row.practicalAdvice.join(" "),
  };
  assert.equal(schemas.xam.safeParse(input).success, true);
  assert.equal(schemas.xam.safeParse({ ...input, xam_type: "WONG_TAI_SIN_100:1.0.0", source: "" }).success, false);
});

test("editorial edits preserve original authorship metadata and revoke prior approval", async (context) => {
  const prisma = require("../src/config/prisma");
  const repository = require("../src/repositories/content-editor.repository");
  const previousTransaction = prisma.$transaction;
  const original = toOriginalDraftRecord(dataset.records[0], dataset);
  const priorApproval = markOriginalXamApproved(original.editorial_metadata);
  const updatedAt = new Date("2026-11-01T10:00:00.000Z");
  let updateData;
  let findCount = 0;
  prisma.$transaction = async (callback) => callback({
    xin_xam: {
      findUnique: async () => {
        findCount += 1;
        return findCount === 1
          ? { id: "original-editor-id", updated_at: updatedAt, editorial_status: "DRAFT", editorial_metadata: priorApproval }
          : { id: "original-editor-id", updated_at: updatedAt, ...updateData };
      },
      updateMany: async ({ data }) => { updateData = data; return { count: 1 }; },
    },
    admin_audit_logs: { create: async () => ({ id: "audit-id" }) },
  });
  context.after(() => { prisma.$transaction = previousTransaction; });

  await repository.save("xam", "original-editor-id", "editor-id", {
    expectedUpdatedAt: updatedAt.toISOString(),
    editorialStatus: "IN_REVIEW",
    reviewNote: "Submit original poem for review",
    source: "",
    region: "NATIONWIDE",
    category: dataset.systemId,
    stick_number: original.stick_number,
    xam_type: original.xam_type,
    name: original.name,
    fortune_level: original.fortune_level,
    poem: original.poem,
    meaning: original.meaning,
    advice: original.advice,
    provenance: {},
  });
  assert.equal(updateData.editorial_metadata.systemId, dataset.systemId);
  assert.equal(updateData.editorial_metadata.reviewStatus, "DRAFT");
  assert.equal(updateData.editorial_metadata.humanApproved, false);
});

test("admin approval of original xam requires a separate rights confirmation and records approval metadata", async (context) => {
  const prisma = require("../src/config/prisma");
  const adminRepository = require("../src/repositories/admin.repository");
  const previousTransaction = prisma.$transaction;
  const draft = toOriginalDraftRecord(dataset.records[0], dataset);
  const updatedAt = new Date("2026-11-02T10:00:00.000Z");
  let updateData;
  let findCount = 0;
  prisma.$transaction = async (callback) => callback({
    xin_xam: {
      findUnique: async () => {
        findCount += 1;
        if (findCount === 1) return {
          ...draft,
          id: "original-review-id",
          updated_at: updatedAt,
          editorial_status: "IN_REVIEW",
        };
        return { id: "original-review-id", ...updateData };
      },
      updateMany: async ({ data }) => { updateData = data; return { count: 1 }; },
    },
    admin_audit_logs: {
      findFirst: async () => ({ actor_id: "different-editor" }),
      create: async () => ({ id: "review-audit-id" }),
    },
  });
  context.after(() => { prisma.$transaction = previousTransaction; });

  const result = await adminRepository.updateReview({
    model: "xin_xam",
    id: "original-review-id",
    actorId: "reviewer-id",
    patch: { verified: true, active: false },
    expectedUpdatedAt: updatedAt.toISOString(),
    reviewNote: "Reviewed original text and ownership basis",
    rightsConfirmed: true,
  });
  assert.equal(result.updated.verified, true);
  assert.equal(result.updated.editorial_status, "APPROVED");
  assert.equal(updateData.editorial_metadata.reviewStatus, "APPROVED");
  assert.equal(updateData.editorial_metadata.humanApproved, true);
  assert.equal(updateData.source, undefined);
});

test("catalog publication requires all 100 individually approved current versions", async (context) => {
  const prisma = require("../src/config/prisma");
  const repository = require("../src/repositories/admin.repository");
  const previousTransaction = prisma.$transaction;
  const cards = dataset.records.map((row) => ({
    ...toOriginalDraftRecord(row, dataset),
    id: `id-${row.id}`,
    editorial_metadata: markOriginalXamApproved(toOriginalDraftRecord(row, dataset).editorial_metadata),
    editorial_status: "APPROVED",
    verified: true,
    active: false,
    updated_at: new Date("2026-11-03T10:00:00.000Z"),
  }));
  const audit = cards.map((card) => ({ target_id: card.id, details: { after: { verified: true }, approvedContentHash: editorialContentHash(card) } }));
  let publicationUpdates = 0;
  let catalogAudit = null;
  prisma.$transaction = async (callback) => callback({
    xin_xam: {
      findMany: async () => cards,
      updateMany: async () => { publicationUpdates += 1; return { count: 1 }; },
    },
    admin_audit_logs: {
      findMany: async () => audit,
      create: async ({ data }) => { catalogAudit = data; return { id: "audit-id" }; },
    },
  });
  context.after(() => { prisma.$transaction = previousTransaction; });

  const result = await repository.publishOriginalXamCatalog({ actorId: "reviewer-id", reviewNote: "Explicit catalog release confirmation" });
  assert.deepEqual(result, { published: true, systemId: dataset.systemId, datasetVersion: dataset.datasetVersion, count: 100 });
  assert.equal(publicationUpdates, 100);
  assert.equal(catalogAudit.action, "XAM_CATALOG_PUBLISHED");
  assert.equal(catalogAudit.target_type, "xin_xam_catalog");
  assert.equal(catalogAudit.target_id, cards[0].id);
});

test("catalog publication refuses incomplete or unapproved catalog records", async (context) => {
  const prisma = require("../src/config/prisma");
  const repository = require("../src/repositories/admin.repository");
  const previousTransaction = prisma.$transaction;
  const cards = dataset.records.slice(0, 99).map((row) => ({ ...toOriginalDraftRecord(row, dataset), id: `id-${row.id}` }));
  prisma.$transaction = async (callback) => callback({ xin_xam: { findMany: async () => cards } });
  context.after(() => { prisma.$transaction = previousTransaction; });
  assert.deepEqual(await repository.publishOriginalXamCatalog({ actorId: "reviewer-id", reviewNote: "Explicit catalog release confirmation" }), { catalogIncomplete: true, count: 99 });
});

test("an original xam card cannot bypass its catalog release with individual publication", async (context) => {
  const prisma = require("../src/config/prisma");
  const repository = require("../src/repositories/admin.repository");
  const previousTransaction = prisma.$transaction;
  const card = toOriginalDraftRecord(dataset.records[0], dataset);
  const updatedAt = new Date("2026-11-04T10:00:00.000Z");
  prisma.$transaction = async (callback) => callback({ xin_xam: { findUnique: async () => ({ ...card, id: "card-id", updated_at: updatedAt, editorial_status: "APPROVED", verified: true, active: false }) } });
  context.after(() => { prisma.$transaction = previousTransaction; });
  const result = await repository.updateReview({
    model: "xin_xam", id: "card-id", actorId: "admin-id", patch: { active: true },
    expectedUpdatedAt: updatedAt.toISOString(), reviewNote: "Publish approved original card",
  });
  assert.deepEqual(result, { catalogPublicationRequired: true });
});
