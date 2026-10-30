import { useEffect, useRef, useState } from "react";
import { Bird, Crown, Flower2, Scale, ScrollText, X } from "lucide-react";
import { AppDialog } from "./AppDialog";
import { Button } from "./ui/button";
import { isDemoMode } from "../data/demoMode";
import { DEMO_COMMERCE_CONFIG, DEMO_PREMIUM_BENEFITS } from "../data/demoCommerceCatalog";
import { DEMO_COMMERCE_CHANGED_EVENT, OPEN_DEMO_PREMIUM_EVENT } from "../data/demoPremiumEvents";
import { completeDemoCheckout, loadDemoCommerceState, quoteDemoCheckout, type DemoCommerceState } from "../data/demoCommerceService";

export function DemoPremiumPurchaseDialogHost() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = () => { if (isDemoMode()) setOpen(true); };
    window.addEventListener(OPEN_DEMO_PREMIUM_EVENT, show);
    return () => window.removeEventListener(OPEN_DEMO_PREMIUM_EVENT, show);
  }, []);
  if (!open || !isDemoMode()) return null;
  return <DemoPremiumPurchaseDialog onClose={() => setOpen(false)} />;
}

function DemoPremiumPurchaseDialog({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<DemoCommerceState>(loadDemoCommerceState);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState("");
  const requestId = useRef<string | null>(null);
  const busy = useRef(false);
  const quote = quoteDemoCheckout("PREMIUM_BENEFITS", 1, state);
  const price = quote.totalVnd.toLocaleString("vi-VN");

  const finish = (outcome: "succeeded" | "failed" | "cancelled") => {
    if (busy.current || !requestId.current) return;
    busy.current = true;
    try {
      const result = completeDemoCheckout(requestId.current, "PREMIUM_BENEFITS", 1, outcome);
      setState(result.state);
      requestId.current = null;
      setConfirming(false);
      if (outcome === "succeeded" && result.transaction.status === "succeeded") {
        window.dispatchEvent(new Event(DEMO_COMMERCE_CHANGED_EVENT));
        setMessage("Premium demo đã được kích hoạt. Quyền lợi đã cộng vào số dư.");
      } else if (outcome === "failed") {
        setMessage("Thanh toán mô phỏng thất bại. Số dư không thay đổi.");
      } else {
        setMessage("Giao dịch đã hủy. Số dư không thay đổi.");
      }
    } catch {
      requestId.current = null;
      setConfirming(false);
      setMessage("Chưa hoàn tất được giao dịch demo. Quyền lợi không thay đổi.");
    } finally {
      busy.current = false;
    }
  };

  const benefitItems = [
    { label: `${DEMO_PREMIUM_BENEFITS.xamDetailedReadings} lượt luận giải xăm`, Icon: ScrollText },
    { label: `${DEMO_PREMIUM_BENEFITS.keoDetailedReadings} lượt luận giải keo`, Icon: Scale },
    { label: `${DEMO_PREMIUM_BENEFITS.virtualChickens} gà ảo`, Icon: Bird },
    { label: `${DEMO_PREMIUM_BENEFITS.royalLanterns} hoa đăng xịn`, Icon: Flower2 },
  ];

  return (
    <AppDialog labelledBy="demo-premium-title" onClose={onClose} className="max-w-[32rem] p-0">
      <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-7 sm:pt-7">
        <div className="flex min-w-0 items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-gold/40 bg-gold/10 text-accent">
            <Crown className="h-5 w-5" aria-hidden="true" />
          </span>
          <div className="pt-0.5">
            <h2 id="demo-premium-title" className="font-display text-xl font-bold leading-tight text-ink sm:text-2xl">Mở rộng hành trình trải nghiệm</h2>
            <p className="mt-1.5 text-sm leading-5 text-muted">Thêm lượt luận giải và vật phẩm dành riêng cho bạn.</p>
          </div>
        </div>
        <button type="button" aria-label="Đóng" onClick={onClose} className="-mr-2 -mt-2 grid min-h-11 min-w-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-surface-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="px-5 pb-4 pt-5 sm:px-7">
        <div className="rounded-2xl border border-gold/35 bg-accent-soft/40 px-4 py-3.5 text-center">
          <p className="font-display text-4xl font-bold tracking-tight text-accent">{price}đ</p>
          <p className="mt-1 text-xs font-medium text-muted">Mua một lần · Không tự động gia hạn</p>
        </div>

        {state.entitlements.premiumOwned && (
          <p className="mt-3 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-center text-xs font-medium text-ink" role="status">
            Bạn đã có Premium. Mua thêm để cộng dồn quyền lợi.
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5" aria-label="Quyền lợi Premium">
          {benefitItems.map(({ label, Icon }) => (
            <div key={label} className="flex min-h-12 items-center gap-2.5 rounded-xl bg-surface-soft/70 px-3 py-2">
              <Icon className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              <span className="text-xs font-medium leading-4 text-ink sm:text-sm">{label}</span>
            </div>
          ))}
        </div>

        <p className="mt-3 text-center text-sm font-semibold text-accent">Giảm {DEMO_COMMERCE_CONFIG.memberAdditionalPurchaseDiscountPercent}% khi mua thêm</p>

        {!confirming ? (
          <Button
            type="button"
            size="lg"
            className="mt-4 w-full font-semibold"
            onClick={() => { requestId.current = `premium:${crypto.randomUUID()}`; setMessage(""); setConfirming(true); }}
          >
            Nâng cấp Premium · {price}đ
          </Button>
        ) : (
          <div className="mt-4 rounded-2xl border border-line bg-surface-soft/60 p-3">
            <p className="mb-2 text-center text-sm font-semibold text-ink">Chọn kết quả thanh toán mô phỏng</p>
            <Button type="button" className="w-full" onClick={() => finish("succeeded")}>Mô phỏng thành công</Button>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => finish("failed")}>Thất bại</Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => finish("cancelled")}>Hủy giao dịch</Button>
            </div>
          </div>
        )}

        {message && <p role="status" className="mt-3 text-center text-sm leading-5 text-muted">{message}</p>}
      </div>

      <p role="note" className="sticky bottom-0 border-t border-line bg-surface px-5 py-3 text-center text-xs font-medium text-muted sm:px-7">
        Thanh toán mô phỏng · Không phát sinh giao dịch thật
      </p>
    </AppDialog>
  );
}
