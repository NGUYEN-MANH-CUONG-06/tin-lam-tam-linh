const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ApiError = require("../src/utils/api-error");
const {
  addMembershipMonths,
} = require("../src/utils/vnpay");

const ORDER_ID = "c".repeat(32);
const NOW = new Date("2026-10-17T12:00:00Z");

function notification(amount) {
  return {
    notification_type: "ORDER_PAID",
    order: {
      order_invoice_number: ORDER_ID,
      order_status: "CAPTURED",
      order_currency: "VND",
      order_amount: String(amount),
    },
    transaction: {
      id: "membership_transaction_001",
      transaction_status: "APPROVED",
      transaction_type: "PAYMENT",
      transaction_currency: "VND",
      transaction_amount: String(amount),
    },
  };
}

function setup(options = {}) {
  const yearly = options.yearly ?? false;
  const amount = yearly ? 499000 : 49000;

  const state = {
    order: {
      id: ORDER_ID,
      user_id: "00000000-0000-4000-8000-000000000001",
      plan_id: "test-plan",
      amount,
      status: "PENDING",
      payment_provider: "SEPAY",
      payment_environment: "sandbox",
      transaction_no: null,
    },
    subscription: options.expiresAt
      ? {
          id: "existing-subscription",
          expires_at: new Date(options.expiresAt),
          status: "ACTIVE",
        }
      : null,
    gifts: 0,
  };

  const paymentOrders = {
    async findUnique({ where }) {
      if (where.id) {
        return where.id === state.order.id
          ? { ...state.order }
          : null;
      }

      return state.order.transaction_no === where.transaction_no
        ? { id: state.order.id }
        : null;
    },

    async updateMany({ where, data }) {
      if (
        state.order.id !== where.id ||
        state.order.status !== where.status ||
        state.order.payment_provider !== where.payment_provider ||
        state.order.payment_environment !== where.payment_environment
      ) {
        return { count: 0 };
      }

      Object.assign(state.order, data);
      return { count: 1 };
    },
  };

  const tx = {
    $queryRaw: async () => [{ locked: 1 }],
    payment_orders: paymentOrders,

    digital_orders: {
      findUnique: async () => null,
    },

    membership_plans: {
      async findUnique() {
        return {
          id: "test-plan",
          code: yearly ? "TAM_AN_YEARLY" : "TAM_AN_MONTHLY",
        };
      },
    },

    subscriptions: {
      async findFirst() {
        return state.subscription
          ? { ...state.subscription }
          : null;
      },

      async create({ data }) {
        state.subscription = {
          id: "new-subscription",
          ...data,
        };
        return { ...state.subscription };
      },

      async update({ data }) {
        Object.assign(state.subscription, data);
        return { ...state.subscription };
      },
    },
  };

  const prisma = {
    payment_orders: paymentOrders,

    async $transaction(callback) {
      const before = {
        order: { ...state.order },
        subscription: state.subscription
          ? { ...state.subscription }
          : null,
        gifts: state.gifts,
      };

      try {
        return await callback(tx);
      } catch (error) {
        state.order = before.order;
        state.subscription = before.subscription;
        state.gifts = before.gifts;
        throw error;
      }
    },
  };

  class FixedDate extends Date {
    constructor(...args) {
      if (args.length === 0) {
        super(NOW.getTime());
      } else {
        super(...args);
      }
    }

    static now() {
      return NOW.getTime();
    }
  }

  const dependencies = {
    "node:crypto": require("node:crypto"),
    "../config/env": {
      SEPAY_ENV: "sandbox",
      SEPAY_IPN_SECRET: "unit-test-only-secret-123456789012345",
    },
    "../config/prisma": prisma,
    "../utils/api-error": ApiError,
    "../utils/vnpay": { addMembershipMonths },

    "./payment-environment.service": {
      async assertPaymentEnvironment() {},
    },

    "./payment-alert.service": {
      async recordVoidNotification() {
        throw new Error("Test này không xử lý TRANSACTION_VOID.");
      },
    },

    "./digital-inventory.service": {
      async grantPurchasedItem() {
        throw new Error("Đơn hội viên không được cấp hàng mua riêng.");
      },

      async grantYearlyGifts() {
        state.gifts += 1;

        if (options.giftFailure) {
          throw new Error("Giả lập lỗi cấp quà.");
        }
      },
    },
  };

  const filename = path.join(
    __dirname,
    "../src/services/sepay-ipn.service.js"
  );
  const moduleObject = { exports: {} };

  vm.runInNewContext(
    fs.readFileSync(filename, "utf8"),
    {
      module: moduleObject,
      exports: moduleObject.exports,
      Buffer,
      Date: FixedDate,
      require(name) {
        if (!Object.hasOwn(dependencies, name)) {
          throw new Error(`Dependency chưa được mock: ${name}`);
        }
        return dependencies[name];
      },
    },
    { filename }
  );

  return {
    state,
    body: notification(amount),
    ...moduleObject.exports,
  };
}

test("Mua gói tháng tạo hội viên từ thời điểm thanh toán", async () => {
  const service = setup();

  await service.processSePayIpn(service.body);

  assert.equal(service.state.order.status, "PAID");
  assert.equal(
    service.state.subscription.expires_at.toISOString(),
    "2026-11-17T12:00:00.000Z"
  );
  assert.equal(
    service.state.subscription.provider,
    "SEPAY_SANDBOX"
  );
  assert.equal(service.state.gifts, 0);
});

test("Gia hạn cộng tiếp từ hạn hiện tại nếu còn hiệu lực", async () => {
  const service = setup({
    expiresAt: "2026-12-31T12:00:00Z",
  });

  await service.processSePayIpn(service.body);

  assert.equal(
    service.state.subscription.expires_at.toISOString(),
    "2027-01-31T12:00:00.000Z"
  );
});

test("Hội viên hết hạn được tính lại từ thời điểm thanh toán", async () => {
  const service = setup({
    expiresAt: "2026-09-01T12:00:00Z",
  });

  await service.processSePayIpn(service.body);

  assert.equal(
    service.state.subscription.expires_at.toISOString(),
    "2026-11-17T12:00:00.000Z"
  );
});

test("Gia hạn cuối tháng không tràn sang tháng tiếp theo", async () => {
  const service = setup({
    expiresAt: "2027-01-31T12:00:00Z",
  });

  await service.processSePayIpn(service.body);

  assert.equal(
    service.state.subscription.expires_at.toISOString(),
    "2027-02-28T12:00:00.000Z"
  );
});

test("Gói năm cộng 12 tháng và gọi cấp quà một lần", async () => {
  const service = setup({ yearly: true });

  await service.processSePayIpn(service.body);

  assert.equal(
    service.state.subscription.expires_at.toISOString(),
    "2027-10-17T12:00:00.000Z"
  );
  assert.equal(service.state.gifts, 1);
});

test("IPN gói năm gửi lại không cộng hạn hoặc cấp quà lần hai", async () => {
  const service = setup({ yearly: true });

  await service.processSePayIpn(service.body);
  const firstExpiry =
    service.state.subscription.expires_at.toISOString();

  const result = await service.processSePayIpn(service.body);

  assert.equal(result.replayed, true);
  assert.equal(
    service.state.subscription.expires_at.toISOString(),
    firstExpiry
  );
  assert.equal(service.state.gifts, 1);
});

test("Lỗi cấp quà rollback đơn và hội viên; thử lại chỉ cấp một lần", async () => {
  const options = {
    yearly: true,
    giftFailure: true,
    expiresAt: "2026-12-01T12:00:00Z",
  };
  const service = setup(options);

  await assert.rejects(
    service.processSePayIpn(service.body),
    /Giả lập lỗi cấp quà/
  );

  assert.equal(service.state.order.status, "PENDING");
  assert.equal(service.state.order.transaction_no, null);
  assert.equal(
    service.state.subscription.expires_at.toISOString(),
    "2026-12-01T12:00:00.000Z"
  );
  assert.equal(service.state.gifts, 0);

  options.giftFailure = false;

  await service.processSePayIpn(service.body);

  assert.equal(service.state.order.status, "PAID");
  assert.equal(
    service.state.subscription.expires_at.toISOString(),
    "2027-12-01T12:00:00.000Z"
  );
  assert.equal(service.state.gifts, 1);
});
