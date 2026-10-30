import React from "react";
import {
  ArrowRight,
  Compass,
  Flower2,
  Heart,
  Landmark,
  PenLine,
  ScrollText,
  Sparkles,
  Wind,
  BookOpen,
  Sparkle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { UnverifiedImage } from "../components/UnverifiedImage";
import "../styles/ExperienceScreen.css";

interface ExperienceScreenProps {
  onGoToXinXam: () => void;
  onGoToWish: () => void;
  onGoToZen: () => void;
  onGoToGratitude: () => void;
  onGoToXinKeo: () => void;
  onGoToAstrology: () => void;
  onGoToAncestorAltar: () => void;
  onGoToCulture: () => void;
}

interface ExperienceItem {
  id: string;
  title: string;
  description: string;
  label: string;
  icon: LucideIcon;
  image: string;
  badge: string;
  tag: string;
  onClick: () => void;
}

interface ExperienceGroup {
  id: string;
  title: string;
  description: string;
  items: ExperienceItem[];
}

export const ExperienceScreen: React.FC<ExperienceScreenProps> = ({
  onGoToXinXam,
  onGoToWish,
  onGoToZen,
  onGoToGratitude,
  onGoToXinKeo,
  onGoToAstrology,
  onGoToAncestorAltar,
  onGoToCulture,
}) => {
  const groups: ExperienceGroup[] = [
    {
      id: "quiet-moments",
      title: "Một khoảng nghỉ cho mình",
      description:
        "Thực hành tĩnh tâm nhẹ nhàng, tìm lại điểm tựa an lành giữa nhịp sống bận rộn.",
      items: [
        {
          id: "zen",
          title: "Thiền ngắn an tịnh",
          description:
            "Dành vài phút chú ý đến hơi thở trong không gian yên tĩnh với âm thanh tổng hợp tùy chọn.",
          label: "Mở phiên thiền",
          icon: Wind,
          image: "/images/zen_meditation.jpg",
          badge: "Tĩnh tâm 3 phút",
          tag: "Chuông xoay · Hơi thở",
          onClick: onGoToZen,
        },
        {
          id: "wish",
          title: "Lời nguyện hoa đăng",
          description:
            "Viết điều bạn mong mỏi và chọn lưu vào nhật ký; thao tác buông bỏ được thể hiện bằng một hiệu ứng biểu tượng.",
          label: "Viết lời nguyện",
          icon: PenLine,
          image: "/images/do_paper_still_life.jpg",
          badge: "Lời nguyện",
          tag: "Giấy dó · Nguyện ước",
          onClick: onGoToWish,
        },
        {
          id: "gratitude",
          title: "Một lời biết ơn",
          description:
            "Gửi gắm lời tri ân chân thành tới bậc sinh thành, người đồng hành hoặc điều nhỏ bé bạn trân quý.",
          label: "Gửi lời tri ân",
          icon: Heart,
          image: "/images/tea_bowl.jpg",
          badge: "Nuôi dưỡng tâm từ",
          tag: "Tri ân · Chân thành",
          onClick: onGoToGratitude,
        },
      ],
    },
    {
      id: "cultural-reflection",
      title: "Chiêm nghiệm qua văn hóa",
      description:
        "Tiếp cận những phong tục và biểu tượng dân gian như một lời gợi mở để tự soi chiếu lòng mình.",
      items: [
        {
          id: "xinxam",
          title: "Xin xăm văn hóa truyền thống",
          description:
            "Xin xăm Quan Âm hoặc Quan Thánh theo nghi thức cổ truyền, đón nhận quẻ thơ đối chiếu nguồn cội.",
          label: "Bắt đầu xin xăm",
          icon: ScrollText,
          image: "/images/temple_bac_bo.jpg",
          badge: "Phổ biến nhất",
          tag: "Quan Âm · Quan Thánh",
          onClick: onGoToXinXam,
        },
        {
          id: "xinkeo",
          title: "Xin keo âm dương",
          description:
            "Trải nghiệm phong tục gieo quẻ keo dân gian cổ xưa, chiêm nghiệm sự thuận hòa của nhân duyên.",
          label: "Trải nghiệm gieo keo",
          icon: Compass,
          image: "/images/pottery_artisan.jpg",
          badge: "Dân gian cổ phong",
          tag: "Quẻ keo Âm Dương",
          onClick: onGoToXinKeo,
        },
      ],
    },
    {
      id: "spaces-and-symbols",
      title: "Không gian và biểu tượng cội nguồn",
      description:
        "Dạo bước qua không gian tâm linh số kết nối đạo lý uống nước nhớ nguồn và triết học phương Đông.",
      items: [
        {
          id: "sanctuary",
          title: "Không gian gia tiên & Tưởng niệm",
          description:
            "Thắp nén nhang lòng, dâng trà nước tri ân ông bà tổ tiên và những người thân yêu đã đi xa.",
          label: "Vào không gian gia tiên",
          icon: Landmark,
          image: "/images/ancestor_portrait.jpg",
          badge: "Cội nguồn gia tiên",
          tag: "Lòng hiếu kính · Ký ức",
          onClick: onGoToAncestorAltar,
        },
        {
          id: "astrology",
          title: "Tư liệu biểu tượng ngày sinh",
          description:
            "Tính năng này sẽ mở sau khi phương pháp và nội dung được hoàn thiện.",
          label: "Xem trạng thái tính năng",
          icon: Sparkles,
          image: "/images/hue_trung_bo.jpg",
          badge: "Can chi & Ngũ hành",
          tag: "Lịch âm · Minh triết xưa",
          onClick: onGoToAstrology,
        },
      ],
    },
  ];

  return (
    <div className="screen-shell relative overflow-hidden">
      {/* Vầng sáng nền mang sắc ấm mỹ học truyền thống */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] sm:w-[56rem] h-[28rem] rounded-full bg-gradient-to-b from-accent/10 via-gold/5 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <main className="page-container max-w-6xl relative z-10 py-6 sm:py-10">
        {/* ========================================================= */}
        {/* 1. HEADER KHÁM PHÁ TRẢI NGHIỆM & TRIỆN SON "NGHIỆM" (驗)   */}
        {/* ========================================================= */}
        <header className="mb-10 sm:mb-14 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/8 border border-accent/20 text-accent font-medium text-xs sm:text-sm tracking-wide shadow-xs backdrop-blur-xs mb-4">
            <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>Không gian thực hành số · Điểm tựa tĩnh tại</span>
          </div>

          <h1
            tabIndex={-1}
            className="experience-page-title font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink leading-tight tracking-tight mb-3 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0"
          >
            <span className="experience-seal-badge" title="Dấu triện Nghiệm (Chiêm nghiệm thực hành)">
              驗
            </span>
            <span>Khám phá không gian trải nghiệm</span>
          </h1>

          <p className="text-base sm:text-lg text-muted leading-relaxed">
            Một khoảng dừng an yên, một lời nguyện riêng hay dạo bước qua những
            nghi thức cổ phong. Bạn hoàn toàn tự do lựa chọn
            theo cảm xúc của mình.
          </p>

          {/* Dải phân cách hoa văn cổ phong */}
          <div className="flex items-center gap-3 my-4" aria-hidden="true">
            <div className="h-px w-14 bg-gradient-to-r from-transparent to-accent/40" />
            <div className="w-1.5 h-1.5 rotate-45 bg-accent/70" />
            <div className="h-px w-28 bg-accent/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-accent/70" />
            <div className="h-px w-14 bg-gradient-to-l from-transparent to-accent/40" />
          </div>
        </header>

        {/* ========================================================= */}
        {/* 2. CÁC NHÓM TRẢI NGHIỆM THỰC HÀNH 10/10                  */}
        {/* ========================================================= */}
        <div className="space-y-12 sm:space-y-16">
          {groups.map((group) => (
            <section key={group.id} aria-labelledby={`${group.id}-title`}>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-1.5">
                    <Flower2 className="w-3.5 h-3.5" />
                    <span>Không gian chủ đề</span>
                  </div>
                  <h2
                    id={`${group.id}-title`}
                    className="font-display text-2xl sm:text-3xl font-semibold text-ink tracking-tight"
                  >
                    {group.title}
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-muted max-w-xl">
                  {group.description}
                </p>
              </div>

              <div
                className={[
                  "grid grid-cols-1 sm:grid-cols-2 gap-6",
                  group.items.length === 3 ? "lg:grid-cols-3" : "",
                ].join(" ")}
              >
                {group.items.map((item) => {
                  const Icon = item.icon;

                  return (
                    <article key={item.id} className="experience-card group">
                      <div className="experience-card-golden-rim" />
                      <CornerOrnament className="experience-card-corner experience-card-corner--tl" />
                      <CornerOrnament className="experience-card-corner experience-card-corner--br" />

                      {/* Khung ảnh đại diện chân thực */}
                      <div className="experience-card-image-box">
                        <UnverifiedImage
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          decoding="async"
                          className="experience-card-img"
                        />
                        <span className="experience-card-badge">
                          <Sparkle className="w-3 h-3 text-gold" />
                          <span>{item.badge}</span>
                        </span>
                      </div>

                      {/* Nội dung chi tiết */}
                      <div className="experience-card-body">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="experience-card-icon-wrap">
                              <Icon className="w-5 h-5" />
                            </div>
                            <span className="text-[11px] font-medium text-muted bg-surface-soft px-2.5 py-1 rounded-md border border-line/60">
                              {item.tag}
                            </span>
                          </div>

                          <h3 className="experience-card-title">
                            {item.title}
                          </h3>

                          <p className="experience-card-desc">
                            {item.description}
                          </p>
                        </div>

                        {/* Nút mở trải nghiệm */}
                        <button
                          type="button"
                          onClick={item.onClick}
                          className="experience-card-btn group/btn"
                        >
                          <span>{item.label}</span>
                          <ArrowRight className="w-4 h-4 text-accent transition-transform duration-300 group-hover/btn:translate-x-1" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        {/* ========================================================= */}
        {/* 3. BANNER CẦU NỐI VĂN HÓA (BOTTOM CULTURE BRIDGE)         */}
        {/* ========================================================= */}
        <section
          aria-labelledby="experience-culture-title"
          className="mt-14 sm:mt-20 experience-culture-bridge"
        >
          <div className="experience-bridge-rim" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Kho tàng cội nguồn</span>
              </div>

              <h2
                id="experience-culture-title"
                className="font-display text-2xl sm:text-3xl font-semibold text-ink leading-snug mb-2"
              >
                Muốn hiểu thêm câu chuyện phía sau mỗi nghi thức?
              </h2>

              <p className="text-sm sm:text-base text-muted leading-relaxed">
                Khám phá các bài khảo cứu sống động về phong tục thờ cúng, tín
                ngưỡng dân gian và di sản ba miền Bắc - Trung - Nam trước hoặc
                sau khi trải nghiệm.
              </p>
            </div>

            <button
              type="button"
              onClick={onGoToCulture}
              className="experience-primary-btn group shrink-0"
            >
              <span className="experience-btn-sheen" />
              <span>Đọc bài viết văn hóa</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* Cam kết văn hóa */}
        <p className="mt-8 text-xs sm:text-sm text-center text-muted leading-relaxed">
          Tất cả các không gian thực hành mang tính chất chiêm nghiệm thư thái
          và nuôi dưỡng tâm hồn, không mang tính mê tín dị đoan hay quyết định thay bạn.
        </p>
      </main>
    </div>
  );
};

/** Hoa văn góc cổ phong đồng bộ toàn hệ thống */
const CornerOrnament: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M4 20V8a4 4 0 0 1 4-4h12" />
    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
  </svg>
);
