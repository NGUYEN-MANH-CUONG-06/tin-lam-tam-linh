import { ShieldCheck, Landmark, Compass, BookOpen, ExternalLink, CheckCircle2 } from "lucide-react";

interface SourceItem {
  title: string;
  subtitle?: string;
  note: string;
  href?: string;
}

interface SourceCategory {
  category: string;
  icon: typeof Landmark;
  badge: string;
  items: SourceItem[];
}

const SOURCE_CATEGORIES: SourceCategory[] = [
  {
    category: "Di sản & Cơ quan quản lý văn hóa",
    icon: Landmark,
    badge: "Chính thống",
    items: [
      {
        title: "Cục Di sản văn hóa",
        subtitle: "Bộ Văn hóa, Thể thao và Du lịch",
        note: "Danh mục di sản văn hóa phi vật thể quốc gia · Chuẩn hóa tên gọi và xuất xứ lễ tục truyền thống.",
        href: "https://dsvh.gov.vn/danh-muc-di-san-van-hoa-phi-vat-the-quoc-gia-1789",
      },
      {
        title: "Viện Văn hóa Nghệ thuật Quốc gia (VICAS)",
        subtitle: "Nghiên cứu văn hóa dân gian Việt Nam",
        note: "Tư liệu khảo cứu về tín ngưỡng thờ Mẫu, nghi lễ nếp nhà và phong tục sóc vọng ba miền.",
        href: "http://vicas.org.vn/",
      },
      {
        title: "Hồ sơ Di sản UNESCO Việt Nam",
        subtitle: "Công ước Bảo vệ Di sản Phi vật thể",
        note: "Đối chiếu hồ sơ tín ngưỡng thờ cúng Hùng Vương, Hát Xoan, Đờn ca tài tử và Thực hành Then.",
        href: "https://dsvh.gov.vn/di-san-van-hoa-duoc-unesco-ghi-danh-1790",
      },
    ],
  },
  {
    category: "Lịch pháp & Tiết khí thiên văn",
    icon: Compass,
    badge: "Tính toán thiên văn",
    items: [
      {
        title: "Thuật toán Lịch âm Việt Nam UTC+7",
        subtitle: "Tác giả: Hồ Ngọc Đức",
        note: "Thuật toán quy đổi can chi, tháng nhuận và ngày sóc vọng chuẩn theo múi giờ Việt Nam.",
      },
      {
        title: "Đài Thiên văn Hong Kong (HKO)",
        subtitle: "24 Solar Terms Database",
        note: "Tọa độ kinh độ mặt trời đối chiếu 24 tiết khí trong năm.",
        href: "https://www.hko.gov.hk/en/gts/time/24solarterms.htm",
      },
      {
        title: "Quy tắc 12 sao Hoàng đạo & Hắc đạo",
        subtitle: "Khoa học chọn ngày dân gian",
        note: "Đối chiếu quy tắc Thanh Long Hoàng Đạo và chu kỳ trực nhật 12 thần sát.",
        href: "https://amlichvn.net/kien-thuc/ngay-hoang-dao-hac-dao/",
      },
    ],
  },
  {
    category: "Thư tịch cổ & Thẻ xăm nguyên bản",
    icon: BookOpen,
    badge: "Khảo dị văn bản",
    items: [
      {
        title: "Chinese Temples Committee (Hồng Kông)",
        subtitle: "Tư liệu 100 thẻ Quan Âm linh cảm",
        note: "Đối chiếu văn bản nguyên tác chữ Hán, thơ quẻ và điển cố tích truyện.",
        href: "https://www.ctc.org.hk/chim/觀音籤-第一籤/",
      },
      {
        title: "Wikisource · Quan Thánh Đế Quân Linh Xăm",
        subtitle: "Bản khắc cổ đối chiếu",
        note: "Khảo dị câu từ quẻ Quan Thánh để giữ vẹn nguyên tinh thần hướng thiện nguyên bản.",
        href: "https://zh.wikisource.org/w/index.php?title=關聖帝君靈籤&oldid=2428837",
      },
      {
        title: "Kho tàng Văn học Dân gian Việt Nam",
        subtitle: "Ca dao, Tục ngữ & Điển tích nếp nhà",
        note: "Tuyển tập ca dao tục ngữ thuần Việt đối chiếu theo nguồn nghiên cứu văn học dân gian.",
        href: "https://cadao.me/",
      },
    ],
  },
];

export function AboutSourcesSection() {
  return (
    <section
      aria-labelledby="about-sources-heading"
      className="about-sources-section my-10 rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-6">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0 shadow-2xs">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold tracking-widest uppercase text-accent">
              Tiêu chuẩn học thuật &amp; Trách nhiệm di sản
            </span>
            <h2 id="about-sources-heading" className="font-display text-xl sm:text-2xl font-bold text-ink mt-0.5">
              Minh bạch nguồn tư liệu
            </h2>
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 self-start sm:self-center px-3 py-1.5 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 shadow-2xs">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Đã kiểm chứng nguồn gốc</span>
        </div>
      </div>

      <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed max-w-3xl">
        Tin Lắm Tâm Linh tuyệt đối không thêu dệt, phóng đại hoặc đưa ra các suy diễn mê tín dị đoan. Mọi thuật toán lịch pháp, ý nghĩa can chi, phong tục sóc vọng và văn bản thơ quẻ đều được đối chiếu cẩn trọng với tư liệu di sản, cơ sở thiên văn học và văn bản học truyền thống.
      </p>

      <div className="mt-8 grid gap-6 md:grid-cols-3 items-stretch">
        {SOURCE_CATEGORIES.map(({ category, icon: Icon, badge, items }) => (
          <div
            key={category}
            className="flex flex-col rounded-2xl border border-line/80 bg-surface-soft/40 p-5 transition-all hover:border-accent/40 hover:bg-surface-soft/70 shadow-2xs"
          >
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4 text-accent" />
                <h3 className="font-display text-sm font-bold text-ink">{category}</h3>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-surface border border-line text-muted">
                {badge}
              </span>
            </div>

            <div className="flex flex-col gap-3 flex-1 justify-between">
              {items.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl bg-surface border border-line/60 p-3.5 text-xs leading-normal hover:border-accent/30 transition-colors shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-ink text-xs sm:text-[13px]">{item.title}</span>
                    {item.href && (
                      <a
                        href={item.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted hover:text-accent shrink-0 p-0.5 transition-colors"
                        aria-label={`Mở liên kết tham khảo: ${item.title}`}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                  {item.subtitle && (
                    <span className="block text-[11px] text-accent font-semibold mt-1">
                      {item.subtitle}
                    </span>
                  )}
                  <p className="text-muted text-[11px] mt-1.5 leading-relaxed">
                    {item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-line/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-muted leading-relaxed">
        <p>
          * Mỗi tư liệu đều được thẩm định và đối chiếu cẩn trọng cho từng trải nghiệm trên nền tảng. Các dị bản văn hóa vùng miền luôn được ghi nhận với tinh thần tôn trọng sâu sắc tính đa dạng của di sản dân tộc.
        </p>
      </div>
    </section>
  );
}

