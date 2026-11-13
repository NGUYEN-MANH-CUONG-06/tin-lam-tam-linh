const fs = require("node:fs");
const path = require("node:path");
const dataset = require("../data/xin-xam/tltl-original-100-v1.json");
const { validateOriginalCatalog } = require("../src/services/original-xam-catalog");

const structural = validateOriginalCatalog(dataset);
const normalize = (value) => String(value || "").normalize("NFC").toLocaleLowerCase("vi").replace(/[\p{P}\p{S}\s]+/gu, "");
const records = dataset.records.map((record) => {
  const lines = record.poem.split(/\r?\n/);
  const sevenEach = lines.length === 4 && lines.every((line) => line.trim().split(/\s+/u).length === 7);
  const hasOriginalMetadata = record.systemId === dataset.systemId && record.contentType === "ORIGINAL" && record.reviewStatus === "DRAFT";
  const safeDraft = dataset.status === "DRAFT_NOT_APPROVED" && dataset.authorship?.humanApproved === false;
  const classification = sevenEach && hasOriginalMetadata && safeDraft ? "READY_FOR_HUMAN_REVIEW" : "NEEDS_REVISION";
  return { ...record, lines, classification };
});
const counts = Object.fromEntries(["READY_FOR_HUMAN_REVIEW", "NEEDS_REVISION", "REJECTED"].map((name) => [name, records.filter((r) => r.classification === name).length]));
const duplicateTitles = new Set();
const titleSeen = new Set();
const duplicatePoems = new Set();
const poemSeen = new Set();
for (const record of records) {
  const title = normalize(record.title);
  const poem = normalize(record.poem);
  if (titleSeen.has(title)) duplicateTitles.add(title);
  if (poemSeen.has(poem)) duplicatePoems.add(poem);
  titleSeen.add(title); poemSeen.add(poem);
}
const rows = records.map((r) => `| ${r.id} | ${r.title} | ${r.grade} | ${r.lines.map((line) => line.trim().split(/\s+/u).length).join("/")} | Đạt nội bộ | Cần đối chiếu độc lập | ${r.classification} | ${r.centralMeaning} |`).join("\n");
const content = `# Phase 9K – Rà soát chất lượng bộ xăm nguyên tác

- System ID: \`${dataset.systemId}\` (giữ nguyên); phiên bản nội dung: \`${dataset.datasetVersion}\`.
- Trạng thái: **DRAFT_NOT_APPROVED**. Đây là bản sáng tác biên tập có AI hỗ trợ, không phải văn bản Quan Âm, tài liệu cổ hoặc xăm truyền thống. Báo cáo này không ghi nhận phê duyệt của con người.
- Phạm vi: ${records.length}/100 quẻ; ${structural.uniqueTitles} tên riêng; ${structural.uniquePoems} bài thơ riêng; ${structural.uniquePoemLines}/400 dòng không trùng nguyên văn; số tiếng: ${JSON.stringify(structural.syllableCounts)}; nhóm phẩm cấp: ${JSON.stringify(structural.grades)}.
- Phân loại: ${JSON.stringify(counts)}. READY_FOR_HUMAN_REVIEW chỉ có nghĩa là đủ điều kiện chuyển sang biên tập viên, không có nghĩa là đã duyệt hoặc được phép phát hành.

## Rubric áp dụng

Mỗi mục được xét như tiêu chí rà soát, không phải chứng nhận tự động:

1. Ngôn ngữ tự nhiên; 2. ý nghĩa rõ; 3. hình tượng nhất quán; 4. phẩm cấp phù hợp nội dung; 5. lời khuyên thực tế; 6. không khẳng định chắc chắn tương lai; 7. không gieo sợ hãi; 8. không lặp đáng kể; 9. không mạo nhận nguồn truyền thống; 10. không sao chép.

Rà soát nội bộ không thấy tuyên bố nguồn truyền thống trong metadata; nội dung có disclaimer rõ là sáng tác mới. Tên, bài thơ và từng dòng không trùng nguyên văn trong chính dataset. Các chủ đề đời sống (kiên nhẫn, chuẩn bị, quan hệ, trách nhiệm) có giao nhau tự nhiên; đây không phải kết quả kiểm định similarity ngữ nghĩa hoặc pháp lý. Mục 10 **chưa thể được chứng nhận** bằng rà soát nội bộ; cần người có thẩm quyền đối chiếu độc lập trước phát hành.

## Thể thơ và 34 chỉnh sửa

Dataset hiện dùng bốn câu, mỗi câu bảy tiếng (đếm theo từ cách nhau bằng khoảng trắng): 400/400 dòng đạt. Đã biên tập 20 dòng từng lệch số tiếng và 14 dòng khác có cách diễn đạt gượng; một số dòng đã chỉnh tiếp để giữ câu chữ tự nhiên. Tổng cộng 34 dòng riêng biệt trên 29 quẻ được sửa, không đổi ý nghĩa nền. Không chép hoặc phỏng theo bài trong [tài liệu Scribd](https://www.scribd.com/document/985766406/100-xam-quan-am-1), trang này hiển thị “All Rights Reserved”.

Độ dài bảy tiếng không tự nó tạo thành thể thất ngôn luật thi. Các bài hiện là thơ bốn câu với nhịp/vần tự do, chưa chuẩn hóa niêm luật hoặc vần bằng trắc; nếu định vị là thất ngôn tứ tuyệt theo luật, cần biên tập viên thơ rà tiếp.

Các dòng được chỉnh (theo thứ tự quẻ và dòng):

| Quẻ | Dòng đã biên tập |
|---:|---|
| 3 | Đường thẳng khuất sau triền đá cao |
| 11 | Chum muối đầy, miệng chum chưa đậy |
| 13 | Lòng cho đi vẫn chừa phần mình |
| 22 | Người cầm bút, chọn đường mình đi |
| 23 | Gầu kéo chậm, nước trong vẫn đầy |
| 31 | Mỗi luống gieo một loại rau riêng; Vườn tươi nhờ sắc lá đan xen |
| 38 | Lần làm trật không thành bản án |
| 40 | Người chài về bến, rổ vừa đầy |
| 45 | Chỉ khiến khoản nợ lớn thêm dần |
| 48 | Nước đầu nguồn nay đục hơn rồi |
| 50 | Ý kiến khác vang lên giữa phòng; Hỏi thêm lý lẽ, cùng soi xét; Khác góc nhìn mở lối hiểu sâu |
| 51 | Hy vọng nảy từ điều gần ta |
| 52 | Điều vướng đôi khi chỉ cần sửa |
| 54 | Gánh nặng chia đều qua hai đầu |
| 55 | Cứ hỏi, cứ làm, tay vững dần |
| 56 | Có lần chia tay chẳng hơn thua |
| 57 | Hạt giống được cất nơi khô ráo |
| 60 | Kim đồng hồ trễ mất vài phút |
| 61 | Sớm gọi người xem kỹ nền móng |
| 67 | Quyền hạn mở ra bao lối đi |
| 68 | Người trước trao kìm, người sau đón |
| 69 | Hàng gạch đầu tiên đặt thẳng ngay |
| 73 | Kể chuyện ngày xưa, rồi bước tiếp |
| 75 | Chồi non mới lên cạnh khoảng trống |
| 79 | Vết rạn chạy dọc đường men xưa |
| 80 | Nói rõ từ đầu, nhẹ đôi bên |
| 85 | Cửa mở nhờ thợ khéo, kiên nhẫn |
| 91 | Kinh nghiệm soi đường, chẳng trói chân |
| 97 | Thang dựa tường, chân chưa cài chặt |

## Kết quả từng quẻ

| ID | Tên | Phẩm cấp | Tiếng từng dòng | R1–R9 | R10: không sao chép | Phân loại | Ý nghĩa nền |
|---:|---|---|---|---|---|---|---|
${rows}

## Kiểm thử và điều kiện tiếp theo

- Validator và importer dry-run: chạy riêng; xem kết quả trong báo cáo phase 9K của phiên làm việc. Dry-run không ghi database.
- Database test: SKIP vì không có \`TEST_DATABASE_URL\` trong process hoặc \`.env.test\`; không kết nối, không import và không ghi dữ liệu.
- Gemini live: một request trực tiếp với ngữ cảnh quẻ nháp ID 1, structured JSON; không qua endpoint production, không ghi kết quả, không gắn trạng thái duyệt. Cache/reload được kiểm tra bằng unit test giả lập, không phải E2E live.
- Quyền sử dụng: tài liệu công khai tham khảo ghi “All Rights Reserved”; chưa có giấy phép thương mại. Không sao chép nội dung từ đó. Cần chủ dự án cung cấp văn bản cổ/nguồn được phép hoặc xin giấy phép phù hợp.
- Trước khi phát hành: người biên tập tiếng Việt rà từng quẻ, xác nhận bản quyền và độ tương đồng, hoàn tất duyệt theo workflow hiện có, chỉ nhập vào database test chuyên biệt trước; không đổi trạng thái dataset hoặc bật routing công khai trước các bước này.
`;

const output = path.resolve(__dirname, "../docs/phase-9k-original-xam-quality-review.md");
fs.writeFileSync(output, content, "utf8");
console.log(`Wrote quality review for ${records.length} records (${JSON.stringify(counts)}): ${output}`);
