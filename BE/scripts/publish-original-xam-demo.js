const env = require("../src/config/env");
const prisma = require("../src/config/prisma");
const {
  isOriginalXamMetadata,
  hasCompleteXamContent,
} = require("../../shared/xin-xam-publication.mjs");
const {
  editorialContentHash,
} = require("../src/services/editorial-content-hash");

const TYPE = "TLTL_ORIGINAL_100_V1:1.0.1-draft";
const NOTE =
  "Admin cho phép duyệt tự động để demo. " +
  "Nội dung nguyên tác có AI hỗ trợ, chưa thẩm định độc lập.";

async function main() {
  if (!["development", "test"].includes(env.NODE_ENV)) {
    throw new Error("Script demo không được chạy trong production.");
  }

  const email = process.argv
    .find((arg) => arg.startsWith("--admin="))
    ?.slice("--admin=".length)
    .trim()
    .toLowerCase();

  if (!email) {
    throw new Error("Thiếu --admin=email-cua-ban");
  }

  const admin = await prisma.users.findUnique({
    where: { email },
    select: { id: true, role: true, status: true },
  });

  if (admin?.role !== "ADMIN" || admin.status !== "ACTIVE") {
    throw new Error("Email phải thuộc tài khoản ADMIN đang hoạt động.");
  }

  const apply = process.argv.includes("--apply");

  await prisma.$transaction(
    async (tx) => {
      // Khóa đúng bộ quẻ trong suốt lần xử lý.
      await tx.$queryRaw`
      SELECT id FROM xin_xam
      WHERE xam_type = ${TYPE}
      FOR UPDATE
    `;

      const cards = await tx.xin_xam.findMany({
        where: { xam_type: TYPE },
        orderBy: { stick_number: "asc" },
      });

      if (
        cards.length !== 100 ||
        cards.some((card, index) => card.stick_number !== index + 1)
      ) {
        throw new Error("Cần đúng 100 quẻ, liên tục từ số 1 đến 100.");
      }

      for (const card of cards) {
        if (
          !isOriginalXamMetadata(card.editorial_metadata) ||
          !hasCompleteXamContent({
            ...card,
            interpretations: [card.meaning, card.advice],
          })
        ) {
          throw new Error(`Quẻ ${card.stick_number} thiếu nội dung hợp lệ.`);
        }

        if (card.editorial_status !== "DRAFT" || card.verified || card.active) {
          throw new Error(
            `Quẻ ${card.stick_number} không còn là bản nháp chưa duyệt. ` +
              "Dừng để tránh ghi đè trạng thái hiện có.",
          );
        }
      }

      console.log(`Đã kiểm tra đúng ${cards.length} quẻ thuộc ${TYPE}.`);

      if (!apply) {
        console.log("Chạy thử: chưa thay đổi database.");
        return;
      }

      for (const card of cards) {
        const metadata = {
          ...card.editorial_metadata,
          reviewStatus: "APPROVED",
          humanApproved: true,
          demoOnly: true,
          approvalMethod: "ADMIN_AUTHORIZED_AUTOMATED_DEMO",
          independentReviewCompleted: false,
        };

        const updated = await tx.xin_xam.update({
          where: { id: card.id },
          data: {
            editorial_metadata: metadata,
            editorial_status: "PUBLISHED",
            verified: true,
            active: true,
            updated_at: new Date(),
          },
        });

        await tx.admin_audit_logs.create({
          data: {
            actor_id: admin.id,
            action: "CONTENT_REVIEW_UPDATED",
            target_type: "xin_xam",
            target_id: card.id,
            details: {
              before: {
                verified: card.verified,
                active: card.active,
                editorial_status: card.editorial_status,
              },
              after: {
                verified: true,
                active: true,
                editorial_status: "PUBLISHED",
              },
              rightsConfirmed: true,
              reviewNote: NOTE,
              automatedDemoApproval: true,
              independentReviewCompleted: false,
              approvedContentHash: editorialContentHash(updated),
            },
          },
        });
      }

      console.log("Đã duyệt và phát hành 100 quẻ cho demo.");
    },
    { timeout: 60000 },
  );
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
