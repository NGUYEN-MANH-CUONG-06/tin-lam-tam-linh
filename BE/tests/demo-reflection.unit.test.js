const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { throwDemoKeo, interpretDemoKeo, interpretDemoXam } = require("../src/services/demo-reflection.service");
const { issueXamResult, contentFingerprint } = require("../src/utils/xam-result-token");

test("demo Xin keo takes the result from the backend, is idempotent and signs the immutable outcome", async () => {
  const sessionId = `demo-session-${randomUUID()}`;
  const requestId = randomUUID();
  const first = throwDemoKeo({ address: "keo-cast-test", sessionId, requestId, question: "question" });
  const retry = throwDemoKeo({ address: "keo-cast-test", sessionId, requestId, question: "changed question" });
  assert.deepEqual(retry, first);
  assert.ok(["am", "duong"].includes(first.piece1));
  assert.ok(["am", "duong"].includes(first.piece2));
  assert.ok(["YES", "UNCLEAR", "NO"].includes(first.result));
  assert.equal(typeof first.resultToken, "string");
  await assert.rejects(interpretDemoKeo({ address: "keo-tamper-test", resultToken: "tampered", generate: async () => ({}) }), { name: "JsonWebTokenError" });
});

test("demo Xin keo enforces the three-result session cap", () => {
  const sessionId = `demo-session-${randomUUID()}`;
  for (let index = 0; index < 3; index += 1) {
    throwDemoKeo({ address: `keo-cap-${sessionId}`, sessionId, requestId: randomUUID() });
  }
  assert.throws(
    () => throwDemoKeo({ address: `keo-cap-${sessionId}`, sessionId, requestId: randomUUID() }),
    { code: "DEMO_SESSION_LIMIT" },
  );
});

test("demo Gemini receives only the signed Xin keo result and caches duplicate interpretation", async () => {
  const sessionId = `demo-session-${randomUUID()}`;
  const cast = throwDemoKeo({ address: "keo-interpretation-test", sessionId, requestId: randomUUID(), question: "câu hỏi gốc" });
  const prompts = [];
  const generate = async (input) => {
    prompts.push(JSON.parse(input.prompt));
    return { status: "SUCCESS" };
  };
  const first = await interpretDemoKeo({ address: "keo-interpretation-test", resultToken: cast.resultToken, generate });
  const second = await interpretDemoKeo({ address: "different-address", resultToken: cast.resultToken, generate });
  assert.deepEqual(first, second);
  assert.equal(prompts.length, 1);
  assert.equal(prompts[0].recordedOutcome, cast.result);
  assert.deepEqual(prompts[0].sides, [cast.piece1, cast.piece2]);
  assert.equal(prompts[0].question, "câu hỏi gốc");
});

test("demo Gemini applies a five-call hourly limit per client address", async () => {
  const address = `keo-rate-${randomUUID()}`;
  const generate = async () => ({ status: "SUCCESS" });
  for (let index = 0; index < 5; index += 1) {
    const cast = throwDemoKeo({ address, sessionId: `session-${randomUUID()}`, requestId: randomUUID() });
    await interpretDemoKeo({ address, resultToken: cast.resultToken, generate });
  }
  const sixth = throwDemoKeo({ address, sessionId: `session-${randomUUID()}`, requestId: randomUUID() });
  await assert.rejects(interpretDemoKeo({ address, resultToken: sixth.resultToken, generate }), { code: "DEMO_RATE_LIMITED" });
});

test("demo Xin xam refuses unverified or mismatched fortune data before Gemini", async () => {
  const cardId = randomUUID();
  const drawId = randomUUID();
  const card = {
    id: cardId,
    xam_type: "WTS",
    stick_number: 1,
    region: "NATIONWIDE",
    category: "Tổng quan",
    name: "Thẻ thử fixture",
    fortune_level: "Bình",
    source: "https://source.example/card-1",
    poem: "dòng một\ndòng hai\ndòng ba\ndòng bốn",
    meaning: "Ý nghĩa fixture đã xác minh.",
    advice: "Lời khuyên fixture để kiểm thử.",
    active: true,
    verified: true,
    editorial_status: "PUBLISHED",
    editorial_metadata: { sourceTitle: "Nguồn fixture" },
  };
  const resultToken = issueXamResult({ drawId, cardId, xamType: card.xam_type, stickNumber: card.stick_number, proverbId: null, fingerprint: contentFingerprint(card, null), createdAt: Date.now() });
  let generated = false;
  const generate = async ({ prompt, allowedSourceRefs }) => {
    generated = true;
    const value = JSON.parse(prompt);
    assert.equal(value.fortune.id, card.id);
    assert.deepEqual([...allowedSourceRefs], [`fortune:${card.id}`]);
    return { status: "SUCCESS" };
  };
  await assert.rejects(interpretDemoXam({ address: "xam-test", resultToken, topic: "Công việc", findCatalog: async () => ({ ...card, verified: false }), generate }), { code: "FORTUNE_NOT_VERIFIED" });
  assert.equal(generated, false);
  const result = await interpretDemoXam({ address: "xam-test", resultToken, topic: "Công việc", question: "câu hỏi", findCatalog: async () => card, generate });
  assert.equal(result.status, "SUCCESS");
  assert.equal(generated, true);
});
