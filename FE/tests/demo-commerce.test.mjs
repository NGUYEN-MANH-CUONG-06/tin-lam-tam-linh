import test from "node:test";
import assert from "node:assert/strict";
import {
  completeDemoCheckout,
  completeDemoReadingCheckout,
  consumeDemoInventory,
  consumeDemoReadingEntitlement,
  DEMO_COMMERCE_STORAGE_KEY,
  isDemoReadingUnlocked,
  loadDemoCommerceState,
  quoteDemoCheckout,
  resetDemoCommerceState,
} from "../src/data/demoCommerceService.ts";
import { DEMO_COMMERCE_CONFIG } from "../src/data/demoCommerceCatalog.ts";
import { readDemoValue, clearDemoValues } from "../src/data/demoStorage.ts";

function installMemoryStorage() {
  const entries = new Map();
  globalThis.localStorage = {
    getItem(key) { return entries.get(key) ?? null; },
    setItem(key, value) { entries.set(key, String(value)); },
    removeItem(key) { entries.delete(key); },
    key(index) { return [...entries.keys()][index] ?? null; },
    get length() { return entries.size; },
  };
  globalThis.window = {
    location: { search: "?demo=1", href: "http://localhost:3000/?demo=1", assign() {} },
    sessionStorage: { getItem() { return "true"; }, setItem() {}, removeItem() {} },
  };
  return entries;
}

test("demo commerce ignores malformed or incompatible persisted state", () => {
  const storage = installMemoryStorage();
  storage.set(`tltl-demo-${DEMO_COMMERCE_STORAGE_KEY}`, JSON.stringify({ schemaVersion: 99, inventory: { virtualChickens: -3 } }));
  assert.equal(loadDemoCommerceState().inventory.virtualChickens, 0);
});

test("successful purchases grant once and repeated request IDs replay the original transaction", () => {
  installMemoryStorage();
  resetDemoCommerceState();
  const first = completeDemoCheckout("request-premium-1", "PREMIUM_BENEFITS", 1, "succeeded", new Date("2026-01-01T00:00:00Z"));
  const replay = completeDemoCheckout("request-premium-1", "PREMIUM_BENEFITS", 1, "succeeded");
  assert.equal(first.state.inventory.virtualChickens, 3);
  assert.equal(first.state.inventory.royalLanterns, 5);
  assert.equal(first.state.entitlements.xamDetailedReadings, 2);
  assert.equal(replay.replayed, true);
  assert.equal(replay.state.inventory.virtualChickens, 3);
  assert.equal(replay.state.transactions.length, 1);
});

test("failed and cancelled checkouts do not grant benefits; premium discount is 30 percent", () => {
  installMemoryStorage();
  resetDemoCommerceState();
  completeDemoCheckout("failed-chicken", "VIRTUAL_CHICKEN", 2, "failed");
  assert.equal(loadDemoCommerceState().inventory.virtualChickens, 0);
  completeDemoCheckout("premium-once", "PREMIUM_BENEFITS", 1, "succeeded");
  completeDemoCheckout("cancelled-lantern", "ROYAL_LANTERN_BUNDLE", 1, "cancelled");
  assert.equal(loadDemoCommerceState().inventory.royalLanterns, 5);
  assert.equal(quoteDemoCheckout("VIRTUAL_CHICKEN", 1).totalVnd, 7_000);
  assert.equal(quoteDemoCheckout("XAM_DETAILED_READING", 1).totalVnd, 13_300);
  assert.equal(quoteDemoCheckout("KEO_DETAILED_READING", 1).totalVnd, 13_300);
  assert.equal(quoteDemoCheckout("ROYAL_LANTERN_BUNDLE", 1).totalVnd, 7_000);
  assert.equal(quoteDemoCheckout("PREMIUM_BENEFITS", 1).totalVnd, 59_000);
  assert.equal(quoteDemoCheckout("VIRTUAL_CHICKEN", 1).discountVnd, 3_000);
});

test("item and reading consumption is validated and reading unlock is idempotent", () => {
  installMemoryStorage();
  resetDemoCommerceState();
  completeDemoCheckout("premium-for-use", "PREMIUM_BENEFITS", 1, "succeeded");
  const afterUse = consumeDemoInventory("virtualChickens", 1, "use-chicken-1");
  assert.equal(afterUse.inventory.virtualChickens, 2);
  const firstUnlock = consumeDemoReadingEntitlement("xam", "draw-123");
  const replayUnlock = consumeDemoReadingEntitlement("xam", "draw-123");
  const sameIdInOtherFlow = consumeDemoReadingEntitlement("keo", "draw-123");
  assert.equal(firstUnlock.entitlements.xamDetailedReadings, 1);
  assert.equal(replayUnlock.entitlements.xamDetailedReadings, 1);
  assert.equal(sameIdInOtherFlow.entitlements.keoDetailedReadings, 1);
  assert.equal(replayUnlock.readingUses.length, 1);
  assert.throws(() => consumeDemoInventory("royalLanterns", 6, "use-too-many-lanterns"), /Kho vật phẩm/);
});

test("single xam and keo purchases unlock only their matching result and persist across reloads", () => {
  installMemoryStorage();
  resetDemoCommerceState();
  const xam = completeDemoReadingCheckout("buy-xam-1", "xam", "draw-1", "succeeded");
  const replay = completeDemoReadingCheckout("buy-xam-1", "xam", "draw-1", "succeeded");
  const keo = completeDemoReadingCheckout("buy-keo-1", "keo", "session-1:throw-1", "succeeded");
  assert.equal(xam.transaction.totalVnd, 19_000);
  assert.equal(replay.replayed, true);
  assert.throws(() => completeDemoReadingCheckout("buy-xam-1", "xam", "draw-2", "succeeded"), /giao dịch khác/);
  assert.equal(keo.transaction.totalVnd, 19_000);
  assert.equal(isDemoReadingUnlocked("xam", "draw-1"), true);
  assert.equal(isDemoReadingUnlocked("xam", "draw-2"), false);
  assert.equal(isDemoReadingUnlocked("keo", "session-1:throw-1"), true);
  assert.equal(loadDemoCommerceState().entitlements.unlockedReadingIds.length, 2);
});

test("failed and cancelled reading checkouts do not unlock a result", () => {
  installMemoryStorage();
  resetDemoCommerceState();
  completeDemoReadingCheckout("fail-xam", "xam", "draw-fail", "failed");
  completeDemoReadingCheckout("cancel-keo", "keo", "cast-cancel", "cancelled");
  assert.equal(isDemoReadingUnlocked("xam", "draw-fail"), false);
  assert.equal(isDemoReadingUnlocked("keo", "cast-cancel"), false);
});

test("production mode rejects demo commerce writes", () => {
  const storage = installMemoryStorage();
  globalThis.window.location.search = "";
  globalThis.window.sessionStorage.getItem = () => null;
  assert.throws(() => completeDemoReadingCheckout("prod-attempt", "xam", "draw-prod", "succeeded"), /Demo Mode/);
  assert.equal(storage.has(`tltl-demo-${DEMO_COMMERCE_STORAGE_KEY}`), false);
});

test("reset clears commerce unlocks", () => {
  installMemoryStorage();
  completeDemoReadingCheckout("reset-checkout", "xam", "draw-reset", "succeeded");
  assert.equal(isDemoReadingUnlocked("xam", "draw-reset"), true);
  const reset = resetDemoCommerceState();
  assert.equal(reset.entitlements.unlockedReadingIds.length, 0);
  assert.equal(isDemoReadingUnlocked("xam", "draw-reset"), false);
});

test("virtual chicken and lantern bundle purchases grant the exact consumable quantities", () => {
  installMemoryStorage();
  resetDemoCommerceState();
  const chicken = completeDemoCheckout("buy-chicken-1", "VIRTUAL_CHICKEN", 1, "succeeded");
  const lanterns = completeDemoCheckout("buy-lantern-2", "ROYAL_LANTERN_BUNDLE", 2, "succeeded");
  assert.equal(chicken.state.inventory.virtualChickens, 1);
  assert.equal(lanterns.state.inventory.royalLanterns, 6);
  assert.equal(chicken.transaction.totalVnd, 10_000);
  assert.equal(lanterns.transaction.totalVnd, 20_000);
});

test("inventory use records history and the same request ID cannot consume twice", () => {
  installMemoryStorage();
  resetDemoCommerceState();
  completeDemoCheckout("buy-chicken-stock", "VIRTUAL_CHICKEN", 2, "succeeded");
  const first = consumeDemoInventory("virtualChickens", 1, "altar-offering-1");
  const replay = consumeDemoInventory("virtualChickens", 1, "altar-offering-1");
  assert.equal(first.inventory.virtualChickens, 1);
  assert.equal(replay.inventory.virtualChickens, 1);
  assert.equal(replay.inventoryUses.length, 1);
  assert.throws(() => consumeDemoInventory("virtualChickens", 2, "altar-offering-1"), /vật phẩm khác/);
});

test("premium-provided chicken and lantern balances can be consumed once and never become negative", () => {
  installMemoryStorage();
  resetDemoCommerceState();
  completeDemoCheckout("buy-premium-for-inventory", "PREMIUM_BENEFITS", 1, "succeeded");
  const afterChicken = consumeDemoInventory("virtualChickens", 1, "premium-chicken-use");
  const afterLantern = consumeDemoInventory("royalLanterns", 1, "premium-lantern-use");
  assert.equal(afterChicken.inventory.virtualChickens, 2);
  assert.equal(afterLantern.inventory.royalLanterns, 4);
  assert.throws(() => consumeDemoInventory("virtualChickens", 99, "negative-stock-test"), /Kho vật phẩm/);
});

test("legacy commerce state is migrated with an empty inventory-use history", () => {
  const storage = installMemoryStorage();
  const { schemaVersion, accountId, inventory, entitlements, processedRequestIds, transactions } = resetDemoCommerceState();
  storage.set(`tltl-demo-${DEMO_COMMERCE_STORAGE_KEY}`, JSON.stringify({ schemaVersion, accountId, inventory: { ...inventory, virtualChickens: 2 }, entitlements, processedRequestIds, transactions }));
  assert.equal(loadDemoCommerceState().inventory.virtualChickens, 2);
  assert.deepEqual(loadDemoCommerceState().inventoryUses, []);
  assert.deepEqual(loadDemoCommerceState().readingUses, []);
});

test("separate Premium purchases stack benefits and history; failed or cancelled Premium grants nothing", () => {
  installMemoryStorage();
  const failed = completeDemoCheckout("premium-failed", "PREMIUM_BENEFITS", 1, "failed");
  const cancelled = completeDemoCheckout("premium-cancelled", "PREMIUM_BENEFITS", 1, "cancelled");
  assert.equal(failed.state.entitlements.premiumOwned, false);
  assert.equal(cancelled.state.inventory.virtualChickens, 0);
  const first = completeDemoCheckout("premium-stack-1", "PREMIUM_BENEFITS", 1, "succeeded");
  const second = completeDemoCheckout("premium-stack-2", "PREMIUM_BENEFITS", 1, "succeeded");
  assert.equal(second.state.entitlements.xamDetailedReadings, 4);
  assert.equal(second.state.entitlements.keoDetailedReadings, 4);
  assert.equal(second.state.inventory.virtualChickens, 6);
  assert.equal(second.state.inventory.royalLanterns, 10);
  assert.equal(second.state.transactions.length, 4);
  assert.equal(first.transaction.totalVnd, DEMO_COMMERCE_CONFIG.premiumListPriceVnd);
  assert.equal(quoteDemoCheckout("PREMIUM_BENEFITS", 1, second.state).totalVnd, 59_000);
});

test("demo balances and transaction and use history persist after reload", () => {
  installMemoryStorage();
  resetDemoCommerceState();
  completeDemoCheckout("persistent-premium", "PREMIUM_BENEFITS", 1, "succeeded");
  consumeDemoReadingEntitlement("xam", "persistent-reading");
  consumeDemoInventory("virtualChickens", 1, "persistent-chicken-use");
  const reloaded = loadDemoCommerceState();
  assert.equal(reloaded.entitlements.premiumOwned, true);
  assert.equal(reloaded.entitlements.xamDetailedReadings, 1);
  assert.equal(reloaded.inventory.virtualChickens, 2);
  assert.equal(reloaded.transactions.length, 1);
  assert.equal(reloaded.readingUses.length, 1);
  assert.equal(reloaded.inventoryUses.length, 1);
});

test("end-to-end demo journey links xam to keo, purchases and consumes inventory, Premium benefits, discounts, reload, reset, and production isolation", async () => {
  const storage = installMemoryStorage();
  resetDemoCommerceState();
  storage.set("tltl-profile-production", "keep-me");

  const xam = { id: `demo-xam-${crypto.randomUUID()}`, drawId: "" };
  xam.drawId = xam.id;
  storage.set("tltl-demo-xin-xam-current-result-v1", JSON.stringify({ drawId: xam.drawId, result: xam }));
  completeDemoReadingCheckout("journey-xam-buy", "xam", xam.id, "succeeded");
  assert.equal(isDemoReadingUnlocked("xam", xam.id), true);

  const keoFlow = { sessionId: `demo-keo-${crypto.randomUUID()}`, drawId: xam.drawId, castId: `cast-${crypto.randomUUID()}` };
  assert.equal(keoFlow.drawId, xam.id);
  completeDemoReadingCheckout("journey-keo-buy", "keo", keoFlow.castId, "succeeded");
  assert.equal(isDemoReadingUnlocked("keo", keoFlow.castId), true);

  completeDemoCheckout("journey-chicken-buy", "VIRTUAL_CHICKEN", 1, "succeeded");
  consumeDemoInventory("virtualChickens", 1, "journey-chicken-use");
  assert.equal(loadDemoCommerceState().inventory.virtualChickens, 0);

  completeDemoCheckout("journey-lantern-buy", "ROYAL_LANTERN_BUNDLE", 1, "succeeded");
  consumeDemoInventory("royalLanterns", 1, "journey-lantern-use");
  consumeDemoInventory("royalLanterns", 1, "journey-lantern-use");
  assert.equal(loadDemoCommerceState().inventory.royalLanterns, 2);

  completeDemoCheckout("journey-premium-buy", "PREMIUM_BENEFITS", 1, "succeeded");
  consumeDemoReadingEntitlement("xam", "journey-xam-credit");
  consumeDemoReadingEntitlement("keo", "journey-keo-credit");
  consumeDemoInventory("virtualChickens", 1, "journey-premium-chicken-use");
  consumeDemoInventory("royalLanterns", 1, "journey-premium-lantern-use");
  const extraXam = completeDemoReadingCheckout("journey-extra-xam", "xam", "journey-extra-xam-result", "succeeded");
  const extraKeo = completeDemoReadingCheckout("journey-extra-keo", "keo", "journey-extra-keo-result", "succeeded");
  completeDemoCheckout("journey-extra-chicken", "VIRTUAL_CHICKEN", 1, "succeeded");
  completeDemoCheckout("journey-extra-lanterns", "ROYAL_LANTERN_BUNDLE", 1, "succeeded");
  assert.equal(extraXam.transaction.totalVnd, 13_300);
  assert.equal(extraKeo.transaction.totalVnd, 13_300);
  const afterReload = loadDemoCommerceState();
  assert.equal(afterReload.entitlements.premiumOwned, true);
  assert.equal(afterReload.entitlements.xamDetailedReadings, 1);
  assert.equal(afterReload.entitlements.keoDetailedReadings, 1);
  assert.equal(afterReload.inventory.virtualChickens, 3);
  assert.equal(afterReload.inventory.royalLanterns, 9);
  assert.equal(quoteDemoCheckout("XAM_DETAILED_READING", 1, afterReload).totalVnd, 13_300);
  assert.equal(quoteDemoCheckout("KEO_DETAILED_READING", 1, afterReload).totalVnd, 13_300);
  assert.equal(quoteDemoCheckout("VIRTUAL_CHICKEN", 1, afterReload).totalVnd, 7_000);
  assert.equal(quoteDemoCheckout("ROYAL_LANTERN_BUNDLE", 1, afterReload).totalVnd, 7_000);
  assert.equal(quoteDemoCheckout("PREMIUM_BENEFITS", 1, afterReload).totalVnd, 59_000);
  assert.equal(afterReload.transactions.length, 9);
  assert.equal(afterReload.readingUses.length, 2);
  assert.equal(afterReload.inventoryUses.length, 4);
  assert.deepEqual(readDemoValue("xin-xam-current-result-v1", null).result.id, xam.id);

  clearDemoValues();
  resetDemoCommerceState();
  assert.equal(loadDemoCommerceState().transactions.length, 0);
  assert.equal(readDemoValue("xin-xam-current-result-v1", null), null);
  assert.equal(storage.get("tltl-profile-production"), "keep-me");

  globalThis.window.location.search = "";
  globalThis.window.sessionStorage.getItem = () => null;
  assert.throws(() => completeDemoCheckout("journey-prod-attempt", "PREMIUM_BENEFITS", 1, "succeeded"), /Demo Mode/);
  assert.equal(loadDemoCommerceState().entitlements.premiumOwned, false);
});
