const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const requireAdmin = require("../middleware/requireAdmin.middleware");
const requireContentTeam = require("../middleware/requireContentTeam.middleware");
const requireEditor = require("../middleware/requireEditor.middleware");
const validate = require("../middleware/validation.middleware");
const controller = require("../controllers/admin.controller");
const { listSchema, idParamsSchema, reviewSchema } = require("../validators/admin.validator");
const signalAdminValidator = require("../validators/signal-admin.validator");
const { z } = require("zod");

const router = express.Router();
router.use(authenticate);
router.get("/overview", requireAdmin, controller.overview);
router.get("/culture", requireContentTeam, validate(listSchema, "query"), controller.articles);
router.patch("/culture/:id/review", requireAdmin, validate(idParamsSchema, "params"), validate(reviewSchema), controller.updateArticle);
router.get("/calendar", requireContentTeam, validate(listSchema, "query"), controller.calendar);
router.patch("/calendar/:id/review", requireAdmin, validate(idParamsSchema, "params"), validate(reviewSchema), controller.updateCalendar);
router.get("/xam", requireContentTeam, validate(listSchema, "query"), controller.xam);
router.post("/xam/original/publish", requireAdmin, validate(z.object({ reviewNote: z.string().trim().min(8).max(500) }).strict()), controller.publishOriginalXamCatalog);
router.patch("/xam/:id/review", requireAdmin, validate(idParamsSchema, "params"), validate(reviewSchema), controller.updateXam);
router.get("/rituals", requireContentTeam, validate(listSchema, "query"), controller.rituals);
router.patch("/rituals/:id/review", requireAdmin, validate(idParamsSchema, "params"), validate(reviewSchema), controller.updateRitual);
router.get("/prayers", requireContentTeam, validate(listSchema, "query"), controller.prayers);
router.patch("/prayers/:id/review", requireAdmin, validate(idParamsSchema, "params"), validate(reviewSchema), controller.updatePrayer);
router.get("/membership-interests", requireAdmin, validate(listSchema, "query"), controller.interests);
router.get("/audit-logs", requireAdmin, validate(listSchema, "query"), controller.auditLogs);
router.get("/signals", requireContentTeam, validate(signalAdminValidator.signalListSchema, "query"), controller.signals);
router.post("/signals", requireEditor, validate(signalAdminValidator.signalDraftSchema), controller.createSignal);
router.get("/signals/:id/audit-logs", requireAdmin, validate(idParamsSchema, "params"), controller.signalAuditLogs);
router.get("/signals/:id", requireContentTeam, validate(idParamsSchema, "params"), controller.signal);
router.put("/signals/:id", requireEditor, validate(idParamsSchema, "params"), validate(signalAdminValidator.signalDraftSchema), controller.updateSignal);
router.post("/signals/:id/withdraw", requireEditor, validate(idParamsSchema, "params"), validate(z.object({ expectedUpdatedAt: z.iso.datetime(), reviewNote: z.string().trim().min(8).max(500) }).strict()), controller.withdrawSignal);
router.post("/signals/:id/revoke-approval", requireAdmin, validate(idParamsSchema, "params"), validate(z.object({ expectedUpdatedAt: z.iso.datetime(), reviewNote: z.string().trim().min(8).max(500) }).strict()), controller.revokeSignalApproval);
router.patch("/signals/:id/review", requireAdmin, validate(idParamsSchema, "params"), validate(signalAdminValidator.reviewSchema), controller.reviewSignal);
router.get("/team-members", requireAdmin, controller.teamMembers);
router.post("/team-members", requireAdmin, validate(z.object({ email: z.email().trim().max(255) }).strict()), controller.addTeamEditor);
router.patch("/team-members/:id", requireAdmin, validate(idParamsSchema, "params"), validate(z.object({ role: z.enum(["USER", "EDITOR"]) }).strict()), controller.updateTeamMember);

const editor = require("../repositories/content-editor.repository");
const adminRepository = require("../repositories/admin.repository");
const { schemas } = require("../validators/content-editor.validator");
const ApiError = require("../utils/api-error");
const { sendSuccess } = require("../utils/response");
for (const kind of ["culture", "calendar", "xam", "rituals", "prayers"]) {
  router.get(`/${kind}/:id`, requireContentTeam, validate(idParamsSchema, "params"), async (req, res) => {
    const record = await editor.find(kind, req.params.id, req.user.role === "EDITOR" ? req.user.id : null);
    if (!record) throw new ApiError(404, "Không tìm thấy nội dung.");
    const editorialContext = await adminRepository.getEditorialContext({ culture: "culture_articles", calendar: "calendar_events", xam: "xin_xam", rituals: "rituals", prayers: "prayers" }[kind], req.params.id);
    return sendSuccess(res, { data: { ...record, ...editorialContext } });
  });
  router.post(`/${kind}`, requireEditor, validate(schemas[kind]), async (req, res) => {
    return sendSuccess(res, { statusCode: 201, data: await editor.save(kind, null, req.user.id, req.body) });
  });
  router.put(`/${kind}/:id`, requireEditor, validate(idParamsSchema, "params"), validate(schemas[kind]), async (req, res) => {
    const record = await editor.save(kind, req.params.id, req.user.id, req.body, true);
    if (!record) throw new ApiError(404, "Không tìm thấy nội dung.");
    if (record.versionConflict) throw new ApiError(409, "Nội dung đã được thay đổi sau khi bạn mở. Tải lại rồi thử lại.");
    if (record.workflowConflict) throw new ApiError(409, "Chỉ bản nháp mới được sửa. Hãy rút nội dung về bản nháp trước.");
    return sendSuccess(res, { data: record });
  });
  router.post(`/${kind}/:id/withdraw`, requireEditor, validate(idParamsSchema, "params"), validate(z.object({ expectedUpdatedAt: z.iso.datetime(), reviewNote: z.string().trim().min(8).max(500) }).strict()), async (req, res) => {
    const record = await editor.transitionToDraft(kind, req.params.id, req.user.id, req.body.expectedUpdatedAt, req.body.reviewNote, true);
    if (!record) throw new ApiError(404, "Không tìm thấy nội dung.");
    if (record.versionConflict) throw new ApiError(409, "Nội dung đã thay đổi. Tải lại rồi thử lại.");
    if (record.workflowConflict) throw new ApiError(409, "Nội dung đã ở trạng thái Bản nháp.");
    return sendSuccess(res, { data: record });
  });
  router.post(`/${kind}/:id/revoke-approval`, requireAdmin, validate(idParamsSchema, "params"), validate(z.object({ expectedUpdatedAt: z.iso.datetime(), reviewNote: z.string().trim().min(8).max(500) }).strict()), async (req, res) => {
    const record = await editor.revokeApprovalToDraft(kind, req.params.id, req.user.id, req.body.expectedUpdatedAt, req.body.reviewNote);
    if (!record) throw new ApiError(404, "Không tìm thấy nội dung.");
    if (record.versionConflict) throw new ApiError(409, "Nội dung đã thay đổi. Tải lại rồi thử lại.");
    if (record.workflowConflict) throw new ApiError(409, "Chỉ nội dung đã duyệt hoặc đang công khai mới có thể thu hồi duyệt để sửa.");
    return sendSuccess(res, { data: record });
  });
  router.post(`/${kind}/:id/request-changes`, requireAdmin, validate(idParamsSchema, "params"), validate(z.object({ expectedUpdatedAt: z.iso.datetime(), reviewNote: z.string().trim().min(8).max(500) }).strict()), async (req, res) => {
    const record = await editor.transitionToDraft(kind, req.params.id, req.user.id, req.body.expectedUpdatedAt, req.body.reviewNote);
    if (!record) throw new ApiError(404, "Không tìm thấy nội dung.");
    if (record.versionConflict) throw new ApiError(409, "Nội dung đã thay đổi. Tải lại rồi thử lại.");
    if (record.workflowConflict) throw new ApiError(409, "Chỉ nội dung đang chờ duyệt hoặc trạng thái thu hồi cũ mới có thể yêu cầu chỉnh sửa.");
    return sendSuccess(res, { data: record });
  });
}

module.exports = router;
