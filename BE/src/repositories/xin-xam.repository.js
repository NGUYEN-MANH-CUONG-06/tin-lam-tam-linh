const prisma = require("../config/prisma");
const { isPublishableXamCard } = require("../../../shared/xin-xam-publication.mjs");

function isPublishedDraw(draw) {
  return draw?.xin_xam && isPublishableXamCard({
    ...draw.xin_xam,
    interpretations: [draw.xin_xam.meaning, draw.xin_xam.advice],
  });
}

async function attachReviewMetadata(items, client = prisma) {
  const records = Array.isArray(items) ? items : [items];
  const ids = [...new Set(records.map((item) => item?.xin_xam?.id).filter(Boolean))];
  if (ids.length === 0) return items;

  const reviews = await client.admin_audit_logs.findMany({
    where: { target_type: "xin_xam", target_id: { in: ids }, action: "CONTENT_REVIEW_UPDATED" },
    orderBy: { created_at: "desc" },
    select: { target_id: true, details: true, created_at: true, users: { select: { full_name: true } } },
  });
  const latestReview = new Map();
  for (const review of reviews) {
    if (latestReview.has(review.target_id)) continue;
    if (review.details?.after?.verified !== true) {
      latestReview.set(review.target_id, null);
      continue;
    }
    // A later visibility-only change preserves an earlier rights approval.
    // A fresh transition from unverified to verified must carry its own check.
    if (review.details?.rightsConfirmed !== true && review.details?.before?.verified === true) continue;
    const approved = review.details?.rightsConfirmed === true;
    latestReview.set(review.target_id, approved ? {
      reviewedBy: review.users?.full_name || undefined,
      reviewedOn: review.created_at.toISOString().slice(0, 10),
      reviewNote: typeof review.details?.reviewNote === "string" ? review.details.reviewNote : undefined,
    } : null);
  }

  for (const item of records) {
    if (!item?.xin_xam) continue;
    item.xin_xam.reviewMetadata = latestReview.get(item.xin_xam.id) || null;
    // Treat the verified flag as publishable only when the latest admin approval
    // explicitly records a rights review. This also blocks legacy approvals.
    item.xin_xam.verified = item.xin_xam.verified === true && Boolean(item.xin_xam.reviewMetadata);
  }
  return items;
}

async function findCatalog(xamType, stickNumber, client = prisma) {
  const card = await client.xin_xam.findUnique({ where: { xam_type_stick_number: { xam_type: xamType, stick_number: stickNumber } } });
  const [withReview] = await attachReviewMetadata([{ xin_xam: card }], client);
  if (!isPublishableXamCard({ ...withReview?.xin_xam, interpretations: [withReview?.xin_xam?.meaning, withReview?.xin_xam?.advice] })) return null;
  return withReview.xin_xam;
}

async function listCatalog(xamType, region, client = prisma) {
  const cards = await client.xin_xam.findMany({
    where: { xam_type: xamType, region, active: true, verified: true, editorial_status: "PUBLISHED" },
    orderBy: { stick_number: "asc" },
  });
  const reviewed = await attachReviewMetadata(cards.map((card) => ({ xin_xam: card })), client);
  return reviewed.map((item) => item.xin_xam).filter((card) => isPublishableXamCard({
    ...card,
    interpretations: [card.meaning, card.advice],
  }));
}

async function listUnifiedCatalog(topic, client = prisma) {
  const cards = await client.xin_xam.findMany({
    where: {
      OR: [
        { xam_type: { endsWith: `:${topic}` } },
        { xam_type: topic },
        { category: topic },
      ],
      active: true,
      verified: true,
      editorial_status: "PUBLISHED",
    },
    orderBy: [{ region: "asc" }, { stick_number: "asc" }],
  });
  const reviewed = await attachReviewMetadata(cards.map((card) => ({ xin_xam: card })), client);
  return reviewed.map((item) => item.xin_xam).filter((card) => isPublishableXamCard({
    ...card,
    interpretations: [card.meaning, card.advice],
  }));
}

function upsertCatalog(data, client = prisma) {
  return client.xin_xam.upsert({
    where: { xam_type_stick_number: { xam_type: data.xam_type, stick_number: data.stick_number } },
    create: data,
    update: data,
  });
}

function createDraw(data, client = prisma) {
  return client.xin_xam_draws.create({ data, include: { xin_xam: true, proverbs: true } }).then(async (draw) => {
    await attachReviewMetadata(draw, client);
    return draw;
  });
}

async function listDraws(userId, limit = 100, client = prisma) {
  const draws = await client.xin_xam_draws.findMany({
    where: { user_id: userId, saved_at: { not: null }, xin_xam: { is: { active: true, verified: true, editorial_status: "PUBLISHED" } } },
    orderBy: { created_at: "desc" },
    take: limit,
    include: { xin_xam: true, proverbs: true },
  });
  await attachReviewMetadata(draws, client);
  return draws.filter(isPublishedDraw);
}

async function findDraw(id, userId, client = prisma) {
  const draw = await client.xin_xam_draws.findFirst({ where: { id, user_id: userId, xin_xam: { is: { active: true, verified: true, editorial_status: "PUBLISHED" } } }, include: { xin_xam: true, proverbs: true } });
  if (!draw) return null;
  await attachReviewMetadata(draw, client);
  if (!isPublishedDraw(draw)) return null;
  return draw;
}

function updateStar(id, userId, starred, client = prisma) {
  return client.xin_xam_draws.updateMany({ where: { id, user_id: userId, saved_at: { not: null } }, data: { starred } });
}

function markDrawSaved(id, userId, client = prisma) {
  return client.xin_xam_draws.updateMany({ where: { id, user_id: userId }, data: { saved_at: new Date() } });
}

function remove(id, userId, client = prisma) {
  return client.xin_xam_draws.deleteMany({ where: { id, user_id: userId, saved_at: { not: null } } });
}

module.exports = { findCatalog, listCatalog, listUnifiedCatalog, upsertCatalog, createDraw, listDraws, findDraw, markDrawSaved, updateStar, remove };
