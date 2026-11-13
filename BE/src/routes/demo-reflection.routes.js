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
  if (error.code === "DEMO_RATE_LIMITED" || error.code === "DEMO_SESSION_LIMIT") return new ApiError(429, error.message);
  if (error.code === "INVALID_DEMO_REQUEST" || error.code === "INVALID_DEMO_RESULT" || error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") return new ApiError(400, "Demo request is invalid or expired.");
  if (error.code === "FORTUNE_NOT_VERIFIED") return new ApiError(409, error.message);
  if (error.code === "GEMINI_TIMEOUT") return new ApiError(504, "Gemini request timed out.", [{ code: error.code }]);
  if (error.code?.startsWith("GEMINI_")) return new ApiError(502, "Gemini interpretation is unavailable.", [{ code: error.code }]);
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

router.post("/xin-keo/interpretation", validate(z.object({ resultToken: z.string().min(1).max(5000) }).strict()), async (req, res) => {
  const input = req.body;
  return respond(res, () => demoReflectionService.interpretDemoKeo({ address: req.ip, ...input }), "Demo xin keo interpretation");
});

router.post("/xin-xam/interpretation", validate(z.object({ resultToken: z.string().min(1).max(10000), question: z.string().max(2000).optional(), topic: z.string().min(1).max(80) }).strict()), async (req, res) => {
  const input = req.body;
  return respond(res, () => demoReflectionService.interpretDemoXam({ address: req.ip, ...input }), "Demo xin xam interpretation");
});

module.exports = router;
