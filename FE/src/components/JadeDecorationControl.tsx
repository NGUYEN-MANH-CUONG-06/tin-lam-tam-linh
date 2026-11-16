import React, { useState, useEffect } from "react";
import type { useJadeDecoration } from "../hooks/useJadeDecoration";
import { isDemoMode } from "../data/demoMode";
import { DemoCommercePurchaseDialog, type DemoPurchasableSku } from "./DemoCommercePurchaseDialog";
import { loadDemoCommerceState, type DemoCommerceState } from "../data/demoCommerceService";
import {
  Utensils,
  RotateCcw,
  CheckCircle2,
  Check,
  Plus,
  Sparkles,
  ChevronDown,
} from "lucide-react";

export interface OfferingCardItem {
  code: string;
  name: string;
  subtitle: string;
  category: "main" | "decoration";
  description: string;
  priceVnd: number;
  unitLabel: string;
  sku: DemoPurchasableSku;
}

// Bộ icon vector đồng nhất phong cách mỹ thuật tâm linh truyền thống
function OfferingVectorIcon({ code }: { code: string }) {
  switch (code) {
    case "BOILED_CHICKEN":
      return (
        <svg
          viewBox="0 0 36 36"
          className="w-6 h-6"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="18"
            cy="27"
            rx="15"
            ry="5.5"
            fill="#f8fafc"
            stroke="#cbd5e1"
            strokeWidth="1"
          />
          <ellipse cx="18" cy="27" rx="12.5" ry="4" fill="#f1f5f9" />
          <path
            d="M9 22C8.5 17 11 13 16 13C17 10 19 8.5 22 8C23.5 10 24 12 23 14C26 14.5 27.5 17 27 20C26.5 23 23 25 18 25C13 25 9.5 24 9 22Z"
            fill="#eab308"
            stroke="#ca8a04"
            strokeWidth="1.1"
          />
          <path
            d="M13 19C15 16 19 16 22 19"
            stroke="#b45309"
            strokeWidth="1.1"
            strokeLinecap="round"
          />
          <path
            d="M21 7C21.5 5.5 23 5.5 23.5 7C24 5.5 25.5 6 25 7.5"
            fill="#dc2626"
          />
          <circle cx="25.5" cy="11.5" r="2.2" fill="#ef4444" />
          <circle cx="25.5" cy="11.5" r="1.1" fill="#b91c1c" />
        </svg>
      );
    case "STICKY_RICE":
      return (
        <svg
          viewBox="0 0 36 36"
          className="w-6 h-6"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="18"
            cy="27"
            rx="15"
            ry="5.5"
            fill="#fcfaf8"
            stroke="#d4af37"
            strokeWidth="1"
          />
          <g transform="translate(18, 19)">
            {[0, 90, 180, 270].map((deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-6.5"
                rx="4.2"
                ry="5"
                transform={`rotate(${deg})`}
                fill="#ea580c"
                stroke="#c2410c"
                strokeWidth="0.8"
              />
            ))}
            <circle
              cx="0"
              cy="0"
              r="3.8"
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth="0.8"
            />
            <circle cx="0" cy="0" r="1.8" fill="#eab308" />
          </g>
        </svg>
      );
    case "WATERMELON":
      return (
        <svg
          viewBox="0 0 36 36"
          className="w-6 h-6"
          fill="none"
          aria-hidden="true"
        >
          <rect x="11" y="27" width="14" height="3" rx="1.5" fill="#78350f" />
          <path d="M14 27L13 24H23L22 27Z" fill="#92400e" />
          <ellipse
            cx="18"
            cy="17"
            rx="10"
            ry="11.5"
            fill="#15803d"
            stroke="#14532d"
            strokeWidth="1"
          />
          <path
            d="M18 5.5Q14 17 18 28.5"
            stroke="#14532d"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M18 5.5Q10 17 13 28"
            stroke="#14532d"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M18 5.5Q26 17 23 28"
            stroke="#14532d"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M18 5.5Q19 3 21 3.5"
            stroke="#4ade80"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      );
    case "FRUIT_PLATE":
      return (
        <svg
          viewBox="0 0 36 36"
          className="w-6 h-6"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="18"
            cy="27"
            rx="15"
            ry="5.5"
            fill="#f8fafc"
            stroke="#3b82f6"
            strokeWidth="1"
          />
          <circle
            cx="13"
            cy="21"
            r="4.5"
            fill="#f97316"
            stroke="#c2410c"
            strokeWidth="0.8"
          />
          <circle
            cx="23"
            cy="21"
            r="4.5"
            fill="#e11d48"
            stroke="#be123c"
            strokeWidth="0.8"
          />
          <ellipse
            cx="18"
            cy="22"
            rx="4.5"
            ry="5"
            fill="#84cc16"
            stroke="#4d7c0f"
            strokeWidth="0.8"
          />
          <ellipse
            cx="18"
            cy="14"
            rx="4"
            ry="4.5"
            fill="#eab308"
            stroke="#a16207"
            strokeWidth="0.8"
          />
          <path
            d="M18 10C19.5 8 22 9 21.5 11C20 11.5 18 11 18 10Z"
            fill="#15803d"
          />
        </svg>
      );
    case "JADE_LOTUS":
      return (
        <svg
          viewBox="0 0 36 36"
          className="w-6 h-6"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14 18L13 28C13 29 23 29 23 28L22 18Q23 16 21 16H15Q13 16 14 18Z"
            fill="#0d9488"
            stroke="#0f766e"
            strokeWidth="0.8"
          />
          <path
            d="M18 6C16 10 16 14 18 16C20 14 20 10 18 6Z"
            fill="#5eead4"
            stroke="#0d9488"
            strokeWidth="0.8"
          />
          <path
            d="M13 11C15 12 16 14 16 16C14 15 13 13 13 11Z"
            fill="#99f6e4"
          />
          <path
            d="M23 11C21 12 20 14 20 16C22 15 23 13 23 11Z"
            fill="#99f6e4"
          />
        </svg>
      );
    case "GOLDEN_LOTUS":
      return (
        <svg
          viewBox="0 0 36 36"
          className="w-6 h-6"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M14 18L13 28C13 29 23 29 23 28L22 18Q23 16 21 16H15Q13 16 14 18Z"
            fill="#d97706"
            stroke="#b45309"
            strokeWidth="0.8"
          />
          <path
            d="M18 6C16 10 16 14 18 16C20 14 20 10 18 6Z"
            fill="#f59e0b"
            stroke="#b45309"
            strokeWidth="0.8"
          />
          <path
            d="M13 11C15 12 16 14 16 16C14 15 13 13 13 11Z"
            fill="#fde68a"
          />
          <path
            d="M23 11C21 12 20 14 20 16C22 15 23 13 23 11Z"
            fill="#fde68a"
          />
        </svg>
      );
    case "INCENSE_BURNER":
      return (
        <svg
          viewBox="0 0 36 36"
          className="w-6 h-6"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M12 25L10 29M24 25L26 29M18 26V30"
            stroke="#78350f"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <ellipse
            cx="18"
            cy="21"
            rx="8.5"
            ry="6.5"
            fill="#b45309"
            stroke="#78350f"
            strokeWidth="1"
          />
          <path
            d="M9.5 19C8 17 8 23 9.5 21"
            stroke="#92400e"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M26.5 19C28 17 28 23 26.5 21"
            stroke="#92400e"
            strokeWidth="1.2"
            fill="none"
          />
          <path
            d="M18 15Q16 11 18 8Q20 5 18 2"
            stroke="#d97706"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="1.5 1.5"
            fill="none"
          />
        </svg>
      );
    default:
      return null;
  }
}

// Danh sách lễ vật chính dâng bàn thờ gia tiên
export const MAIN_OFFERING_CATALOG: OfferingCardItem[] = [
  {
    code: "BOILED_CHICKEN",
    name: "Đĩa gà luộc",
    subtitle: "Gà luộc hoa hồng",
    category: "main",
    description:
      "Gà trống thiến luộc vàng óng ngậm hoa hồng, bày trang nghiêm ở tiền bái bên trái.",
    priceVnd: 10000,
    unitLabel: "mâm",
    sku: "VIRTUAL_CHICKEN",
  },
  {
    code: "STICKY_RICE",
    name: "Đĩa xôi",
    subtitle: "Xôi gấc hoa mai",
    category: "main",
    description:
      "Đĩa xôi gấc tạo hình hoa mai đỏ thắm, điểm nhụy vàng, đặt trang trọng trên bàn thờ.",
    priceVnd: 6000,
    unitLabel: "đĩa",
    sku: "OFFERING_STICKY_RICE",
  },
  {
    code: "WATERMELON",
    name: "Dưa hấu",
    subtitle: "Cặp dưa hấu khắc chữ",
    category: "main",
    description:
      "Cặp dưa hấu xanh mướt khắc chữ Tài Lộc trên đế gỗ trang nghiêm.",
    priceVnd: 8000,
    unitLabel: "cặp",
    sku: "OFFERING_WATERMELON",
  },
  {
    code: "FRUIT_PLATE",
    name: "Đĩa trái cây",
    subtitle: "Mâm ngũ quả men lam",
    category: "main",
    description:
      "Mâm ngũ quả tươi ngon đủ sắc thái, biểu trưng ngũ hành sung túc hai bên bàn thờ.",
    priceVnd: 10000,
    unitLabel: "mâm",
    sku: "OFFERING_FRUIT_PLATE",
  },
];

// Danh sách vật phẩm trang trí phụ (đã loại bỏ theo yêu cầu người dùng để tập trung vào 4 lễ vật chính)
export const DECORATION_CATALOG: OfferingCardItem[] = [];

export function JadeDecorationControl({
  state,
  allowDemoChickenOffering = false,
  selectedCodes = [],
  onToggleCode,
  placedCodes = [],
  onClearPlaced,
}: {
  state: ReturnType<typeof useJadeDecoration>;
  allowDemoChickenOffering?: boolean;
  selectedCodes?: string[];
  onToggleCode?: (code: string) => void;
  placedCodes?: string[];
  onClearPlaced?: () => void;
}) {
  const [purchaseConfig, setPurchaseConfig] = useState<{
    sku: DemoPurchasableSku;
    showAll: boolean;
  } | null>(null);
  const [commerceState, setCommerceState] = useState(() =>
    isDemoMode() ? loadDemoCommerceState() : null
  );

  useEffect(() => {
    if (!isDemoMode()) return;
    const updateCommerce = () => setCommerceState(loadDemoCommerceState());
    window.addEventListener("tltl-demo-inventory-change", updateCommerce);
    return () =>
      window.removeEventListener("tltl-demo-inventory-change", updateCommerce);
  }, []);

  const getOfferingStock = (sku: DemoPurchasableSku) => {
    if (!isDemoMode() || !commerceState) return 99;
    switch (sku) {
      case "VIRTUAL_CHICKEN":
        return commerceState.inventory.virtualChickens ?? 0;
      case "OFFERING_STICKY_RICE":
        return commerceState.inventory.stickyRice ?? 0;
      case "OFFERING_WATERMELON":
        return commerceState.inventory.watermelons ?? 0;
      case "OFFERING_FRUIT_PLATE":
        return commerceState.inventory.fruitPlates ?? 0;
      default:
        return 0;
    }
  };

  const isOfferingAvailable = (item: OfferingCardItem) => {
    if (isDemoMode()) {
      return getOfferingStock(item.sku) > 0;
    }
    return state.items.some((i) => i.code === item.code);
  };

  const handleCardClick = (item: OfferingCardItem) => {
    // Nếu chưa thỉnh vật phẩm (kho = 0), bấm vào thẻ (hoặc dấu +) sẽ mở mua ĐÚNG món đó thôi
    if (!isOfferingAvailable(item)) {
      setPurchaseConfig({ sku: item.sku, showAll: false });
      return;
    }

    if (onToggleCode) {
      onToggleCode(item.code);
    } else {
      void state.change(item.code);
    }
  };

  const renderOfferingCard = (item: OfferingCardItem, isGrid = true) => {
    const isPlaced = placedCodes.includes(item.code);
    const isSelected = onToggleCode
      ? selectedCodes.includes(item.code)
      : state.selected === item.code;
    const stock = getOfferingStock(item.sku);
    const available = isOfferingAvailable(item);

    return (
      <button
        key={item.code}
        type="button"
        onClick={() => handleCardClick(item)}
        disabled={state.loading || state.busy}
        className={`group relative w-full text-left rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-between gap-2 p-2.5 sm:p-3 min-h-[62px] border ${
          isSelected
            ? "border-amber-600 bg-amber-500/[0.09] shadow-xs ring-1 ring-amber-600/40"
            : isPlaced
              ? "border-emerald-600/40 bg-emerald-500/[0.04]"
              : !available
                ? "border-line bg-surface-soft/40 hover:bg-surface hover:border-amber-600/40 opacity-90 hover:opacity-100"
                : "border-line bg-surface-soft/60 hover:bg-surface hover:border-amber-600/40"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Unified Vector Thumbnail */}
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg shrink-0 overflow-hidden border border-line/80 bg-surface flex items-center justify-center p-1 group-hover:border-amber-600/40 transition-colors shadow-2xs">
            <OfferingVectorIcon code={item.code} />
          </div>

          {/* Name & Subtitle & Price & Owned Stock */}
          <div className={`min-w-0 flex-1 ${isGrid ? "pr-4" : ""}`}>
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-xs sm:text-[13px] font-bold text-ink whitespace-normal break-words leading-snug font-serif">
                {item.name}
              </h4>
              <span className="font-mono font-bold text-[10px] text-amber-800 dark:text-amber-300 bg-amber-500/12 border border-amber-500/25 px-1.5 py-0.2 rounded shrink-0">
                {item.priceVnd.toLocaleString("vi-VN")}đ
              </span>
              {isDemoMode() && (
                available ? (
                  <span
                    className="font-mono text-[9px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-1 py-0.2 rounded shrink-0"
                    title={`Có sẵn ${stock} ${item.unitLabel} trong kho`}
                  >
                    Có: {stock}
                  </span>
                ) : (
                  <span
                    className="text-[9px] font-medium text-stone-500 dark:text-stone-400 bg-stone-500/10 border border-stone-500/20 px-1.5 py-0.2 rounded shrink-0"
                    title="Chưa có trong kho — Bấm vào để thỉnh"
                  >
                    Chưa có
                  </span>
                )
              )}
            </div>
            <div className="flex items-center gap-1 mt-1">
              <p className="text-[10px] sm:text-[11px] text-muted whitespace-normal break-words leading-snug truncate">
                {item.subtitle}
              </p>
            </div>
          </div>
        </div>

        {/* Status Indicator: Top-right circle */}
        <div className="absolute top-2.5 right-2.5 flex items-center">
          {isPlaced ? (
            <span
              className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-2xs"
              title="Đã bày lễ vật"
            >
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          ) : isSelected ? (
            <span
              className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-2xs ring-2 ring-amber-600/20"
              title="Đang xem trước trên bàn thờ"
            >
              <Check className="w-2.5 h-2.5 stroke-[3]" />
            </span>
          ) : !available ? (
            <span
              className="w-3.5 h-3.5 rounded-full border border-dashed border-stone-300 dark:border-stone-600 group-hover:border-amber-500/60 transition-colors"
              title="Chưa có trong kho — Bấm để thỉnh"
            />
          ) : (
            <span className="w-3.5 h-3.5 rounded-full border border-stone-300 dark:border-stone-600 group-hover:border-amber-500/50 transition-colors" />
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="rounded-2xl border border-line bg-surface/95 p-3 sm:p-3.5 shadow-xs space-y-2.5">
      {/* Header bar */}
      <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-1.5">
        <label className="text-xs sm:text-sm font-bold tracking-wide text-ink font-serif flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-accent" />
          <span>1. Chọn lễ vật dâng kính</span>
        </label>

        <span className="text-[10px] font-medium text-muted bg-surface-soft px-2 py-0.5 rounded-full border border-line">
          Đã chọn: {selectedCodes.length} / {MAIN_OFFERING_CATALOG.length}
        </span>
      </div>

      {/* Main Offerings 2x2 Grid */}
      <div>
        <div className="text-[10px] font-medium text-muted mb-1.5">
          Bốn lễ vật truyền thống trên mặt bàn thờ:
        </div>
        <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
          {MAIN_OFFERING_CATALOG.map((item) => renderOfferingCard(item, true))}
        </div>
      </div>

      {/* Footer Instructions & Reset Altar Button */}
      <div className="pt-2.5 border-t border-line/60 flex items-center justify-between gap-2">
        <div className="text-[11px] text-stone-500 dark:text-stone-400 flex items-center gap-1.5 min-w-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-600/70 shrink-0" />
          <span className="truncate">Dâng lễ thành tâm</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isDemoMode() && allowDemoChickenOffering && (
            <button
              type="button"
              onClick={() => setPurchaseConfig({ sku: "OFFERING_COMBO_FULL", showAll: true })}
              className="group relative inline-flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-gradient-to-r from-red-800 via-amber-800 to-amber-700 px-3.5 py-1.5 text-xs font-semibold text-amber-50 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:from-red-700 hover:to-amber-600 hover:shadow-sm active:translate-y-0 active:scale-[0.98] cursor-pointer"
              title="Thỉnh lễ vật dâng cúng tổ tiên (Combo trọn gói hoặc từng món)"
            >
              <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center transition-transform duration-200 group-hover:rotate-90">
                <Plus className="w-3 h-3 text-amber-100" />
              </div>
              <span className="tracking-wide">Thỉnh lễ</span>
            </button>
          )}

          <button
            type="button"
            disabled={state.loading || state.busy}
            onClick={onClearPlaced}
            className="group inline-flex items-center gap-1.5 rounded-xl border border-amber-600/30 bg-gradient-to-b from-amber-50/80 via-white to-amber-100/40 dark:from-stone-800 dark:to-stone-900 px-3 py-1.5 text-xs font-semibold text-amber-950 dark:text-amber-100 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-600/60 hover:bg-amber-100/50 hover:shadow-sm active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 disabled:pointer-events-none disabled:opacity-50 cursor-pointer"
            title="Đặt lại bàn thờ về thanh tịnh"
          >
            <RotateCcw className="h-3.5 w-3.5 text-amber-700 dark:text-amber-400 transition-transform duration-300 group-hover:-rotate-90" />
            <span className="tracking-wide">Làm mới</span>
          </button>
        </div>
      </div>

      {purchaseConfig && isDemoMode() && (
        <DemoCommercePurchaseDialog
          sku={purchaseConfig.sku}
          showAll={purchaseConfig.showAll}
          onClose={() => setPurchaseConfig(null)}
          onPurchaseComplete={(newCommerceState) => {
            setCommerceState(newCommerceState);
            state.syncDemoCommerceState(newCommerceState);
          }}
        />
      )}
    </div>
  );
}
