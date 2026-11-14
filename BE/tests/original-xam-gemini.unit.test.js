const test = require("node:test");
const assert = require("node:assert/strict");
const dataset = require("../data/xin-xam/tltl-original-100-v1.json");
const { generateInterpretation, interpretFortune, buildOriginalFortuneContext, validateOriginalInterpretation, ORIGINAL_XAM_SYSTEM_ID } = require("../src/services/fortune-interpretation.service");

function makeFortune(reviewStatus = "APPROVED") {
  const row = dataset.records[0];
  return {
    id: "original-card-1",
    xam_type: `${dataset.systemId}:${dataset.datasetVersion}`,
    name: row.title,
    stick_number: row.id,
    fortune_level: row.grade,
    poem: row.poem,
    meaning: row.centralMeaning,
    advice: row.practicalAdvice.join(" "),
    source: null,
    verified: true,
    editorial_metadata: {
      systemId: ORIGINAL_XAM_SYSTEM_ID,
      datasetVersion: dataset.datasetVersion,
      contentType: row.contentType,
      contentVersion: row.contentVersion,
      reviewStatus,
      humanApproved: reviewStatus === "APPROVED",
      centralMeaning: row.centralMeaning,
      symbols: row.symbols,
      symbolicExplanations: row.symbolicExplanations,
      topics: row.topics,
      interpretationGuidance: row.interpretationGuidance,
      cautions: row.cautions,
      practicalAdvice: row.practicalAdvice,
    },
  };
}

test("original Gemini context carries editorial content and explicitly denies a traditional-source claim", () => {
  const fortune = makeFortune();
  const context = buildOriginalFortuneContext(fortune, "Câu hỏi mẫu", "work");
  assert.equal(context.fortune.stickNumber, 1);
  assert.equal(context.fortune.poem, fortune.poem);
  assert.equal(context.fortune.centralMeaning, fortune.meaning);
  assert.equal(context.fortune.grade, fortune.fortune_level);
  assert.equal(context.question, "Câu hỏi mẫu");
  assert.match(context.instruction, /không phải văn bản Quan Âm, kinh văn hay tư liệu cổ/);
  assert.deepEqual(context.sourceRefs, ["fortune:original-card-1"]);
});

test("Gemini interpretation refuses original content before human approval", async () => {
  await assert.rejects(interpretFortune({
    userId: "original-draft-user",
    drawId: "original-draft-draw",
    question: "Câu hỏi thử",
    topic: "work",
    fortune: makeFortune("DRAFT"),
    cacheValue: async () => null,
    saveValue: async () => {},
    generate: async () => { throw new Error("must not call model for a draft"); },
  }), { code: "FORTUNE_NOT_VERIFIED" });
});

test("original interpretation rejects a conflicting quẻ number from the model", () => {
  const valid = {
    status: "SUCCESS",
    summary: "Quẻ số 1 gợi một khởi đầu cần được chăm sóc.",
    traditionalMeaning: "Ý nghĩa nền gợi một cách quan sát hoàn cảnh hiện tại.",
    symbolicAnalysis: "Hình tượng được đọc trong phạm vi ý nghĩa đã biên soạn.",
    contextualInterpretation: "Với câu hỏi này, hãy đối chiếu thêm dữ kiện thực tế.",
    practicalAdvice: ["Ghi lại một bước có thể kiểm tra trước khi quyết định."],
    cautions: ["Không xem lời diễn giải như dự báo chắc chắn."],
    sourceRefs: ["fortune:original-card-1"],
  };
  const fortune = makeFortune();
  const refs = new Set(["fortune:original-card-1"]);
  assert.equal(validateOriginalInterpretation(valid, fortune, refs)?.status, "SUCCESS");
  assert.equal(validateOriginalInterpretation({ ...valid, summary: "Quẻ số 2 gợi một khởi đầu cần được chăm sóc." }, fortune, refs), null);
  assert.equal(validateOriginalInterpretation({ ...valid, stickNumber: 2 }, fortune, refs), null);
  assert.equal(validateOriginalInterpretation({ ...valid, grade: "CẨN TRỌNG" }, fortune, refs), null);
  assert.equal(validateOriginalInterpretation({ ...valid, poem: "Bài thơ do model tự tạo" }, fortune, refs), null);
});

test("structured Gemini response validation keeps the original quẻ number", async () => {
  const fortune = makeFortune();
  const allowedSourceRefs = new Set(["fortune:original-card-1"]);
  const response = {
    status: "SUCCESS",
    summary: "Quẻ số 1 gợi một khởi đầu cần được chăm sóc.",
    traditionalMeaning: "Ý nghĩa nền gợi một cách quan sát hoàn cảnh hiện tại.",
    symbolicAnalysis: "Hình tượng được đọc trong phạm vi ý nghĩa đã biên soạn.",
    contextualInterpretation: "Với câu hỏi này, hãy đối chiếu thêm dữ kiện thực tế.",
    practicalAdvice: ["Ghi lại một bước có thể kiểm tra trước khi quyết định."],
    cautions: ["Không xem lời diễn giải như dự báo chắc chắn."],
    sourceRefs: ["fortune:original-card-1"],
  };
  const result = await generateInterpretation({
    apiKey: "unit-test-key",
    model: "unit-test-model",
    prompt: "context",
    allowedSourceRefs,
    validate: (value, refs) => validateOriginalInterpretation(value, fortune, refs),
    generateContentImpl: async () => ({ text: JSON.stringify(response) }),
  });
  assert.equal(result.status, "SUCCESS");
  await assert.rejects(generateInterpretation({
    apiKey: "unit-test-key",
    model: "unit-test-model",
    prompt: "context",
    allowedSourceRefs,
    validate: (value, refs) => validateOriginalInterpretation(value, fortune, refs),
    generateContentImpl: async () => ({ text: JSON.stringify({ ...response, summary: "Quẻ số 2 gợi một khởi đầu cần được chăm sóc." }) }),
  }), { code: "GEMINI_INVALID_RESPONSE" });
});

test("approved original interpretation sends full context and versions cache by question", async () => {
  const fortune = makeFortune();
  const saved = [];
  let prompt;
  const generate = async ({ prompt: request }) => {
    prompt = JSON.parse(request);
    return {
      status: "SUCCESS",
      summary: "Một góc nhìn có điều kiện dựa trên dữ liệu của quẻ.",
      traditionalMeaning: "Ý nghĩa nền gợi một cách quan sát hoàn cảnh hiện tại.",
      symbolicAnalysis: "Hình tượng được đọc trong phạm vi ý nghĩa đã biên soạn.",
      contextualInterpretation: "Với câu hỏi này, hãy đối chiếu thêm dữ kiện thực tế.",
      practicalAdvice: ["Ghi lại một bước có thể kiểm tra trước khi quyết định."],
      cautions: ["Không xem lời diễn giải như dự báo chắc chắn."],
      sourceRefs: ["fortune:original-card-1"],
      model: "test-model",
    };
  };
  const common = {
    userId: "original-approved-user",
    question: "Câu hỏi đầu tiên",
    topic: "work",
    fortune,
    cacheValue: async () => null,
    saveValue: async (value) => saved.push(JSON.parse(value)),
    generate,
  };
  await interpretFortune({ ...common, drawId: "original-draw-a" });
  const firstHash = saved[0].contextHash;
  assert.equal(prompt.fortune.systemId, ORIGINAL_XAM_SYSTEM_ID);
  assert.equal(prompt.fortune.title, fortune.name);
  assert.deepEqual(prompt.fortune.symbolicExplanations, fortune.editorial_metadata.symbolicExplanations);
  assert.deepEqual(prompt.fortune.cautions, fortune.editorial_metadata.cautions);
  assert.equal(prompt.topic, "work");
  await interpretFortune({ ...common, drawId: "original-draw-b", question: "Câu hỏi khác" });
  assert.notEqual(saved[1].contextHash, firstHash);
});

test("concurrent questions on the same draw do not share a Gemini interpretation", async () => {
  const fortune = makeFortune();
  let calls = 0;
  const saved = [];
  const response = {
    status: "SUCCESS",
    summary: "Một góc nhìn có điều kiện dựa trên dữ liệu của quẻ.",
    traditionalMeaning: "Ý nghĩa nền gợi một cách quan sát hoàn cảnh hiện tại.",
    symbolicAnalysis: "Hình tượng được đọc trong phạm vi ý nghĩa đã biên soạn.",
    contextualInterpretation: "Với câu hỏi này, hãy đối chiếu thêm dữ kiện thực tế.",
    practicalAdvice: ["Ghi lại một bước có thể kiểm tra trước khi quyết định."],
    cautions: ["Không xem lời diễn giải như dự báo chắc chắn."],
    sourceRefs: ["fortune:original-card-1"],
    model: "test-model",
  };
  const common = {
    userId: "original-parallel-user",
    drawId: "original-parallel-draw",
    topic: "work",
    fortune,
    cacheValue: async () => null,
    saveValue: async (value) => saved.push(JSON.parse(value)),
    generate: async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return response;
    },
  };
  await Promise.all([
    interpretFortune({ ...common, question: "Câu hỏi A" }),
    interpretFortune({ ...common, question: "Câu hỏi B" }),
  ]);
  assert.equal(calls, 2);
  assert.equal(new Set(saved.map((item) => item.contextHash)).size, 2);
});

test("draft test cache returns the saved interpretation on reload without another model call", async () => {
  const fortune = makeFortune();
  let cached;
  let calls = 0;
  const interpretation = {
    status: "SUCCESS",
    summary: "Một góc nhìn có điều kiện dựa trên dữ liệu của quẻ.",
    traditionalMeaning: "Ý nghĩa nền gợi một cách quan sát hoàn cảnh hiện tại.",
    symbolicAnalysis: "Hình tượng được đọc trong phạm vi ý nghĩa đã biên soạn.",
    contextualInterpretation: "Với câu hỏi này, hãy đối chiếu thêm dữ kiện thực tế.",
    practicalAdvice: ["Ghi lại một bước có thể kiểm tra trước khi quyết định."],
    cautions: ["Không xem lời diễn giải như dự báo chắc chắn."],
    sourceRefs: ["fortune:original-card-1"],
    model: "test-model",
  };
  const common = {
    userId: "original-cache-user",
    drawId: "original-cache-draw",
    question: "Câu hỏi cần xem lại",
    topic: "work",
    fortune,
    cacheValue: async () => cached,
    saveValue: async (value) => { cached = JSON.parse(value); },
    generate: async () => { calls += 1; return interpretation; },
  };

  const first = await interpretFortune(common);
  const reloaded = await interpretFortune(common);

  assert.deepEqual(reloaded, first);
  assert.equal(calls, 1);
  assert.equal(cached.resultId, common.drawId);
  assert.equal(cached.fortuneId, fortune.id);
});

test("changing the question on the same result invalidates the interpretation cache", async () => {
  const fortune = makeFortune();
  let cached;
  let calls = 0;
  const generate = async () => {
    calls += 1;
    return {
      status: "SUCCESS",
      summary: "Một góc nhìn có điều kiện dựa trên dữ liệu của quẻ.",
      traditionalMeaning: "Ý nghĩa nền gợi một cách quan sát hoàn cảnh hiện tại.",
      symbolicAnalysis: "Hình tượng được đọc trong phạm vi ý nghĩa đã biên soạn.",
      contextualInterpretation: "Với câu hỏi này, hãy đối chiếu thêm dữ kiện thực tế.",
      practicalAdvice: ["Ghi lại một bước có thể kiểm tra trước khi quyết định."],
      cautions: ["Không xem lời diễn giải như dự báo chắc chắn."],
      sourceRefs: ["fortune:original-card-1"],
      model: "test-model",
    };
  };
  const common = {
    userId: "original-cache-question-user",
    drawId: "original-cache-question-draw",
    topic: "work",
    fortune,
    cacheValue: async () => cached,
    saveValue: async (value) => { cached = JSON.parse(value); },
    generate,
  };

  await interpretFortune({ ...common, question: "Câu hỏi thứ nhất" });
  const firstHash = cached.contextHash;
  await interpretFortune({ ...common, question: "Câu hỏi khác" });

  assert.equal(calls, 2);
  assert.notEqual(cached.contextHash, firstHash);
  assert.equal(cached.resultId, common.drawId);
});
