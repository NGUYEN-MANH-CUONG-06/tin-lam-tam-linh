export const OPEN_DEMO_PREMIUM_EVENT = "tltl-open-demo-premium";

export function openDemoPremiumPurchase(): void {
  if (typeof window !== "undefined") {
    window.setTimeout(() => window.dispatchEvent(new Event(OPEN_DEMO_PREMIUM_EVENT)), 0);
  }
}

export const DEMO_COMMERCE_CHANGED_EVENT = "tltl-demo-inventory-change";
