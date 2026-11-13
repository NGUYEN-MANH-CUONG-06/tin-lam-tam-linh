const { createHash, randomUUID } = require("node:crypto");
const jwt = require("jsonwebtoken");
const env = require("../config/env");
const { castPieces } = require("./xin-keo-algorithm");
const { OUTCOMES } = require("./xin-keo.service");
const { generateInterpretation } = require("./fortune-interpretation.service");
const xinXamRepository = require("../repositories/xin-xam.repository");
const { contentFingerprint, readXamResult } = require("../utils/xam-result-token");
const { isPublishableXamCard } = require("../../../shared/xin-xam-publication.mjs");

const demoCastSessions = new Map();
const demoUsage = new Map();
const interpretations = new Map();
const interpretationsInFlight = new Map();
const WINDOW_MS = 60 * 60 * 1000;

function assertDemoEnvironment() {
  if (env.NODE_ENV === "production") {
    const error = new Error("Demo reflection endpoints are disabled in production.");
    error.code = "DEMO_ENDPOINT_DISABLED";
    throw error;
  }
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

function throwDemoKeo({ address, sessionId, requestId, question }) {
  assertDemoEnvironment();
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
  const response = { id, resultToken, throwNumber: state.throws.size + 1, piece1: result.left, piece2: result.right, type: OUTCOMES[result.result].type, result: result.result, proverb: null };
  state.throws.set(requestId, response);
  if (demoCastSessions.size >= 2000) demoCastSessions.delete(demoCastSessions.keys().next().value);
  demoCastSessions.set(sessionId, state);
  return response;
}

async function interpretDemoKeo({ address, resultToken, generate = generateInterpretation }) {
  assertDemoEnvironment();
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
    return generate({
      allowedSourceRefs: new Set(["keo-traditional-outcome"]),
      prompt: JSON.stringify({ kind: "xin-keo", recordedOutcome: claims.outcome, sides: [claims.leftSide, claims.rightSide], question: claims.question, sourceRefs: ["keo-traditional-outcome"] }),
    });
  });
}

async function interpretDemoXam({ address, resultToken, question, topic, findCatalog = xinXamRepository.findCatalog, generate = generateInterpretation }) {
  assertDemoEnvironment();
  if (typeof topic !== "string" || topic.length > 80) {
    const error = new Error("Invalid demo xin xam topic.");
    error.code = "INVALID_DEMO_REQUEST";
    throw error;
  }
  const receipt = readXamResult(resultToken);
  const card = await findCatalog(receipt.xamType, receipt.stickNumber);
  if (!card || card.id !== receipt.cardId || !isPublishableXamCard({ ...card, interpretations: [card.meaning, card.advice] }) || contentFingerprint(card, null) !== receipt.fingerprint) {
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
      prompt: JSON.stringify({ kind: "xin-xam", fortune: { id: card.id, system: card.xam_type, name: card.name, stickNumber: card.stick_number, level: card.fortune_level, poem: card.poem, verifiedMeaning: card.meaning, verifiedAdvice: card.advice, verifiedSource: card.editorial_metadata?.sourceTitle || card.source }, question: String(question || "").slice(0, 2000), topic, sourceRefs: [sourceRef] }),
    });
  });
}

module.exports = { throwDemoKeo, interpretDemoKeo, interpretDemoXam };
