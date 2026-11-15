const test = require("node:test");
const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const demoService = require("../src/services/demo-reflection.service");
const { getOutcome } = require("../src/services/xin-keo.service");
const DEMO_ENV = { NODE_ENV: "test", TLTL_DEMO_AUTO_PUBLISH: true };
const withDemoEnv = (service) => (input) => service({ ...input, environment: DEMO_ENV });
const throwDemoKeo = withDemoEnv(demoService.throwDemoKeo);
const interpretDemoKeo = withDemoEnv(demoService.interpretDemoKeo);
const interpretDemoXam = withDemoEnv(demoService.interpretDemoXam);
const drawDemoXam = withDemoEnv(demoService.drawDemoXam);
const { issueXamResult, contentFingerprint } = require("../src/utils/xam-result-token");

test("Xin keo catalog and all three outcomes come from backend with topic-aware guidance", () => {
  const status = demoService.getDemoStatus(DEMO_ENV);
  assert.equal(status.xinKeo.outcomes.length, 3);
  assert.equal(status.xinKeo.version, "KEO_OUTCOMES_V2");
  assert.ok(status.xinKeo.outcomes.every((outcome) => outcome.title && outcome.subTitle && outcome.meaning && outcome.guidance));
  const productionStatus = demoService.getDemoStatus({ NODE_ENV: "production", TLTL_DEMO_AUTO_PUBLISH: true });
  assert.equal(productionStatus.xinKeo.status, "DISABLED");
  assert.equal(productionStatus.xinKeo.outcomes.length, 3);

  const question = "Chủ đề: Học tập & Thi cử\nMong muốn: Mong kỳ thi tới làm bài tốt và đạt điểm cao.";
  const mixed = getOutcome("YES", question);
  const twoYang = getOutcome("UNCLEAR", question);
  const twoYin = getOutcome("NO", question);

  assert.match(mixed.guidance, /cân nhắc vấn đề từ nhiều phía/);
  assert.match(twoYang.guidance, /điều mình chủ động chuẩn bị/);
  assert.match(twoYin.guidance, /chậm lại và xem điều gì còn cần làm rõ/);
  for (const outcome of [mixed, twoYang, twoYin]) {
    assert.match(outcome.guidance, /một bước chuẩn bị cụ thể nằm trong khả năng của mình/i);
    assert.equal(outcome.guidanceBasis, "TOPIC");
  }

  const familyTwoYang = getOutcome(
    "UNCLEAR",
    "Chủ đề: Gia đình & Người thân\nMong muốn: Mong gia đình có sức khỏe dồi dào.",
  );
  assert.match(familyTwoYang.guidance, /một cách quan tâm hoặc hỗ trợ thiết thực phù hợp với tình huống/);
  assert.doesNotMatch(familyTwoYang.guidance, /thi cử/);
  assert.equal(familyTwoYang.guidanceBasis, "TOPIC");

  const familyLove = getOutcome(
    "YES",
    "Chủ đề: Gia đình & Người thân\nMong muốn: Mong mọi người yêu thương nhau.",
  );
  assert.match(familyLove.guidance, /một cách quan tâm hoặc hỗ trợ thiết thực phù hợp với tình huống/);
  assert.equal(familyLove.guidanceBasis, "TOPIC");

  const familyTrip = getOutcome(
    "NO",
    "Chủ đề: Gia đình & Người thân\nMong muốn: Mong cả nhà có chuyến đi vui vẻ.",
  );
  assert.match(familyTrip.guidance, /một cách quan tâm hoặc hỗ trợ thiết thực phù hợp với tình huống/);
  assert.doesNotMatch(familyTrip.guidance, /sức khỏe|thi cử|điểm cao/i);

  const noTopic = getOutcome("YES");
  assert.equal(noTopic.guidanceBasis, "OUTCOME");
});

test("demo Xin keo takes the result from the backend, is idempotent and signs the immutable outcome", async () => {
  const sessionId = `demo-session-${randomUUID()}`;
  const requestId = randomUUID();
  const first = throwDemoKeo({ address: "keo-cast-test", sessionId, requestId, question: "question" });
  const retry = throwDemoKeo({ address: "keo-cast-test", sessionId, requestId, question: "changed question" });
  assert.deepEqual(retry, first);
  assert.ok(["am", "duong"].includes(first.piece1));
  assert.ok(["am", "duong"].includes(first.piece2));
  assert.ok(["YES", "UNCLEAR", "NO"].includes(first.result));
  assert.equal(typeof first.title, "string");
  assert.equal(typeof first.meaning, "string");
  assert.equal(typeof first.guidance, "string");
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
  assert.equal(prompts[0].recordedOutcome, cast.title);
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

test("published database Xin xam results remain interpretable when JSON demo activation is disabled", async () => {
  const cardId = randomUUID();
  const drawId = randomUUID();
  const card = {
    id: cardId,
    xam_type: "TLTL_ORIGINAL_100_V1:1.0.1-draft",
    stick_number: 40,
    region: "NATIONWIDE",
    category: "Gia đình",
    name: "Thẻ đã phát hành",
    fortune_level: "THUẬN",
    source: null,
    poem: "dòng một\ndòng hai\ndòng ba\ndòng bốn",
    meaning: "Ý nghĩa đã duyệt.",
    advice: "Lời khuyên đã duyệt.",
    active: true,
    verified: true,
    editorial_status: "PUBLISHED",
    editorial_metadata: {
      systemId: "TLTL_ORIGINAL_100_V1",
      contentType: "ORIGINAL",
      authoringMethod: "AI_ASSISTED_EDITORIAL_DRAFT",
      contentVersion: "1.0.1-draft",
      reviewStatus: "APPROVED",
      humanApproved: true,
    },
  };
  const resultToken = issueXamResult({
    drawId,
    cardId,
    xamType: card.xam_type,
    stickNumber: card.stick_number,
    proverbId: null,
    fingerprint: contentFingerprint(card, null),
    createdAt: Date.now(),
  });

  const result = await demoService.interpretDemoXam({
    address: "published-db-xam",
    resultToken,
    topic: "Gia đình",
    findCatalog: async () => card,
    generate: async () => ({ status: "SUCCESS" }),
    environment: { NODE_ENV: "development", TLTL_DEMO_AUTO_PUBLISH: false },
  });

  assert.equal(result.status, "SUCCESS");

  const demoResultToken = issueXamResult({
    drawId: randomUUID(),
    cardId,
    xamType: card.xam_type,
    stickNumber: card.stick_number,
    proverbId: null,
    fingerprint: contentFingerprint(card, null),
    createdAt: Date.now(),
    demo: true,
  });
  await assert.rejects(
    demoService.interpretDemoXam({
      address: "disabled-json-demo",
      resultToken: demoResultToken,
      topic: "Gia đình",
      findCatalog: async () => card,
      generate: async () => ({ status: "SUCCESS" }),
      environment: { NODE_ENV: "development", TLTL_DEMO_AUTO_PUBLISH: false },
    }),
    { code: "DEMO_ENDPOINT_DISABLED" },
  );
});

test("demo Xin xam draws from all 100 validated JSON cards and Gemini receives that exact card", async () => {
  const address = `demo-xam-${randomUUID()}`;
  const requestId = randomUUID();
  const availability = demoService.getDemoXamAvailability({ environment: DEMO_ENV, region: "Bắc Bộ", topic: "Bình an" });
  assert.equal(availability.count, 100);
  assert.equal(availability.available, true);
  assert.equal(availability.region, "Bắc Bộ");
  assert.equal(availability.topic, "Bình an");
  const draw = drawDemoXam({ address, requestId, region: "Bắc Bộ", topic: "Tài chính", question: "Câu hỏi demo" });
  assert.equal(draw.demoStatus, "DEMO_ACTIVE");
  assert.equal(draw.editorialStatus, "DEMO_ACTIVE");
  assert.equal(draw.active, true);
  assert.equal(draw.verified, false);
  assert.match(draw.xamType, /^TLTL_ORIGINAL_100_V1:1\.0\.1-draft$/);
  assert.ok(Number(draw.stickNumber) >= 1 && Number(draw.stickNumber) <= 100);
  assert.equal(draw.originalContent.poem.split(/\r?\n/).length, 4);
  assert.deepEqual(drawDemoXam({ address, requestId, region: "Bắc Bộ", topic: "Tài chính", question: "Câu hỏi demo" }), draw);

  let prompt;
  const interpreted = await interpretDemoXam({
    address,
    resultToken: draw.resultToken,
    topic: "Tài chính",
    question: "Câu hỏi demo",
    generate: async (input) => { prompt = JSON.parse(input.prompt); return { status: "SUCCESS" }; },
  });
  assert.equal(interpreted.status, "SUCCESS");
  assert.equal(prompt.fortune.stickNumber, Number(draw.stickNumber));
  assert.equal(prompt.fortune.poem, draw.poem);
  assert.equal(prompt.fortune.demoStatus, "DEMO_ACTIVE");
  assert.match(prompt.instruction, /Xin xăm không có kết quả nhị phân YES, NO hoặc UNCLEAR/);
  assert.equal(prompt.question, "Câu hỏi demo");
});

test("demo auto-activation requires the backend flag and is impossible in production", () => {
  assert.equal(demoService.getDemoStatus(DEMO_ENV).xinXam.count, 100);
  assert.equal(demoService.getDemoStatus({ NODE_ENV: "production", TLTL_DEMO_AUTO_PUBLISH: true }).enabled, false);
  assert.equal(demoService.getDemoStatus({ NODE_ENV: "development", TLTL_DEMO_AUTO_PUBLISH: false }).enabled, false);
  assert.throws(
    () => demoService.drawDemoXam({ address: "disabled", requestId: randomUUID(), topic: "all", environment: { NODE_ENV: "development", TLTL_DEMO_AUTO_PUBLISH: false } }),
    { code: "DEMO_ENDPOINT_DISABLED" },
  );
  assert.throws(
    () => demoService.drawDemoXam({ address: "production", requestId: randomUUID(), topic: "all", environment: { NODE_ENV: "production", TLTL_DEMO_AUTO_PUBLISH: true } }),
    { code: "DEMO_ENDPOINT_DISABLED" },
  );
});

test("demo HTTP routes do not treat a client query or body field as backend enablement", async (context) => {
  const app = require("../src/app");
  const server = app.listen(0);
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await new Promise((resolve) => server.once("listening", resolve));
  const address = server.address();
  const base = `http://127.0.0.1:${address.port}/api/v1/demo/reflections`;

  const statusResponse = await fetch(`${base}/status`);
  const status = await statusResponse.json();
  assert.equal(status.success, true);
  assert.equal(status.data.enabled, demoService.getDemoStatus().enabled);
  const queryStatusResponse = await fetch(`${base}/status?demo=1`);
  const queryStatus = await queryStatusResponse.json();
  assert.equal(queryStatus.data.enabled, status.data.enabled);

  const bodyEnableAttempt = await fetch(`${base}/xin-xam/draw`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ requestId: randomUUID(), topic: "all", TLTL_DEMO_AUTO_PUBLISH: true }),
  });
  assert.equal(bodyEnableAttempt.status, 422);
});

test("a signed demo Xam result is rejected before the account persistence path", async (context) => {
  const reflectionService = require("../src/services/reflection.service");
  const repository = require("../src/repositories/xin-xam.repository");
  const previousFindDraw = repository.findDraw;
  let databaseRead = false;
  repository.findDraw = async () => { databaseRead = true; return null; };
  context.after(() => { repository.findDraw = previousFindDraw; });
  const card = require("../src/services/demo-xam-catalog").DEMO_CARDS[0];
  const token = issueXamResult({
    drawId: randomUUID(), cardId: card.id, xamType: card.xam_type, stickNumber: card.stick_number,
    proverbId: null, fingerprint: contentFingerprint(card, null), createdAt: Date.now(), demo: true,
  });
  await assert.rejects(reflectionService.saveXamDraw("user-id", { resultToken: token }), { statusCode: 403 });
  assert.equal(databaseRead, false);
});
