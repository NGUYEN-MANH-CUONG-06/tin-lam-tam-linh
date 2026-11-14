const service = require("../services/admin.service");
const signalAdminService = require("../services/signal-admin.service");
const teamService = require("../services/admin-team.service");
const { ROLE } = require("../constants/role.constant");
const ApiError = require("../utils/api-error");
const { sendSuccess } = require("../utils/response");

async function overview(_req, res) { return sendSuccess(res, { data: await service.getOverview() }); }
const editorOwner = (req) => req.user.role === ROLE.EDITOR ? req.user.id : null;
async function articles(req, res) { return sendSuccess(res, { data: await service.listArticles(req.validated.query, editorOwner(req)) }); }
async function calendar(req, res) { return sendSuccess(res, { data: await service.listCalendarEvents(req.validated.query, editorOwner(req)) }); }
async function xam(req, res) { return sendSuccess(res, { data: await service.listXamLots(req.validated.query, editorOwner(req)) }); }
async function rituals(req, res) { return sendSuccess(res, { data: await service.listRituals(req.validated.query, editorOwner(req)) }); }
async function prayers(req, res) { return sendSuccess(res, { data: await service.listPrayers(req.validated.query, editorOwner(req)) }); }
async function interests(req, res) { return sendSuccess(res, { data: await service.listMembershipInterests(req.validated.query) }); }
async function auditLogs(req, res) { return sendSuccess(res, { data: await service.listAuditLogs(req.validated.query) }); }
async function updateArticle(req, res) { return sendSuccess(res, { data: await service.updateArticleReview(req.params.id, req.user.id, req.body) }); }
async function updateCalendar(req, res) { return sendSuccess(res, { data: await service.updateCalendarReview(req.params.id, req.user.id, req.body) }); }
async function updateXam(req, res) { return sendSuccess(res, { data: await service.updateXamReview(req.params.id, req.user.id, req.body) }); }
async function publishOriginalXamCatalog(req, res) { return sendSuccess(res, { data: await service.publishOriginalXamCatalog(req.user.id, req.body) }); }
async function updateRitual(req, res) { return sendSuccess(res, { data: await service.updateRitualReview(req.params.id, req.user.id, req.body) }); }
async function updatePrayer(req, res) { return sendSuccess(res, { data: await service.updatePrayerReview(req.params.id, req.user.id, req.body) }); }

async function signals(req, res) { return sendSuccess(res, { data: await signalAdminService.list(req.validated.query, editorOwner(req)) }); }
async function signal(req, res) {
  const data = await signalAdminService.get(req.params.id, req.user.role === ROLE.ADMIN, undefined, editorOwner(req));
  if (!data) throw new ApiError(404, "Signal not found");
  return sendSuccess(res, { data });
}
async function createSignal(req, res) { return sendSuccess(res, { statusCode: 201, data: await signalAdminService.save(null, req.user.id, req.body) }); }
async function updateSignal(req, res) {
  const data = await signalAdminService.save(req.params.id, req.user.id, req.body, undefined, req.user.role === ROLE.EDITOR);
  if (!data) throw new ApiError(404, "Signal not found");
  return sendSuccess(res, { data });
}
async function reviewSignal(req, res) {
  const data = await signalAdminService.review(req.params.id, req.user.id, req.body);
  if (!data) throw new ApiError(404, "Signal not found");
  return sendSuccess(res, { data });
}
async function withdrawSignal(req, res) {
  const data = await signalAdminService.withdrawToDraft(req.params.id, req.user.id, req.body);
  if (!data) throw new ApiError(404, "Signal not found");
  return sendSuccess(res, { data });
}
async function revokeSignalApproval(req, res) {
  const data = await signalAdminService.revokeApprovalToDraft(req.params.id, req.user.id, req.body);
  if (!data) throw new ApiError(404, "Signal not found");
  return sendSuccess(res, { data });
}
async function signalAuditLogs(req, res) { return sendSuccess(res, { data: await signalAdminService.logs(req.params.id) }); }
async function teamMembers(_req, res) { return sendSuccess(res, { data: await teamService.listMembers() }); }
async function addTeamEditor(req, res) { return sendSuccess(res, { statusCode: 201, data: await teamService.addEditorByEmail(req.body.email, req.user.id) }); }
async function updateTeamMember(req, res) { return sendSuccess(res, { data: await teamService.setEditorialAccess(req.params.id, req.body.role, req.user.id) }); }

module.exports = { overview, articles, calendar, xam, rituals, prayers, interests, auditLogs, updateArticle, updateCalendar, updateXam, publishOriginalXamCatalog, updateRitual, updatePrayer, signals, signal, createSignal, updateSignal, reviewSignal, withdrawSignal, revokeSignalApproval, signalAuditLogs, teamMembers, addTeamEditor, updateTeamMember };
