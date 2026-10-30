import { apiRequest } from "../lib/api";
import { isDemoMode } from "./demoMode";
import { consumeDemoInventory, loadDemoCommerceState } from "./demoCommerceService";

export interface LanternUseReceipt {
  id: string;
  itemCode: "ROYAL_LANTERN";
  replayed: boolean;
}

export function useRoyalLantern(requestId: string) {
  if (isDemoMode()) {
    try {
      const prior = loadDemoCommerceState().inventoryUses.some((use) => use.requestId === requestId);
      consumeDemoInventory("royalLanterns", 1, requestId);
      return Promise.resolve({ id: `demo-${requestId}`, itemCode: "ROYAL_LANTERN", replayed: prior } satisfies LanternUseReceipt);
    } catch (error) {
      return Promise.reject(error);
    }
  }
  return apiRequest<LanternUseReceipt>(
    "/inventory/royal-lantern/use",
    {
      method: "POST",
      body: JSON.stringify({ requestId }),
    }
  );
}

export function getDemoRoyalLanternStock(): number {
  return loadDemoCommerceState().inventory.royalLanterns;
}
