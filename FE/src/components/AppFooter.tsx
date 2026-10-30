import React, { useEffect, useState } from "react";
import { NavScreen } from "./AppHeader";
import { DailyProverb, loadDailyProverb } from "../data/contentService";
import { apiRequest } from "../lib/api";
import { isDemoMode } from "../data/demoMode";
import {
  Sparkles,
  ArrowRight,
  Compass,
  Crown,
  Flower2,
  ScrollText,
} from "lucide-react";

interface AppFooterProps {
  onNavigate?: (screen: NavScreen) => void;
  showMembershipBanner?: boolean;
}

interface FooterMembershipStatus {
  plans: Array<{
    term: "monthly" | "yearly";
    name: string;
    price: number;
    months: number;
  }>;
  salesEnabled: boolean;
  checkoutAvailable: boolean;
  paymentEnvironment: "sandbox" | "production";
  subscription: { started_at: string; expires_at: string } | null;
  aiUsage: { successfulUsed: number; inProgress: number; successfulRemaining: number; successfulLimit: number; attemptsUsed: number; attemptsRemaining: number; providerAttemptLimit: number; nextUsableAt: string | null };
}

const demoMembershipPlans: FooterMembershipStatus["plans"] = [
  { term: "monthly", name: "Tâm An tháng", price: 49000, months: 1 },
  { term: "yearly", name: "Tâm An năm", price: 490000, months: 12 },
];

export const AppFooter: React.FC<AppFooterProps> = ({ onNavigate, showMembershipBanner = true }) => {
  const [dailyProverb, setDailyProverb] = useState<DailyProverb | null>(null);
  const [proverbLoadFailed, setProverbLoadFailed] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<FooterMembershipStatus | null>(null);
  const [membershipStatusLoading, setMembershipStatusLoading] = useState(true);

  useEffect(() => {
    if (isDemoMode()) {
      setMembershipStatus({ plans: demoMembershipPlans, salesEnabled: false, checkoutAvailable: false, paymentEnvironment: "sandbox", subscription: null, aiUsage: { successfulUsed: 0, inProgress: 0, successfulRemaining: 0, successfulLimit: 0, attemptsUsed: 0, attemptsRemaining: 0, providerAttemptLimit: 0, nextUsableAt: null } });
      setMembershipStatusLoading(false);
      return;
    }
    let active = true;
    loadDailyProverb()
      .then((result) => {
        if (active) setDailyProverb(result);
      })
      .catch(() => {
        if (active) setProverbLoadFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isDemoMode()) {
      setMembershipStatus({ plans: demoMembershipPlans, salesEnabled: false, checkoutAvailable: false, paymentEnvironment: "sandbox", subscription: null, aiUsage: { successfulUsed: 1, inProgress: 0, successfulRemaining: 2, successfulLimit: 3, attemptsUsed: 1, attemptsRemaining: 4, providerAttemptLimit: 5, nextUsableAt: null } });
      setMembershipStatusLoading(false);
      return;
    }
    let active = true;
    apiRequest<FooterMembershipStatus>("/membership/status")
      .then((status) => {
        if (!active) return;
        setMembershipStatus(status);
        setMembershipStatusLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setMembershipStatus(null);
        setMembershipStatusLoading(false);
      });
    return () => { active = false; };
  }, []);

  const membershipTitle = membershipStatus?.subscription
    ? "Hội viên Tâm An đang hoạt động"
    : "Hội viên Tâm An · quyền lợi và giá gói";
  const membershipDescription = membershipStatus?.subscription
      ? `Hội viên Tâm An có hiệu lực đến ${new Date(membershipStatus.subscription.expires_at).toLocaleDateString("vi-VN")}. AI theo năm: đã tạo ${membershipStatus.aiUsage.successfulUsed}/${membershipStatus.aiUsage.successfulLimit} bản, còn ${membershipStatus.aiUsage.successfulRemaining}; ${membershipStatus.aiUsage.inProgress} yêu cầu đang xử lý. Trong 24 giờ qua, đã gửi ${membershipStatus.aiUsage.attemptsUsed}/${membershipStatus.aiUsage.providerAttemptLimit} yêu cầu AI (yêu cầu lỗi cũng tính vào giới hạn).${membershipStatus.aiUsage.nextUsableAt ? ` Có thể dùng tiếp từ ${new Date(membershipStatus.aiUsage.nextUsableAt).toLocaleString("vi-VN")}.` : ""}`
    : `${membershipStatus && !membershipStatus.salesEnabled ? "Đăng ký hiện chưa mở. " : membershipStatus && !membershipStatus.checkoutAvailable ? "Thanh toán đang tạm thời không khả dụng. " : membershipStatus?.paymentEnvironment === "sandbox" ? "Thanh toán đang ở chế độ thử nghiệm. " : ""}Xem quyền lợi, giá gói tháng/năm và tình trạng thanh toán trước khi đăng ký.`;
  const membershipPricePlans = membershipStatus?.plans ?? [];

  const goTo = (screen: NavScreen) => {
    if (onNavigate) {
      onNavigate(screen);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer className="site-footer" role="contentinfo">
      {/* Trạng thái gói hội viên */}
      {showMembershipBanner && <div className="footer-membership-banner">
        <div className="footer-membership-card">
          <div className="footer-membership-left">
            <div className="footer-membership-badge">
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>{membershipStatus?.subscription ? "HỘI VIÊN ĐANG HOẠT ĐỘNG" : membershipStatus?.salesEnabled ? "TRẠNG THÁI GÓI HỘI VIÊN" : "CHƯA MỞ ĐĂNG KÝ"}</span>
            </div>
            <h3 className="footer-membership-title">
              {membershipTitle}
            </h3>
            <p className="footer-membership-desc">
              {membershipDescription}
            </p>
            <div className="footer-membership-prices" aria-label="Giá gói Hội viên Tâm An">
              {membershipPricePlans.length > 0 ? membershipPricePlans.map((plan) => (
                <span className="footer-membership-price" key={plan.term}>
                  <span>{plan.name}</span>
                  <strong>{new Intl.NumberFormat("vi-VN").format(plan.price)}đ</strong>
                </span>
              )) : (
                <span className="footer-membership-price-message" role="status">
                  {membershipStatusLoading ? "Đang tải giá gói…" : "Chưa tải được giá gói hiện tại."}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => goTo("membership")}
            className="footer-membership-btn group"
            id="footer-membership-cta"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>Xem gói &amp; đăng ký</span>
            <ArrowRight className="w-4 h-4 text-amber-200 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </div>}

      {/* 2. KHỐI NỘI DUNG CHÍNH (4 CỘT HIỆN ĐẠI) */}
      <div className="site-footer__inner">
        {/* Cột 1: Thương hiệu & Sứ mệnh */}
        <div className="footer-brand-col">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center p-1 overflow-hidden">
              <img src="/logo.png" alt="" className="w-full h-full object-contain" style={{ imageRendering: "pixelated" }} />
            </span>
            <span className="font-display text-lg font-bold tracking-wide text-ink">
              Tin Lắm Tâm Linh
            </span>
          </div>
          <p className="footer-brand-desc">
            Khám phá văn hóa Việt, tham khảo nghi lễ và ghi lại cảm xúc.
          </p>
        </div>

        {/* Nội dung chính */}
        <div className="footer-nav-col">
          <h4 className="footer-nav-title">
            <Compass className="w-3.5 h-3.5 text-accent" />
            <span>Khám phá nội dung</span>
          </h4>
          <ul className="footer-nav-list">
            <li>
              <button type="button" onClick={() => goTo("culture")} className="footer-link">
                Bài viết văn hóa
              </button>
            </li>
            <li>
              <button type="button" onClick={() => goTo("rituals")} className="footer-link">
                Hướng dẫn nghi lễ
              </button>
            </li>
            <li>
              <button type="button" onClick={() => goTo("mood")} className="footer-link">
                Ghi lại cảm xúc
              </button>
            </li>
          </ul>
        </div>

        {/* Cột: Minh triết ngày mới */}
        <div className="footer-proverb-col">
          <h4 className="footer-nav-title">
            <ScrollText className="w-3.5 h-3.5 text-accent" />
            <span>Minh triết ngày mới</span>
          </h4>
          <div className="footer-proverb-card">
            {dailyProverb ? (
              <>
                <blockquote className="footer-proverb-quote">
                  “{dailyProverb.content}”
                </blockquote>
                <p className="footer-proverb-meaning">{dailyProverb.meaning}</p>
              </>
            ) : (
              <p className="text-xs text-muted">
                {proverbLoadFailed
                  ? "Chưa thể tải câu hôm nay."
                  : "Đang tải lời cổ nhân…"}
              </p>
            )}
          </div>
        </div>

      </div>

      {/* 3. DÒNG BẢN QUYỀN VÀ PHÁP LÝ (LOWER BAR) */}
      <div className="site-footer__lower">
        <div className="site-footer__lower-inner">
          <p>
            © {new Date().getFullYear()} Tin Lắm Tâm Linh.
          </p>
          <div className="footer-legal-links">
            <button type="button" onClick={() => goTo("account")} className="footer-legal-link">
              Góc của tôi
            </button>
            <span>·</span>
            <button type="button" onClick={() => goTo("membership")} className="footer-legal-link text-accent">
              Gói Tâm An
            </button>
            <span>·</span>
            <button type="button" onClick={() => goTo("today")} className="footer-legal-link">
              Hôm nay
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
