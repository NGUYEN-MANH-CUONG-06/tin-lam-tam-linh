import { useRef, useState } from "react";
import { AppDialog } from "./AppDialog";
import { Button } from "./ui/button";
import { isDemoMode } from "../data/demoMode";
import { DEMO_COMMERCE_CATALOG } from "../data/demoCommerceCatalog";
import { openDemoPremiumPurchase } from "../data/demoPremiumEvents";
import {
  completeDemoReadingCheckout,
  consumeDemoReadingEntitlement,
  isDemoReadingUnlocked,
  loadDemoCommerceState,
  quoteDemoCheckout,
  type DemoCheckoutOutcome,
  type DemoCommerceState,
} from "../data/demoCommerceService";

export interface DetailedReadingSection {
  title: string;
  content: string;
}

interface DetailedReadingUnlockProps {
  kind: "xam" | "keo";
  resultId: string;
  sections: DetailedReadingSection[];
}

const DEMO_READING_NOTICE = "Nội dung minh họa phục vụ trải nghiệm demo, không phải dự đoán chắc chắn.";

export function DetailedReadingUnlock({ kind, resultId, sections }: DetailedReadingUnlockProps) {
  const sku = kind === "xam" ? "XAM_DETAILED_READING" : "KEO_DETAILED_READING";
  const initialState = loadDemoCommerceState();
  const [commerceState, setCommerceState] = useState<DemoCommerceState>(initialState);
  const [unlocked, setUnlocked] = useState(() => isDemoReadingUnlocked(kind, resultId, initialState));
  const [expanded, setExpanded] = useState(() => isDemoReadingUnlocked(kind, resultId, initialState));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkoutStage, setCheckoutStage] = useState(false);
  const [message, setMessage] = useState("");
  const busyRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);

  if (!isDemoMode() || !resultId) return null;

  const creditCount = kind === "xam"
    ? commerceState.entitlements.xamDetailedReadings
    : commerceState.entitlements.keoDetailedReadings;
  const quote = quoteDemoCheckout(sku, 1, commerceState);
  const productName = DEMO_COMMERCE_CATALOG[sku].name;

  const openPurchaseDialog = () => {
    setMessage("");
    setCheckoutStage(false);
    requestIdRef.current = null;
    setDialogOpen(true);
  };

  const beginMockCheckout = () => {
    if (busyRef.current) return;
    requestIdRef.current = `reading:${kind}:${resultId}:${crypto.randomUUID()}`;
    setCheckoutStage(true);
    setMessage("");
  };

  const finishMockCheckout = (outcome: DemoCheckoutOutcome) => {
    if (busyRef.current || !requestIdRef.current) return;
    busyRef.current = true;
    try {
      const result = completeDemoReadingCheckout(requestIdRef.current, kind, resultId, outcome);
      setCommerceState(result.state);
      if (outcome === "succeeded" && result.transaction.status === "succeeded" && isDemoReadingUnlocked(kind, resultId, result.state)) {
        setUnlocked(true);
        setExpanded(true);
        setDialogOpen(false);
        setCheckoutStage(false);
        setMessage("");
      } else if (outcome === "failed") {
        setMessage("Thanh toán mô phỏng thất bại. Kết quả vẫn đang khóa; bạn có thể thử lại.");
        setCheckoutStage(false);
      } else {
        setDialogOpen(false);
        setCheckoutStage(false);
        setMessage("Giao dịch đã hủy. Kết quả vẫn đang khóa.");
      }
      requestIdRef.current = null;
    } catch {
      setMessage("Chưa hoàn tất được thao tác demo. Quyền lợi không bị trừ.");
    } finally {
      busyRef.current = false;
    }
  };

  const usePremiumCredit = () => {
    if (busyRef.current || creditCount < 1) return;
    busyRef.current = true;
    try {
      const result = consumeDemoReadingEntitlement(kind, resultId);
      setCommerceState(result);
      setUnlocked(true);
      setExpanded(true);
      setDialogOpen(false);
      setMessage("");
    } catch {
      setMessage("Không dùng được lượt Premium. Số dư lượt vẫn được giữ nguyên.");
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <section className="my-6 rounded-card border border-accent/25 bg-surface-soft/60 p-5 sm:p-6" aria-labelledby={`detailed-reading-${kind}-title`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 id={`detailed-reading-${kind}-title`} className="font-display text-lg font-bold text-ink">Luận giải chi tiết</h3>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">Khám phá thêm góc nhìn và ý nghĩa của kết quả qua phần luận giải mở rộng.</p>
        </div>
        {unlocked ? (
          <Button type="button" variant="outline" onClick={() => setExpanded((value) => !value)}>
            {expanded ? "Thu gọn luận giải" : "Xem luận giải chi tiết"}
          </Button>
        ) : (
          <Button type="button" onClick={openPurchaseDialog}>Mở khóa luận giải — {quote.unitPriceVnd.toLocaleString("vi-VN")}đ</Button>
        )}
      </div>

      {message && <p role="status" className="mt-3 text-sm text-muted">{message}</p>}

      {unlocked && expanded && (
        <div className="mt-5 space-y-4 border-t border-line pt-5">
          {sections.map((section) => (
            <article key={section.title}>
              <h4 className="font-semibold text-ink">{section.title}</h4>
              <p className="mt-1 text-sm leading-relaxed text-muted">{section.content}</p>
            </article>
          ))}
          <p className="rounded-panel border border-line bg-surface px-4 py-3 text-xs leading-relaxed text-muted">{DEMO_READING_NOTICE}</p>
        </div>
      )}

      {dialogOpen && (
        <AppDialog labelledBy={`reading-unlock-dialog-${kind}`} onClose={() => setDialogOpen(false)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 id={`reading-unlock-dialog-${kind}`} className="font-display text-xl font-bold text-ink">Mở khóa {productName}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">Mở phần luận giải minh họa gắn với kết quả hiện tại. Kết quả cơ bản vẫn được xem miễn phí.</p>
            </div>
            <button type="button" aria-label="Đóng" onClick={() => setDialogOpen(false)} className="min-h-11 min-w-11 rounded-full border border-line text-lg text-muted hover:text-ink">×</button>
          </div>

          <div className="mt-5 space-y-3">
            <div className="rounded-panel border border-line bg-surface-soft p-4">
              <div className="flex items-center justify-between gap-3 text-sm"><span className="font-semibold text-ink">Mua lẻ một lượt</span><span>{quote.subtotalVnd.toLocaleString("vi-VN")}đ</span></div>
              {quote.discountVnd > 0 && <div className="mt-1 flex items-center justify-between gap-3 text-xs font-medium text-success"><span>Ưu đãi Premium</span><span>−{quote.discountVnd.toLocaleString("vi-VN")}đ</span></div>}
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-line pt-2"><span className="font-semibold text-ink">Tổng thanh toán</span><span className="font-bold text-accent">{quote.totalVnd.toLocaleString("vi-VN")}đ</span></div>
              <p className="mt-1 text-xs text-muted">Chỉ mở luận giải cho kết quả này.</p>
              {!checkoutStage ? (
                <Button type="button" className="mt-3 w-full" onClick={beginMockCheckout}>Tiếp tục thanh toán mô phỏng</Button>
              ) : (
                <div className="mt-3 space-y-2">
                  <p role="note" className="text-xs font-semibold text-accent">Thanh toán mô phỏng — Không phát sinh giao dịch thật.</p>
                  <Button type="button" className="w-full" onClick={() => finishMockCheckout("succeeded")}>Mô phỏng thanh toán thành công</Button>
                  <Button type="button" variant="outline" className="w-full" onClick={() => finishMockCheckout("failed")}>Mô phỏng thanh toán thất bại</Button>
                  <Button type="button" variant="ghost" className="w-full" onClick={() => finishMockCheckout("cancelled")}>Hủy giao dịch</Button>
                </div>
              )}
            </div>

            {creditCount > 0 && (
              <div className="rounded-panel border border-line bg-surface p-4">
                <p className="text-sm text-ink">Bạn còn <strong>{creditCount}</strong> lượt Premium cho luận giải {kind === "xam" ? "xăm" : "keo"}.</p>
                <Button type="button" variant="outline" className="mt-3 w-full" onClick={usePremiumCredit}>Dùng một lượt Premium</Button>
              </div>
            )}

            <div className="rounded-panel border border-line p-4">
              <Button type="button" variant="outline" className="w-full" onClick={() => { setDialogOpen(false); openDemoPremiumPurchase(); }}>Xem hoặc mua Premium</Button>
            </div>
          </div>

          {message && <p role="status" className="mt-3 text-sm text-muted">{message}</p>}
        </AppDialog>
      )}
    </section>
  );
}
