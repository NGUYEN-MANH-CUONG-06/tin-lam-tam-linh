const prisma = require("../config/prisma");
const ApiError = require("../utils/api-error");
const {
  DIGITAL_ITEMS: ITEMS,
} = require("../constants/digital-items");

async function grantYearlyGifts(transaction, userId) {
  // Mỗi lần mua/gia hạn năm thành công tặng một lượt đèn.
  await transaction.digital_inventory.upsert({
    where: {
      user_id_item_code: {
        user_id: userId,
        item_code: "ROYAL_LANTERN",
      },
    },
    create: {
      user_id: userId,
      item_code: "ROYAL_LANTERN",
      quantity: 1,
    },
    update: {
      quantity: { increment: 1 },
      updated_at: new Date(),
    },
  });

  // Vật phẩm vĩnh viễn: đã sở hữu thì không tăng số lượng.
  await transaction.digital_inventory.upsert({
    where: {
      user_id_item_code: {
        user_id: userId,
        item_code: "JADE_LOTUS",
      },
    },
    create: {
      user_id: userId,
      item_code: "JADE_LOTUS",
      quantity: 1,
    },
    update: {},
  });
}

async function listInventory(userId) {
  const rows = await prisma.digital_inventory.findMany({
    where: {
      user_id: userId,
      quantity: { gt: 0 },
    },
    orderBy: { item_code: "asc" },
  });

  return rows
    .filter((row) => Object.hasOwn(ITEMS, row.item_code))
    .map((row) => ({
      code: row.item_code,
      ...ITEMS[row.item_code],
      quantity: row.quantity,
      equipped: row.equipped,
    }));
}

async function useRoyalLantern(userId, requestId) {
  try {
    return await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`
        SELECT id FROM users
        WHERE id = ${userId}::uuid
        FOR UPDATE
      `;

      const existing = await tx.digital_item_uses.findUnique({
        where: { id: requestId },
      });

      if (existing) {
        if (
          existing.user_id !== userId ||
          existing.item_code !== "ROYAL_LANTERN"
        ) {
          throw new ApiError(
            409,
            "Mã sử dụng không hợp lệ cho tài khoản này."
          );
        }

        return {
          id: existing.id,
          itemCode: existing.item_code,
          replayed: true,
        };
      }

      const deducted = await tx.digital_inventory.updateMany({
        where: {
          user_id: userId,
          item_code: "ROYAL_LANTERN",
          quantity: { gte: 1 },
        },
        data: {
          quantity: { decrement: 1 },
          updated_at: new Date(),
        },
      });

      if (deducted.count !== 1) {
        throw new ApiError(
          409,
          "Bạn không còn lượt đèn hoa đăng hoàng gia."
        );
      }

      const receipt = await tx.digital_item_uses.create({
        data: {
          id: requestId,
          user_id: userId,
          item_code: "ROYAL_LANTERN",
        },
      });

      return {
        id: receipt.id,
        itemCode: receipt.item_code,
        replayed: false,
      };
    });
  } catch (error) {
    if (error?.code === "P2002") {
      throw new ApiError(
        409,
        "Mã sử dụng đã tồn tại. Hãy kiểm tra lại lượt đang xử lý."
      );
    }

    throw error;
  }
}

async function setJadeDecoration(userId, enabled) {
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM users
      WHERE id = ${userId}::uuid
      FOR UPDATE
    `;

    const item = await tx.digital_inventory.findUnique({
      where: {
        user_id_item_code: {
          user_id: userId,
          item_code: "JADE_LOTUS",
        },
      },
    });

    if (enabled && (!item || item.quantity < 1)) {
      throw new ApiError(
        403,
        "Bạn chưa sở hữu bình sen ngọc."
      );
    }

    if (item) {
      await tx.digital_inventory.update({
        where: {
          user_id_item_code: {
            user_id: userId,
            item_code: "JADE_LOTUS",
          },
        },
        data: {
          equipped: enabled,
          updated_at: new Date(),
        },
      });
    }

    return { equipped: enabled };
  });
}

async function grantPurchasedItem(tx, order) {
  const item = Object.hasOwn(ITEMS, order.item_code)
    ? ITEMS[order.item_code]
    : null;

  if (
    !item ||
    item.price === null ||
    order.quantity !== 1
  ) {
    throw new ApiError(
      422,
      "Vật phẩm hoặc số lượng không được hỗ trợ."
    );
  }

  if (item.kind === "PERMANENT") {
    const existing = await tx.digital_inventory.findUnique({
      where: {
        user_id_item_code: {
          user_id: order.user_id,
          item_code: order.item_code,
        },
      },
    });

    if (existing && existing.quantity > 0) {
      return { duplicatePermanent: true };
    }
  }

  await tx.digital_inventory.upsert({
    where: {
      user_id_item_code: {
        user_id: order.user_id,
        item_code: order.item_code,
      },
    },
    create: {
      user_id: order.user_id,
      item_code: order.item_code,
      quantity: 1,
    },
    update:
      item.kind === "PERMANENT"
        ? {
            quantity: 1,
            updated_at: new Date(),
          }
        : {
            quantity: { increment: order.quantity },
            updated_at: new Date(),
          },
  });

  return { duplicatePermanent: false };
}

const DECORATION_CODES = [
  "JADE_LOTUS",
  "GOLDEN_LOTUS",
  "INCENSE_BURNER",
  "BOILED_CHICKEN",
];

async function setDecoration(userId, itemCode) {
  if (
    itemCode !== null &&
    !DECORATION_CODES.includes(itemCode)
  ) {
    throw new ApiError(422, "Vật phẩm trang trí không hợp lệ.");
  }

  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`
      SELECT id FROM users
      WHERE id = ${userId}::uuid
      FOR UPDATE
    `;

    if (itemCode !== null) {
      const owned = await tx.digital_inventory.findUnique({
        where: {
          user_id_item_code: {
            user_id: userId,
            item_code: itemCode,
          },
        },
      });

      if (!owned || owned.quantity < 1) {
        throw new ApiError(403, "Bạn chưa sở hữu vật phẩm này.");
      }
    }

    await tx.digital_inventory.updateMany({
      where: {
        user_id: userId,
        item_code: { in: DECORATION_CODES },
        equipped: true,
      },
      data: {
        equipped: false,
        updated_at: new Date(),
      },
    });

    if (itemCode !== null) {
      await tx.digital_inventory.update({
        where: {
          user_id_item_code: {
            user_id: userId,
            item_code: itemCode,
          },
        },
        data: {
          equipped: true,
          updated_at: new Date(),
        },
      });
    }

    return { itemCode };
  });
}

module.exports = {
  grantYearlyGifts,
  grantPurchasedItem,
  listInventory,
  useRoyalLantern,
  setJadeDecoration,
  setDecoration,
};
