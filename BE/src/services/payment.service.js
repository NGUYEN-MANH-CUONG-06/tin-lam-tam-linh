const { randomBytes } = require("node:crypto");
const env = require("../config/env");
const prisma = require("../config/prisma");
const ApiError = require("../utils/api-error");
const { encodedParams, signature, verifyCallback, vietnamTimestamp, addMembershipMonths } = require("../utils/vnpay");
const {
  grantYearlyGifts,
} = require("./digital-inventory.service");
const {
  isSePayConfigured,
} = require("../config/sepay");
const {
  createSePayCheckout,
} = require("./sepay-checkout.service");
const {
  assertPaymentEnvironment,
} = require("./payment-environment.service");

const PLANS = {
  monthly: {
    code: "TAM_AN_MONTHLY",
    name: "Tâm An tháng",
    price: 49000,
    originalPrice: 49000,
    months: 1,
  },
  yearly: {
    code: "TAM_AN_YEARLY",
    name: "Tâm An năm",
    price: 499000,
    originalPrice: 588000,
    months: 12,
  },
};

const TAM_AN_CODES = Object.values(PLANS).map(
  (plan) => plan.code
);

function isConfigured() { return Boolean(env.VNPAY_TMN_CODE && env.VNPAY_HASH_SECRET && env.VNPAY_RETURN_URL); }
function canStartCheckout() {
  return (
    env.MEMBERSHIP_SALES_ENABLED === true &&
    isSePayConfigured() &&
    Boolean(env.GEMINI_API_KEY)
  );
}
async function getMembership(userId) {
  const subscription = userId ? await prisma.subscriptions.findFirst({
    where: {
      user_id: userId,
      status: "ACTIVE",
      expires_at: { gt: new Date() },
      membership_plans: {
        code: { in: TAM_AN_CODES },
      },
    },
    orderBy: { expires_at: "desc" },
    select: { id: true, started_at: true, expires_at: true },
  }) : null;
  const aiLimits = { successfulReadingsPer24Hours: 3, providerAttemptsPer24Hours: 5 };
  return {
    subscription,
    price: PLANS.monthly.price,
    plans: Object.entries(PLANS).map(([term, plan]) => ({
      term,
      name: plan.name,
      price: plan.price,
      originalPrice: plan.originalPrice,
      months: plan.months,
    })),
    currency: "VND",
    paymentEnvironment: env.SEPAY_ENV,
    aiLimits,
    benefits: [
      { name: "Check-in cảm xúc", free: "Có", premium: "Có", availability: "Đang hoạt động" },
      { name: "Lưu và xem lại lời chiêm nghiệm", free: "Có, theo tài khoản", premium: "Có, theo tài khoản", availability: "Đang hoạt động" },
      { name: "AI chiêm nghiệm theo năm", free: "Chưa khả dụng", premium: `Tối đa ${aiLimits.successfulReadingsPer24Hours} bản thành công và ${aiLimits.providerAttemptsPer24Hours} lần gọi trong 24 giờ`, availability: env.GEMINI_API_KEY ? "Yêu cầu hội viên đang hiệu lực" : "AI chưa được cấu hình" },
      { name: "Thư viện hội viên", free: "Không bao gồm", premium: "Các bài đã phát hành", availability: "Phụ thuộc bài đã được phát hành" },
      { name: "Thư viện xin xăm đã thẩm định", free: "Chưa khả dụng", premium: "Chưa khả dụng", availability: "Chờ nhóm xác nhận nội dung và quyền sử dụng" },
      { name: "Quà trang trí gói năm", free: "Không bao gồm", premium: "Cấp sau khi máy chủ xác nhận đơn năm", availability: "Theo điều kiện gói năm" },
    ],
    salesEnabled: env.MEMBERSHIP_SALES_ENABLED === true,
    checkoutAvailable: canStartCheckout(),
  };
}
async function checkout(userId, ip, term, requestId) {
  if (
    !Object.hasOwn(PLANS, term) ||
    typeof requestId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      requestId
    )
  ) {
    throw new ApiError(422, "Yêu cầu tạo đơn không hợp lệ.");
  }

  if (!canStartCheckout()) {
    throw new ApiError(
      503,
      "Gói hội viên hiện chưa nhận đăng ký hoặc gia hạn."
    );
  }

  await assertPaymentEnvironment();

  const selected = PLANS[term];
  const id = requestId.replace(/-/g, "").toLowerCase();

  const assertCompatible = (order) => {
    if (
      order.user_id !== userId ||
      order.membership_plans?.code !== selected.code ||
      order.payment_provider !== "SEPAY" ||
      order.payment_environment !== env.SEPAY_ENV
    ) {
      throw new ApiError(
        409,
        "Mã yêu cầu đã thuộc tài khoản, gói hoặc môi trường khác."
      );
    }
  };

  let order = await prisma.payment_orders.findUnique({
    where: { id },
    include: {
      membership_plans: {
        select: { code: true },
      },
    },
  });

  if (!order) {
    const plan = await prisma.membership_plans.upsert({
      where: { code: selected.code },
      update: {},
      create: {
        code: selected.code,
        name: selected.name,
        price_monthly:
          term === "monthly" ? selected.price : 0,
        price_yearly:
          term === "yearly" ? selected.price : 0,
        features: ["Chiêm nghiệm AI theo năm"],
      },
    });

    if (!plan.active) {
      throw new ApiError(
        503,
        "Gói hội viên đang tạm ngừng đăng ký."
      );
    }

    try {
      order = await prisma.payment_orders.create({
        data: {
          id,
          user_id: userId,
          plan_id: plan.id,
          amount: selected.price,
          payment_provider: "SEPAY",
          payment_environment: env.SEPAY_ENV,
          expires_at: new Date(Date.now() + 15 * 60 * 1000),
        },
        include: {
          membership_plans: {
            select: { code: true },
          },
        },
      });
    } catch (error) {
      if (error.code !== "P2002") throw error;

      // Một yêu cầu đồng thời có thể đã tạo cùng đơn.
      order = await prisma.payment_orders.findUniqueOrThrow({
        where: { id },
        include: {
          membership_plans: {
            select: { code: true },
          },
        },
      });
    }
  }

  assertCompatible(order);

  return createSePayCheckout(
    order,
    `Thanh toan goi ${selected.name}`
  );
}
async function processIpn(query, client = prisma) {
  if (
    typeof query.vnp_TxnRef === "string" &&
    query.vnp_TxnRef.startsWith("DI")
  ) {
    return require("./digital-shop.service").processIpn(
      query,
      client
    );
  }

  const reply = (RspCode, Message) => ({ RspCode, Message });
  if (!isConfigured() || !verifyCallback(query, env.VNPAY_HASH_SECRET) || query.vnp_TmnCode !== env.VNPAY_TMN_CODE) return reply("97", "Invalid signature");
  const order = await client.payment_orders.findUnique({
    where: {
      id: query.vnp_TxnRef || "",
    },
    include: {
      membership_plans: {
        select: { code: true },
      },
    },
  });
  if (!order) return reply("01", "Order not found");
  if (order.payment_provider !== "VNPAY") {
    return reply("01", "Order belongs to another provider");
  }

  const purchasedPlan = Object.values(PLANS).find(
    (plan) => plan.code === order.membership_plans?.code
  );

  if (!purchasedPlan) {
    return reply("99", "Unsupported membership plan");
  }

  if (!/^\d+$/.test(query.vnp_Amount) || Number(query.vnp_Amount) !== order.amount * 100) return reply("04", "Invalid amount");
  const paid = query.vnp_ResponseCode === "00" && query.vnp_TransactionStatus === "00";
  if (paid && !/^\d{1,15}$/.test(query.vnp_TransactionNo || "")) return reply("99", "Invalid transaction");
  return client.$transaction(async (tx) => {
    // Serialize all payments for one account, including two different successful renewals.
    await tx.$queryRaw`SELECT id FROM users WHERE id = ${order.user_id}::uuid FOR UPDATE`;
    const changed = await tx.payment_orders.updateMany({ where: { id: order.id, status: "PENDING" }, data: {
      status: paid ? "PAID" : "FAILED", transaction_no: paid ? query.vnp_TransactionNo : null,
      response_code: query.vnp_ResponseCode, paid_at: paid ? new Date() : null,
    } });
    if (!changed.count) return reply("02", "Order already confirmed");
    if (paid) {
      const existing = await tx.subscriptions.findFirst({
        where: {
          user_id: order.user_id,
          status: "ACTIVE",
          membership_plans: {
            code: { in: TAM_AN_CODES },
          },
        },
        orderBy: {
          expires_at: "desc",
        },
      });
      const now = new Date();
      const expires = addMembershipMonths(
        existing?.expires_at && existing.expires_at > now
          ? existing.expires_at
          : now,
        purchasedPlan.months
      );
      if (existing) {
        await tx.subscriptions.update({
          where: { id: existing.id },
          data: {
            plan_id: order.plan_id,
            expires_at: expires,
            updated_at: now,
            provider: "VNPAY",
            provider_subscription_id: order.id,
          },
        });
      } else {
        await tx.subscriptions.create({ data: { user_id: order.user_id, plan_id: order.plan_id, expires_at: expires, provider: "VNPAY", provider_subscription_id: order.id } });
      }

      if (purchasedPlan.code === "TAM_AN_YEARLY") {
        await grantYearlyGifts(tx, order.user_id);
      }
    }
    return reply("00", "Confirm Success");
  });
}
async function getOrder(userId, id) {
  if (!/^[a-f0-9]{32}$/i.test(id)) {
    throw new ApiError(404, "Không tìm thấy giao dịch.");
  }

  const order = await prisma.payment_orders.findFirst({
    where: {
      id,
      user_id: userId,
    },
    select: {
      id: true,
      status: true,
      amount: true,
      expires_at: true,
      payment_provider: true,
      payment_environment: true,
    },
  });

  if (!order) {
    throw new ApiError(404, "Không tìm thấy giao dịch.");
  }

  return {
    ...order,
    paymentWindowExpired:
      order.status === "PENDING" &&
      order.expires_at.getTime() <= Date.now(),
  };
}
module.exports = { checkout, processIpn, getOrder, getMembership };
