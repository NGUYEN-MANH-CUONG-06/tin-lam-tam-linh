const test = require("node:test");
const assert = require("node:assert/strict");
const dataset = require("../data/xin-xam/tltl-original-100-v1.json");
const { toOriginalDraftRecord } = require("../src/services/original-xam-catalog");
const { hasCompleteXamContent, isOriginalXamMetadata, markOriginalXamApproved, isPublishableXamCard } = require("../../shared/xin-xam-publication.mjs");
const { schemas } = require("../src/validators/content-editor.validator");

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
