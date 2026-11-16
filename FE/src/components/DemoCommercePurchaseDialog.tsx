import { useEffect, useRef, useState } from "react";
import { AppDialog } from "./AppDialog";
import { DEMO_COMMERCE_CATALOG, type DemoCommerceSku } from "../data/demoCommerceCatalog";
import { openDemoPremiumPurchase } from "../data/demoPremiumEvents";
import {
  completeDemoCheckout,
  completeDemoCartCheckout,
  loadDemoCommerceState,
  quoteDemoCheckout,
  type DemoCommerceState,
} from "../data/demoCommerceService";
import {
  Crown,
  Sparkles,
  Plus,
  Minus,
  X,
  Check,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";

export type DemoPurchasableSku =
  | "VIRTUAL_CHICKEN"
  | "ROYAL_LANTERN_BUNDLE"
  | "OFFERING_STICKY_RICE"
  | "OFFERING_WATERMELON"
  | "OFFERING_FRUIT_PLATE"
  | "OFFERING_COMBO_FULL";

const ALTAR_OFFERINGS: { sku: DemoPurchasableSku; name: string; unitLabel: string }[] = [
  { sku: "VIRTUAL_CHICKEN", name: "Đĩa gà luộc", unitLabel: "mâm" },
  { sku: "OFFERING_STICKY_RICE", name: "Đĩa xôi gấc", unitLabel: "đĩa" },
  { sku: "OFFERING_WATERMELON", name: "Cặp dưa hấu", unitLabel: "cặp" },
  { sku: "OFFERING_FRUIT_PLATE", name: "Mâm ngũ quả", unitLabel: "mâm" },
];

interface DemoCommercePurchaseDialogProps {
  sku: DemoPurchasableSku;
  showAll?: boolean;
  onClose: () => void;
  onPurchaseComplete: (state: DemoCommerceState) => void;
}

// Huy hiệu vector lễ vật hoàng gia sắc nét
function OfferingVectorBadge({ sku }: { sku: DemoPurchasableSku }) {
  if (sku === "OFFERING_COMBO_FULL") {
    return (
      <svg
        viewBox="0 0 48 48"
        className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md shrink-0"
        fill="none"
        aria-hidden="true"
      >
        <ellipse cx="24" cy="37" rx="22" ry="7.5" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" />
        <ellipse cx="24" cy="37" rx="19.5" ry="5.5" fill="#fffbeb" stroke="#d97706" strokeWidth="0.8" strokeDasharray="2 1.5" />
        <ellipse cx="16" cy="27" rx="6" ry="6.5" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
        <circle cx="18" cy="21" r="1.5" fill="#dc2626" />
        <ellipse cx="24" cy="28" rx="4.5" ry="3.5" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
        <circle cx="24" cy="28" r="1.2" fill="#facc15" />
        <circle cx="31" cy="25" r="5" fill="#15803d" stroke="#14532d" strokeWidth="1" />
        <circle cx="34" cy="29" r="3" fill="#eab308" />
        <circle cx="28" cy="30" r="2.2" fill="#ef4444" />
        <path d="M24 10L25 13L28 14L25 15L24 18L23 15L20 14L23 13Z" fill="#f59e0b" />
        <path d="M12 14L12.7 16L14.7 16.7L12.7 17.4L12 19.4L11.3 17.4L9.3 16.7L11.3 16Z" fill="#fbbf24" />
        <path d="M36 13L36.7 15L38.7 15.7L36.7 16.4L36 18.4L35.3 16.4L33.3 15.7L35.3 15Z" fill="#fbbf24" />
      </svg>
    );
  }

  if (sku === "OFFERING_STICKY_RICE") {
    return (
      <svg
        viewBox="0 0 48 48"
        className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md shrink-0"
        fill="none"
        aria-hidden="true"
      >
        <ellipse cx="24" cy="36" rx="20" ry="7.5" fill="#fefdfb" stroke="#d4af37" strokeWidth="1.5" />
        <ellipse cx="24" cy="36" rx="17" ry="5.5" fill="#f8f6f0" />
        <path
          d="M24 16C21 16 20 20 22 23C19 22 17 24 18 27C17 30 20 32 23 31C24 34 27 34 28 31C31 32 34 30 33 27C34 24 32 22 29 23C31 20 30 16 27 16C25.5 14 24.5 14 24 16Z"
          fill="#b91c1c"
          stroke="#991b1b"
          strokeWidth="1.2"
        />
        <circle cx="25.5" cy="24" r="3.5" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
        <circle cx="25.5" cy="24" r="1.5" fill="#facc15" />
      </svg>
    );
  }

  if (sku === "OFFERING_WATERMELON") {
    return (
      <svg
        viewBox="0 0 48 48"
        className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md shrink-0"
        fill="none"
        aria-hidden="true"
      >
        <rect x="8" y="34" width="32" height="6" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.2" />
        <circle cx="19" cy="25" r="11" fill="#15803d" stroke="#14532d" strokeWidth="1.2" />
        <path d="M11 23C14 27 18 29 22 29" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M13 18C16 21 21 23 25 21" stroke="#166534" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="19" cy="25" r="4.5" fill="#b91c1c" />
        <text x="19" y="27.5" textAnchor="middle" fill="#fef08a" fontSize="7" fontWeight="bold" fontFamily="serif">TÀI</text>
        <circle cx="31" cy="26" r="9.5" fill="#16a34a" stroke="#14532d" strokeWidth="1.2" />
        <path d="M25 24C28 27 32 28 36 27" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="31" cy="26" r="4" fill="#b91c1c" />
        <text x="31" y="28.5" textAnchor="middle" fill="#fef08a" fontSize="6" fontWeight="bold" fontFamily="serif">LỘC</text>
      </svg>
    );
  }

  if (sku === "OFFERING_FRUIT_PLATE") {
    return (
      <svg
        viewBox="0 0 48 48"
        className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md shrink-0"
        fill="none"
        aria-hidden="true"
      >
        <ellipse cx="24" cy="36" rx="20" ry="7.5" fill="#fefdfb" stroke="#1e3a8a" strokeWidth="1.5" />
        <ellipse cx="24" cy="36" rx="17" ry="5.5" fill="#f0f9ff" stroke="#3b82f6" strokeWidth="0.8" strokeDasharray="1.5 1.5" />
        <path d="M12 28C14 21 22 22 28 26C24 29 18 30 12 28Z" fill="#65a30d" stroke="#4d7c0f" strokeWidth="1" />
        <circle cx="24" cy="21" r="7" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
        <circle cx="32" cy="25" r="5.5" fill="#e11d48" stroke="#be123c" strokeWidth="1" />
        <circle cx="16" cy="25" r="5" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
      </svg>
    );
  }

  if (sku === "VIRTUAL_CHICKEN") {
    return (
      <svg
        viewBox="0 0 48 48"
        className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md shrink-0"
        fill="none"
        aria-hidden="true"
      >
        {/* Đĩa sứ viền vàng */}
        <ellipse cx="24" cy="36" rx="20" ry="7.5" fill="#fefdfb" stroke="#d4af37" strokeWidth="1.5" />
        <ellipse cx="24" cy="36" rx="17" ry="5.5" fill="#f8f6f0" />
        <ellipse
          cx="24"
          cy="36"
          rx="14"
          ry="4"
          stroke="#1e3a8a"
          strokeWidth="0.8"
          strokeDasharray="1.5 1.5"
          fill="none"
          opacity="0.6"
        />
        {/* Thân gà luộc vàng ươm */}
        <path
          d="M12 30C11.5 23 15 17 22 17C23.5 13 26 11 30 10.5C32 13 33 16 31.5 18.5C35.5 19 37.5 22.5 37 27C36.5 31 32 34 25 34C18 34 13 33 12 30Z"
          fill="url(#chickenGoldDlg)"
          stroke="#b45309"
          strokeWidth="1.4"
        />
        {/* Cánh gà uốn lượn */}
        <path
          d="M19 23C15 25 15 29 19 30C23 31 25 28 24 24C23 21 21 21 19 23Z"
          fill="#f59e0b"
          stroke="#b45309"
          strokeWidth="1"
        />
        {/* Mào gà đỏ son */}
        <path
          d="M30 10.5C30.5 8 32.5 8.5 33 10C34 8.5 35.5 9 35 11C36 10.5 37 11.5 36 13C34 13 32 11.5 30 10.5Z"
          fill="#dc2626"
        />
        {/* Bông hoa hồng ngậm ở mỏ gà */}
        <circle cx="34.5" cy="15.5" r="3.2" fill="#e11d48" />
        <circle cx="34.5" cy="15.5" r="2" fill="#be123c" />
        <circle cx="34.5" cy="15.5" r="0.9" fill="#fecdd3" />
        <defs>
          <linearGradient id="chickenGoldDlg" x1="12" y1="12" x2="36" y2="34" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="0.4" stopColor="#facc15" />
            <stop offset="0.85" stopColor="#eab308" />
            <stop offset="1" stopColor="#ca8a04" />
          </linearGradient>
        </defs>
      </svg>
    );
  }

  // ROYAL_LANTERN_BUNDLE
  return (
    <svg
      viewBox="0 0 48 48"
      className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-md shrink-0"
      fill="none"
      aria-hidden="true"
    >
      <path d="M24 38C14 38 10 32 10 32C13 35 18 36 24 36C30 36 35 35 38 32C38 32 34 38 24 38Z" fill="#b45309" />
      <path d="M12 30C15 22 21 25 24 32C19 32 15 31 12 30Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
      <path d="M36 30C33 22 27 25 24 32C29 32 33 31 36 30Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
      <path d="M17 33C19 20 23 20 24 33C21 33 19 33 17 33Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <path d="M31 33C29 20 25 20 24 33C27 33 29 33 31 33Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
      <path d="M21 34C22 17 23.5 17 24 34C24 34 22 34 21 34Z" fill="#fef08a" stroke="#f59e0b" strokeWidth="1" />
      <ellipse cx="24" cy="22" rx="2.5" ry="5.5" fill="#ffedd5" />
      <path d="M24 16C23 12 24 9 24 8C24 9 25 12 24 16Z" fill="#f97316" />
      <circle cx="24" cy="13" r="1.5" fill="#fef08a" />
    </svg>
  );
}

export function DemoCommercePurchaseDialog({
  sku,
  showAll = false,
  onClose,
  onPurchaseComplete,
}: DemoCommercePurchaseDialogProps) {
  const [activeSku, setActiveSku] = useState<DemoPurchasableSku>(sku);
  const [commerceState, setCommerceState] = useState(loadDemoCommerceState);
  const [quantity, setQuantity] = useState(1);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [message, setMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const requestIdRef = useRef<string | null>(null);
  const busyRef = useRef(false);

  // Giỏ hàng cho Lễ vật gia tiên: cho phép chọn cùng lúc nhiều món với số lượng tùy ý
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>(() => ({
    VIRTUAL_CHICKEN: sku === "OFFERING_COMBO_FULL" || sku === "VIRTUAL_CHICKEN" ? 1 : 0,
    OFFERING_STICKY_RICE: sku === "OFFERING_COMBO_FULL" || sku === "OFFERING_STICKY_RICE" ? 1 : 0,
    OFFERING_WATERMELON: sku === "OFFERING_COMBO_FULL" || sku === "OFFERING_WATERMELON" ? 1 : 0,
    OFFERING_FRUIT_PLATE: sku === "OFFERING_COMBO_FULL" || sku === "OFFERING_FRUIT_PLATE" ? 1 : 0,
  }));

  useEffect(() => {
    setActiveSku(sku);
    setQuantity(1);
    setCheckoutReady(false);
    setMessage("");
    setSuccessMessage("");
    if (sku === "OFFERING_COMBO_FULL") {
      setCartQuantities({
        VIRTUAL_CHICKEN: 1,
        OFFERING_STICKY_RICE: 1,
        OFFERING_WATERMELON: 1,
        OFFERING_FRUIT_PLATE: 1,
      });
    } else if (ALTAR_OFFERINGS.some((o) => o.sku === sku)) {
      setCartQuantities({
        VIRTUAL_CHICKEN: sku === "VIRTUAL_CHICKEN" ? 1 : 0,
        OFFERING_STICKY_RICE: sku === "OFFERING_STICKY_RICE" ? 1 : 0,
        OFFERING_WATERMELON: sku === "OFFERING_WATERMELON" ? 1 : 0,
        OFFERING_FRUIT_PLATE: sku === "OFFERING_FRUIT_PLATE" ? 1 : 0,
      });
    }
  }, [sku]);

  const product = DEMO_COMMERCE_CATALOG[activeSku];
  const quote = quoteDemoCheckout(activeSku as DemoCommerceSku, quantity, commerceState);
  const unitsPerPurchase = activeSku === "ROYAL_LANTERN_BUNDLE" ? 3 : 1;
  const isAltarOffering = ALTAR_OFFERINGS.some((o) => o.sku === activeSku) || activeSku === "OFFERING_COMBO_FULL";

  // Danh sách giỏ hàng lễ vật gia tiên
  const altarCartItems = ALTAR_OFFERINGS.map((item) => ({
    ...item,
    quantity: cartQuantities[item.sku] ?? 0,
    unitPriceVnd: DEMO_COMMERCE_CATALOG[item.sku].unitPriceVnd,
  }));

  const totalSelectedCount = isAltarOffering
    ? altarCartItems.reduce((sum, item) => sum + item.quantity, 0)
    : quantity;

  // Tính số bộ combo hoàn chỉnh (nếu cả 4 món đều có ít nhất 1)
  const isAllFourSelected = isAltarOffering && altarCartItems.every((item) => item.quantity >= 1);
  const comboSets = isAllFourSelected ? Math.min(...altarCartItems.map((item) => item.quantity)) : 0;

  // Tính toán tịnh tài giỏ lễ vật
  const altarSubtotalVnd = altarCartItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPriceVnd,
    0
  );
  const altarComboDiscountVnd = comboSets * 6000;
  const altarAfterComboVnd = Math.max(0, altarSubtotalVnd - altarComboDiscountVnd);
  const isMember = commerceState.entitlements.premiumOwned;
  const altarMemberDiscountVnd = isMember ? Math.round((altarAfterComboVnd * 30) / 100) : 0;
  const finalAltarTotalVnd = altarAfterComboVnd - altarMemberDiscountVnd;

  // Thao tác giỏ hàng
  const handleToggleOffering = (targetSku: DemoPurchasableSku) => {
    if (checkoutReady) return;
    setCartQuantities((prev) => {
      const current = prev[targetSku] ?? 0;
      const next = current > 0 ? 0 : 1;
      return { ...prev, [targetSku]: next };
    });
    setActiveSku(targetSku);
    setMessage("");
    setSuccessMessage("");
  };

  const handleUpdateOfferingQty = (targetSku: DemoPurchasableSku, delta: number) => {
    if (checkoutReady) return;
    setCartQuantities((prev) => {
      const current = prev[targetSku] ?? 0;
      const next = Math.max(0, Math.min(99, current + delta));
      return { ...prev, [targetSku]: next };
    });
    setActiveSku(targetSku);
    setMessage("");
    setSuccessMessage("");
  };

  const handleToggleCombo = () => {
    if (checkoutReady) return;
    if (isAllFourSelected) {
      // Nếu đang chọn combo rồi thì click tiếp sẽ bỏ chọn tất cả
      setCartQuantities({
        VIRTUAL_CHICKEN: 0,
        OFFERING_STICKY_RICE: 0,
        OFFERING_WATERMELON: 0,
        OFFERING_FRUIT_PLATE: 0,
      });
      setActiveSku("VIRTUAL_CHICKEN");
    } else {
      // Nếu chưa chọn đủ combo thì click sẽ chọn trọn bộ 4 món
      setCartQuantities({
        VIRTUAL_CHICKEN: 1,
        OFFERING_STICKY_RICE: 1,
        OFFERING_WATERMELON: 1,
        OFFERING_FRUIT_PLATE: 1,
      });
      setActiveSku("OFFERING_COMBO_FULL");
    }
    setMessage("");
    setSuccessMessage("");
  };

  const handleClearAllOfferings = () => {
    if (checkoutReady) return;
    setCartQuantities({
      VIRTUAL_CHICKEN: 0,
      OFFERING_STICKY_RICE: 0,
      OFFERING_WATERMELON: 0,
      OFFERING_FRUIT_PLATE: 0,
    });
    setMessage("");
    setSuccessMessage("");
  };

  const quickPills = (() => {
    switch (activeSku) {
      case "ROYAL_LANTERN_BUNDLE":
      default:
        return [
          { count: 1, label: "1 bộ", desc: "3 hoa đăng" },
          { count: 3, label: "3 bộ", desc: "9 hoa đăng" },
          { count: 5, label: "5 bộ", desc: "15 hoa đăng" },
        ];
    }
  })();

  const beginCheckout = () => {
    if (busyRef.current) return;
    if (isAltarOffering && totalSelectedCount === 0) {
      setMessage("Vui lòng chọn ít nhất 1 lễ vật để dâng kính.");
      return;
    }
    requestIdRef.current = `purchase:${isAltarOffering ? "altar-cart" : activeSku}:${crypto.randomUUID()}`;
    setCheckoutReady(true);
    setMessage("");
    setSuccessMessage("");
  };

  const finishCheckout = (outcome: "succeeded" | "failed" | "cancelled") => {
    if (busyRef.current || !requestIdRef.current) return;
    busyRef.current = true;
    try {
      if (isAltarOffering) {
        const itemsToPurchase = altarCartItems
          .filter((item) => item.quantity > 0)
          .map((item) => ({ sku: item.sku as DemoCommerceSku, quantity: item.quantity }));

        if (itemsToPurchase.length === 0) {
          setMessage("Vui lòng chọn ít nhất 1 lễ vật.");
          busyRef.current = false;
          return;
        }

        const isExactFullCombo = altarCartItems.every((item) => item.quantity === 1);

        const result = completeDemoCartCheckout(
          requestIdRef.current,
          itemsToPurchase,
          outcome,
          isExactFullCombo,
          finalAltarTotalVnd,
        );

        setCommerceState(result.state);
        onPurchaseComplete(result.state);
        if (outcome === "succeeded") {
          window.dispatchEvent(new Event("tltl-demo-inventory-change"));
        }
        requestIdRef.current = null;
        setCheckoutReady(false);

        if (outcome === "succeeded") {
          const msg = isExactFullCombo
            ? "Đã thỉnh thành công Trọn Mâm Cỗ (4 món) vào kho gia tiên!"
            : `Đã thỉnh thành công ${totalSelectedCount} lễ vật đã chọn vào kho gia tiên!`;
          setSuccessMessage(msg);
          setMessage("");
        } else if (outcome === "failed") {
          setMessage("Giao dịch mô phỏng thất bại. Số dư vật phẩm không thay đổi.");
        } else {
          onClose();
        }
      } else {
        const result = completeDemoCheckout(requestIdRef.current, activeSku, quantity, outcome);
        setCommerceState(result.state);
        onPurchaseComplete(result.state);
        if (outcome === "succeeded" && result.transaction.status === "succeeded") {
          window.dispatchEvent(new Event("tltl-demo-inventory-change"));
        }
        requestIdRef.current = null;
        setCheckoutReady(false);
        if (outcome === "succeeded" && result.transaction.status === "succeeded") {
          setSuccessMessage(`Đã thỉnh thành công ${quantity} ${product.unitLabel} ${product.name}!`);
          setMessage("");
        } else if (outcome === "failed") {
          setMessage("Giao dịch mô phỏng thất bại. Số dư vật phẩm không thay đổi.");
        } else {
          onClose();
        }
      }
    } catch {
      setMessage("Chưa hoàn tất được giao dịch demo. Số dư vật phẩm không thay đổi.");
      setCheckoutReady(false);
      requestIdRef.current = null;
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <AppDialog
      labelledBy={`demo-purchase-${activeSku}`}
      onClose={onClose}
      className="max-w-xl sm:max-w-xl p-4 sm:p-6"
    >
      <div className="space-y-4">
        {/* Header với Icon minh họa */}
        <div className="flex items-start justify-between gap-3 border-b border-line/60 pb-3.5">
          <div className="flex items-center gap-3">
            <div className="w-13 h-13 sm:w-15 sm:h-15 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-600/10 to-red-900/15 border border-amber-500/35 p-1 flex items-center justify-center shrink-0 shadow-xs relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.22),transparent_70%)] animate-pulse" />
              <OfferingVectorBadge
                sku={isAltarOffering && isAllFourSelected ? "OFFERING_COMBO_FULL" : activeSku}
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300 tracking-wide uppercase">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isAltarOffering ? "Lễ phẩm bàn thờ gia tiên" : "Hoa đăng tâm nguyện"}</span>
              </div>
              <h2
                id={`demo-purchase-${activeSku}`}
                className="font-serif text-base sm:text-lg font-bold text-ink leading-snug"
              >
                {isAltarOffering
                  ? isAllFourSelected
                    ? "Thỉnh Combo Trọn Mâm Cỗ (4 món)"
                    : "Thỉnh lễ vật dâng cúng tổ tiên"
                  : `Thỉnh ${product.name}`}
              </h2>
              <p className="text-xs text-muted leading-relaxed">
                {isAltarOffering
                  ? totalSelectedCount > 0
                    ? `Đang chọn ${totalSelectedCount} lễ vật sắm vào kho gia tiên.`
                    : "Chọn một hoặc nhiều lễ vật bên dưới để sắm vào kho gia tiên."
                  : `${quantity * unitsPerPurchase} hoa đăng (${quantity} bộ) thỉnh gửi lời nguyện ước trên dòng nước.`}
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Đóng"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-line bg-surface hover:bg-surface-soft hover:border-amber-600/40 text-muted hover:text-ink flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thông báo thành công nếu vừa thỉnh xong */}
        {successMessage && (
          <div className="rounded-xl border border-emerald-500/35 bg-emerald-500/10 p-2.5 sm:p-3 text-xs text-emerald-950 dark:text-emerald-200 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium text-xs break-words">{successMessage}</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-[11px] transition-colors cursor-pointer shrink-0"
            >
              {isAltarOffering ? "Về bàn thờ" : "Tiếp tục thả hoa đăng"}
            </button>
          </div>
        )}

        {/* NẾU LÀ LỄ VẬT GIA TIÊN: GIỎ CHỌN NHIỀU MÓN LINH HOẠT */}
        {isAltarOffering ? (
          <div className="space-y-2.5">
            {/* COMBO TRỌN MÂM CỖ 4 MÓN NỔI BẬT */}
            <div
              onClick={handleToggleCombo}
              className={`relative p-2.5 sm:p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                isAllFourSelected && comboSets === 1
                  ? "border-amber-600 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-red-900/10 ring-2 ring-amber-600/50 shadow-xs"
                  : "border-amber-500/40 bg-gradient-to-r from-amber-500/[0.08] via-amber-500/[0.03] to-surface hover:border-amber-600/60 hover:bg-amber-500/15"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-surface flex items-center justify-center p-1 border border-amber-500/40 shrink-0 shadow-2xs">
                  <OfferingVectorBadge sku="OFFERING_COMBO_FULL" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-xs sm:text-[13px] text-ink font-serif">
                      Combo Trọn Mâm Cỗ (4 món)
                    </span>
                    <span className="text-[9.5px] font-bold text-red-700 dark:text-red-300 bg-red-500/15 border border-red-500/30 px-1.5 py-0.2 rounded shrink-0">
                      Tiết kiệm 6.000đ
                    </span>
                  </div>
                  <p className="text-[10.5px] text-muted truncate mt-0.5">
                    Gồm Đĩa gà luộc + Đĩa xôi gấc + Cặp dưa hấu + Mâm ngũ quả
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                <div className="text-right">
                  <div className="font-mono font-bold text-xs sm:text-sm text-amber-900 dark:text-amber-200">
                    28.000đ
                  </div>
                  <div className="text-[10px] text-muted line-through">34.000đ</div>
                </div>
                <div className="shrink-0">
                  {isAllFourSelected ? (
                    <div className="w-4.5 h-4.5 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-2xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-4.5 h-4.5 rounded-full border border-stone-300 dark:border-stone-600" />
                  )}
                </div>
              </div>
            </div>

            {/* Header danh mục & nút bỏ chọn */}
            <div className="flex items-center justify-between px-0.5 pt-1">
              <span className="text-xs font-bold text-ink font-serif tracking-wide">
                Hoặc chọn nhiều món tùy ý:
              </span>
              {totalSelectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllOfferings}
                  className="text-[11px] text-stone-500 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Bỏ chọn tất cả
                </button>
              )}
            </div>

            {/* Lưới 4 thẻ lễ vật có checkbox và stepper riêng */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
              {altarCartItems.map((item) => {
                const qty = item.quantity;
                const isSelected = qty > 0;
                const pInfo = DEMO_COMMERCE_CATALOG[item.sku];
                const stock =
                  item.sku === "VIRTUAL_CHICKEN"
                    ? commerceState.inventory.virtualChickens ?? 0
                    : item.sku === "OFFERING_STICKY_RICE"
                    ? commerceState.inventory.stickyRice ?? 0
                    : item.sku === "OFFERING_WATERMELON"
                    ? commerceState.inventory.watermelons ?? 0
                    : commerceState.inventory.fruitPlates ?? 0;

                return (
                  <div
                    key={item.sku}
                    onClick={() => handleToggleOffering(item.sku)}
                    className={`relative p-2.5 sm:p-3 rounded-xl border text-center transition-all duration-200 cursor-pointer flex flex-col items-center justify-between gap-1.5 min-h-[148px] ${
                      isSelected
                        ? "border-amber-600 bg-amber-500/15 ring-2 ring-amber-600/40 shadow-xs"
                        : "border-line bg-surface hover:bg-surface-soft hover:border-amber-600/40"
                    }`}
                  >
                    {/* Checkbox Icon Top-right */}
                    <div className="absolute top-2 right-2">
                      {isSelected ? (
                        <div className="w-4.5 h-4.5 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-2xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-stone-300 dark:border-stone-600" />
                      )}
                    </div>

                    {/* Vector Badge */}
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg bg-surface flex items-center justify-center p-1 border border-line/70 shrink-0 shadow-2xs mt-1">
                      <OfferingVectorBadge sku={item.sku} />
                    </div>

                    {/* Content */}
                    <div className="w-full space-y-1">
                      <div className="font-bold text-[11.5px] sm:text-xs text-ink font-serif text-center leading-snug min-h-[30px] flex items-center justify-center px-0.5 break-words">
                        {item.name}
                      </div>
                      <div>
                        <span className="inline-block font-mono font-bold text-[11px] text-amber-900 dark:text-amber-200 bg-amber-500/12 border border-amber-500/30 px-2 py-0.5 rounded-md">
                          {pInfo.unitPriceVnd.toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 dark:text-stone-400">
                        {stock > 0 ? (
                          <span className="text-emerald-700 dark:text-emerald-400 font-medium">Kho: {stock}</span>
                        ) : (
                          <span>Kho: 0</span>
                        )}
                      </div>
                    </div>

                    {/* Stepper hoặc Nút Chọn */}
                    <div className="w-full pt-1" onClick={(e) => e.stopPropagation()}>
                      {isSelected ? (
                        <div className="flex items-center justify-center gap-1.5 bg-surface/90 rounded-lg p-0.5 border border-amber-600/30 shadow-2xs">
                          <button
                            type="button"
                            disabled={checkoutReady}
                            onClick={() => handleUpdateOfferingQty(item.sku, -1)}
                            className="w-6 h-6 rounded-md bg-surface-soft hover:bg-amber-100 dark:hover:bg-amber-950/40 flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all"
                            title="Giảm số lượng"
                          >
                            <Minus className="w-3 h-3 text-stone-700 dark:text-stone-300" />
                          </button>
                          <span className="font-mono font-bold text-xs text-ink min-w-[18px] text-center select-none">
                            {qty}
                          </span>
                          <button
                            type="button"
                            disabled={checkoutReady || qty >= 99}
                            onClick={() => handleUpdateOfferingQty(item.sku, 1)}
                            className="w-6 h-6 rounded-md bg-surface-soft hover:bg-amber-100 dark:hover:bg-amber-950/40 flex items-center justify-center text-ink cursor-pointer active:scale-95 transition-all"
                            title="Tăng số lượng"
                          >
                            <Plus className="w-3 h-3 text-stone-700 dark:text-stone-300" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleOffering(item.sku)}
                          className="w-full py-1 text-[11px] font-medium text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 rounded-lg hover:bg-amber-500/10 transition-colors cursor-pointer"
                        >
                          + Chọn món
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* NẾU LÀ HOA ĐĂNG (ROYAL_LANTERN_BUNDLE): DÙNG STEPPER CŨ */
          <div className="space-y-2">
            <label className="text-xs font-bold text-ink tracking-wide font-serif flex items-center justify-between">
              <span>Số lượng {product.unitLabel}</span>
              <span className="text-[11px] font-normal text-muted">Tối đa 99</span>
            </label>

            <div className="flex items-center justify-between rounded-xl border border-amber-900/15 bg-surface-soft/60 p-1.5 shadow-2xs">
              <button
                type="button"
                disabled={checkoutReady || quantity <= 1}
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-lg border border-line bg-surface hover:bg-amber-100/50 dark:hover:bg-amber-950/30 active:scale-95 flex items-center justify-center text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Giảm số lượng"
              >
                <Minus className="w-4 h-4 text-stone-700 dark:text-stone-300" />
              </button>

              <div className="flex items-baseline gap-1 text-center select-none">
                <span className="font-serif text-xl font-bold text-ink">{quantity}</span>
                <span className="text-xs text-muted font-medium">{product.unitLabel}</span>
              </div>

              <button
                type="button"
                disabled={checkoutReady || quantity >= 99}
                onClick={() => setQuantity((q) => Math.min(99, q + 1))}
                className="w-9 h-9 rounded-lg border border-line bg-surface hover:bg-amber-100/50 dark:hover:bg-amber-950/30 active:scale-95 flex items-center justify-center text-ink disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                title="Tăng số lượng"
              >
                <Plus className="w-4 h-4 text-stone-700 dark:text-stone-300" />
              </button>
            </div>

            {/* Quick Selection Pills */}
            <div className="grid grid-cols-3 gap-1.5 pt-0.5">
              {quickPills.map((pill) => {
                const isActive = quantity === pill.count;
                return (
                  <button
                    key={pill.count}
                    type="button"
                    disabled={checkoutReady}
                    onClick={() => setQuantity(pill.count)}
                    className={`px-2 py-1.5 rounded-lg border text-xs transition-all duration-150 cursor-pointer text-center ${
                      isActive
                        ? "border-amber-600 bg-amber-500/15 text-amber-950 dark:text-amber-100 shadow-2xs font-semibold ring-1 ring-amber-500/30"
                        : "border-line bg-surface hover:bg-surface-soft hover:border-amber-600/30 text-stone-600 dark:text-stone-400"
                    }`}
                  >
                    <div className="font-bold text-[11px] leading-tight font-serif">{pill.label}</div>
                    <div className="text-[10px] opacity-75">{pill.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Khối Banner Hội viên An Nhiên */}
        {isMember ? (
          <div className="flex items-center gap-2 rounded-xl border border-amber-500/35 bg-gradient-to-r from-amber-500/12 via-amber-500/6 to-transparent px-3 py-2 text-xs text-amber-950 dark:text-amber-100 shadow-2xs">
            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
              <Crown className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
            </div>
            <span className="font-medium text-[11.5px] leading-snug">
              {isAltarOffering
                ? "Đã áp dụng đặc quyền Hội viên An Nhiên: Giảm 30% cho mỗi mâm lễ."
                : "Đã áp dụng đặc quyền Hội viên An Nhiên: Giảm 30% khi thỉnh hoa đăng."}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-amber-600/25 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 dark:from-stone-900 dark:to-stone-800 p-2.5 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-amber-700 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-amber-950 dark:text-amber-200 leading-snug font-serif">
                  Gói Hội Viên An Nhiên
                </div>
                <div className="text-[10px] text-muted truncate">
                  Tiết kiệm 30% cho mọi lễ vật & tặng lễ miễn phí
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                openDemoPremiumPurchase();
              }}
              className="shrink-0 text-[11px] font-semibold text-amber-800 hover:text-amber-950 dark:text-amber-300 dark:hover:text-amber-100 flex items-center gap-0.5 px-2 py-1 rounded-lg hover:bg-amber-100/60 transition-colors cursor-pointer"
            >
              <span>Xem ưu đãi</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Bảng chi tiết tịnh tài lễ vật */}
        <div className="rounded-xl border border-line/80 bg-surface-soft/60 p-3 text-xs space-y-2">
          {isAltarOffering ? (
            <>
              {totalSelectedCount > 0 ? (
                <div className="space-y-1 pb-1">
                  {altarCartItems
                    .filter((item) => item.quantity > 0)
                    .map((item) => (
                      <div
                        key={item.sku}
                        className="flex justify-between items-center text-[11.5px] text-muted"
                      >
                        <span>
                          {item.name} (x{item.quantity} {item.unitLabel})
                        </span>
                        <span className="font-mono text-ink">
                          {(item.quantity * item.unitPriceVnd).toLocaleString("vi-VN")}đ
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-[11.5px] text-muted text-center py-1">
                  Chưa chọn món nào. Vui lòng bấm vào các món để thêm vào giỏ.
                </div>
              )}

              {altarComboDiscountVnd > 0 && (
                <div className="flex justify-between items-center text-red-700 dark:text-red-300 font-semibold text-xs pt-1 border-t border-line/40">
                  <span>⭐ Ưu đãi Combo Trọn Mâm (4 món)</span>
                  <span className="font-mono font-bold">
                    −{altarComboDiscountVnd.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}

              {altarMemberDiscountVnd > 0 && (
                <div className="flex justify-between items-center text-amber-800 dark:text-amber-300 font-medium text-xs">
                  <span className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>Ưu đãi Hội viên (-30%)</span>
                  </span>
                  <span className="font-mono font-bold">
                    −{altarMemberDiscountVnd.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}

              <div className="border-t border-line/60 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-ink font-serif text-sm">
                  Tổng tịnh tài ({totalSelectedCount} món)
                </span>
                <span className="font-serif text-lg sm:text-xl font-bold text-accent font-mono">
                  {finalAltarTotalVnd.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center text-muted">
                <span>{isAltarOffering ? "Đơn giá lễ vật" : "Đơn giá hoa đăng"}</span>
                <span className="font-mono text-ink">
                  {product.unitPriceVnd.toLocaleString("vi-VN")}đ / {product.unitLabel}
                </span>
              </div>

              {quote.discountVnd > 0 && (
                <div className="flex justify-between items-center text-amber-800 dark:text-amber-300 font-medium">
                  <span className="flex items-center gap-1">
                    <Crown className="w-3 h-3 text-amber-600" />
                    <span>Ưu đãi Hội viên (-30%)</span>
                  </span>
                  <span className="font-mono font-bold">
                    −{quote.discountVnd.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              )}

              <div className="border-t border-line/60 pt-2 flex justify-between items-baseline">
                <span className="font-bold text-ink font-serif text-sm">
                  {isAltarOffering ? "Tổng tịnh tài dâng lễ" : "Tổng tịnh tài thỉnh đèn"}
                </span>
                <span className="font-serif text-lg sm:text-xl font-bold text-accent font-mono">
                  {quote.totalVnd.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </>
          )}
        </div>

        {/* CTA Actions */}
        {!checkoutReady ? (
          <div className="space-y-2 pt-0.5">
            <button
              type="button"
              disabled={isAltarOffering && totalSelectedCount === 0}
              onClick={beginCheckout}
              className="group relative w-full rounded-xl border border-amber-400/40 bg-gradient-to-r from-red-800 via-amber-800 to-amber-700 p-3 text-sm font-bold text-amber-50 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:from-red-700 hover:to-amber-600 hover:shadow-lg active:translate-y-0 active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer font-serif tracking-wide disabled:opacity-40 disabled:pointer-events-none"
            >
              <Sparkles className="w-4 h-4 text-amber-200 transition-transform duration-300 group-hover:scale-110" />
              <span>
                {isAltarOffering
                  ? totalSelectedCount > 0
                    ? `Tiến hành thỉnh lễ • ${finalAltarTotalVnd.toLocaleString("vi-VN")}đ`
                    : "Vui lòng chọn ít nhất 1 lễ vật"
                  : `Tiến hành thỉnh hoa đăng • ${quote.totalVnd.toLocaleString("vi-VN")}đ`}
              </span>
            </button>

            <p role="note" className="text-[11px] text-center text-muted flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-600/70 shrink-0" />
              <span>
                {isAltarOffering
                  ? "Trải nghiệm mô phỏng dâng lễ thành kính — Không phát sinh chi phí thật"
                  : "Trải nghiệm mô phỏng thả hoa đăng tâm nguyện — Không phát sinh chi phí thật"}
              </span>
            </p>
          </div>
        ) : (
          <div className="space-y-2 pt-0.5">
            <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 p-2.5 text-center">
              <p className="text-xs font-semibold text-amber-950 dark:text-amber-200 font-serif">
                {isAltarOffering
                  ? `Xác nhận thỉnh ${totalSelectedCount} lễ vật vào kho gia tiên`
                  : `Xác nhận thỉnh ${quantity} ${product.unitLabel} hoa đăng vào kho`}
              </p>
              {isAltarOffering && (
                <p className="text-[11px] text-muted mt-1">
                  {altarCartItems
                    .filter((item) => item.quantity > 0)
                    .map((item) => `${item.name} (x${item.quantity})`)
                    .join(" • ")}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => finishCheckout("succeeded")}
                className="rounded-xl border border-emerald-600/40 bg-gradient-to-r from-emerald-800 to-emerald-700 hover:from-emerald-700 hover:to-emerald-600 text-white font-semibold text-xs py-2.5 px-3 shadow-xs hover:shadow-sm active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>{isAltarOffering ? "Hoàn tất thỉnh lễ" : "Hoàn tất thỉnh hoa đăng"}</span>
              </button>

              <button
                type="button"
                onClick={() => finishCheckout("failed")}
                className="rounded-xl border border-line bg-surface hover:bg-surface-soft text-stone-600 dark:text-stone-400 font-medium text-xs py-2.5 px-3 transition-colors cursor-pointer"
              >
                Thử mô phỏng lỗi (Demo)
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setCheckoutReady(false);
                requestIdRef.current = null;
              }}
              className="w-full text-center text-[11px] text-muted hover:text-ink py-1 transition-colors cursor-pointer"
            >
              Quay lại chỉnh sửa {isAltarOffering ? "giỏ lễ vật" : "số lượng hoa đăng"}
            </button>
          </div>
        )}

        {message && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-800 dark:text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{message}</span>
          </div>
        )}
      </div>
    </AppDialog>
  );
}
