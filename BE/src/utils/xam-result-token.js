const jwt = require("jsonwebtoken");
const { createHash } = require("node:crypto");
const { z } = require("zod");
const env = require("../config/env");
const ApiError = require("./api-error");

const ISSUER = "tin-lam-tam-linh-api";
const AUDIENCE = "tin-lam-tam-linh-xam-result";

const receiptSchema = z.object({
  drawId: z.string().uuid(),
  cardId: z.string().uuid(),
  xamType: z.string().min(1),
  stickNumber: z.number().int().positive(),
  proverbId: z.string().uuid().nullable(),
  fingerprint: z.string().regex(/^[a-f0-9]{64}$/),
  createdAt: z.number().int().positive().safe(),
  demo: z.boolean().optional(),
}).strict();

function contentFingerprint(card, proverb) {
  // Chỉ kiểm tra những trường ảnh hưởng kết quả đã hiển thị.
  const fields = [
    card.id,
    card.xam_type,
    card.stick_number,
    card.region,
    card.category,
    card.name,
    card.fortune_level,
    card.source,
    card.poem,
    card.meaning,
    card.advice,
    proverb?.id || null,
    proverb?.content || null,
    proverb?.meaning || null,
    proverb?.source || null,
  ];

  return createHash("sha256")
    .update(JSON.stringify(fields))
    .digest("hex");
}

function issueXamResult(receipt) {
  return jwt.sign(
    { receipt: receiptSchema.parse(receipt) },
    env.JWT_ACCESS_SECRET,
    {
      algorithm: "HS256",
      issuer: ISSUER,
      audience: AUDIENCE,
      expiresIn: "24h",
    },
  );
}

function readXamResult(token) {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, {
      algorithms: ["HS256"],
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    return receiptSchema.parse(payload.receipt);
  } catch {
    throw new ApiError(
      422,
      "Mã lượt rút không hợp lệ hoặc đã quá 24 giờ. Hãy nhận một kết quả mới trước khi lưu.",
    );
  }
}

module.exports = {
  contentFingerprint,
  issueXamResult,
  readXamResult,
};
