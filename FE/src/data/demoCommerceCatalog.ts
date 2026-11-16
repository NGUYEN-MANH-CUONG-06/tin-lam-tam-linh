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
  | "OFFERING_STICKY_RICE"
  | "OFFERING_WATERMELON"
  | "OFFERING_FRUIT_PLATE"
  | "OFFERING_COMBO_FULL"
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
  VIRTUAL_CHICKEN: { sku: "VIRTUAL_CHICKEN", name: "Đĩa gà luộc hoa hồng", unitPriceVnd: 10_000, unitLabel: "mâm", discountEligible: true },
  ROYAL_LANTERN_BUNDLE: { sku: "ROYAL_LANTERN_BUNDLE", name: "Hoa đăng Hoàng Kim", unitPriceVnd: 10_000, unitLabel: "bộ 3 chiếc", discountEligible: true },
  OFFERING_STICKY_RICE: { sku: "OFFERING_STICKY_RICE", name: "Lễ vật Xôi gấc hoa mai", unitPriceVnd: 6_000, unitLabel: "đĩa", discountEligible: true },
  OFFERING_WATERMELON: { sku: "OFFERING_WATERMELON", name: "Lễ vật Cặp dưa hấu khắc chữ", unitPriceVnd: 8_000, unitLabel: "cặp", discountEligible: true },
  OFFERING_FRUIT_PLATE: { sku: "OFFERING_FRUIT_PLATE", name: "Lễ vật Mâm ngũ quả men lam", unitPriceVnd: 10_000, unitLabel: "mâm", discountEligible: true },
  OFFERING_COMBO_FULL: { sku: "OFFERING_COMBO_FULL", name: "Combo Trọn Mâm Cỗ Gia Tiên (4 món)", unitPriceVnd: 28_000, unitLabel: "mâm cỗ", discountEligible: true },
  PREMIUM_BENEFITS: { sku: "PREMIUM_BENEFITS", name: "Gói Hội Viên", unitPriceVnd: DEMO_COMMERCE_CONFIG.premiumListPriceVnd, unitLabel: "gói", discountEligible: false },
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
