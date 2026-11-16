import { readDemoValue, writeDemoValue } from "./demoStorage";
import { isDemoMode } from "./demoMode";
import {
  DEMO_COMMERCE_CATALOG,
  DEMO_PREMIUM_BENEFITS,
  getDemoProductPrice,
  type DemoCommerceSku,
} from "./demoCommerceCatalog";

export const DEMO_COMMERCE_SCHEMA_VERSION = 1;
export const DEMO_COMMERCE_STORAGE_KEY = "commerce-state-v1";
export const DEMO_COMMERCE_ACCOUNT_ID = "tltl-demo-account-v1";

export interface DemoCommerceState {
  schemaVersion: 1;
  accountId: typeof DEMO_COMMERCE_ACCOUNT_ID;
  inventory: {
    virtualChickens: number;
    royalLanterns: number;
    stickyRice?: number;
    watermelons?: number;
    fruitPlates?: number;
  };
  entitlements: { premiumOwned: boolean; xamDetailedReadings: number; keoDetailedReadings: number; unlockedReadingIds: string[] };
  processedRequestIds: string[];
  transactions: DemoCommerceTransaction[];
  inventoryUses: DemoInventoryUse[];
  readingUses: DemoReadingUse[];
}

export interface DemoReadingUse {
  id: string;
  kind: "xam" | "keo";
  readingId: string;
  createdAt: string;
}

export interface DemoInventoryUse {
  id: string;
  requestId: string;
  item: keyof DemoCommerceState["inventory"];
  quantity: number;
  createdAt: string;
}

export interface DemoCommerceTransaction {
  id: string;
  requestId: string;
  sku: DemoCommerceSku;
  quantity: number;
  unitPriceVnd: number;
  totalVnd: number;
  status: "succeeded" | "failed" | "cancelled";
  createdAt: string;
  readingKey?: string;
}

export type DemoCheckoutOutcome = "succeeded" | "failed" | "cancelled";

export interface DemoCheckoutQuote {
  sku: DemoCommerceSku;
  quantity: number;
  unitPriceVnd: number;
  subtotalVnd: number;
  discountVnd: number;
  totalVnd: number;
  paymentNotice: "Thanh toán mô phỏng — Không phát sinh giao dịch thật";
}

export function createEmptyDemoCommerceState(): DemoCommerceState {
  return {
    schemaVersion: DEMO_COMMERCE_SCHEMA_VERSION,
    accountId: DEMO_COMMERCE_ACCOUNT_ID,
    inventory: {
      virtualChickens: 2,
      royalLanterns: 5,
      stickyRice: 2,
      watermelons: 2,
      fruitPlates: 2,
    },
    entitlements: { premiumOwned: false, xamDetailedReadings: 3, keoDetailedReadings: 3, unlockedReadingIds: [] },
    processedRequestIds: [],
    transactions: [],
    inventoryUses: [],
    readingUses: [],
  };
}

function isNonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) >= 0;
}

function isDemoCommerceState(value: unknown): value is DemoCommerceState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<DemoCommerceState>;
  return state.schemaVersion === DEMO_COMMERCE_SCHEMA_VERSION
    && state.accountId === DEMO_COMMERCE_ACCOUNT_ID
    && !!state.inventory
    && isNonNegativeInteger(state.inventory.virtualChickens)
    && isNonNegativeInteger(state.inventory.royalLanterns)
    && (state.inventory.stickyRice === undefined || isNonNegativeInteger(state.inventory.stickyRice))
    && (state.inventory.watermelons === undefined || isNonNegativeInteger(state.inventory.watermelons))
    && (state.inventory.fruitPlates === undefined || isNonNegativeInteger(state.inventory.fruitPlates))
    && !!state.entitlements && typeof state.entitlements.premiumOwned === "boolean"
    && isNonNegativeInteger(state.entitlements.xamDetailedReadings) && isNonNegativeInteger(state.entitlements.keoDetailedReadings)
    && Array.isArray(state.entitlements.unlockedReadingIds) && state.entitlements.unlockedReadingIds.every((id) => typeof id === "string")
    && Array.isArray(state.processedRequestIds) && state.processedRequestIds.every((id) => typeof id === "string")
    && Array.isArray(state.transactions) && state.transactions.every(isDemoCommerceTransaction)
    && (state.inventoryUses === undefined || (Array.isArray(state.inventoryUses) && state.inventoryUses.every(isDemoInventoryUse)))
    && (state.readingUses === undefined || (Array.isArray(state.readingUses) && state.readingUses.every(isDemoReadingUse)));
}

function isDemoReadingUse(value: unknown): value is DemoReadingUse {
  if (!value || typeof value !== "object") return false;
  const use = value as Partial<DemoReadingUse>;
  return typeof use.id === "string" && (use.kind === "xam" || use.kind === "keo")
    && typeof use.readingId === "string" && typeof use.createdAt === "string";
}

function isDemoInventoryUse(value: unknown): value is DemoInventoryUse {
  if (!value || typeof value !== "object") return false;
  const use = value as Partial<DemoInventoryUse>;
  return typeof use.id === "string" && typeof use.requestId === "string"
    && (use.item === "virtualChickens" || use.item === "royalLanterns" || use.item === "stickyRice" || use.item === "watermelons" || use.item === "fruitPlates")
    && isNonNegativeInteger(use.quantity) && (use.quantity as number) > 0
    && typeof use.createdAt === "string";
}

function isDemoCommerceTransaction(value: unknown): value is DemoCommerceTransaction {
  if (!value || typeof value !== "object") return false;
  const tx = value as Partial<DemoCommerceTransaction>;
  return typeof tx.id === "string" && typeof tx.requestId === "string"
    && typeof tx.sku === "string" && tx.sku in DEMO_COMMERCE_CATALOG
    && isNonNegativeInteger(tx.quantity) && (tx.quantity as number) > 0
    && isNonNegativeInteger(tx.unitPriceVnd) && isNonNegativeInteger(tx.totalVnd)
    && (tx.status === "succeeded" || tx.status === "failed" || tx.status === "cancelled")
    && (tx.readingKey === undefined || typeof tx.readingKey === "string")
    && typeof tx.createdAt === "string";
}

export function loadDemoCommerceState(): DemoCommerceState {
  const stored = readDemoValue<unknown>(DEMO_COMMERCE_STORAGE_KEY, null);
  if (!isDemoCommerceState(stored)) return createEmptyDemoCommerceState();
  // Đảm bảo có sẵn số dư demo để ban giám khảo / sinh viên không bị chặn lỗi hết hàng khi thuyết trình
  return {
    ...stored,
    inventory: {
      ...stored.inventory,
      royalLanterns: Math.max(stored.inventory.royalLanterns ?? 0, 3),
      virtualChickens: Math.max(stored.inventory.virtualChickens ?? 0, 1),
      stickyRice: Math.max(stored.inventory.stickyRice ?? 0, 1),
      watermelons: Math.max(stored.inventory.watermelons ?? 0, 1),
      fruitPlates: Math.max(stored.inventory.fruitPlates ?? 0, 1),
    },
    inventoryUses: stored.inventoryUses ?? [],
    readingUses: stored.readingUses ?? [],
  };
}

export function resetDemoCommerceState(): DemoCommerceState {
  assertDemoMode();
  const state = createEmptyDemoCommerceState();
  writeDemoValue(DEMO_COMMERCE_STORAGE_KEY, state);
  return state;
}

export function quoteDemoCheckout(sku: DemoCommerceSku, quantity: number, state = loadDemoCommerceState()): DemoCheckoutQuote {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) throw new Error("Số lượng demo không hợp lệ.");
  const unitPriceVnd = getDemoProductPrice(sku, state.entitlements.premiumOwned);
  const subtotalVnd = DEMO_COMMERCE_CATALOG[sku].unitPriceVnd * quantity;
  const totalVnd = unitPriceVnd * quantity;
  return {
    sku,
    quantity,
    unitPriceVnd,
    subtotalVnd,
    discountVnd: subtotalVnd - totalVnd,
    totalVnd,
    paymentNotice: "Thanh toán mô phỏng — Không phát sinh giao dịch thật",
  };
}

export function completeDemoCheckout(
  requestId: string,
  sku: DemoCommerceSku,
  quantity: number,
  outcome: DemoCheckoutOutcome,
  now = new Date(),
): { state: DemoCommerceState; transaction: DemoCommerceTransaction; replayed: boolean } {
  return completeCheckout(requestId, sku, quantity, outcome, now);
}

export interface DemoCartItem {
  sku: DemoCommerceSku;
  quantity: number;
}

export function completeDemoCartCheckout(
  requestId: string,
  items: DemoCartItem[],
  outcome: DemoCheckoutOutcome,
  isFullCombo = false,
  comboTotalVnd = 28_000,
  now = new Date(),
): { state: DemoCommerceState; transactions: DemoCommerceTransaction[] } {
  assertDemoMode();
  if (!requestId.trim() || requestId.length > 160) throw new Error("Mã yêu cầu demo không hợp lệ.");
  const state = loadDemoCommerceState();
  const transactions: DemoCommerceTransaction[] = [];

  if (isFullCombo) {
    const tx: DemoCommerceTransaction = {
      id: `demo-tx:${encodeURIComponent(requestId)}`,
      requestId,
      sku: "OFFERING_COMBO_FULL",
      quantity: 1,
      unitPriceVnd: comboTotalVnd,
      totalVnd: comboTotalVnd,
      status: outcome,
      createdAt: now.toISOString(),
    };
    if (outcome === "succeeded") {
      grantPurchase(state, "OFFERING_COMBO_FULL", 1);
    }
    state.processedRequestIds.push(requestId);
    state.transactions.unshift(tx);
    transactions.push(tx);
  } else {
    for (const item of items) {
      if (item.quantity <= 0) continue;
      const quote = quoteDemoCheckout(item.sku, item.quantity, state);
      const subRequestId = `${requestId}:${item.sku}`;
      const tx: DemoCommerceTransaction = {
        id: `demo-tx:${encodeURIComponent(subRequestId)}`,
        requestId: subRequestId,
        sku: item.sku,
        quantity: item.quantity,
        unitPriceVnd: quote.unitPriceVnd,
        totalVnd: quote.totalVnd,
        status: outcome,
        createdAt: now.toISOString(),
      };
      if (outcome === "succeeded") {
        grantPurchase(state, item.sku, item.quantity);
      }
      state.processedRequestIds.push(subRequestId);
      state.transactions.unshift(tx);
      transactions.push(tx);
    }
  }

  writeDemoValue(DEMO_COMMERCE_STORAGE_KEY, state);
  return { state, transactions };
}

export function completeDemoReadingCheckout(
  requestId: string,
  kind: "xam" | "keo",
  readingId: string,
  outcome: DemoCheckoutOutcome,
  now = new Date(),
): { state: DemoCommerceState; transaction: DemoCommerceTransaction; replayed: boolean } {
  if (!readingId.trim()) throw new Error("Thiếu mã luận giải.");
  const sku = kind === "xam" ? "XAM_DETAILED_READING" : "KEO_DETAILED_READING";
  return completeCheckout(requestId, sku, 1, outcome, now, `${kind}:${readingId}`);
}

function completeCheckout(
  requestId: string,
  sku: DemoCommerceSku,
  quantity: number,
  outcome: DemoCheckoutOutcome,
  now: Date,
  readingKey?: string,
): { state: DemoCommerceState; transaction: DemoCommerceTransaction; replayed: boolean } {
  assertDemoMode();
  if (!requestId.trim() || requestId.length > 160) throw new Error("Mã yêu cầu demo không hợp lệ.");
  const state = loadDemoCommerceState();
  const prior = state.transactions.find((transaction) => transaction.requestId === requestId);
  if (prior) {
    if (prior.sku !== sku || prior.readingKey !== readingKey) throw new Error("Mã yêu cầu đã được dùng cho giao dịch khác.");
    return { state, transaction: prior, replayed: true };
  }

  const quote = quoteDemoCheckout(sku, quantity, state);
  const transaction: DemoCommerceTransaction = {
    id: `demo-tx:${encodeURIComponent(requestId)}`,
    requestId,
    sku,
    quantity,
    unitPriceVnd: quote.unitPriceVnd,
    totalVnd: quote.totalVnd,
    status: outcome,
    createdAt: now.toISOString(),
    ...(readingKey ? { readingKey } : {}),
  };

  if (outcome === "succeeded") {
    if (readingKey) {
      if (!state.entitlements.unlockedReadingIds.includes(readingKey)) state.entitlements.unlockedReadingIds.push(readingKey);
    } else {
      grantPurchase(state, sku, quantity);
    }
  }
  state.processedRequestIds.push(requestId);
  state.transactions.unshift(transaction);
  writeDemoValue(DEMO_COMMERCE_STORAGE_KEY, state);
  return { state, transaction, replayed: false };
}

export function consumeDemoInventory(
  item: keyof DemoCommerceState["inventory"],
  quantity = 1,
  requestId = `use:${crypto.randomUUID()}`,
): DemoCommerceState {
  assertDemoMode();
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error("Số lượng sử dụng không hợp lệ.");
  if (!requestId.trim() || requestId.length > 160) throw new Error("Mã thao tác vật phẩm không hợp lệ.");
  const state = loadDemoCommerceState();
  const priorUse = state.inventoryUses.find((entry) => entry.requestId === requestId);
  if (priorUse) {
    if (priorUse.item !== item || priorUse.quantity !== quantity) throw new Error("Mã thao tác đã được dùng cho vật phẩm khác.");
    return state;
  }
  const currentStock = state.inventory[item] ?? 0;
  if (currentStock < quantity) throw new Error("Kho vật phẩm demo không đủ số lượng.");
  state.inventory[item] = currentStock - quantity;
  state.inventoryUses.unshift({
    id: `demo-use:${encodeURIComponent(requestId)}`,
    requestId,
    item,
    quantity,
    createdAt: new Date().toISOString(),
  });
  writeDemoValue(DEMO_COMMERCE_STORAGE_KEY, state);
  return state;
}

export function consumeDemoReadingEntitlement(kind: "xam" | "keo", readingId: string): DemoCommerceState {
  assertDemoMode();
  if (!readingId.trim()) throw new Error("Thiếu mã luận giải.");
  const state = loadDemoCommerceState();
  const unlockKey = `${kind}:${readingId}`;
  if (state.entitlements.unlockedReadingIds.includes(unlockKey)) return state;
  const key = kind === "xam" ? "xamDetailedReadings" : "keoDetailedReadings";
  if (state.entitlements[key] < 1) throw new Error("Không còn lượt luận giải demo.");
  state.entitlements[key] -= 1;
  state.entitlements.unlockedReadingIds.push(unlockKey);
  state.readingUses.unshift({ id: `demo-reading-use:${encodeURIComponent(unlockKey)}`, kind, readingId, createdAt: new Date().toISOString() });
  writeDemoValue(DEMO_COMMERCE_STORAGE_KEY, state);
  return state;
}

export function isDemoReadingUnlocked(kind: "xam" | "keo", readingId: string, state = loadDemoCommerceState()): boolean {
  return state.entitlements.unlockedReadingIds.includes(`${kind}:${readingId}`);
}

function assertDemoMode(): void {
  if (!isDemoMode()) throw new Error("Mock commerce chỉ khả dụng trong Demo Mode.");
}

function grantPurchase(state: DemoCommerceState, sku: DemoCommerceSku, quantity: number): void {
  switch (sku) {
    case "XAM_DETAILED_READING":
      // A later phase associates purchased units with a specific reading.
      state.entitlements.xamDetailedReadings += quantity;
      break;
    case "KEO_DETAILED_READING":
      state.entitlements.keoDetailedReadings += quantity;
      break;
    case "VIRTUAL_CHICKEN":
      state.inventory.virtualChickens += quantity;
      break;
    case "ROYAL_LANTERN_BUNDLE":
      state.inventory.royalLanterns += quantity * 3;
      break;
    case "OFFERING_STICKY_RICE":
      state.inventory.stickyRice = (state.inventory.stickyRice ?? 0) + quantity;
      break;
    case "OFFERING_WATERMELON":
      state.inventory.watermelons = (state.inventory.watermelons ?? 0) + quantity;
      break;
    case "OFFERING_FRUIT_PLATE":
      state.inventory.fruitPlates = (state.inventory.fruitPlates ?? 0) + quantity;
      break;
    case "OFFERING_COMBO_FULL":
      // Combo mâm cỗ trọn vẹn: cộng đủ cả 4 món vào kho
      state.inventory.virtualChickens += quantity;
      state.inventory.stickyRice = (state.inventory.stickyRice ?? 0) + quantity;
      state.inventory.watermelons = (state.inventory.watermelons ?? 0) + quantity;
      state.inventory.fruitPlates = (state.inventory.fruitPlates ?? 0) + quantity;
      break;
    case "PREMIUM_BENEFITS":
      state.entitlements.premiumOwned = true;
      state.entitlements.xamDetailedReadings += DEMO_PREMIUM_BENEFITS.xamDetailedReadings * quantity;
      state.entitlements.keoDetailedReadings += DEMO_PREMIUM_BENEFITS.keoDetailedReadings * quantity;
      state.inventory.virtualChickens += DEMO_PREMIUM_BENEFITS.virtualChickens * quantity;
      state.inventory.royalLanterns += DEMO_PREMIUM_BENEFITS.royalLanterns * quantity;
      break;
  }
}
