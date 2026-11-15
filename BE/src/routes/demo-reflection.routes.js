const express = require("express");
const { z } = require("zod");
const demoReflectionService = require("../services/demo-reflection.service");
const ApiError = require("../utils/api-error");
const { sendSuccess } = require("../utils/response");
const validate = require("../middleware/validation.middleware");

const router = express.Router();

function mapError(error) {
  if (error instanceof ApiError) return error;
  if (error.code === "DEMO_ENDPOINT_DISABLED") return new ApiError(404, "Demo endpoint unavailable.");
  if (error.code === "DEMO_RATE_LIMITED") {
    return new ApiError(429, "Đã chạm giới hạn sử dụng demo theo giờ. Hãy thử lại sau.", [{ code: error.code }]);
  }
  if (error.code === "DEMO_SESSION_LIMIT") {
    return new ApiError(429, "Phiên này đã đủ 3 lượt. Hãy bắt đầu phiên mới.", [{ code: error.code }]);
  }
  if (error.code === "INTERPRETATION_RATE_LIMITED") {
    return new ApiError(429, "Đã chạm giới hạn luận giải trong giờ này. Hãy thử lại sau.", [{ code: error.code }]);
  }
  if (error.code === "GEMINI_RATE_LIMITED") {
    return new ApiError(429, "Gemini đang giới hạn yêu cầu. Hãy thử lại sau.", [{ code: error.code, ...(Number.isFinite(error.status) ? { providerStatus: error.status } : {}), ...(typeof error.model === "string" ? { model: error.model } : {}) }]);
  }
  if (error.code === "GROQ_RATE_LIMITED") {
    return new ApiError(429, "Các dịch vụ luận giải đang quá tải. Hãy thử lại sau.", [{ code: error.code, ...(Number.isFinite(error.status) ? { providerStatus: error.status } : {}), ...(typeof error.model === "string" ? { model: error.model } : {}) }]);
  }
  if (error.code?.startsWith("GROQ_")) {
    const status = error.code === "GROQ_TIMEOUT" ? 504 : 502;
    return new ApiError(status, "Dịch vụ luận giải đang tạm thời bận. Hãy thử lại sau.", [{ code: error.code, ...(Number.isFinite(error.status) ? { providerStatus: error.status } : {}), ...(typeof error.model === "string" ? { model: error.model } : {}) }]);
  }
  if (error.code === "GEMINI_NOT_CONFIGURED" || error.code === "AI_PROVIDER_NOT_CONFIGURED") return new ApiError(503, "AI interpretation is not configured on the backend.");
  if (error.code === "DEMO_REQUEST_CONFLICT") return new ApiError(409, error.message);
  if (error.code === "INVALID_DEMO_REQUEST" || error.code === "INVALID_DEMO_RESULT" || error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return new ApiError(400, "Demo request is invalid or expired.");
  if (error.code === "FORTUNE_NOT_VERIFIED") return new ApiError(409, error.message);
  if (error.code === "GEMINI_TIMEOUT") return new ApiError(504, "Gemini request timed out.", [{ code: error.code }]);
  if (error.code?.startsWith("GEMINI_")) {
    return new ApiError(502, "Gemini interpretation is unavailable.", [{
      code: error.code,
      ...(Number.isFinite(error.status) ? { providerStatus: error.status } : {}),
      ...(typeof error.model === "string" ? { model: error.model } : {}),
    }]);
  }
  return error;
}

async function respond(res, operation, message) {
  try {
    return sendSuccess(res, { message, data: await operation() });
  } catch (error) {
    throw mapError(error);
  }
}

router.post("/xin-keo/throws", validate(z.object({ sessionId: z.string().min(8).max(100), requestId: z.string().uuid(), question: z.string().max(2000).optional() }).strict()), async (req, res) => {
  const input = req.body;
  return respond(res, () => demoReflectionService.throwDemoKeo({ address: req.ip, ...input }), "Demo xin keo cast");
});

router.get("/status", (_req, res) => sendSuccess(res, { data: demoReflectionService.getDemoStatus() }));

router.get("/xin-xam/availability", validate(z.object({ region: z.string().max(100).optional(), topic: z.string().max(80).optional() }).strict(), "query"), (req, res) => {
  try { return sendSuccess(res, { data: demoReflectionService.getDemoXamAvailability(req.query) }); }
  catch (error) { throw mapError(error); }
});

router.post("/xin-xam/draw", validate(z.object({ requestId: z.string().uuid(), region: z.string().max(100).optional(), topic: z.string().trim().min(1).max(80), question: z.string().max(2000).optional() }).strict()), async (req, res) => {
  const input = req.body;
  return respond(res, () => demoReflectionService.drawDemoXam({ address: req.ip, ...input }), "Demo xin xam draw");
});

router.post("/xin-keo/interpretation", validate(z.object({ resultToken: z.string().min(1).max(5000) }).strict()), async (req, res) => {
  const input = req.body;
  return respond(res, () => demoReflectionService.interpretDemoKeo({ address: req.ip, ...input }), "Demo xin keo interpretation");
});

router.post("/xin-xam/interpretation", validate(z.object({ resultToken: z.string().min(1).max(10000), question: z.string().max(2000).optional(), topic: z.string().min(1).max(80) }).strict()), async (req, res) => {
  const input = req.body;
  return respond(res, () => demoReflectionService.interpretDemoXam({ address: req.ip, ...input }), "Demo xin xam interpretation");
});

module.exports = router;
