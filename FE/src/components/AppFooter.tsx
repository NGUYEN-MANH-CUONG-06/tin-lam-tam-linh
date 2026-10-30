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
  BookOpen,
  ShieldCheck,
  ArrowUp,
} from "lucide-react";

interface AppFooterProps {
  onNavigate?: (screen: NavScreen) => void;
  showMembershipBanner?: boolean;
  compactDemo?: boolean;
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

export const AppFooter: React.FC<AppFooterProps> = ({ onNavigate }) => {
  const [dailyProverb, setDailyProverb] = useState<DailyProverb | null>(null);

  useEffect(() => {
    let active = true;
    if (isDemoMode()) {
      setDailyProverb({
        id: "demo-proverb-1",
        date: new Date().toISOString().slice(0, 10),
        sequence: 1,
        cycleLength: 365,
        category: "Tâm an",
        content: "Tâm an vạn sự an, tâm bình thế giới bình.",
        meaning: "Lòng giữ được sự an nhiên thì nhìn đâu cũng thấy thanh thản và thuận hòa.",
        source: {
          name: "Cổ đức minh huấn",
          url: "https://dsvh.gov.vn",
          license: "Public Domain",
        },
        verified: true,
      });
      return;
    }
    loadDailyProverb()
      .then((result) => {
        if (active) setDailyProverb(result);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const goTo = (screen: NavScreen) => {
    if (onNavigate) {
      onNavigate(screen);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="site-footer border-t border-line bg-surface/50 py-10 px-4 mt-12" role="contentinfo">
      <div className="max-w-2xl mx-auto flex flex-col items-center text-center">
        {/* Brand matching Header style */}
        <div className="flex items-center gap-2.5 mb-1.5">
          <span className="brand-mark w-7 h-8 shrink-0">
            <img src="/logo.png" alt="" className="w-full h-full object-contain" />
          </span>
          <div className="text-left">
            <span className="brand-name block text-base font-bold text-ink leading-tight">
              Tin Lắm Tâm Linh
            </span>
            <span className="brand-caption block text-[10px] font-semibold tracking-wider text-accent uppercase">
              Vạn Sự Tùy Duyên
            </span>
          </div>
        </div>

        <p className="text-xs text-muted mt-2 mb-4 max-w-md leading-relaxed">
          Nền tảng chiêm nghiệm và lưu truyền nét đẹp văn hóa tín ngưỡng truyền thống trong không gian số.
        </p>

        {/* Proverb pill */}
        {dailyProverb && (
          <div className="mb-5 px-4 py-1.5 rounded-full bg-accent/5 border border-accent/20 inline-flex items-center gap-2">
            <span className="text-[12px] font-serif italic text-accent">
              “{dailyProverb.content}”
            </span>
          </div>
        )}

        {/* Deep Utility Links (Khác biệt hoàn toàn với Header) */}
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted mb-5" aria-label="Điều hướng chân trang">
          <button
            type="button"
            onClick={() => goTo("about")}
            className="hover:text-accent transition-colors"
          >
            Về chúng tôi &amp; Nguồn tư liệu
          </button>
          <span className="text-line select-none">·</span>
          <button
            type="button"
            onClick={() => goTo("about")}
            className="hover:text-accent transition-colors"
          >
            Nguyên tắc nội dung
          </button>
          <span className="text-line select-none">·</span>
          <button
            type="button"
            onClick={scrollToTop}
            className="inline-flex items-center gap-1 hover:text-accent transition-colors group cursor-pointer"
            aria-label="Cuộn lên đầu trang"
          >
            <span>Lên đầu trang</span>
            <ArrowUp className="w-3 h-3 transition-transform group-hover:-translate-y-0.5" />
          </button>
        </nav>

        {/* Lower copyright */}
        <p className="text-[11px] text-muted/70 leading-normal">
          © {new Date().getFullYear()} Tin Lắm Tâm Linh. Thông tin chiêm nghiệm mang tính tham khảo &amp; bảo tồn di sản văn hóa dân gian.
        </p>
      </div>
    </footer>
  );
};

