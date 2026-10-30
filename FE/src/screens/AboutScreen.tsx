import React from "react";
import { ArrowRight, BookOpen, CalendarDays, Compass, Flower2, Landmark, Sparkles } from "lucide-react";
import type { NavScreen } from "../components/AppHeader";

type AboutScreenProps = {
  onNavigate: (screen: NavScreen) => void;
};

const explorations: Array<{ title: string; description: string; screen: NavScreen; icon: React.ElementType }> = [
  { title: "Xin xăm và xin keo âm dương", description: "Tìm hiểu các hình thức chiêm nghiệm dân gian.", screen: "xinxam", icon: Compass },
  { title: "Không gian gia tiên", description: "Ghé thăm không gian thờ tự và tưởng nhớ gia tiên.", screen: "ancestor-altar", icon: Landmark },
  { title: "Hoa đăng và lời nguyện", description: "Gửi lời nguyện trong trải nghiệm hoa đăng.", screen: "wish", icon: Flower2 },
  { title: "Bản đồ di sản văn hóa", description: "Khám phá nội dung văn hóa theo vùng miền.", screen: "culture-map", icon: BookOpen },
  { title: "Lịch văn hóa và nghi lễ", description: "Xem lịch và cẩm nang nghi lễ.", screen: "calendar", icon: CalendarDays },
  { title: "Trải nghiệm Tử vi minh họa", description: "Tìm hiểu nội dung tử vi với mục đích tham khảo.", screen: "astrology", icon: Sparkles },
];

export const AboutScreen: React.FC<AboutScreenProps> = ({ onNavigate }) => (
  <div className="screen-shell">
    <main className="page-container max-w-5xl">
      <header className="border-b border-line pb-8 pt-5 sm:pb-10 sm:pt-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-accent">Về chúng tôi</p>
        <h1 className="font-display text-3xl font-bold leading-tight text-ink sm:text-5xl">Tin Lắm Tâm Linh</h1>
        <p className="mt-3 font-display text-lg italic text-accent sm:text-xl">“Khám phá văn hóa Việt trong không gian số.”</p>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-muted sm:text-base">
          Nền tảng trải nghiệm văn hóa, tín ngưỡng và những giá trị tinh thần trong đời sống người Việt thông qua công nghệ.
        </p>
      </header>

      <section className="grid gap-8 border-b border-line py-8 sm:grid-cols-[0.7fr_1.3fr] sm:py-10" aria-labelledby="about-mission">
        <h2 id="about-mission" className="font-display text-2xl font-bold text-ink">Sứ mệnh</h2>
        <ul className="space-y-3 text-sm leading-6 text-muted sm:text-base">
          <li>Giúp người trẻ tiếp cận văn hóa truyền thống dễ dàng hơn.</li>
          <li>Tạo không gian khám phá và chiêm nghiệm có tính tương tác.</li>
          <li>Kết nối di sản văn hóa với trải nghiệm số.</li>
        </ul>
      </section>

      <section className="py-8 sm:py-10" aria-labelledby="about-explore">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent">Khám phá nền tảng</p>
            <h2 id="about-explore" className="font-display text-2xl font-bold text-ink">Những gì bạn có thể khám phá</h2>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {explorations.map(({ title, description, screen, icon: Icon }) => (
            <button
              key={title}
              type="button"
              onClick={() => onNavigate(screen)}
              className="group flex min-h-24 items-center gap-4 rounded-panel border border-line bg-surface p-4 text-left transition-colors hover:border-amber-600/40 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-amber-700/20 bg-amber-700/5 text-accent">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-semibold text-ink">{title}</span>
                <span className="mt-1 block text-sm leading-5 text-muted">{description}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="border-t border-line py-7 sm:py-8" aria-labelledby="about-principles">
        <h2 id="about-principles" className="font-display text-xl font-bold text-ink">Nguyên tắc nội dung</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-muted sm:text-base">
          Nội dung luận giải và trải nghiệm mô phỏng phục vụ mục đích tìm hiểu, tự chiêm nghiệm và tham khảo văn hóa; không bảo đảm dự đoán tương lai.
        </p>
      </section>
    </main>
  </div>
);
