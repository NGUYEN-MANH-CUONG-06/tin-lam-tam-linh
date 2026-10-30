import React, { useEffect, useState } from "react";
import { UnverifiedImage } from "../components/UnverifiedImage";
import {
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Heart,
  BookOpen,
  Info,
  HelpCircle,
  Clock,
  ArrowRight,
  Check,
  RotateCcw,
  Building2,
  Handshake,
  Mail,
  Compass,
  Crown,
  Flame,
  Flower2,
  ScrollText,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { MembershipCheckout } from "../components/MembershipCheckout";
import type {
  Status as MembershipStatus,
} from "../components/MembershipCheckout";
import { MemberLibrary } from "../components/MemberLibrary";
import { DigitalShop } from "../components/DigitalShop";
import { DigitalInventory } from "../components/DigitalInventory";
import { PaymentHistory } from "../components/PaymentHistory";
import { PartnershipPanel } from "../components/PartnershipPanel";
import { PartnerGifts } from "../components/PartnerGifts";
import { isDemoMode } from "../data/demoMode";
import type { MembershipTerm } from "../data/membershipIntent";
import { writeMembershipIntent } from "../data/membershipIntent";
import { loadDemoCommerceState, type DemoCommerceState } from "../data/demoCommerceService";
import { DEMO_COMMERCE_CHANGED_EVENT, openDemoPremiumPurchase } from "../data/demoPremiumEvents";
import { clearDemoValues } from "../data/demoStorage";
import { quoteDemoCheckout, resetDemoCommerceState } from "../data/demoCommerceService";
import { DEMO_COMMERCE_CATALOG, DEMO_COMMERCE_CONFIG, DEMO_PREMIUM_BENEFITS } from "../data/demoCommerceCatalog";
import { AppDialog } from "../components/AppDialog";

interface MembershipScreenProps {
  onBackToHome: () => void;
  onGoToExperience?: () => void;
  currentUserEmail?: string;
  onGoToLogin: (term: MembershipTerm) => void;
}

export const MembershipScreen: React.FC<MembershipScreenProps> = ({
  onBackToHome,
  onGoToExperience,
  currentUserEmail,
  onGoToLogin,
}) => {
  const [membershipStatus, setMembershipStatus] =
    useState<MembershipStatus | null>(null);
  const [demoCommerce, setDemoCommerce] = useState<DemoCommerceState>(loadDemoCommerceState);
  const [resetDemoOpen, setResetDemoOpen] = useState(false);
  useEffect(() => {
    if (!isDemoMode()) return;
    const refreshDemoCommerce = () => setDemoCommerce(loadDemoCommerceState());
    window.addEventListener(DEMO_COMMERCE_CHANGED_EVENT, refreshDemoCommerce);
    return () => window.removeEventListener(DEMO_COMMERCE_CHANGED_EVENT, refreshDemoCommerce);
  }, []);

  const membershipAvailability = !membershipStatus
    ? "Chưa xác định trạng thái thanh toán"
    : !membershipStatus.salesEnabled
      ? "Chưa mở đăng ký và gia hạn"
      : !membershipStatus.checkoutAvailable
        ? "Thanh toán đang tạm thời không khả dụng"
        : membershipStatus.paymentEnvironment === "sandbox"
          ? "Đang mở thanh toán thử nghiệm"
          : "Đang mở đăng ký và gia hạn";

  const membershipPriceLabel = membershipStatus
    ? membershipStatus.plans
        .map(
          (plan) =>
            `${plan.name}: ${plan.price.toLocaleString("vi-VN")}đ`
        )
        .join(" · ")
    : "Giá và trạng thái được tải từ máy chủ";

  const featureMatrix = membershipStatus?.benefits ?? [];

  const resetDemoData = () => {
    clearDemoValues();
    const nextCommerceState = resetDemoCommerceState();
    setDemoCommerce(nextCommerceState);
    window.dispatchEvent(new Event(DEMO_COMMERCE_CHANGED_EVENT));
    setResetDemoOpen(false);
  };

  if (isDemoMode()) {
    const premiumPrice = quoteDemoCheckout("PREMIUM_BENEFITS", 1, demoCommerce).totalVnd;
    const transactionStatus = (status: DemoCommerceState["transactions"][number]["status"]) => ({
      succeeded: "Thành công",
      failed: "Thất bại",
      cancelled: "Đã hủy",
    })[status];

    return (
      <div className="screen-shell">
        <main className="page-container max-w-4xl space-y-6 pb-12 pt-1 sm:pt-4">
          {/* HEADER / BREADCRUMB */}
          <div className="flex items-center justify-between text-xs text-muted">
            <span className="font-semibold uppercase tracking-wider text-accent">
              Góc cá nhân • Quản lý hội viên
            </span>
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center gap-1.5 font-medium hover:text-accent transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Về Trang chủ</span>
            </button>
          </div>

          {/* MAIN MEMBERSHIP CARD */}
          <section
            className="relative overflow-hidden rounded-3xl border border-amber-600/30 bg-gradient-to-br from-surface via-surface to-amber-500/[0.04] p-6 sm:p-8 shadow-sm"
            aria-labelledby="demo-premium-membership-title"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-amber-500/5 blur-2xl" />

            <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(220px,0.8fr)] md:items-center">
              <div>
                {demoCommerce.entitlements.premiumOwned ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 shadow-2xs mb-3">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>Đặc quyền Hội viên đang kích hoạt</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-accent shadow-2xs mb-3">
                    <Crown className="h-3.5 w-3.5" />
                    <span>Gói Trải Nghiệm Văn Hóa Số</span>
                  </div>
                )}

                <h1 id="demo-premium-membership-title" className="font-display text-2xl sm:text-3xl font-bold text-ink">
                  Gói Hội Viên • Tin Lắm Tâm Linh
                </h1>

                <p className="mt-2.5 text-sm leading-relaxed text-muted max-w-xl">
                  {demoCommerce.entitlements.premiumOwned
                    ? "Tài khoản của bạn đã được kích hoạt trọn vẹn đặc quyền hội viên. Bạn có thể sử dụng các lượt chiêm nghiệm chuyên sâu và lễ vật dâng cúng ở phía dưới, hoặc nạp thêm khi cần."
                    : "Mở rộng hành trình trải nghiệm văn hóa truyền thống với các đặc quyền luận giải sâu sắc và lễ vật trang nghiêm dành riêng cho bạn."}
                </p>

                <div className="mt-4 flex flex-wrap items-baseline gap-2">
                  <span className="font-display text-3xl font-bold text-accent">
                    {premiumPrice.toLocaleString("vi-VN")}đ
                  </span>
                  <span className="text-xs text-muted">/ gói trọn bộ</span>
                  <span className="text-xs text-muted ml-2 border-l border-line/80 pl-2">
                    Mua một lần — Không tự động gia hạn
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    className="min-h-12 w-full sm:w-auto px-6 font-semibold shadow-sm"
                    onClick={openDemoPremiumPurchase}
                  >
                    {demoCommerce.entitlements.premiumOwned ? (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        <span>Nạp thêm gói quyền lợi ({premiumPrice.toLocaleString("vi-VN")}đ)</span>
                      </>
                    ) : (
                      <>
                        <Crown className="mr-2 h-4 w-4" />
                        <span>Kích hoạt đặc quyền Hội viên</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-line bg-surface-soft shadow-xs aspect-[4/3]">
                <UnverifiedImage
                  src="/images/tea_bowl.jpg"
                  alt="Tách trà thanh tịnh trong không gian văn hóa Việt"
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-3 text-center">
                  <p className="text-[11px] font-medium text-amber-200/90 italic">
                    “Tâm xuất Phật chứng • Lễ bạc lòng thành”
                  </p>
                </div>
              </div>
            </div>

            {/* BENEFITS MATRIX */}
            <div className="mt-8 border-t border-line/80 pt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-accent mb-4">
                Đặc quyền gói hội viên bao gồm:
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3 rounded-2xl border border-line/60 bg-surface-soft/40 p-3.5 transition-colors hover:border-accent/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-ink text-sm block">
                      {DEMO_PREMIUM_BENEFITS.xamDetailedReadings} lượt Luận giải xăm chuyên sâu
                    </span>
                    <span className="text-xs text-muted leading-relaxed block mt-0.5">
                      Phân tích toàn văn thơ quẻ, điển tích cổ nhân và lời khuyên ứng xử minh triết.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-line/60 bg-surface-soft/40 p-3.5 transition-colors hover:border-accent/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-ink text-sm block">
                      {DEMO_PREMIUM_BENEFITS.keoDetailedReadings} lượt Luận giải keo Âm Dương
                    </span>
                    <span className="text-xs text-muted leading-relaxed block mt-0.5">
                      Chiêm nghiệm điềm ứng Âm - Dương thấu đáo, định tâm trước các ngã rẽ cuộc sống.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-line/60 bg-surface-soft/40 p-3.5 transition-colors hover:border-accent/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-ink text-sm block">
                      {DEMO_PREMIUM_BENEFITS.virtualChickens} mâm Lễ vật Gà ngậm hoa
                    </span>
                    <span className="text-xs text-muted leading-relaxed block mt-0.5">
                      Vật phẩm lễ vật cúng trang nghiêm dâng lên Bàn thờ Gia Tiên 3D.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-line/60 bg-surface-soft/40 p-3.5 transition-colors hover:border-accent/30">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-ink text-sm block">
                      {DEMO_PREMIUM_BENEFITS.royalLanterns} Hoa đăng Hoàng Kim cầu an
                    </span>
                    <span className="text-xs text-muted leading-relaxed block mt-0.5">
                      Hoa đăng đặc biệt tỏa sáng rực rỡ, gửi gắm ước nguyện bình an trên dòng sông ảo.
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-line/60 bg-surface-soft/40 p-3.5 sm:col-span-2 transition-colors hover:border-accent/30">
                  <CheckCircle2 className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-ink text-sm block">
                      Ưu đãi thành viên: Giảm {DEMO_COMMERCE_CONFIG.memberAdditionalPurchaseDiscountPercent}% khi thỉnh thêm
                    </span>
                    <span className="text-xs text-muted leading-relaxed block mt-0.5">
                      Áp dụng tự động cho mọi lượt chiêm nghiệm hoặc vật phẩm thỉnh thêm trên nền tảng.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p role="note" className="mt-5 text-xs text-muted text-center sm:text-left">
              * Thanh toán mô phỏng trong bản trải nghiệm mẫu — Không phát sinh giao dịch thật.
            </p>
          </section>

          {/* MY BENEFITS & INVENTORY */}
          <section className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-sm" aria-labelledby="demo-my-benefits-title">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line/80 pb-5">
              <div>
                <h2 id="demo-my-benefits-title" className="font-display text-xl font-bold text-ink">
                  Quyền Lợi &amp; Số Dư Của Tôi
                </h2>
                {!demoCommerce.entitlements.premiumOwned ? (
                  <p className="mt-1 text-xs text-muted">
                    Bạn chưa kích hoạt gói hội viên. Quyền lợi và số dư sẽ hiển thị tại đây sau khi kích hoạt.
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted">
                    Các lượt chiêm nghiệm và vật phẩm khả dụng có thể sử dụng ngay trong các phân hệ tương ứng.
                  </p>
                )}
              </div>

              {demoCommerce.entitlements.premiumOwned && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Đã sở hữu gói hội viên</span>
                </span>
              )}
            </div>

            {demoCommerce.entitlements.premiumOwned && (
              <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-line/60 bg-surface-soft/50 p-4 transition-all hover:border-accent/40 shadow-2xs">
                  <div className="flex items-center gap-2 text-accent">
                    <ScrollText className="h-4 w-4" />
                    <dt className="text-xs font-semibold text-muted">Lượt xăm chuyên sâu</dt>
                  </div>
                  <dd className="mt-2 text-2xl font-bold font-display text-ink">{demoCommerce.entitlements.xamDetailedReadings}</dd>
                </div>

                <div className="rounded-2xl border border-line/60 bg-surface-soft/50 p-4 transition-all hover:border-accent/40 shadow-2xs">
                  <div className="flex items-center gap-2 text-accent">
                    <Compass className="h-4 w-4" />
                    <dt className="text-xs font-semibold text-muted">Lượt keo Âm Dương</dt>
                  </div>
                  <dd className="mt-2 text-2xl font-bold font-display text-ink">{demoCommerce.entitlements.keoDetailedReadings}</dd>
                </div>

                <div className="rounded-2xl border border-line/60 bg-surface-soft/50 p-4 transition-all hover:border-accent/40 shadow-2xs">
                  <div className="flex items-center gap-2 text-amber-600">
                    <Flame className="h-4 w-4" />
                    <dt className="text-xs font-semibold text-muted">Lễ vật Gia Tiên</dt>
                  </div>
                  <dd className="mt-2 text-2xl font-bold font-display text-ink">{demoCommerce.inventory.virtualChickens}</dd>
                </div>

                <div className="rounded-2xl border border-line/60 bg-surface-soft/50 p-4 transition-all hover:border-accent/40 shadow-2xs">
                  <div className="flex items-center gap-2 text-rose-600">
                    <Flower2 className="h-4 w-4" />
                    <dt className="text-xs font-semibold text-muted">Hoa đăng Hoàng Kim</dt>
                  </div>
                  <dd className="mt-2 text-2xl font-bold font-display text-ink">{demoCommerce.inventory.royalLanterns}</dd>
                </div>
              </dl>
            )}

            {/* USAGE & TRANSACTION HISTORY */}
            <details className="mt-6 rounded-2xl border border-line/60 bg-surface-soft/30 p-4 transition-all">
              <summary className="cursor-pointer text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent select-none">
                Lịch sử giao dịch &amp; sử dụng vật phẩm
              </summary>
              <div className="mt-4 grid gap-5 border-t border-line/60 pt-4 lg:grid-cols-2">
                <section aria-labelledby="demo-premium-transactions-title">
                  <h3 id="demo-premium-transactions-title" className="text-xs font-bold uppercase tracking-wider text-muted">
                    Lịch sử thỉnh gói &amp; giao dịch
                  </h3>
                  {demoCommerce.transactions.length > 0 ? (
                    <ul className="mt-3 max-h-64 space-y-2 overflow-auto text-xs text-muted pr-1">
                      {demoCommerce.transactions.map((transaction) => (
                        <li key={transaction.id} className="rounded-xl border border-line/80 bg-surface p-3 shadow-2xs">
                          <div className="flex items-center justify-between font-semibold text-ink">
                            <span>{DEMO_COMMERCE_CATALOG[transaction.sku].name}</span>
                            <span className="text-accent">{transaction.totalVnd.toLocaleString("vi-VN")}đ</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
                            <span>{new Date(transaction.createdAt).toLocaleString("vi-VN")}</span>
                            <span className="rounded px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-medium">
                              {transactionStatus(transaction.status)}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted">Chưa có giao dịch phát sinh.</p>
                  )}
                </section>

                <section aria-labelledby="demo-premium-uses-title">
                  <h3 id="demo-premium-uses-title" className="text-xs font-bold uppercase tracking-wider text-muted">
                    Lịch sử sử dụng lượt &amp; dâng lễ
                  </h3>
                  {demoCommerce.readingUses.length + demoCommerce.inventoryUses.length > 0 ? (
                    <ul className="mt-3 max-h-64 space-y-2 overflow-auto text-xs text-muted pr-1">
                      {demoCommerce.readingUses.map((use) => (
                        <li key={use.id} className="rounded-xl border border-line/80 bg-surface p-3 shadow-2xs">
                          <span className="font-semibold text-ink">
                            Luận giải {use.kind === "xam" ? "quẻ xăm" : "quẻ keo"} chuyên sâu
                          </span>
                          <div className="mt-1 text-[11px] text-muted">
                            {new Date(use.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </li>
                      ))}
                      {demoCommerce.inventoryUses.map((use) => (
                        <li key={use.id} className="rounded-xl border border-line/80 bg-surface p-3 shadow-2xs">
                          <span className="font-semibold text-ink">
                            Dâng {use.quantity} {use.item === "virtualChickens" ? "mâm Lễ vật Gà ngậm hoa" : "Hoa đăng Hoàng Kim"}
                          </span>
                          <div className="mt-1 text-[11px] text-muted">
                            {new Date(use.createdAt).toLocaleString("vi-VN")}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-muted">Chưa có lượt hoặc vật phẩm nào được sử dụng.</p>
                  )}
                </section>
              </div>
            </details>

            {/* RESET BUTTON */}
            <div className="mt-5 border-t border-line/60 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
              <span>Dữ liệu lưu trữ cục bộ trong trình duyệt máy bạn.</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={() => setResetDemoOpen(true)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Làm mới số dư mẫu</span>
              </Button>
            </div>
          </section>

          {resetDemoOpen && (
            <AppDialog labelledBy="reset-demo-title" onClose={() => setResetDemoOpen(false)}>
              <h2 id="reset-demo-title" className="font-display text-xl font-bold text-ink">
                Làm mới số dư trải nghiệm mẫu?
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Thao tác này sẽ thiết lập lại số dư quyền lợi và lịch sử giao dịch mẫu trên trình duyệt về trạng thái ban đầu.
              </p>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setResetDemoOpen(false)}>
                  Hủy
                </Button>
                <Button type="button" onClick={resetDemoData}>
                  Xác nhận làm mới
                </Button>
              </div>
            </AppDialog>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="screen-shell">
      <main className="page-container max-w-6xl">
        {/* Top Breadcrumb & Status Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 text-xs text-stone-600 dark:text-stone-400">
          <div className="flex items-center gap-2">
            <button
              onClick={onBackToHome}
              className="hover:text-amber-800 dark:hover:text-amber-300 cursor-pointer transition-colors"
            >
              Hôm nay
            </button>
            <span className="text-stone-400">/</span>
            <span className="text-amber-800 dark:text-amber-300 font-semibold">Định hướng hội viên & Hợp tác</span>
          </div>

          <button
            onClick={onBackToHome}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-amber-800 dark:hover:text-amber-300 transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại trang chủ</span>
          </button>
        </div>

        {/* Hero Magazine Section */}
        <section className="mb-10 p-6 sm:p-10 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-surface via-surface to-amber-500/[0.04] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none rounded-bl-full" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-3.5">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300">
                  CỘNG ĐỒNG GÌN GIỮ NẾP NHÀ & DI SẢN
                </span>
                <span className="text-xs text-stone-400">·</span>
                <span className="text-xs text-stone-500">Độc Lập & Thanh Tịnh</span>
              </div>

              <h1 className="page-title font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-ink leading-tight">
                Nuôi Dưỡng Tâm An Qua Chiều Sâu Văn Hóa Việt
              </h1>

              <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed max-w-2xl">
                Các trải nghiệm hiện có để tham khảo. Bạn không cần tin theo hay làm theo; nội dung không dùng nỗi sợ vận hạn hoặc điềm gở để thuyết phục.
              </p>

              <div className="flex items-center gap-4 text-xs font-semibold text-stone-600 dark:text-stone-400 flex-wrap pt-2">
                <span className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  {membershipAvailability}
                </span>
                <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  AI không tính lá số cá nhân
                </span>
                <span className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                  <Lock className="w-4 h-4 text-stone-500" />
                  Checklist lưu tiến độ trên thiết bị
                </span>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-2xl overflow-hidden border border-line shadow-xs relative aspect-16/10 bg-surface-soft">
                <UnverifiedImage
                  src="/images/tea_bowl.jpg"
                  alt="Nhâm nhi tách trà thơm và tìm hiểu nếp xưa dân tộc"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
                <div className="absolute bottom-2.5 left-3.5 right-3.5 text-[11px] text-white/90 italic flex items-center justify-between">
                  <span>Khoảnh khắc thưởng trà và lắng lòng ngẫm đạo</span>
                  <span className="text-amber-300">✦</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <MembershipCheckout
            key={currentUserEmail || "guest"}
            email={currentUserEmail}
            onLogin={(term) => {
              writeMembershipIntent(term);
              onGoToLogin(term);
            }}
            onStatusChange={setMembershipStatus}
          />

        {/* 2 Primary Plans Comparison: Free vs Tam An */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 items-stretch">
          {/* Card 1: Free features currently available */}
          <Card className="p-6 sm:p-8 rounded-3xl bg-surface border border-line shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  TÍNH NĂNG MIỄN PHÍ
                </span>
                <Badge variant="outline" className="text-xs border-emerald-500/40 text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 font-semibold">
                  Mở hoàn toàn miễn phí
                </Badge>
              </div>

              <h2 className="font-display font-bold text-2xl text-ink mb-1">
                Trải Nghiệm Tự Do
              </h2>
              <p className="text-xs text-stone-500 mb-4">Dành cho mọi người dùng tìm kiếm sự an yên</p>

              <div className="p-3.5 rounded-2xl bg-surface-soft border border-line text-xs text-stone-700 dark:text-stone-300 leading-relaxed mb-5">
                Các tính năng cơ bản hiện có được dùng miễn phí.
                Hội viên Tâm An bổ sung diễn giải AI theo năm và quyền
                đọc các bài đã phát hành trong thư viện hội viên.
                Trạng thái đăng ký được hiển thị bên dưới.
              </div>

              <div className="space-y-3 text-xs text-stone-700 dark:text-stone-300 mb-6">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Check-in tâm trạng:</strong> Nhận lời gợi mở an yên để chiêm nghiệm mỗi ngày.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Gieo keo:</strong> Trải nghiệm ngẫu nhiên để chiêm nghiệm cùng lời quẻ xin xăm theo chủ đề.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                  <strong>Lời nguyện:</strong> Lưu vào Góc của tôi qua tài khoản; thao tác buông bỏ trong Wish chỉ là hiệu ứng biểu tượng.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Lịch nếp nhà:</strong> Tra cứu ngày âm/dương và ghi chú cá nhân. Cẩm nang nghi lễ và tra cứu ngày lành chỉ mở sau khi tư liệu được thẩm định.
                  </span>
                </div>

                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Khoảng nghỉ tĩnh tâm:</strong> Dùng phiên thở ngắn và âm thanh tổng hợp. Luận giải ngày sinh chưa được phát hành.
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={onBackToHome}
              className="w-full py-3.5 rounded-xl border-line text-xs font-semibold text-ink hover:bg-surface-soft cursor-pointer min-h-11"
            >
              Tiếp tục sử dụng bản tự do
            </Button>
          </Card>

          {/* Card 2: Planned membership offer; checkout is not active */}
          <Card className="p-6 sm:p-8 rounded-3xl bg-surface border-2 border-amber-500/40 shadow-md">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              HỘI VIÊN TÂM AN
            </p>

            <h2 className="mt-2 font-display text-2xl font-bold text-ink">
              Đồng hành cùng nếp sống văn hóa
            </h2>

            <p className="mt-3 text-sm font-semibold text-ink">
              {membershipPriceLabel}
            </p>

            <p className="mt-2 text-sm text-muted">
              {membershipAvailability}
            </p>

            <ul className="mt-5 list-disc space-y-3 pl-5 text-sm text-ink">
              <li>
                Diễn giải AI theo năm để tự suy ngẫm về công việc,
                quan hệ và chăm sóc bản thân.
              </li>
              <li>
                Đọc các bài đã phát hành trong thư viện hội viên.
                Danh sách bài hiện có được hiển thị bên dưới.
              </li>
              <li>
                Gói năm tặng một lượt đèn hoa đăng trang trí và
                bình sen ngọc dùng trong cảnh tưởng niệm.
              </li>
            </ul>

            <p className="mt-5 text-sm text-muted">
              Gia hạn thủ công, không tự động trừ tiền. Quyền lợi
              chỉ được kích hoạt sau khi máy chủ xác nhận thanh toán.
              Vật phẩm trang trí không làm lời nguyện có hiệu lực hơn.
            </p>

            <p className="mt-3 text-sm text-muted">
              Xem hạn hội viên, giới hạn AI và thao tác đăng ký
              trong phần trạng thái hội viên bên dưới.
            </p>
          </Card>
        </div>

        <section className="mb-10 rounded-3xl border border-line bg-surface p-5 sm:p-7" aria-labelledby="membership-current-title">
          <h2 id="membership-current-title" className="font-display text-xl font-semibold text-ink">Trạng thái tài khoản</h2>
          {!membershipStatus ? <p className="mt-2 text-sm text-muted">Chưa tải được dữ liệu hội viên từ máy chủ.</p> : <>
            <p className="mt-2 text-sm text-ink">{membershipStatus.subscription ? `Tâm An đang hoạt động đến ${new Date(membershipStatus.subscription.expires_at).toLocaleString("vi-VN")}.` : "Tài khoản hiện chưa có gói Tâm An đang hoạt động."}</p>
            <p className="mt-2 text-sm text-muted">AI theo năm: {membershipStatus.aiUsage.successfulUsed} bản thành công, {membershipStatus.aiUsage.inProgress} lượt đang xử lý; còn {membershipStatus.aiUsage.successfulRemaining}/{membershipStatus.aiUsage.successfulLimit} suất. Đã gọi {membershipStatus.aiUsage.attemptsUsed}/{membershipStatus.aiUsage.providerAttemptLimit} lần trong 24 giờ; lượt lỗi vẫn tính số lần gọi.</p>
            {membershipStatus.aiUsage.nextUsableAt && <p className="mt-1 text-sm text-muted">Lượt tiếp theo dự kiến từ {new Date(membershipStatus.aiUsage.nextUsableAt).toLocaleString("vi-VN")}.</p>}
          </>}
        </section>

        {/* Feature Comparison Matrix Table */}
        <section className="membership-matrix-frame mb-10 p-6 sm:p-8 rounded-3xl bg-surface border border-line shadow-xs">
          <div className="mb-6">
            <h3 className="font-display font-bold text-xl sm:text-2xl text-ink mb-1">
              So Sánh Tính Năng Trực Quan
            </h3>
            <p className="text-xs text-stone-500">
              Bảng Free/Premium và trạng thái khả dụng được tải từ máy chủ; giá và trạng thái thanh toán hiển thị theo cấu hình hiện tại.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line text-stone-500 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-3 px-3">Quyền lợi</th>
                  <th className="py-3 px-3">Free</th>
                  <th className="py-3 px-3">Premium</th>
                  <th className="py-3 px-3">Khả dụng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {featureMatrix.length ? featureMatrix.map((row) => (
                  <tr key={row.name} className="hover:bg-surface-soft/60 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-ink">{row.name}</td>
                    <td className="py-3.5 px-3 text-ink">{row.free}</td>
                    <td className="py-3.5 px-3 text-ink">{row.premium}</td>
                    <td className="py-3.5 px-3 text-muted">{row.availability}</td>
                  </tr>
                )) : <tr><td className="py-4 px-3 text-muted" colSpan={4}>Đang tải quyền lợi và giá gói từ máy chủ.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {/* 3 Immutable Ethical Principles */}
        <section className="p-6 sm:p-8 rounded-3xl bg-surface border border-line mb-10 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Ba nguyên tắc đạo đức bất di bất dịch của Tin Lắm Tâm Linh</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            <div className="p-4 rounded-2xl bg-surface-soft border border-line">
              <div className="font-bold text-red-700 dark:text-red-400 mb-1 flex items-center gap-1.5">
                <span>🚫 Không thương mại hóa nỗi sợ</span>
              </div>
              Chúng tôi không quy định hạn hán xui xẻo, không đe dọa tâm lý hay bán các phép giải hạn đắt đỏ.
              Tâm linh chân chính là hướng thiện và soi mình, không phải sợ hãi.
            </div>

            <div className="p-4 rounded-2xl bg-surface-soft border border-line">
              <div className="font-bold text-amber-700 dark:text-amber-400 mb-1 flex items-center gap-1.5">
                <span>📖 Tự nguyện & Minh bạch nguồn cội</span>
              </div>
              Tính năng cơ bản miễn phí. Giá gói và trạng thái thanh toán hiện tại: {membershipPriceLabel}. Bạn có thể xem rõ quyền lợi trước khi chọn gói.
            </div>

            <div className="p-4 rounded-2xl bg-surface-soft border border-line">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
                <span>🔒 Tôn trọng sự riêng tư tâm khảm</span>
              </div>
              Những dòng suy tư, nhật ký tâm trạng trong Góc của tôi là bí mật của bạn. Chúng tôi tuyệt đối
              không phân tích dữ liệu tâm tư cá nhân để vụ lợi.
            </div>
          </div>
        </section>

        <MemberLibrary
          key={currentUserEmail || "guest"}
          email={currentUserEmail}
        />

        <DigitalShop
          key={currentUserEmail || "guest"}
          email={currentUserEmail}
        />

        <DigitalInventory
          key={currentUserEmail || "guest"}
          email={currentUserEmail}
        />

        <PaymentHistory
          key={currentUserEmail || "guest"}
          email={currentUserEmail}
        />

        <PartnerGifts />

        {currentUserEmail || isDemoMode() ? (
          <PartnershipPanel key={currentUserEmail} />
        ) : (
          <p className="my-6 text-sm text-muted">
            Đăng nhập để gửi và theo dõi đề xuất hợp tác.
          </p>
        )}
        {resetDemoOpen && isDemoMode() && (
          <AppDialog labelledBy="reset-demo-title" onClose={() => setResetDemoOpen(false)}>
            <h2 id="reset-demo-title" className="font-display text-xl font-bold text-ink">Đặt lại dữ liệu demo?</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">Thao tác này xóa dữ liệu trải nghiệm được lưu trong namespace demo trên thiết bị, gồm số dư, giao dịch và tiến độ demo. Tài khoản và dữ liệu production không bị tác động.</p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setResetDemoOpen(false)}>Hủy</Button>
              <Button type="button" onClick={resetDemoData}>Đặt lại dữ liệu demo</Button>
            </div>
          </AppDialog>
        )}
      </main>
    </div>
  );
};
