import { useRef, useState } from "react";
import {
  Sparkles,
  Crown,
  CheckCircle2,
  X,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  ArrowRight,
  BookOpen,
} from "lucide-react";
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

const DEMO_READING_NOTICE =
  "Nội dung luận giải mang tính biểu tượng chiêm nghiệm và định hướng tâm an, phục vụ trải nghiệm demo; không phải dự đoán tương lai mang tính áp đặt.";

export function DetailedReadingUnlock({
  kind,
  resultId,
  sections,
}: DetailedReadingUnlockProps) {
  const sku =
    kind === "xam" ? "XAM_DETAILED_READING" : "KEO_DETAILED_READING";
  const initialState = loadDemoCommerceState();
  const [commerceState, setCommerceState] =
    useState<DemoCommerceState>(initialState);
  const [unlocked, setUnlocked] = useState(() =>
    isDemoReadingUnlocked(kind, resultId, initialState)
  );
  const [expanded, setExpanded] = useState(() =>
    isDemoReadingUnlocked(kind, resultId, initialState)
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [checkoutStage, setCheckoutStage] = useState(false);
  const [message, setMessage] = useState("");
  const busyRef = useRef(false);
  const requestIdRef = useRef<string | null>(null);

  if (!isDemoMode() || !resultId) return null;

  const creditCount =
    kind === "xam"
      ? commerceState.entitlements.xamDetailedReadings
      : commerceState.entitlements.keoDetailedReadings;
  const quote = quoteDemoCheckout(sku, 1, commerceState);
  const kindLabel = kind === "xam" ? "quẻ xăm" : "keo âm dương";

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
      const result = completeDemoReadingCheckout(
        requestIdRef.current,
        kind,
        resultId,
        outcome
      );
      setCommerceState(result.state);
      if (
        outcome === "succeeded" &&
        result.transaction.status === "succeeded" &&
        isDemoReadingUnlocked(kind, resultId, result.state)
      ) {
        setUnlocked(true);
        setExpanded(true);
        setDialogOpen(false);
        setCheckoutStage(false);
        setMessage("");
      } else if (outcome === "failed") {
        setMessage(
          "Thanh toán mô phỏng chưa thành công. Kết quả vẫn đang được khóa, bạn có thể thử lại bất cứ lúc nào."
        );
        setCheckoutStage(false);
      } else {
        setDialogOpen(false);
        setCheckoutStage(false);
        setMessage("Giao dịch đã được hủy. Kết quả vẫn được giữ nguyên trạng thái khóa.");
      }
      requestIdRef.current = null;
    } catch {
      setMessage("Chưa hoàn tất được thao tác thử nghiệm. Quyền lợi tài khoản không bị ảnh hưởng.");
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
      setMessage("Không thể kích hoạt lượt Premium lúc này. Số dư lượt vẫn được bảo lưu.");
    } finally {
      busyRef.current = false;
    }
  };

  return (
    <section
      className="my-6 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-50/60 via-surface to-amber-50/30 dark:from-amber-950/20 dark:via-surface dark:to-surface p-5 sm:p-6 shadow-sm"
      aria-labelledby={`detailed-reading-${kind}-title`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Info */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          <span
            className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 font-serif font-bold text-sm shadow-xs shrink-0 mt-0.5"
            aria-hidden="true"
          >
            解
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3
                id={`detailed-reading-${kind}-title`}
                className="font-display text-base sm:text-lg font-bold text-ink whitespace-nowrap"
              >
                Luận giải chuyên sâu
              </h3>
              {creditCount > 0 && !unlocked && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-[11px] font-bold">
                  <Crown className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Có sẵn {creditCount} lượt</span>
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Khám phá trọn vẹn 5 góc nhìn văn hóa, biểu tượng và bài học chiêm nghiệm.
            </p>
          </div>
        </div>

        {/* Right: Action Button */}
        <div className="shrink-0 sm:self-center">
          {unlocked ? (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full border border-line hover:border-amber-500/40 bg-surface hover:bg-surface-soft text-xs sm:text-sm font-semibold text-ink transition-all cursor-pointer whitespace-nowrap shadow-2xs"
            >
              {expanded ? (
                <>
                  <span>Thu gọn luận giải</span>
                  <ChevronUp className="w-4 h-4 text-muted" />
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Xem chi tiết</span>
                  <ChevronDown className="w-4 h-4 text-muted" />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={openPurchaseDialog}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 h-11 px-6 rounded-full font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-600 shadow-md shadow-amber-900/15 transition-all cursor-pointer whitespace-nowrap"
            >
              {creditCount > 0 ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Khai mở ngay</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Mở khóa — {quote.totalVnd.toLocaleString("vi-VN")}đ</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {message && (
        <p role="status" className="mt-3 text-xs sm:text-sm text-muted">
          {message}
        </p>
      )}

      {/* Expanded Reading Content */}
      {unlocked && expanded && (
        <div className="mt-6 space-y-3.5 border-t border-line/70 pt-6">
          {sections.map((section) => (
            <article
              key={section.title}
              className="p-4 rounded-xl bg-surface border border-line/80 shadow-2xs"
            >
              <h4 className="font-semibold text-sm text-ink flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                <span>{section.title}</span>
              </h4>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted">
                {section.content}
              </p>
            </article>
          ))}
          <div className="rounded-xl border border-line bg-surface/70 p-3.5 text-xs leading-relaxed text-muted flex items-start gap-2.5">
            <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
            <span>{DEMO_READING_NOTICE}</span>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {dialogOpen && (
        <AppDialog
          labelledBy={`reading-unlock-dialog-${kind}`}
          onClose={() => setDialogOpen(false)}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-line">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-amber-600 to-amber-800 text-amber-100 font-serif font-bold text-sm shadow-2xs"
                  aria-hidden="true"
                >
                  解
                </span>
                <h2
                  id={`reading-unlock-dialog-${kind}`}
                  className="font-display text-xl font-bold text-ink"
                >
                  Khai mở Luận giải chuyên sâu
                </h2>
              </div>
              <p className="text-xs sm:text-sm leading-relaxed text-muted max-w-md">
                Đào sâu các biểu tượng ẩn tàng, cội nguồn văn hóa và lời khuyên ứng biến tâm an cho {kindLabel} này.
              </p>
            </div>
            <button
              type="button"
              aria-label="Đóng cửa sổ"
              onClick={() => setDialogOpen(false)}
              className="w-9 h-9 rounded-full border border-line hover:border-amber-500/40 bg-surface hover:bg-surface-soft flex items-center justify-center text-muted hover:text-ink transition-all cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="mt-5 space-y-4">
            {/* STAGE: NORMAL SELECTION */}
            {!checkoutStage ? (
              <>
                {/* 1. HERO OPTION IF USER HAS PREMIUM CREDITS */}
                {creditCount > 0 && (
                  <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-surface p-5 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-bold">
                        <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                        <span>Đặc quyền Premium khả dụng</span>
                      </div>
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                        Còn {creditCount} lượt
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-ink mb-1">
                      Sử dụng 1 lượt có sẵn trong tài khoản
                    </h3>
                    <p className="text-xs text-muted leading-relaxed mb-4">
                      Bạn không cần thanh toán thêm. Bấm vào đây để mở trọn vẹn kết quả ngay lập tức.
                    </p>

                    <button
                      type="button"
                      onClick={usePremiumCredit}
                      className="w-full h-12 rounded-full font-bold text-sm text-white bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-600 shadow-md shadow-amber-900/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-amber-200" />
                      <span>Dùng 1 lượt Premium mở khóa ngay</span>
                    </button>
                  </div>
                )}

                {/* 2. PURCHASE SINGLE PASS */}
                <div className="rounded-2xl border border-line bg-surface-soft p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted">
                      {creditCount > 0 ? "Hoặc thỉnh riêng lẻ quẻ này" : "Thỉnh một lượt luận giải riêng lẻ"}
                    </span>
                    {quote.discountVnd > 0 && (
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        Ưu đãi Hội viên −{quote.discountVnd.toLocaleString("vi-VN")}đ
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 py-1 text-sm">
                    <div className="flex items-center justify-between text-muted text-xs">
                      <span>Đơn giá chuẩn:</span>
                      <span>{quote.subtotalVnd.toLocaleString("vi-VN")}đ</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-line/60 pt-2 font-semibold">
                      <span className="text-ink">Chi phí thỉnh:</span>
                      <span className="font-display text-lg font-bold text-accent">
                        {quote.totalVnd.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>

                  <p className="mt-2 text-[11px] leading-relaxed text-muted">
                    Quyền truy cập được lưu cố định cho kết quả này.
                  </p>

                  <button
                    type="button"
                    onClick={beginMockCheckout}
                    className={`mt-4 w-full h-11 rounded-full font-bold text-xs sm:text-sm transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      creditCount > 0
                        ? "border border-line hover:border-amber-500/40 bg-surface hover:bg-surface-soft text-ink"
                        : "text-white bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-600 shadow-md shadow-amber-900/15"
                    }`}
                  >
                    <span>Tiếp tục thanh toán — {quote.totalVnd.toLocaleString("vi-VN")}đ</span>
                  </button>
                </div>

                {/* 3. PREMIUM MEMBERSHIP INVITATION */}
                <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-700 dark:text-amber-300 shrink-0">
                      <Crown className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs sm:text-sm text-ink">Gói Hội viên Tĩnh Lạc</h4>
                      <p className="text-[11px] text-muted">Mở khóa trọn bộ mọi quẻ xăm, keo và đặc quyền hoa đăng</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDialogOpen(false);
                      openDemoPremiumPurchase();
                    }}
                    className="h-9 px-3.5 rounded-full text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-all shrink-0 cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Khám phá</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </>
            ) : (
              /* STAGE: MOCK CHECKOUT */
              <div className="space-y-4 py-1">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">Không gian thử nghiệm (Sandbox Demo)</span>
                    Dự án đang trong giai đoạn trải nghiệm. Thao tác này hoàn toàn miễn phí và không yêu cầu thông tin ngân hàng thật.
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-line flex items-center justify-between text-sm">
                  <span className="font-medium text-muted">Chi phí mở khóa quẻ:</span>
                  <span className="font-display font-bold text-lg text-accent">
                    {quote.totalVnd.toLocaleString("vi-VN")}đ
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => finishMockCheckout("succeeded")}
                    className="w-full h-12 rounded-full font-bold text-sm text-white bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-700 hover:from-emerald-600 hover:to-emerald-600 shadow-md shadow-emerald-900/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                    <span>Xác nhận thanh toán mô phỏng (Thành công)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => finishMockCheckout("failed")}
                    className="w-full h-11 rounded-full font-medium text-xs text-stone-600 dark:text-stone-300 hover:text-danger bg-surface hover:bg-surface-soft border border-line hover:border-danger/30 transition-all cursor-pointer"
                  >
                    Thử kịch bản thanh toán thất bại
                  </button>

                  <button
                    type="button"
                    onClick={() => setCheckoutStage(false)}
                    className="w-full h-10 rounded-full text-xs text-muted hover:text-ink transition-colors cursor-pointer"
                  >
                    ← Quay lại lựa chọn
                  </button>
                </div>
              </div>
            )}
          </div>

          {message && (
            <p role="status" className="mt-3 text-xs sm:text-sm text-danger">
              {message}
            </p>
          )}

          {/* Privacy & Cultural Reassurance Footnote */}
          <div className="mt-5 pt-3 border-t border-line/60 flex items-center gap-2 text-[11px] text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
            <span>Kết quả cơ bản luôn được mở xem miễn phí. Luận giải chi tiết mở rộng góc nhìn văn hóa.</span>
          </div>
        </AppDialog>
      )}
    </section>
  );
}

