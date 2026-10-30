/** Prices and demo benefits are centralized here for FE-only mock commerce. */
export const DEMO_COMMERCE_CONFIG = {
  launchPremiumPriceEnabled: false,
  launchPremiumPriceVnd: 49_000,
  premiumListPriceVnd: 59_000,
  memberAdditionalPurchaseDiscountPercent: 30,
} as const;

export type DemoCommerceSku =
  | "XAM_DETAILED_READING"
  | "KEO_DETAILED_READING"
  | "VIRTUAL_CHICKEN"
  | "ROYAL_LANTERN_BUNDLE"
  | "PREMIUM_BENEFITS";

export interface DemoCommerceProduct {
  sku: DemoCommerceSku;
  name: string;
  unitPriceVnd: number;
  unitLabel: string;
  discountEligible: boolean;
}

export const DEMO_COMMERCE_CATALOG: Record<DemoCommerceSku, DemoCommerceProduct> = {
  XAM_DETAILED_READING: { sku: "XAM_DETAILED_READING", name: "Luận giải xăm chi tiết", unitPriceVnd: 19_000, unitLabel: "lượt", discountEligible: true },
  KEO_DETAILED_READING: { sku: "KEO_DETAILED_READING", name: "Luận giải keo chi tiết", unitPriceVnd: 19_000, unitLabel: "lượt", discountEligible: true },
  VIRTUAL_CHICKEN: { sku: "VIRTUAL_CHICKEN", name: "Gà ảo", unitPriceVnd: 10_000, unitLabel: "con", discountEligible: true },
  ROYAL_LANTERN_BUNDLE: { sku: "ROYAL_LANTERN_BUNDLE", name: "Hoa đăng xịn", unitPriceVnd: 10_000, unitLabel: "bộ 3 chiếc", discountEligible: true },
  PREMIUM_BENEFITS: { sku: "PREMIUM_BENEFITS", name: "Premium", unitPriceVnd: DEMO_COMMERCE_CONFIG.premiumListPriceVnd, unitLabel: "gói", discountEligible: false },
};

export const DEMO_PREMIUM_BENEFITS = {
  xamDetailedReadings: 2,
  keoDetailedReadings: 2,
  virtualChickens: 3,
  royalLanterns: 5,
} as const;

export function getDemoProductPrice(sku: DemoCommerceSku, premiumOwned = false): number {
  if (sku === "PREMIUM_BENEFITS" && DEMO_COMMERCE_CONFIG.launchPremiumPriceEnabled) {
    return DEMO_COMMERCE_CONFIG.launchPremiumPriceVnd;
  }
  const product = DEMO_COMMERCE_CATALOG[sku];
  if (!premiumOwned || !product.discountEligible) return product.unitPriceVnd;
  return Math.round(product.unitPriceVnd * (100 - DEMO_COMMERCE_CONFIG.memberAdditionalPurchaseDiscountPercent) / 100);
}
