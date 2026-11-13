const { z } = require("zod");
const { hasCompleteXamPoem, normalizeXamPoemLines } = require("../../../shared/xin-xam-publication.mjs");
const text = z.string().trim();
const common = {
  expectedUpdatedAt: z.iso.datetime().optional(),
  source: text.max(2000).refine((value) => !value || /^https:\/\//i.test(value), "Nguồn phải là URL HTTPS"),
  region: z.enum(["NORTH", "CENTRAL", "SOUTH", "NATIONWIDE"]),
  category: text.max(100).optional(),
  image_url: text.max(2000).refine((value) => !value || /^https:\/\//i.test(value) || /^\/images\/[\w./-]+$/.test(value)).optional(),
  provenance: z.object({
    contentType: z.enum(["GROUP_AUTHORED", "FACT", "LEGEND", "QUOTATION"]).optional(),
    sourceTitle: text.max(300),
    sourceAuthor: text.max(300),
    bibliography: text.max(1000),
    sourceLocator: text.max(500),
    localCommunity: text.max(300),
    contentRightsBasis: text.max(1000),
    imageCaption: text.max(500),
    imageSource: text.max(1000),
    imageRightsBasis: text.max(1000),
  }).strict().optional(),
  reviewNote: text.max(500).optional(),
};
const section = z.object({ heading: text.max(200), body: text.max(20000) }).strict();
const ritualStep = z.object({ title: text.max(255), description: text.max(10000) }).strict();
const checklistItem = z.object({
  id: z.string().trim().min(1).max(100).regex(/^[A-Za-z0-9_-]+$/),
  label: text.min(1).max(500),
}).strict();
const articleProvenance = z.object({
  contentType: z.enum(["GROUP_AUTHORED", "FACT", "LEGEND", "QUOTATION"]).optional(),
  sourceTitle: text.max(300),
  sourceAuthor: text.max(300),
  bibliography: text.max(1000),
  sourceLocator: text.max(500),
  localCommunity: text.max(300),
  contentRightsBasis: text.max(1000),
  imageCaption: text.max(500),
  imageSource: text.max(1000),
  imageRightsBasis: text.max(1000),
}).strict();
const ritualProvenance = z.object({
    contentType: z.enum(["GROUP_AUTHORED", "FACT", "LEGEND", "QUOTATION"]).optional(),
  authorOrOrganization: text.max(300),
  scope: text.max(500),
  sourceTitle: text.max(300),
  sourceAuthor: text.max(300),
  bibliography: text.max(1000),
  sourceLocator: text.max(500),
  localCommunity: text.max(300),
  contentRightsBasis: text.max(1000),
  imageCaption: text.max(500).optional(),
  imageCredit: text.max(1000).optional(),
  imageSource: text.max(1000).optional(),
  imageRightsBasis: text.max(1000).optional(),
}).strict();
const workflowStatus = z.enum(["DRAFT", "IN_REVIEW"]);
function requireForReview(schema, check) {
  return schema.superRefine((value, ctx) => {
    if (value.editorialStatus !== "IN_REVIEW") return;
    if ((value.reviewNote || "").trim().length < 8) {
      ctx.addIssue({ code: "custom", path: ["reviewNote"], message: "Ghi chú gửi duyệt cần tối thiểu 8 ký tự." });
    }
    check(value, ctx);
  });
}

const schemas = {
  culture: requireForReview(z.object({ ...common, editorialStatus: workflowStatus, provenance: articleProvenance, slug: text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(160), title: text.min(1).max(255), category: text.max(100), excerpt: text.max(2000), image_url: text.max(2000).refine((value) => !value || /^https:\/\//i.test(value) || /^\/images\/[\w./-]+$/.test(value)), sections: z.array(section).max(30), members_only: z.boolean().default(false) }).strict(), (value, ctx) => {
    const provenance = value.provenance;
    if (!provenance.contentType) ctx.addIssue({ code: "custom", path: ["provenance", "contentType"], message: "Hãy chọn tính chất biên soạn." });
    if (value.sections.length === 0 || value.sections.some((item) => !item.heading.trim() || !item.body.trim())) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: "Mỗi phân mục cần có tiêu đề và nội dung." });
    }
    if (!value.sections.some((item) => item.body.trim().length >= 120)) {
      ctx.addIssue({ code: "custom", path: ["sections"], message: "Cần ít nhất một phân mục có nội dung từ 120 ký tự." });
    }
    if (provenance.contentType === "GROUP_AUTHORED") {
      if (!provenance.contentRightsBasis.trim()) ctx.addIssue({ code: "custom", path: ["provenance", "contentRightsBasis"], message: "Hãy ghi căn cứ quyền nội dung nguyên bản." });
    } else {
      if (!provenance.sourceTitle.trim()) ctx.addIssue({ code: "custom", path: ["provenance", "sourceTitle"], message: "Hãy nhập tên nguồn tư liệu." });
      if (!(provenance.bibliography.trim() || value.source.trim())) ctx.addIssue({ code: "custom", path: ["provenance", "bibliography"], message: "Hãy nhập thông tin thư mục hoặc URL nguồn." });
      if (!provenance.sourceLocator.trim()) ctx.addIssue({ code: "custom", path: ["provenance", "sourceLocator"], message: "Hãy nhập trang hoặc vị trí trích dẫn." });
    }
    if (value.image_url && (!provenance.imageCaption.trim() || !provenance.imageSource.trim() || !provenance.imageRightsBasis.trim())) {
      ctx.addIssue({ code: "custom", path: ["provenance"], message: "Ảnh cần chú thích, nguồn ảnh và căn cứ quyền sử dụng." });
    }
  }),
  calendar: requireForReview(z.object({ ...common, editorialStatus: workflowStatus, title: text.min(1).max(255), description: text.max(10000), category: text.max(100), calendar: z.enum(["LUNAR", "SOLAR"]), day: z.number().int().min(1).max(31).nullable(), month: z.number().int().min(1).max(12).nullable() }).strict(), (value, ctx) => {
    if (!/^https:\/\/[^\s]+$/i.test(value.source.trim())) {
      ctx.addIssue({ code: "custom", path: ["source"], message: "Lịch sự kiện cần URL nguồn HTTPS trước khi gửi duyệt." });
    }
    if (value.day === null || value.month === null) {
      ctx.addIssue({ code: "custom", path: [value.day === null ? "day" : "month"], message: "Sự kiện cần có ngày và tháng trước khi gửi duyệt." });
      return;
    }
    const maxDay = value.calendar === "LUNAR" ? 30 : [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][value.month - 1];
    if (value.day > maxDay) ctx.addIssue({ code: "custom", path: ["day"], message: "Ngày không hợp lệ với tháng và hệ lịch đã chọn." });
  }),
  xam: requireForReview(z.object({ ...common, editorialStatus: workflowStatus, stick_number: z.number().int().min(1).max(100), xam_type: text.min(1).max(100), category: text.max(100), name: text.max(255), fortune_level: text.max(80), poem: text.max(10000).transform((value) => normalizeXamPoemLines(value).join("\n")), meaning: text.max(20000), advice: text.max(10000) }).strict(), (value, ctx) => {
    const original = value.xam_type.startsWith("TLTL_ORIGINAL_100_V1:");
    const allowedGrades = original ? ["THUẬN", "BÌNH", "CẨN TRỌNG"] : ["Thượng Cát", "Trung Cát", "Hạ Bình", "Bình"];
    if (!allowedGrades.includes(value.fortune_level)) ctx.addIssue({ code: "custom", path: ["fortune_level"], message: "Phẩm cấp không phù hợp với hệ thống xăm." });
    if (!hasCompleteXamPoem(value.poem)) ctx.addIssue({ code: "custom", path: ["poem"], message: "Thẻ xăm cần đủ bốn dòng thơ." });
    if (!value.meaning.trim() || !value.advice.trim()) ctx.addIssue({ code: "custom", path: ["meaning"], message: "Cần có ý nghĩa và lời khuyên trước khi gửi duyệt." });
    if (!original && !/^https:\/\//i.test(value.source.trim())) ctx.addIssue({ code: "custom", path: ["source"], message: "Thẻ xăm cần URL nguồn HTTPS trước khi gửi duyệt." });
  }),
  rituals: requireForReview(z.object({
    ...common,
    editorialStatus: workflowStatus,
    slug: text.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(255),
    title: text.min(1).max(255),
    description: text.max(10000),
    occasion: text.max(150),
    calendar: z.enum(["LUNAR", "SOLAR"]).optional().nullable(),
    steps: z.array(ritualStep).max(50),
    checklists: z.array(checklistItem).max(100).refine((items) => new Set(items.map((item) => item.id)).size === items.length, "ID checklist phải duy nhất").optional(),
    provenance: ritualProvenance.optional(),
  }).strict(), (value, ctx) => {
    const provenance = value.provenance || {};
    if (!provenance.contentType) ctx.addIssue({ code: "custom", path: ["provenance", "contentType"], message: "Hãy chọn phương thức biên soạn." });
    if (value.steps.length === 0 || value.steps.some((step) => !step.title.trim() || !step.description.trim())) {
      ctx.addIssue({ code: "custom", path: ["steps"], message: "Mỗi bước nghi lễ cần có tên và mô tả." });
    }
    if (!value.checklists?.some((item) => item.id.trim() && item.label.trim())) {
      ctx.addIssue({ code: "custom", path: ["checklists"], message: "Nghi lễ cần ít nhất một mục checklist có nội dung trước khi gửi duyệt." });
    }
    if (provenance.contentType === "GROUP_AUTHORED") {
      if (!provenance.authorOrOrganization?.trim() || !provenance.scope?.trim() || !provenance.contentRightsBasis?.trim()) {
        ctx.addIssue({ code: "custom", path: ["provenance"], message: "Nghi lễ tự biên soạn cần người biên soạn, phạm vi áp dụng và căn cứ quyền nội dung." });
      }
    } else if (!/^https:\/\//i.test(value.source.trim()) || !provenance.sourceLocator.trim()) {
      ctx.addIssue({ code: "custom", path: ["source"], message: "Nghi lễ dựa trên tư liệu cần URL HTTPS và vị trí trích dẫn." });
    }
    if (value.image_url) {
      if (!String(provenance.imageCaption || "").trim()) {
        ctx.addIssue({ code: "custom", path: ["provenance", "imageCaption"], message: "Ảnh nghi lễ cần có chú thích." });
      }
      if (!String(provenance.imageCredit || "").trim()) {
        ctx.addIssue({ code: "custom", path: ["provenance", "imageCredit"], message: "Ảnh nghi lễ cần có tác giả hoặc thông tin ghi công." });
      }
      if (!/^https:\/\/[^\s]+$/i.test(String(provenance.imageSource || "").trim())) {
        ctx.addIssue({ code: "custom", path: ["provenance", "imageSource"], message: "Ảnh nghi lễ cần URL HTTPS của trang nguồn ảnh." });
      }
      if (!String(provenance.imageRightsBasis || "").trim()) {
        ctx.addIssue({ code: "custom", path: ["provenance", "imageRightsBasis"], message: "Ảnh nghi lễ cần căn cứ quyền sử dụng." });
      }
    }
  }),
  prayers: requireForReview(z.object({
    ...common,
    editorialStatus: workflowStatus,
    title: text.min(1).max(255),
    content: text.max(50000),
    language_style: text.max(100),
    ritual_id: z.preprocess((value) => value === "" ? null : value, z.string().uuid().nullable().optional()),
  }).strict(), (value, ctx) => {
    if (!value.content.trim()) ctx.addIssue({ code: "custom", path: ["content"], message: "Hãy nhập nội dung văn khấn trước khi gửi duyệt." });
    if (!value.ritual_id) ctx.addIssue({ code: "custom", path: ["ritual_id"], message: "Văn khấn cần gắn với một nghi lễ đã công khai trước khi gửi duyệt." });
  }),
};
module.exports = { schemas };
