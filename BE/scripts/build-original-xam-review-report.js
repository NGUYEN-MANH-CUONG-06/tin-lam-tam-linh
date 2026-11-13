const fs = require("node:fs");
const path = require("node:path");
const dataset = require("../data/xin-xam/tltl-original-100-v1.json");
const { validateOriginalCatalog } = require("../src/services/original-xam-catalog");

const report = validateOriginalCatalog(dataset);
const cell = (value) => String(value ?? "").replaceAll("|", "\\|").replaceAll("\n", "<br>");
const rows = dataset.records.map((record) => `| ${record.id} | ${cell(record.title)} | ${cell(record.grade)} | ${cell(record.poem)} | ${cell(record.centralMeaning)} | ${cell(record.interpretationGuidance)} | ${cell(record.symbols.join(", "))} | ${cell(record.cautions.join(" "))} | ${cell(record.practicalAdvice.join(" "))} |`).join("\n");
const contents = `# Phase 9J — Báo cáo biên soạn bộ xăm nguyên tác\n\n`+
  `- System: \`${dataset.systemId}\`; dataset: \`${dataset.datasetVersion}\`.\n`+
  `- Trạng thái: **DRAFT — chưa có biên tập viên con người phê duyệt**. Nội dung được ghi nhận là bản nháp biên soạn có AI hỗ trợ; không phải quẻ Quan Âm, kinh văn hay tư liệu cổ.\n`+
  `- Kiểm tra cấu trúc: ${report.recordCount}/100; ${report.uniqueTitles} tên riêng; ${report.uniquePoems} bài thơ riêng; ${report.uniquePoemLines}/400 dòng thơ không lặp nguyên dòng. Nhịp đếm theo tiếng: ${JSON.stringify(report.syllableCounts)}. Phẩm cấp: ${JSON.stringify(report.grades)}.\n`+
  `- Tham khảo trình bày: [Scribd — 100 Xam Quan Am](https://www.scribd.com/document/985766406/100-xam-quan-am-1). Trang thể hiện “© All Rights Reserved”; chỉ tham khảo cách trình bày số quẻ/thơ/ý nghĩa/lời bàn. Không lấy thơ, bản dịch, phẩm cấp hoặc lời bàn làm dữ liệu. Báo cáo này không phải kết luận pháp lý hay chứng nhận similarity độc lập.\n`+
  `- API: backend có biến tùy chọn \`XIN_XAM_CATALOG_TYPE\`; để trống giữ nguyên pool hiện tại. Khi cấu hình bản nguyên tác, backend lấy đúng \`xam_type\`, không lọc theo topic, và chỉ trả pool khi đủ ID 1–100 đã được duyệt/phát hành. Topic người dùng chỉ đi vào Gemini context. Hiện chưa cấu hình biến này và chưa chuyển catalog mặc định.\n`+
  `- Kiểm duyệt: chưa được con người duyệt; cần biên tập viên Việt ngữ xem nhịp thơ, nghĩa, phẩm cấp, an toàn lời khuyên, khác biệt ý tưởng và đối chiếu nguồn trước phát hành. Không được đổi trạng thái sang APPROVED dựa trên validator hoặc test tự động.\n\n`+
  `| # | Tên quẻ | Phẩm cấp | Bài thơ nguyên tác | Ý nghĩa chính | Hướng luận giải | Hình tượng | Lưu ý | Gợi ý thực tế |\n`+
  `|---:|---|---|---|---|---|---|---|---|\n${rows}\n`;
const output = path.resolve(__dirname, "../docs/phase-9j-original-xam-content-review.md");
fs.writeFileSync(output, contents, "utf8");
console.log(`Wrote review table for ${dataset.records.length} drafts: ${output}`);
