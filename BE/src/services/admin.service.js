const repository = require("../repositories/admin.repository");
const ApiError = require("../utils/api-error");

async function updateReview(model, id, actorId, input) {
  const patch = {};
  if (input.active !== undefined) patch.active = input.active;
  if (input.verified !== undefined) patch.verified = input.verified;
  const result = await repository.updateReview({ model, id, actorId, patch, expectedUpdatedAt: input.expectedUpdatedAt, reviewNote: input.reviewNote, rightsConfirmed: input.rightsConfirmed, imageRightsConfirmed: input.imageRightsConfirmed, source: input.source, sourceLocator: input.sourceLocator, usageRights: input.usageRights });
  if (!result) throw new ApiError(404, "Content record not found");
  if (result.sourceRequired) throw new ApiError(422, "A verified HTTPS source is required before marking this item verified");
  if (result.rightsConfirmationRequired) throw new ApiError(422, "Người duyệt cần xác nhận căn cứ quyền nội dung phù hợp; nếu có ảnh, cần xác nhận riêng hồ sơ quyền ảnh.");
  if (result.imageCaptionRequired) throw new ApiError(422, "Ảnh tổng quan nghi lễ cần có chú thích trước khi duyệt.");
  if (result.imageCreditRequired) throw new ApiError(422, "Ảnh tổng quan nghi lễ cần có tác giả hoặc thông tin ghi công trước khi duyệt.");
  if (result.imageSourceRequired) throw new ApiError(422, "Ảnh tổng quan nghi lễ cần URL HTTPS của trang nguồn ảnh trước khi duyệt.");
  if (result.imageRightsBasisRequired) throw new ApiError(422, "Ảnh tổng quan nghi lễ cần có căn cứ quyền sử dụng trước khi duyệt.");
  if (result.imageRightsConfirmationRequired) throw new ApiError(422, "Người duyệt cần xác nhận đã kiểm tra hồ sơ quyền của ảnh tổng quan nghi lễ.");
  if (result.approvalRequired) throw new ApiError(422, "Chỉ nội dung đã được duyệt mới có thể chuyển sang trạng thái xuất bản.");
  if (result.catalogPublicationRequired) throw new ApiError(422, "Quẻ nguyên tác chỉ được phát hành cùng toàn bộ catalog.");
  if (result.approvalVersionMismatch) throw new ApiError(409, "Phiên bản nội dung không khớp với bản đã duyệt. Hãy đưa về bản nháp, gửi duyệt và duyệt lại trước khi công khai.");
  if (result.invalidTransition) throw new ApiError(422, "Thao tác không hợp lệ với trạng thái nội dung hiện tại.");
  if (result.revokeApprovalRequired) throw new ApiError(422, "Dùng thao tác thu hồi duyệt để đưa nội dung về bản nháp.");
  if (result.reviewRequired) throw new ApiError(422, "Chỉ bản IN_REVIEW mới được duyệt. Hãy gửi bản thảo chờ duyệt trước.");
  if (result.reviewAndPublishInOneStep) throw new ApiError(422, "Cần duyệt nội dung trước, sau đó mới phát hành ở thao tác riêng.");
  if (result.reviewerRequired) throw new ApiError(422, "Tài khoản người duyệt cần có tên hồ sơ trước khi xác nhận.");
  if (result.versionConflict) throw new ApiError(409, "Nội dung đã được thay đổi sau khi bạn mở. Tải lại rồi thử lại.");
  if (result.provenanceRequired) throw new ApiError(422, "Văn khấn/nghi lễ cần locator cụ thể và căn cứ quyền sử dụng trước khi xác minh.");
  if (result.ritualRequired) throw new ApiError(422, "Văn khấn cần gắn với một nghi lễ trước khi công khai.");
  if (result.publishedRitualRequired) throw new ApiError(422, "Nghi lễ liên kết cần được duyệt và công khai trước khi công khai văn khấn.");
  if (result.groupAuthorshipRequired) throw new ApiError(422, "Hướng dẫn nguyên bản cần khai báo người/nhóm biên soạn, phạm vi áp dụng và căn cứ quyền thực tế trước khi xác minh.");
  if (result.sourceInvalid) throw new ApiError(422, "Nguồn văn khấn/nghi lễ phải là liên kết HTTPS hợp lệ.");
  if (result.xamContentRequired) throw new ApiError(422, "Quẻ cần đủ 4 dòng thơ và phần luận giải trước khi xác minh. Người duyệt cần kiểm tra nội dung và quyền sử dụng nguồn.");
  if (result.contentRequired) throw new ApiError(422, "Cần bổ sung hồ sơ nguồn phù hợp loại nội dung và vị trí nguồn; nếu có ảnh thì cần chú thích, nguồn ảnh và căn cứ quyền trước khi duyệt.");
  if (result.checklistRequired) throw new ApiError(422, "Nghi lễ cần ít nhất một mục checklist hợp lệ trước khi xuất bản.");
  return result.updated;
}

async function publishOriginalXamCatalog(actorId, input) {
  const result = await repository.publishOriginalXamCatalog({ actorId, reviewNote: input.reviewNote });
  if (result.catalogIncomplete) throw new ApiError(422, `Bộ quẻ chưa đủ 100 bản ghi (hiện có ${result.count}).`);
  if (result.catalogIdsInvalid) throw new ApiError(422, "Mã quẻ phải đầy đủ, duy nhất và liên tục từ 1 đến 100.");
  if (result.cardsNotApproved) throw new ApiError(422, "Tất cả 100 quẻ phải được duyệt riêng trước khi phát hành.");
  if (result.contentIncomplete) throw new ApiError(422, "Bộ quẻ có nội dung chưa đầy đủ hoặc chưa được ghi nhận duyệt.");
  if (result.approvalVersionMismatch) throw new ApiError(409, "Nội dung đã thay đổi kể từ lần duyệt; cần duyệt lại trước khi phát hành.");
  if (result.versionConflict) throw new ApiError(409, "Catalog vừa được cập nhật đồng thời. Tải lại trạng thái rồi thử lại.");
  return result;
}

module.exports = {
  getOverview: repository.getOverview,
  listArticles: (params, actorId) => repository.listArticles(params, actorId),
  listCalendarEvents: (params, actorId) => repository.listCalendarEvents(params, actorId),
  listXamLots: (params, actorId) => repository.listXamLots(params, actorId),
  listRituals: (params, actorId) => repository.listRituals(params, actorId),
  listPrayers: (params, actorId) => repository.listPrayers(params, actorId),
  listMembershipInterests: repository.listMembershipInterests,
  listAuditLogs: repository.listAuditLogs,
  updateArticleReview: (id, actorId, input) => updateReview("culture_articles", id, actorId, input),
  updateCalendarReview: (id, actorId, input) => updateReview("calendar_events", id, actorId, input),
  updateXamReview: (id, actorId, input) => updateReview("xin_xam", id, actorId, input),
  updateRitualReview: (id, actorId, input) => updateReview("rituals", id, actorId, input),
  updatePrayerReview: (id, actorId, input) => updateReview("prayers", id, actorId, input),
  publishOriginalXamCatalog,
};
