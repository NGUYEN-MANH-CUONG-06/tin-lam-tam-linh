# Tổng kết công việc từ đầu phiên đến hiện tại

**Dự án:** Tin Lắm Tâm Linh  
**Phạm vi:** Thuật toán Xin keo/Xin xăm, backend/frontend demo, Gemini, dữ liệu catalog và quy trình duyệt/phát hành.  
**Thời điểm tổng kết:** 14-11-2026.

## Tình trạng hiện tại

- Bộ sáng tác `TLTL_ORIGINAL_100_V1` có đủ 100 quẻ, version `1.0.1-draft`, 400 dòng thơ đều có 7 tiếng.
- 100 quẻ ở trạng thái `READY_FOR_HUMAN_REVIEW`; **0 quẻ được người có thẩm quyền duyệt**.
- Test offline liên quan tới catalog/Gemini: **27/27 PASS** trong lượt kiểm thử Phase 9L; validator, importer dry-run và Prisma schema validation cũng PASS.
- Chưa có `TEST_DATABASE_URL`/`.env.test`: database TLS, Prisma connection/read-back, import thật và FE–BE E2E chưa được kiểm chứng.
- Chưa xác minh độc lập quyền sử dụng thương mại hoặc độ tương đồng; chưa đủ điều kiện phát hành production.

## Lịch sử theo giai đoạn

### Khảo sát và kiểm thử Xin keo/Xin xăm

- Rà soát thuật toán gieo keo/rút xăm và bổ sung test có RNG kiểm soát cùng kiểm tra phân phối.
- Test Xin keo bao gồm bốn tổ hợp hai mặt keo, lấy mẫu đúng hai lần, không gieo lại theo kết quả và kiểm tra phân phối fair-side.
- Test Xin xăm bao gồm chỉ số chọn, catalog rỗng/trùng/không hợp lệ và kiểm tra phân phối gần đều.
- Có test FE demo cho bốn tổ hợp Xin keo và mô phỏng hai mặt công bằng.
- Các file liên quan hiện có: `BE/src/services/xin-keo-algorithm.js`, `BE/src/services/xin-xam-algorithm.js`, `BE/tests/xin-keo-algorithm.unit.test.js`, `BE/tests/xin-xam-algorithm.unit.test.js`, `FE/src/data/xinKeoAlgorithm.mjs`, `FE/tests/xin-keo-xam-algorithm.test.mjs`.

### Phase 9B – Gemini và FE demo/backend

- Xây đường tích hợp Gemini luận giải và cơ chế FE demo/BE cho reflection; có demo service và route riêng.
- Có kiểm tra cấu trúc phản hồi Gemini và các test fixture cho nội dung diễn giải.
- Việc FE–BE E2E trên môi trường có database riêng chưa hoàn thành; không coi việc FE demo hoạt động là bằng chứng endpoint production đã được gọi.

### Phase 9C, 9C.1 và 9C.2 – Gemini live, Supabase và TLS

- Các kết quả Phase 9C được cung cấp trong yêu cầu tiếp nối: Gemini fallback model, structured output, `interpretKeo()` và Prisma `SELECT 1` đã PASS; DNS/TCP Supabase PASS nhưng xác minh TLS thất bại; backend startup/API E2E khi đó SKIP.
- Prisma dùng driver adapter `pg`; cấu hình client hiện yêu cầu CA hợp lệ và xác minh chứng thư, không chủ ý tắt `rejectUnauthorized`.
- Trong Phase 9L không có database test URL, nên các kết quả DNS/TCP/SELECT 1 cũ không được xem là bằng chứng TLS hoặc readiness hiện tại. Không chạy migration/reset/import ghi.

### Phase 9E–9F – Hoàng Đại Tiên và căn cứ dữ liệu

- Tạo validator/importer và hồ sơ research/provenance cho catalog Hoàng Đại Tiên.
- Khi bắt đầu Phase 9F, catalog dữ liệu đủ căn cứ vẫn thiếu; kết quả file hiện tại `BE/data/xin-xam/wong-tai-sin-100.json` có **0 record**.
- Nguồn trực tuyến không tự tạo quyền sao chép. Quyền đối với văn bản cổ cần được phân biệt với quyền đối với bản dịch, biên tập và chú giải hiện đại; chưa có license thương mại được xác nhận trong repository.

### Phase 9H – Quan Âm CTC

- Tạo cấu trúc research/validation/import cho bộ Quan Âm CTC và yêu cầu giữ provenance/quyền sử dụng.
- Manifest hiện tại `BE/data/xin-xam/guanyin-100-hk-ctc.json` có **0 record**, chưa đủ điều kiện import hoặc production.

### Phase 9J – Bộ sáng tác nguyên tác 100 quẻ

- Tạo catalog `TLTL_ORIGINAL_100_V1` với đủ 100 bản nháp, ID 1–100, phẩm cấp, bốn câu thơ, ý nghĩa, hình tượng, chủ đề, lời khuyên và hướng dẫn Gemini.
- Metadata nêu rõ `AI_ASSISTED_EDITORIAL_DRAFT`, `DRAFT_NOT_APPROVED`, không mạo nhận xăm Quan Âm/Hoàng Đại Tiên/văn bản cổ; quy trình publication yêu cầu duyệt nội dung và xác nhận quyền.
- Có builder, validator, importer chỉ cho phép apply khi `NODE_ENV=test` và `DATABASE_URL` trùng chính xác `TEST_DATABASE_URL`; có test duplicate, import planning, routing và publication gate.

### Phase 9K – Rà soát nội dung

- Đọc và rà 100 quẻ; sửa 20 dòng trước đó không đủ 7 tiếng và 14 dòng khác có câu chữ gượng: tổng cộng **34 dòng trên 29 quẻ** được biên tập.
- Xác nhận lại 400/400 dòng bảy tiếng, 100 tên/bài thơ riêng và 400 dòng không trùng nguyên văn trong chính dataset.
- Phân loại nội bộ: 100 `READY_FOR_HUMAN_REVIEW`, 0 `NEEDS_REVISION`, 0 `REJECTED`. Không đánh dấu `APPROVED`.
- Thể thơ hiện là bốn câu, nhịp/vần tự do; chưa khẳng định là thất ngôn tứ tuyệt theo niêm luật.
- Phiên bản tăng từ `1.0.0-draft` lên `1.0.1-draft`; giữ `systemId`, ID và nội dung quẻ khác không đổi. Importer tính fingerprint theo nội dung/version hiện hành.

### Phase 9L – Hồ sơ duyệt và kiểm thử tích hợp

- Tạo bảng CSV duyệt đủ 100 quẻ tại `BE/docs/phase-9l-approval-register.csv`; reviewer, ngày và quyết định để trống.
- Rà metadata/quy trình biên soạn/nguồn tham khảo và ghi checklist quyền sử dụng; không tuyên bố đã được cấp license hoặc chứng nhận similarity.
- Thêm test cache hit sau reload và test cache bị vô hiệu khi câu hỏi đổi trên cùng `resultId`.
- Xác nhận `XIN_XAM_CATALOG_TYPE` chưa cấu hình trong BE environment; không bật catalog production.
- Database và E2E SKIP do thiếu database test riêng.

## Kết quả kiểm thử đã thực hiện trong Phase 9L

| Lệnh | Kết quả |
|---|---|
| `npm.cmd run data:original-xam:validate` | PASS — 100/100, 400/400 dòng 7 tiếng |
| `npm.cmd run data:original-xam:import:dry-run` | PASS — `DRY_RUN_NO_DATABASE`, 100 `CREATE_DRAFT`; không ghi DB |
| `npm.cmd run prisma:validate` | PASS — Prisma schema hợp lệ |
| `npm.cmd run test:original-xam:offline` | PASS — 19/19 |
| `node --test --test-concurrency=1 tests/fortune-interpretation.unit.test.js` | PASS — 8/8; gồm fallback tối đa một lần sau 5xx, structured output, timeout/fail-closed |

Tổng 27 test fixture/offline PASS, 0 FAIL, 0 SKIP. Các test này không phải API E2E hoặc database integration.

### Gemini live đã làm

Trong Phase 9K có một smoke request trực tiếp qua service, dùng một quẻ nháp, structured output và không gọi endpoint production. Kết quả ghi nhận khi đó là PASS với model `gemini-3.5-flash-lite`. Phase 9L không gọi live; chỉ dùng fixtures. Không chạy hàng loạt 100 quẻ.

## Files/chức năng chính hiện có

- Thuật toán: `BE/src/services/xin-keo-algorithm.js`, `BE/src/services/xin-xam-algorithm.js`; test ở `BE/tests/xin-keo-algorithm.unit.test.js`, `BE/tests/xin-xam-algorithm.unit.test.js`.
- FE demo: `FE/src/data/demoMode.ts`, `FE/src/data/reflectionService.ts`, `BE/src/services/demo-reflection.service.js`, `BE/src/routes/demo-reflection.routes.js`.
- Gemini: `BE/src/services/fortune-interpretation.service.js`; fixtures ở `BE/tests/original-xam-gemini.unit.test.js` và `BE/tests/fortune-interpretation.unit.test.js`.
- Prisma/TLS: `BE/src/config/create-prisma-client.js`; client kiểm tra CA/hostname cho kết nối remote.
- Catalog nguyên tác: `BE/data/xin-xam/tltl-original-100-v1.json`, `BE/scripts/build-original-xam-dataset.js`, `BE/scripts/validate-original-xam.js`, `BE/scripts/import-original-xam.js`, `BE/src/services/original-xam-catalog.js`.
- Hồ sơ Phase 9L: `BE/scripts/build-phase-9l-approval-register.js`, `BE/docs/phase-9l-approval-register.csv`.

## Việc còn thiếu trước khi phát hành

1. Biên tập viên/người có thẩm quyền duyệt từng quẻ; nhập reviewer, ngày, quyết định và căn cứ thật.
2. Đối chiếu độc lập similarity và xác nhận quyền thương mại cho toàn bộ nội dung/quy trình AI-biên tập.
3. Tạo Supabase project/branch test riêng, lấy connection URI và CA từ Dashboard, cấu hình `.env.test`; tuyệt đối không dùng production URL.
4. Kiểm tra TLS/Prisma/readiness, chạy import vào test DB, xác nhận uniqueness, fingerprint, idempotency và read-back.
5. Chạy API/E2E trên test DB: availability, rút quẻ, luận giải, cache/reload và không trừ lượt lặp.
6. Publish riêng các record đã duyệt; xác nhận `XIN_XAM_CATALOG_TYPE`, API availability và FE trước khi đề xuất mở production.

**Kết luận:** Đã hoàn thành nền tảng thuật toán, draft catalog 100 quẻ, validator/importer an toàn, Gemini safeguards/fixtures, chỉnh sửa thơ và hồ sơ duyệt. Catalog chưa được duyệt hoặc import, quyền sử dụng chưa được xác minh độc lập, TLS/database/E2E chưa được kiểm chứng trong test environment; vì vậy **chưa sẵn sàng phát hành production**.
