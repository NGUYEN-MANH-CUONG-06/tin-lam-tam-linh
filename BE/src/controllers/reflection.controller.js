const reflectionService = require("../services/reflection.service");
const xinKeoService = require("../services/xin-keo.service");
const { sendSuccess } = require("../utils/response");

async function saveXam(req, res) { return sendSuccess(res, { statusCode: 201, message: "Xin xam saved", data: await reflectionService.saveXamDraw(req.user.id, req.body) }); }
async function drawXam(req, res) { return sendSuccess(res, { statusCode: 201, message: "Xin xam drawn", data: await reflectionService.drawXam(req.user?.id, req.body) }); }
async function listXam(req, res) { return sendSuccess(res, { message: "Saved xin xam retrieved", data: { items: await reflectionService.listSavedXam(req.user.id) } }); }
async function updateXam(req, res) { return sendSuccess(res, { message: "Saved xin xam updated", data: await reflectionService.updateXamStar(req.user.id, req.params.id, req.body.starred) }); }
async function deleteXam(req, res) { await reflectionService.deleteXam(req.user.id, req.params.id); return sendSuccess(res, { message: "Saved xin xam deleted" }); }
async function listWishes(req, res) { return sendSuccess(res, { message: "Saved wishes retrieved", data: { items: await reflectionService.listWishes(req.user.id) } }); }
async function createWish(req, res) { return sendSuccess(res, { statusCode: 201, message: "Wish saved", data: await reflectionService.createWish(req.user.id, req.body) }); }
async function updateWish(req, res) { return sendSuccess(res, { message: "Wish updated", data: await reflectionService.updateWishStar(req.user.id, req.params.id, req.body.starred) }); }
async function deleteWish(req, res) { await reflectionService.deleteWish(req.user.id, req.params.id); return sendSuccess(res, { message: "Wish deleted" }); }
async function createKeoSession(req, res) { return sendSuccess(res, { statusCode: 201, message: "Xin keo session created", data: await xinKeoService.createSession(req.user.id, req.body.question, req.body.drawId) }); }
async function throwKeo(req, res) {
  const result = await xinKeoService.throwKeo(
    req.user.id,
    req.params.id,
    req.body.requestId
  );

  return sendSuccess(res, {
    message: "Xin keo cast",
    data: result,
  });
}
async function interpretKeo(req, res) {
  const data = await xinKeoService.interpretThrow(req.user.id, req.params.id, req.params.throwId, req.body);
  return sendSuccess(res, { message: "Xin keo interpretation retrieved", data });
}
async function interpretXam(req, res) {
  const data = await reflectionService.interpretXam(req.user.id, req.params.id, req.body);
  return sendSuccess(res, { message: "Xin xam interpretation retrieved", data });
}
async function listKeoSessions(req, res) { return sendSuccess(res, { message: "Xin keo sessions retrieved", data: { items: await xinKeoService.listSessions(req.user.id) } }); }
async function tossKeo(req, res) {
  const session = req.body.sessionId
    ? { id: req.body.sessionId }
    : await xinKeoService.createSession(req.user.id, req.body.question, req.body.drawId);
  const result = await xinKeoService.throwKeo(req.user.id, session.id);
  return sendSuccess(res, { statusCode: 201, message: "Xin keo cast", data: { sessionId: session.id, ...result } });
}

async function getXamAvailability(req, res) {
  const data = await reflectionService.getXamAvailability(
    req.validated.query,
  );

  return sendSuccess(res, {
    message: "Đã kiểm tra thư viện thẻ",
    data,
  });
}

async function getKeoSession(req, res) {
  const session = await xinKeoService.getSession(
    req.user.id,
    req.params.id,
  );

  return sendSuccess(res, {
    message: "Đã tải phiên xin keo",
    data: session,
  });
}

module.exports = {
  getXamAvailability,
  drawXam,
  saveXam,
  listXam,
  updateXam,
  deleteXam,
  listWishes,
  createWish,
  updateWish,
  deleteWish,
  createKeoSession,
  getKeoSession,
  throwKeo,
  interpretKeo,
  interpretXam,
  listKeoSessions,
  tossKeo,
};
