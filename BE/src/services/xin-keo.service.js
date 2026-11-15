const repository = require("../repositories/xin-keo.repository");
const xinXamRepository = require("../repositories/xin-xam.repository");
const ApiError = require("../utils/api-error");
const { toProverbDto } = require("./proverb.service");
const { castPieces } = require("./xin-keo-algorithm");
const fortuneInterpretationService = require("./fortune-interpretation.service");

const OUTCOMES = {
  YES: { type: "nhat-am-nhat-duong", title: "Nhất Âm Nhất Dương", subTitle: "Một Ngửa (Âm) • Một Úp (Dương)", statusLabel: "Một âm · Một dương", meaning: "Lượt gieo này cho kết quả một mặt âm và một mặt dương.", guidance: "Một âm, một dương có thể gợi bạn cân nhắc vấn đề từ nhiều phía." },
  UNCLEAR: { type: "nhi-duong", title: "Nhị Dương", subTitle: "Cùng Sấp • Hai mặt cong úp xuống", statusLabel: "Hai mặt dương", meaning: "Lượt gieo này cho kết quả hai mặt dương.", guidance: "Hai mặt dương có thể nhắc bạn tập trung vào điều mình chủ động chuẩn bị." },
  NO: { type: "nhi-am", title: "Nhị Âm", subTitle: "Cùng Ngửa • Hai mặt phẳng ngửa lên", statusLabel: "Hai mặt âm", meaning: "Lượt gieo này cho kết quả hai mặt âm.", guidance: "Hai mặt âm có thể nhắc bạn chậm lại và xem điều gì còn cần làm rõ." },
};

const TOPIC_GUIDANCE = {
  "Học tập & Thi cử": "Với điều bạn mong trong học tập, hãy xác định một bước chuẩn bị cụ thể nằm trong khả năng của mình.",
  "Công việc & Sự nghiệp": "Với điều bạn mong trong công việc, hãy chọn một việc thực tế mà bạn có thể chủ động làm.",
  "Gia đình & Người thân": "Với điều bạn mong cho gia đình, hãy cân nhắc một cách quan tâm hoặc hỗ trợ thiết thực phù hợp với tình huống.",
  "Bình an & Tâm trí": "Với điều bạn đang băn khoăn, hãy chọn việc cần xử lý trước và cho mình thời gian nghỉ ngơi phù hợp.",
};

function getOutcome(result, question = "") {
  const outcome = OUTCOMES[result];
  if (!outcome) return null;

  const topic = Object.keys(TOPIC_GUIDANCE).find((label) => question.includes(label));
  return {
    ...outcome,
    guidance: `${outcome.guidance}${topic ? ` ${TOPIC_GUIDANCE[topic]}` : ""}`,
    guidanceBasis: topic ? "TOPIC" : "OUTCOME",
  };
}

function parseInterpretations(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return parsed?.version === 1 && parsed.interpretations ? parsed.interpretations : {};
  } catch {
    return {};
  }
}

function toPublicThrow(item, interpretation, question = "") {
  let aiExplanation = null;
  try { aiExplanation = interpretation ? JSON.parse(interpretation).interpretation || null : null; } catch { /* Ignore legacy cached text. */ }
  return { id: item.id, throwNumber: item.throw_number, piece1: item.left_side, piece2: item.right_side, result: item.result, ...getOutcome(item.result, question), proverb: toProverbDto(item.proverbs), aiExplanation, disclaimer: "Kết quả chỉ dùng để chiêm nghiệm văn hóa, không phải dự đoán hay quyết định thay bạn." };
}

function toPublicSession(session) {
  const interpretations = parseInterpretations(session.ai_explanation);
  return { id: session.id, question: session.question, drawId: session.draw_id || null, finalResult: session.final_result, createdAt: session.created_at, throws: session.xin_keo_throws.map((item) => toPublicThrow(item, interpretations[item.id], session.question)) };
}

async function createSession(userId, question, drawId) {
  if (drawId) {
    const draw = await xinXamRepository.findDraw(drawId, userId);
    if (!draw) throw new ApiError(404, "Xin xam draw not found");
  }
  return toPublicSession(await repository.createSession({ user_id: userId, question, draw_id: drawId || null }));
}

async function throwKeo(userId, sessionId, requestId) {
  const session = await repository.findSession(
    sessionId,
    userId
  );

  if (!session) {
    throw new ApiError(404, "Xin keo session not found");
  }

  const existing = requestId
    ? session.xin_keo_throws.find(
        (item) => item.id === requestId
      )
    : null;

  if (existing) {
    return toPublicThrow(existing, null, session.question);
  }

  if (session.xin_keo_throws.length >= 3) {
    throw new ApiError(
      409,
      "A xin keo session is limited to three throws"
    );
  }

  const cast = castPieces();

  try {
    const item =
      await repository.createThrowAndUpdateSession(
        session,
        {
          ...(requestId ? { id: requestId } : {}),
          session_id: session.id,
          left_side: cast.left,
          right_side: cast.right,
          result: cast.result,
          proverb_id: null,
        }
      );

    return toPublicThrow(item, null, session.question);
  } catch (error) {
    if (error?.code === "SESSION_MAX_THROWS") {
      throw new ApiError(
        409,
        "A xin keo session is limited to three throws"
      );
    }

    if (
      error?.code === "THROW_REQUEST_CONFLICT" ||
      error?.code === "P2002"
    ) {
      throw new ApiError(
        409,
        "Mã lần gieo không hợp lệ cho phiên này."
      );
    }

    throw error;
  }
}

async function getSession(userId, sessionId) {
  const session = await repository.findSession(
    sessionId,
    userId,
  );

  if (!session) {
    throw new ApiError(
      404,
      "Không tìm thấy phiên xin keo của tài khoản này.",
    );
  }

  return toPublicSession(session);
}

async function listSessions(userId) { return (await repository.listSessions(userId)).map(toPublicSession); }

async function interpretThrow(userId, sessionId, throwId, input = {}) {
  const session = await repository.findSession(sessionId, userId);
  if (!session) throw new ApiError(404, "Xin keo session not found");
  const item = session.xin_keo_throws.find((throwItem) => throwItem.id === throwId);
  if (!item) throw new ApiError(404, "Xin keo result not found");
  try {
    return await fortuneInterpretationService.interpretKeo({
      userId,
      requestId: throwId,
      question: session.question,
      outcome: item.result,
      leftSide: item.left_side,
      rightSide: item.right_side,
      cacheValue: () => repository.findInterpretation(sessionId, userId, throwId),
      saveValue: (value) => repository.saveInterpretation(sessionId, userId, throwId, value),
    });
  } catch (error) {
    if (error.code === "INVALID_INTERPRETATION_INPUT" || error.code === "INVALID_INTERPRETATION_RESULT") throw new ApiError(400, error.message);
    if (error.code === "INTERPRETATION_RATE_LIMITED") throw new ApiError(429, error.message);
    if (error.code === "AI_ENTITLEMENT_UNAVAILABLE") throw new ApiError(503, error.message);
    const providerError = error.code?.startsWith("GEMINI_") || error.code?.startsWith("GROQ_");
    if (providerError) {
      const status = error.status === 429 ? 429 : error.code.endsWith("TIMEOUT") ? 504 : 502;
      throw new ApiError(status, "Dịch vụ luận giải đang tạm thời bận. Hãy thử lại sau.", [{ code: error.code, ...(Number.isFinite(error.status) ? { providerStatus: error.status } : {}), ...(typeof error.model === "string" ? { model: error.model } : {}) }]);
    }
    throw new ApiError(502, error.message, [{ code: error.code }]);
  }
}

module.exports = { OUTCOMES, getOutcome, createSession, throwKeo, getSession, listSessions, interpretThrow };
