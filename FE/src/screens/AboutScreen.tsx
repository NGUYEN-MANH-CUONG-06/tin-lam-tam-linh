import React from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Compass,
  Flower2,
  Landmark,
  Sparkles,
  Heart,
  ShieldCheck,
  CheckCircle2,
  Flame,
  Quote,
  MapPin,
  Scroll,
  Leaf,
  SunMedium,
} from "lucide-react";
import type { NavScreen } from "../components/AppHeader";
import { AboutSourcesSection } from "../components/AboutSourcesSection";

type AboutScreenProps = {
  onNavigate: (screen: NavScreen) => void;
};

interface ExplorationItem {
  title: string;
  badge: string;
  description: string;
  screen: NavScreen;
  icon: React.ElementType;
  accentClass: string;
}

const EXPLORATIONS: ExplorationItem[] = [
  {
    title: "Bản đồ Di sản Ba Miền",
    badge: "Kiến trúc & Phong tục",
    description: "Khám phá nếp nhà rường Bắc Bộ, gian thờ xứ Huế cổ kính và phong tục Nam Bộ khoáng đạt cùng các hiện vật tiêu biểu.",
    screen: "culture-map",
    icon: Landmark,
    accentClass: "from-amber-500/15 to-orange-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
  },
  {
    title: "Không gian Bàn thờ Gia Tiên 3D",
    badge: "Tâm thức hướng nguồn",
    description: "Không gian thờ tự tương tác trang nghiêm. Thắp nén tâm hương, dâng hoa quả và lắng lòng trong tiếng chuông mõ an định.",
    screen: "ancestor-altar",
    icon: Flame,
    accentClass: "from-red-500/15 to-amber-500/10 text-red-700 dark:text-red-300 border-red-500/20",
  },
  {
    title: "Cẩm nang Nghi lễ & Lịch Sóc Vọng",
    badge: "Lịch pháp UTC+7",
    description: "Tra cứu ngày mùng 1, ngày rằm, 24 tiết khí thiên văn và hướng dẫn lễ bái gia tiên, thần linh theo thuần phong mỹ tục.",
    screen: "calendar",
    icon: CalendarDays,
    accentClass: "from-emerald-500/15 to-teal-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
  },
  {
    title: "Thả Hoa Đăng & Lời Nguyện Cầu",
    badge: "Bình an & Thiện nguyện",
    description: "Thả trôi hoa đăng bên dòng sông tâm tưởng, gửi gắm ước nguyện bình an cho gia đình, người thương và tự tại lòng mình.",
    screen: "wish",
    icon: Flower2,
    accentClass: "from-rose-500/15 to-pink-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
  },
  {
    title: "Xin Xăm & Xin Keo Âm Dương",
    badge: "Chiêm nghiệm cổ truyền",
    description: "Mô phỏng phép xin keo dân gian cùng 100 quẻ Quan Âm và Quan Thánh nguyên tác, đối chiếu chữ Hán và ý nghĩa nhân văn.",
    screen: "xinxam",
    icon: Compass,
    accentClass: "from-blue-500/15 to-indigo-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20",
  },
  {
    title: "Trải nghiệm Luận giải Can Chi",
    badge: "Triết lý cổ phương Đông",
    description: "Tìm hiểu vòng tuần hoàn ngũ hành tương sinh, can chi năm tháng dưới lăng kính chiêm nghiệm và tham khảo văn hóa.",
    screen: "astrology",
    icon: Sparkles,
    accentClass: "from-purple-500/15 to-violet-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20",
  },
];

const CORE_PILLARS = [
  {
    title: "Chân Xác & Học Thuật",
    badge: "Khảo dị văn bản",
    icon: BookOpen,
    description:
      "Từng nét văn hóa, cẩm nang lễ tục và thuật toán lịch pháp đều được tham chiếu từ các tài liệu của Viện Văn hóa Nghệ thuật Quốc gia (VICAS), Cục Di sản văn hóa và các thư tịch cổ. Tuyệt đối bài trừ mê tín dị đoan và suy diễn sai lệch.",
  },
  {
    title: "Tâm Thành Làm Trọng",
    badge: "Lễ bạc lòng thành",
    icon: Heart,
    description:
      "Kế thừa triết lý ngàn đời của người Việt: Sự hiếu kính tổ tiên và lòng hướng thiện quý giá hơn vạn mâm cao cỗ đầy. Dự án đề cao lối sống thanh tịnh, giản dị, tri ân nguồn cội và không thương mại hóa tâm linh.",
  },
  {
    title: "Nhịp Cầu Công Nghệ",
    badge: "Trải nghiệm số nhân văn",
    icon: Sparkles,
    description:
      "Ứng dụng mô phỏng 3D tương tác, âm hưởng nhạc cụ dân gian mộc mạc và ngôn ngữ thiết kế hiện đại nhằm giúp thế hệ trẻ cùng kiều bào muôn phương dễ dàng chạm vào di sản thiêng liêng của cha ông.",
  },
];

const VALUE_STATS = [
  { value: "3 Miền", label: "Kiến trúc thờ tự & Bản sắc văn hóa", icon: MapPin },
  { value: "100 Quẻ", label: "Quan Âm & Quan Thánh khảo dị cổ bản", icon: Scroll },
  { value: "24 Tiết khí", label: "Thuật toán thiên văn chuẩn UTC+7", icon: SunMedium },
  { value: "100%", label: "Phi thương mại hóa & Hướng thiện", icon: ShieldCheck },
];

export const AboutScreen: React.FC<AboutScreenProps> = ({ onNavigate }) => (
  <div className="screen-shell">
    <main className="page-container max-w-5xl space-y-12 pb-16 pt-4 sm:space-y-16 sm:pt-8">
      {/* HERO SECTION */}
      <header className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-b from-surface-soft/60 via-surface to-surface p-6 sm:p-12 shadow-sm">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-amber-500/5 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-red-500/5 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-600/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-accent shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="tracking-wide uppercase">Dự án Văn hóa Số • Tin Lắm Tâm Linh</span>
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-ink sm:text-5xl lg:text-6xl leading-[1.15]">
            Gìn Giữ Hồn Cốt Tiền Nhân{" "}
            <span className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-900 dark:from-amber-400 dark:to-amber-200 bg-clip-text text-transparent">
              Trong Không Gian Số
            </span>
          </h1>

          <p className="mt-4 font-display text-lg italic text-accent sm:text-xl">
            “Vạn sự tùy duyên • Nếp nhà thanh tịnh • Tâm sáng an nhiên”
          </p>

          <p className="mt-5 text-sm leading-relaxed text-muted sm:text-base">
            Trong dòng chảy gấp gáp của đời sống hiện đại, những nét đẹp tín ngưỡng cổ truyền của người Việt đôi khi trở nên xa lạ hoặc bị che mờ bởi những ngộ nhận. 
            <strong className="font-semibold text-ink"> Tin Lắm Tâm Linh</strong> ra đời như một không gian tĩnh tại, chân xác — nơi công nghệ hiện đại bắc nhịp cầu đưa các giá trị di sản, nếp thờ cúng gia tiên và triết lý sống hướng thiện trở về gần gũi trong tâm thức người Việt muôn phương.
          </p>
        </div>

        {/* CULTURAL STATS HIGHLIGHT */}
        <div className="mt-10 grid grid-cols-2 gap-3 border-t border-line/80 pt-8 sm:grid-cols-4 sm:gap-4">
          {VALUE_STATS.map(({ value, label, icon: Icon }) => (
            <div
              key={label}
              className="rounded-2xl border border-line/60 bg-surface/80 p-4 transition-all hover:border-accent/40 shadow-2xs"
            >
              <div className="flex items-center gap-2 text-accent">
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="font-display text-xl font-bold text-ink sm:text-2xl">{value}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted leading-tight">{label}</p>
            </div>
          ))}
        </div>
      </header>

      {/* CORE VALUE PILLARS */}
      <section aria-labelledby="about-pillars" className="space-y-6">
        <div className="text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Triết lý nền tảng</p>
          <h2 id="about-pillars" className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
            Ba Trụ Cột Giá Trị Cốt Lõi
          </h2>
          <p className="mt-2 text-sm text-muted max-w-2xl">
            Định hướng mọi hoạt động nghiên cứu, số hóa và sáng tạo trải nghiệm tại Tin Lắm Tâm Linh.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {CORE_PILLARS.map(({ title, badge, icon: Icon, description }) => (
            <div
              key={title}
              className="flex flex-col justify-between rounded-3xl border border-line bg-surface p-6 transition-all hover:border-accent/40 hover:shadow-sm"
            >
              <div>
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl border border-amber-600/20 bg-amber-500/10 text-accent shadow-2xs">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <span className="rounded-full border border-line bg-surface-soft px-3 py-1 text-[11px] font-semibold text-muted">
                    {badge}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-ink">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CULTURAL MANIFESTO CALLOUT */}
      <section
        aria-labelledby="about-manifesto"
        className="relative overflow-hidden rounded-3xl border border-amber-600/30 bg-gradient-to-br from-amber-500/10 via-surface to-amber-700/5 p-7 sm:p-10 shadow-sm"
      >
        <Quote className="absolute right-6 top-6 h-20 w-20 text-accent/10" aria-hidden="true" />
        <div className="relative z-10 max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">Thông điệp từ trái tim</p>
          <blockquote id="about-manifesto" className="mt-3 font-display text-lg italic leading-relaxed text-ink sm:text-2xl">
            “Tín ngưỡng dân gian của người Việt không phải là sự cầu xin mù quáng hay nỗi sợ hãi siêu hình. Đó là nếp nhớ ơn tổ tiên tiền nhân, là đạo lý ‘Uống nước nhớ nguồn’, và là điểm tựa an yên giúp mỗi người tìm lại sự cân bằng giữa nhịp đời hối hả.”
          </blockquote>
          <div className="mt-5 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-accent/15 border border-accent/30 grid place-items-center text-accent">
              <Leaf className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Ban Biên Tập Dự Án</p>
              <p className="text-xs text-muted">Tin Lắm Tâm Linh • Bảo Tồn & Số Hóa Di Sản Văn Hóa Việt</p>
            </div>
          </div>
        </div>
      </section>

      {/* EXPLORATION PATHWAYS */}
      <section aria-labelledby="about-explore" className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">Không gian trải nghiệm</p>
            <h2 id="about-explore" className="mt-1 font-display text-2xl font-bold text-ink sm:text-3xl">
              Những Gì Bạn Có Thể Khám Phá
            </h2>
          </div>
          <p className="text-sm text-muted">Chọn một phân hệ để bắt đầu trải nghiệm ngay</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {EXPLORATIONS.map(({ title, badge, description, screen, icon: Icon, accentClass }) => (
            <button
              key={title}
              type="button"
              onClick={() => onNavigate(screen)}
              className="group relative flex flex-col justify-between rounded-3xl border border-line bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-amber-600/40 hover:bg-surface-soft/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`grid h-11 w-11 place-items-center rounded-2xl border bg-gradient-to-br shadow-2xs transition-transform group-hover:scale-105 ${accentClass}`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted/90 rounded-md border border-line bg-surface-soft/60 px-2 py-0.5">
                    {badge}
                  </span>
                </div>
                <h3 className="mt-4 font-display font-bold text-ink group-hover:text-accent transition-colors">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted line-clamp-3">
                  {description}
                </p>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-3 text-xs font-semibold text-accent">
                <span>Trải nghiệm ngay</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* CONTENT ETHICS & PRINCIPLES */}
      <section aria-labelledby="about-ethics" className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent/10 border border-accent/20 text-accent">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-accent">Cam kết chuẩn mực</p>
            <h2 id="about-ethics" className="font-display text-xl font-bold text-ink">
              Nguyên Tắc Biên Soạn & Đạo Đức Văn Hóa
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line/60 bg-surface-soft/40 p-4">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Mục đích chiêm nghiệm</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Nội dung quẻ xăm và tử vi mô phỏng chỉ phục vụ chiêm nghiệm nhân sinh và tìm hiểu văn hóa; không quyết định hay bảo đảm vận mệnh tương lai.
            </p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-surface-soft/40 p-4">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Tôn trọng đa dạng</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Hòa hợp các tập tục địa phương Bắc - Trung - Nam, trân trọng nét đặc thù của từng cộng đồng cư dân và tín ngưỡng bản địa thuần Việt.
            </p>
          </div>

          <div className="rounded-2xl border border-line/60 bg-surface-soft/40 p-4">
            <div className="flex items-center gap-2 text-ink font-semibold text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Bảo vệ nếp sống xanh</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Khuyến khích thực hành tâm linh văn minh, hạn chế đốt vàng mã, bảo vệ môi trường và giữ gìn sự thanh tịnh cho không gian sống.
            </p>
          </div>
        </div>
      </section>

      {/* ACADEMIC & CULTURAL CITATIONS */}
      <AboutSourcesSection />

      {/* OUTRO CALL TO ACTION BANNER */}
      <section className="relative overflow-hidden rounded-3xl border border-amber-600/30 bg-gradient-to-r from-amber-700/10 via-surface to-red-700/10 p-8 sm:p-12 text-center shadow-md">
        <div className="mx-auto max-w-2xl space-y-4">
          <span className="inline-block rounded-full border border-amber-600/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-accent uppercase tracking-wider">
            Bắt đầu hành trình
          </span>
          <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">
            Sẵn Sàng Khám Phá Nét Đẹp Văn Hóa Cùng Chúng Tôi?
          </h2>
          <p className="text-sm leading-relaxed text-muted sm:text-base">
            Mỗi góc nhìn, nén hương hay quẻ xăm là một cơ hội để bạn chậm lại một nhịp, lắng nghe chính mình và thấu hiểu chiều sâu truyền thống ngàn đời.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => onNavigate("culture-map")}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-700 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-amber-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              <Landmark className="h-4 w-4" />
              <span>Khám phá Bản đồ Di sản</span>
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onNavigate("ancestor-altar")}
              className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface px-5 py-3 text-sm font-semibold text-ink shadow-2xs transition-all hover:border-amber-600/40 hover:bg-surface-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              <Flame className="h-4 w-4 text-accent" />
              <span>Về Bàn thờ Gia Tiên 3D</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  </div>
);
