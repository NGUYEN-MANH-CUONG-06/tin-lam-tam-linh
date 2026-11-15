const { createHash, randomUUID, randomInt } = require("node:crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { castPieces } = require("./xin-keo-algorithm");
const { OUTCOMES, getOutcome } = require("./xin-keo.service");
const { filterCardsByTopic } = require("./xin-xam-algorithm");
const { isDemoAutoActivationEnabled } = require("./demo-activation");
const { generateInterpretation } = require("./fortune-interpretation.service");
const xinXamRepository = require("../repositories/xin-xam.repository");
const { issueXamResult, contentFingerprint, readXamResult } = require("../utils/xam-result-token");
const { isPublishableXamCard } = require("../../../shared/xin-xam-publication.mjs");
const { DEMO_CARDS, EXPECTED_SYSTEM, EXPECTED_VERSION, findDemoXamCard, toDemoXamDraw } = require("./demo-xam-catalog");

const demoCastSessions = new Map();
const demoUsage = new Map();
const interpretations = new Map();
const interpretationsInFlight = new Map();
const demoXamDraws = new Map();
const WINDOW_MS = 60 * 60 * 1000;

function assertDemoEnvironment(environment = env) {
  if (!isDemoAutoActivationEnabled(environment)) {
    const error = new Error("Demo reflection endpoints are disabled unless the backend explicitly enables demo auto-activation outside production.");
    error.code = "DEMO_ENDPOINT_DISABLED";
    throw error;
  }
}

function getDemoStatus(environment = env) {
  const enabled = isDemoAutoActivationEnabled(environment);
  return {
    enabled,
    xinXam: { status: enabled ? "DEMO_ACTIVE" : "DISABLED", count: enabled ? DEMO_CARDS.length : 0, expectedCount: 100, systemId: EXPECTED_SYSTEM, datasetVersion: EXPECTED_VERSION },
    xinKeo: { status: enabled ? "DEMO_ACTIVE" : "DISABLED", version: "KEO_OUTCOMES_V2", outcomes: Object.keys(OUTCOMES).map((result) => ({ result, ...getOutcome(result) })) },
    disclaimer: "Kích hoạt Demo không phải phê duyệt hay phát hành chính thức.",
  };
}

function getDemoXamAvailability({ region = "Toàn quốc", topic = "all", environment = env } = {}) {
  assertDemoEnvironment(environment);
  return { region, topic, count: DEMO_CARDS.length, available: DEMO_CARDS.length === 100, demoStatus: "DEMO_ACTIVE" };
}

function drawDemoXam({ address, requestId, question, topic, environment = env }) {
  assertDemoEnvironment(environment);
  if (typeof requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(requestId)
    || typeof topic !== "string" || !topic.trim() || topic.length > 80
    || (question !== undefined && (typeof question !== "string" || question.length > 2000))) {
    const error = new Error("Invalid demo xin xam request.");
    error.code = "INVALID_DEMO_REQUEST";
    throw error;
  }
  const ipKey = hashAddress(address);
  const requestKey = `${ipKey}:${requestId}`;
  const requestFingerprint = createHash("sha256").update(JSON.stringify({ topic: topic.trim(), question: String(question || "").trim() })).digest("hex");
  const existing = demoXamDraws.get(requestKey);
  if (existing) {
    if (existing.requestFingerprint !== requestFingerprint) {
      const error = new Error("Demo draw request ID was already used with different input.");
      error.code = "DEMO_REQUEST_CONFLICT";
      throw error;
    }
    return existing.response;
  }
  consumeLimit(`xam-draw:${ipKey}`, 30);
  const candidateCards = filterCardsByTopic(DEMO_CARDS, topic);
  const pool = candidateCards.length > 0 ? candidateCards : DEMO_CARDS;
  const card = pool[randomInt(0, pool.length)];
  const createdAt = new Date();
  const drawId = randomUUID();
  const resultToken = issueXamResult({
    drawId,
    cardId: card.id,
    xamType: card.xam_type,
    stickNumber: card.stick_number,
    proverbId: null,
    fingerprint: contentFingerprint(card, null),
    createdAt: createdAt.getTime(),
    demo: true,
  });
  const response = toDemoXamDraw(card, drawId, resultToken, createdAt);
  if (demoXamDraws.size >= 5000) demoXamDraws.delete(demoXamDraws.keys().next().value);
  demoXamDraws.set(requestKey, { requestFingerprint, response });
  return response;
}

function hashAddress(address) {
  return createHash("sha256").update(String(address || "unknown")).digest("hex");
}

function consumeLimit(key, limit) {
  const now = Date.now();
  const recent = (demoUsage.get(key) || []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= limit) {
    const error = new Error("Demo usage limit reached for this hour.");
    error.code = "DEMO_RATE_LIMITED";
    throw error;
  }
  recent.push(now);
  if (demoUsage.size > 10_000) demoUsage.delete(demoUsage.keys().next().value);
  demoUsage.set(key, recent);
}

async function cachedInterpretation(key, create) {
  if (interpretations.has(key)) return interpretations.get(key);
  if (interpretationsInFlight.has(key)) return interpretationsInFlight.get(key);
  const pending = create();
  interpretationsInFlight.set(key, pending);
  try {
    const value = await pending;
    if (interpretations.size >= 2000) interpretations.delete(interpretations.keys().next().value);
    interpretations.set(key, value);
    return value;
  } finally {
    interpretationsInFlight.delete(key);
  }
}

function throwDemoKeo({ address, sessionId, requestId, question, environment = env }) {
  assertDemoEnvironment(environment);
  if (typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 100 || typeof requestId !== "string" || !/^[0-9a-f-]{36}$/i.test(requestId)) {
    const error = new Error("Invalid demo xin keo request.");
    error.code = "INVALID_DEMO_REQUEST";
    throw error;
  }
  const state = demoCastSessions.get(sessionId) || { question: String(question || "").slice(0, 2000), throws: new Map() };
  if (state.throws.has(requestId)) return state.throws.get(requestId);
  const ipKey = hashAddress(address);
  consumeLimit(`keo-cast:${ipKey}`, 30);
  if (state.throws.size >= 3) {
    const error = new Error("Demo xin keo session reached its three-throw limit.");
    error.code = "DEMO_SESSION_LIMIT";
    throw error;
  }
  const result = castPieces();
  const id = randomUUID();
  const resultToken = jwt.sign({
    kind: "demo-xin-keo",
    id,
    sessionId,
    question: state.question,
    leftSide: result.left,
    rightSide: result.right,
    outcome: result.result,
  }, env.JWT_ACCESS_SECRET, { expiresIn: "24h", issuer: "tin-lam-tam-linh", audience: "demo-reflection" });
  const response = { ...getOutcome(result.result, question), id, resultToken, throwNumber: state.throws.size + 1, piece1: result.left, piece2: result.right, result: result.result, proverb: null };
  state.throws.set(requestId, response);
  if (demoCastSessions.size >= 2000) demoCastSessions.delete(demoCastSessions.keys().next().value);
  demoCastSessions.set(sessionId, state);
  return response;
}

async function interpretDemoKeo({ address, resultToken, generate = generateInterpretation, environment = env }) {
  assertDemoEnvironment(environment);
  const claims = jwt.verify(resultToken, env.JWT_ACCESS_SECRET, { issuer: "tin-lam-tam-linh", audience: "demo-reflection" });
  if (claims.kind !== "demo-xin-keo" || !claims.id || !["am", "duong"].includes(claims.leftSide) || !["am", "duong"].includes(claims.rightSide)) {
    const error = new Error("Invalid signed demo xin keo result.");
    error.code = "INVALID_DEMO_RESULT";
    throw error;
  }
  const key = `demo-keo:${claims.id}`;
  return cachedInterpretation(key, async () => {
    const ipKey = hashAddress(address);
    consumeLimit(`interpretation:${ipKey}`, 5);
    const outcome = getOutcome(claims.outcome);
    return generate({
      allowedSourceRefs: new Set(["keo-traditional-outcome"]),
      prompt: JSON.stringify({
        kind: "xin-keo",
        instruction: "Chỉ gọi kết quả bằng danh xưng văn hóa Việt: 'Nhất Âm Nhất Dương (Đắc keo)', 'Nhị Dương (Keo Tiếu)' hoặc 'Nhị Âm'. Tuyệt đối KHÔNG dùng các từ tiếng Anh (như YES, NO, UNCLEAR) hoặc mã kỹ thuật nội bộ. Tuyệt đối KHÔNG gán cho thần linh, đấng bề trên hay thế giới tâm linh ban ơn/nâng đỡ/phán xét, mà hãy diễn giải theo triết lý văn hóa âm dương cân bằng: gợi mở người hỏi tự soi chiếu nội tâm, nhận diện khúc mắc và chủ động hành động thực tế.",
        recordedOutcome: outcome?.title || "Kết quả ghi nhận",
        resultMeaning: outcome?.meaning || "",
        sides: [claims.leftSide, claims.rightSide],
        question: claims.question,
        sourceRefs: ["keo-traditional-outcome"],
      }),
    });
  });
}

async function interpretDemoXam({ address, resultToken, question, topic, findCatalog = xinXamRepository.findCatalog, generate = generateInterpretation, environment = env }) {
  if (typeof topic !== "string" || topic.length > 80) {
    const error = new Error("Invalid demo xin xam topic.");
    error.code = "INVALID_DEMO_REQUEST";
    throw error;
  }
  const receipt = readXamResult(resultToken);
  if (receipt.demo === true) assertDemoEnvironment(environment);
  const card = receipt.demo
    ? findDemoXamCard(receipt.xamType, receipt.stickNumber)
    : await findCatalog(receipt.xamType, receipt.stickNumber);
  const isValidDemoCard = receipt.demo && card?.demo_status === "DEMO_ACTIVE";
  const isValidPublishedCard = !receipt.demo && card && isPublishableXamCard({ ...card, interpretations: [card.meaning, card.advice] });
  if (!card || card.id !== receipt.cardId || (!isValidDemoCard && !isValidPublishedCard) || contentFingerprint(card, null) !== receipt.fingerprint) {
    const error = new Error("Xin xam card is no longer publishable or its verified content changed.");
    error.code = "FORTUNE_NOT_VERIFIED";
    throw error;
  }
  const key = `demo-xam:${receipt.drawId}:${topic}:${String(question || "").trim().toLowerCase()}`;
  return cachedInterpretation(key, async () => {
    const ipKey = hashAddress(address);
    consumeLimit(`interpretation:${ipKey}`, 5);
    const sourceRef = `fortune:${card.id}`;
    return generate({
      allowedSourceRefs: new Set([sourceRef]),
      prompt: JSON.stringify({ kind: "xin-xam", instruction: "Xin xăm không có kết quả nhị phân YES, NO hoặc UNCLEAR. Tuyệt đối không nhắc các mã này và không tự gán phán quyết thuận lợi hay bất lợi. Chỉ diễn giải lá xăm đã xác minh, chủ đề và câu hỏi được cung cấp.", fortune: { id: card.id, system: card.xam_type, name: card.name, stickNumber: card.stick_number, level: card.fortune_level, poem: card.poem, verifiedMeaning: card.meaning, verifiedAdvice: card.advice, interpretationGuidance: card.editorial_metadata?.interpretationGuidance || [], cautions: card.editorial_metadata?.cautions || [], verifiedSource: card.editorial_metadata?.sourceTitle || card.source, demoStatus: receipt.demo ? "DEMO_ACTIVE" : undefined }, question: String(question || "").slice(0, 2000), topic, sourceRefs: [sourceRef] }),
    });
  });
}

module.exports = { getDemoStatus, getDemoXamAvailability, drawDemoXam, throwDemoKeo, interpretDemoKeo, interpretDemoXam };
