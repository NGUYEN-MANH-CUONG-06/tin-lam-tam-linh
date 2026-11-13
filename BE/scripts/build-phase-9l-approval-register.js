const fs = require("node:fs");
const path = require("node:path");
const dataset = require("../data/xin-xam/tltl-original-100-v1.json");

const csv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const headers = [
  "ID", "Tên quẻ", "Phẩm cấp", "Bài thơ", "Ý nghĩa", "Lời khuyên",
  "Kết quả rà soát nội bộ", "Kết quả rà soát tương đồng", "Reviewer",
  "Ngày duyệt", "Quyết định APPROVE/REVISE/REJECT", "Ghi chú",
];
const rows = dataset.records.map((record) => [
  record.id,
  record.title,
  record.grade,
  record.poem,
  record.centralMeaning,
  record.practicalAdvice.join("\n"),
  "Phase 9K: READY_FOR_HUMAN_REVIEW; chưa được người có thẩm quyền duyệt.",
  "CHƯA ĐƯỢC XÁC MINH ĐỘC LẬP; cần lưu nguồn/công cụ/phạm vi đối chiếu.",
  "",
  "",
  "",
  "Chủ dự án/biên tập viên tự ghi quyết định và căn cứ; không phát hành trước khi xác nhận quyền sử dụng.",
]);
const contents = "\uFEFF" + [headers, ...rows].map((row) => row.map(csv).join(",")).join("\r\n");
const csvOutput = path.resolve(__dirname, "../docs/phase-9l-approval-register.csv");
const markdownRows = dataset.records.map((record) => [
  `## ${record.id}. ${record.title}`,
  "",
  `- **Phẩm cấp:** ${record.grade}`,
  "- **Bài thơ:**",
  "",
  "```text",
  record.poem,
  "```",
  "",
  `- **Ý nghĩa:** ${record.centralMeaning}`,
  `- **Lời khuyên:** ${record.practicalAdvice.join(" ")}`,
  "- **Rà soát nội bộ:** Phase 9K – READY_FOR_HUMAN_REVIEW; chưa được người có thẩm quyền duyệt.",
  "- **Rà soát tương đồng:** CHƯA ĐƯỢC XÁC MINH ĐỘC LẬP; cần ghi nguồn, công cụ, phạm vi và ngày đối chiếu.",
  "- **Reviewer:** ____________________________________",
  "- **Ngày duyệt:** ____________________",
  "- **Quyết định:** [ ] APPROVE  [ ] REVISE  [ ] REJECT",
  "- **Ghi chú/căn cứ:** ______________________________________________________________",
].join("\n")).join("\n\n---\n\n");
const markdown = `# Phase 9L – Hồ sơ duyệt 100 quẻ\n\nSystem: \`${dataset.systemId}\`; dataset: \`${dataset.datasetVersion}\`; trạng thái nguồn: \`${dataset.status}\`. Không có reviewer/ngày/quyết định nào được tự điền. Mỗi mục cần được con người quyết định và ghi bằng chứng quyền sử dụng trước khi publish.\n\n${markdownRows}\n`;
const markdownOutput = path.resolve(__dirname, "../docs/phase-9l-content-approval-review.md");
fs.writeFileSync(csvOutput, contents, "utf8");
fs.writeFileSync(markdownOutput, markdown, "utf8");
console.log(`Wrote ${rows.length} undecided review rows: ${markdownOutput} and ${csvOutput}`);
