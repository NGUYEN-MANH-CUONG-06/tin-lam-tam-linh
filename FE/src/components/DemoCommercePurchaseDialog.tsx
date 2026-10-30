import { useRef, useState } from "react";
import { AppDialog } from "./AppDialog";
import { Button } from "./ui/button";
import { DEMO_COMMERCE_CATALOG, type DemoCommerceSku } from "../data/demoCommerceCatalog";
import { openDemoPremiumPurchase } from "../data/demoPremiumEvents";
import {
  completeDemoCheckout,
  loadDemoCommerceState,
  quoteDemoCheckout,
  type DemoCommerceState,
} from "../data/demoCommerceService";

interface DemoCommercePurchaseDialogProps {
  sku: "VIRTUAL_CHICKEN" | "ROYAL_LANTERN_BUNDLE";
  onClose: () => void;
  onPurchaseComplete: (state: DemoCommerceState) => void;
}

export function DemoCommercePurchaseDialog({ sku, onClose, onPurchaseComplete }: DemoCommercePurchaseDialogProps) {
  const [commerceState, setCommerceState] = useState(loadDemoCommerceState);
  const [quantity, setQuantity] = useState(1);
  const [checkoutReady, setCheckoutReady] = useState(false);
  const [message, setMessage] = useState("");
  const requestIdRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const product = DEMO_COMMERCE_CATALOG[sku];
  const quote = quoteDemoCheckout(sku as DemoCommerceSku, quantity, commerceState);
  const unitsPerPurchase = sku === "ROYAL_LANTERN_BUNDLE" ? 3 : 1;

  const beginCheckout = () => {
    if (busyRef.current) return;
    requestIdRef.current = `purchase:${sku}:${crypto.randomUUID()}`;
    setCheckoutReady(true);
    setMessage("");
  };

  const finishCheckout = (outcome: "succeeded" | "failed" | "cancelled") => {
    if (busyRef.current || !requestIdRef.current) return;
    busyRef.current = true;
    try {
      const result = completeDemoCheckout(requestIdRef.current, sku, quantity, outcome);
      setCommerceState(result.state);
      onPurchaseComplete(result.state);
      if (outcome === "succeeded" && result.transaction.status === "succeeded") {
        window.dispatchEvent(new Event("tltl-demo-inventory-change"));
      }
      requestIdRef.current = null;
      setCheckoutReady(false);
      if (outcome === "succeeded" && result.transaction.status === "succeeded") {
        onClose();
      } else if (outcome === "failed") {
        setMessage("Giao dịch mô phỏng thất bại. Số dư vật phẩm không thay đổi.");
      } else {
        onClose();
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
    <AppDialog labelledBy={`demo-purchase-${sku}`} onClose={onClose}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 id={`demo-purchase-${sku}`} className="font-display text-xl font-bold text-ink">Mua {product.name}</h2>
          <p className="mt-2 text-sm text-muted">
            {sku === "ROYAL_LANTERN_BUNDLE" ? `${quantity * unitsPerPurchase} hoa đăng xịn (${quantity} bộ, mỗi bộ 3 chiếc).` : `${quantity} gà ảo để dâng trên bàn thờ.`}
          </p>
        </div>
        <button type="button" aria-label="Đóng" onClick={onClose} className="min-h-11 min-w-11 rounded-full border border-line text-lg text-muted hover:text-ink">×</button>
      </div>

      <label className="mt-5 block text-sm font-semibold text-ink">
        Số lượng {product.unitLabel}
        <input
          className="mt-2 block min-h-11 w-full rounded-xl border border-line bg-surface px-3 text-ink"
          type="number"
          min={1}
          max={99}
          value={quantity}
          disabled={checkoutReady}
          onChange={(event) => {
            const requestedQuantity = Number(event.target.value) || 1;
            setQuantity(Math.min(99, Math.max(1, Math.floor(requestedQuantity))));
          }}
        />
      </label>

      <dl className="mt-4 space-y-1 rounded-xl border border-line bg-surface-soft p-4 text-sm">
        <div className="flex justify-between gap-3"><dt>Đơn giá</dt><dd>{quote.unitPriceVnd.toLocaleString("vi-VN")}đ / {product.unitLabel}</dd></div>
        {quote.discountVnd > 0 && <div className="flex justify-between gap-3 text-success"><dt>Ưu đãi Premium</dt><dd>−{quote.discountVnd.toLocaleString("vi-VN")}đ</dd></div>}
        <div className="flex justify-between gap-3 border-t border-line pt-2 font-bold"><dt>Tổng cộng</dt><dd>{quote.totalVnd.toLocaleString("vi-VN")}đ</dd></div>
      </dl>

      {!checkoutReady ? (
        <Button type="button" className="mt-4 w-full" onClick={beginCheckout}>Tiếp tục thanh toán mô phỏng</Button>
      ) : (
        <div className="mt-4 space-y-2">
          <p role="note" className="text-xs font-semibold text-accent">Thanh toán mô phỏng — Không phát sinh giao dịch thật.</p>
          <Button type="button" className="w-full" onClick={() => finishCheckout("succeeded")}>Mô phỏng thành công</Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => finishCheckout("failed")}>Mô phỏng thất bại</Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => finishCheckout("cancelled")}>Hủy giao dịch</Button>
        </div>
      )}
      <Button type="button" variant="outline" className="mt-2 w-full" onClick={() => { onClose(); openDemoPremiumPurchase(); }}>Xem hoặc mua Premium</Button>
      {message && <p role="status" className="mt-3 text-sm text-muted">{message}</p>}
    </AppDialog>
  );
}
