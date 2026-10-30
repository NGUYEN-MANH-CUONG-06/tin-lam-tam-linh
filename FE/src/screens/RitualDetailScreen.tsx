import { toast } from "../components/ui/Toast";
import { UnverifiedImage } from "../components/UnverifiedImage";
import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Share2,
  Printer,
  Bookmark,
  ShieldCheck,
  Clock,
  Home,
  Sparkles,
  Flower2,
  Info,
  Flame,
  CheckCircle2,
  RotateCcw,
  Landmark,
  Compass,
  Calendar,
  Waves,
  Heart,
  Volume2,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { adaptRemoteRitual, getRitualById, type RitualGuideItem } from "../data/ritualData";
import { reconcileChecklistProgress, updateChecklistProgress } from "../data/ritualChecklistProgress";
import { clearRitualChecklistProgress, getRitualChecklistStorageKey } from "../data/ritualChecklistStorage";
import { ApiError } from "../lib/api";
import { loadRitual } from "../data/contentService";
import { DetailNotFound } from "../components/DetailNotFound";
import {
  setReadingBookmark,
  useReadingBookmark,
} from "../hooks/useReadingBookmarks";
import { RitualPrayerSection } from "../components/RitualPrayerSection";
import { ScrollReveal } from "../components/ScrollReveal";
import { trackProductEvent } from "../data/productAnalytics";

interface RitualDetailScreenProps {
  ritualId?: string;
  currentUserEmail?: string;
  onBackToRitualList: () => void;
  onSelectRelatedRitual: (id: string) => void;
  onGoToExperience?: () => void;
  onGoToRegionalExperience?: (
    kind: "chau-van" | "sea-prayer" | "southern-culture"
  ) => void;
  onGoToAncestorAltar?: () => void;
  onGoToGoodDay?: () => void;
  onGoToZen?: () => void;
}

interface RitualDetailLoaderProps extends RitualDetailScreenProps {
  ritual: RitualGuideItem;
}

type TextSize = "normal" | "medium" | "large";

const RitualDetailContent: React.FC<RitualDetailLoaderProps> = ({
  ritualId = "chuan-bi-ngay-ram",
  ritual,
  currentUserEmail,
  onBackToRitualList,
  onSelectRelatedRitual,
  onGoToExperience,
  onGoToRegionalExperience,
  onGoToAncestorAltar,
  onGoToGoodDay,
  onGoToZen,
}) => {
  const detail = ritual.detail!;

  const accountId = currentUserEmail?.trim().toLowerCase() || "guest";
  const checklistStorageKey = getRitualChecklistStorageKey(ritual.id, currentUserEmail);

  const validChecklistIds = useMemo(
    () => new Set(detail.checklists.map((item) => item.id)),
    [detail.checklists]
  );
  const previousChecklist = useMemo(
    () => getRitualById(ritual.id)?.detail?.checklists || [],
    [ritual.id],
  );

  const readChecklist = (key: string): string[] => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return [];
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed.filter((value): value is string => typeof value === "string");
    } catch {
      return [];
    }
  };

  const [checkedIds, setCheckedIds] = useState<string[]>(() =>
    readChecklist(checklistStorageKey)
  );

  const [readingProgress, setReadingProgress] = useState(0);
  const [textSize, setTextSize] = useState<TextSize>("normal");
  const [copiedLink, setCopiedLink] = useState(false);
  const [ritualSaveError, setRitualSaveError] = useState("");
  const [heroImageError, setHeroImageError] = useState(false);

  useEffect(() => {
    setHeroImageError(false);
  }, [detail.heroImage]);

  const isBookmarked = useReadingBookmark(
    "ritual",
    ritual.id,
    currentUserEmail
  );

  // Reading progress scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(
          100,
          Math.max(0, (window.scrollY / totalHeight) * 100)
        );
        setReadingProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Reload checklist when key changes
  useEffect(() => {
    setCheckedIds(readChecklist(checklistStorageKey));
    setRitualSaveError("");
  }, [checklistStorageKey]);

  const reconciledProgress = reconcileChecklistProgress(checkedIds, previousChecklist, detail.checklists);
  const completedChecklistCount = reconciledProgress.checkedIds.length;

  const isAllChecklistDone =
    detail.checklists.length > 0 &&
    completedChecklistCount === detail.checklists.length;

  const toggleCheck = (id: string) => {
    if (!validChecklistIds.has(id)) return;
    setRitualSaveError("");

    const currentValidIds = reconciledProgress.checkedIds;

    const nextCurrentIds = currentValidIds.includes(id)
      ? currentValidIds.filter((checkedId) => checkedId !== id)
      : [...currentValidIds, id];
    const updatedIds = updateChecklistProgress(checkedIds, nextCurrentIds, previousChecklist, detail.checklists);

    try {
      localStorage.setItem(checklistStorageKey, JSON.stringify(updatedIds));
    } catch {
      setRitualSaveError(
        "Chưa lưu được tiến trình checklist trên thiết bị này. Vui lòng thử lại."
      );
      return;
    }

    setCheckedIds(updatedIds);
    if (nextCurrentIds.length === detail.checklists.length && completedChecklistCount < detail.checklists.length) {
      trackProductEvent("ritual_checklist_completed");
    }
  };

  const handleResetChecklist = () => {
    if (!clearRitualChecklistProgress(checklistStorageKey)) {
      setRitualSaveError("Chưa đặt lại được checklist trên thiết bị này. Tiến độ hiện tại được giữ nguyên.");
      return;
    }
    setCheckedIds([]);
    setRitualSaveError("");
  };

  const handleToggleBookmark = () => {
    setRitualSaveError("");
    const saved = setReadingBookmark(
      "ritual",
      ritual.id,
      !isBookmarked,
      currentUserEmail,
      ritual.title
    );

    if (!saved) {
      setRitualSaveError("Chưa cập nhật được dấu lưu bài. Hãy thử lại.");
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
      }
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.info("Bạn có thể sao chép liên kết từ thanh địa chỉ trình duyệt.", "Chia sẻ");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const textSizeClass = useMemo(() => {
    switch (textSize) {
      case "medium":
        return "text-[18px] sm:text-[19px] leading-[2.0]";
      case "large":
        return "text-[20px] sm:text-[21px] leading-[2.1]";
      default:
        return "text-[16px] sm:text-[17px] leading-[1.85]";
    }
  }, [textSize]);

  // Contextual Bridge: Thẻ hành động chuyển tiếp thông minh theo từng nghi lễ
  const contextBridge = useMemo(() => {
    if (
      ritual.id === "chuan-bi-ngay-ram" ||
      ritual.id === "mung-mot-thanh-tinh" ||
      ritual.id === "tuong-nho-gia-dinh"
    ) {
      return {
        tag: "KHÔNG GIAN TÂM LINH 3D",
        title: "Bước vào Không gian Bàn thờ Gia Tiên 3D & Thắp nén tâm hương",
        desc: "Dâng nén hương mộc thanh tịnh, nghe chuông gió ngân nga và cảm nhận sự an trú thiêng liêng ngay tại màn hình của bạn.",
        actionLabel: "Khám phá Bàn thờ 3D",
        icon: <Sparkles className="w-5 h-5 text-amber-500" />,
        badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        btnStyle: "bg-amber-600 hover:bg-amber-700 text-white",
        action: () => {
          if (onGoToAncestorAltar) onGoToAncestorAltar();
          else if (onGoToExperience) onGoToExperience();
        },
      };
    }

    if (ritual.id === "cung-gio-mien-nam") {
      return {
        tag: "KHÔNG GIAN THỰC TẾ ẢO NAM BỘ",
        title: "Bước vào Không gian 3D Sông nước Nam Bộ & Thả hoa đăng",
        desc: "Lắng nghe điệu đờn ca tài tử bảng lảng trên bến sông, thả hoa đăng trôi theo dòng phù sa và nguyện ước bình an cho tổ tiên.",
        actionLabel: "Khám phá không gian Nam Bộ 3D",
        icon: <Compass className="w-5 h-5 text-emerald-500" />,
        badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        btnStyle: "bg-emerald-600 hover:bg-emerald-700 text-white",
        action: () => {
          if (onGoToRegionalExperience) onGoToRegionalExperience("southern-culture");
          else if (onGoToExperience) onGoToExperience();
        },
      };
    }

    if (ritual.id === "phong-tuc-dau-nam") {
      return {
        tag: "KHÔNG GIAN TẾT CỔ TRUYỀN BẮC BỘ",
        title: "Bước vào Không gian 3D Đình làng & Tết cổ truyền xứ Bắc",
        desc: "Chiêm ngưỡng kiến trúc đình làng Đại Bái mùa lễ hội, tiếng đàn nguyệt réo rắt và bầu không khí hân hoan đón xuân.",
        actionLabel: "Khám phá không gian Bắc Bộ 3D",
        icon: <Landmark className="w-5 h-5 text-amber-600" />,
        badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        btnStyle: "bg-amber-700 hover:bg-amber-800 text-white",
        action: () => {
          if (onGoToRegionalExperience) onGoToRegionalExperience("chau-van");
          else if (onGoToExperience) onGoToExperience();
        },
      };
    }

    if (ritual.id === "chuan-bi-dong-tho" || ritual.id === "ta-on-nha-moi") {
      return {
        tag: "TRA CỨU NGÀY LÀNH & CÁT KHÁNH",
        title: "Tra cứu Ngày lành tháng tốt & Giờ hoàng đạo khởi sự",
        desc: "Xem lịch vạn niên âm dương, trực ngày, sao cát tường và giờ hoàng đạo hợp tuổi gia chủ để tiến hành đại sự vẹn toàn.",
        actionLabel: "Tra cứu Ngày lành",
        icon: <Calendar className="w-5 h-5 text-amber-600" />,
        badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        btnStyle: "bg-amber-600 hover:bg-amber-700 text-white",
        action: () => {
          if (onGoToGoodDay) onGoToGoodDay();
          else if (onGoToExperience) onGoToExperience();
        },
      };
    }

    return {
      tag: "KHOẢNG LẶNG TĨNH TÂM",
      title: "Ghé thăm Góc Thiền định & Lắng đọng tâm tư",
      desc: "Dành vài phút buông bỏ mọi bộn bề, lắng nghe tiếng chuông xoay Tây Tạng và tìm lại sự bình yên nội tại.",
      actionLabel: "Ghé thăm góc tĩnh tâm",
      icon: <Sparkles className="w-5 h-5 text-accent" />,
      badgeStyle: "bg-accent/10 text-accent border-accent/30",
      btnStyle: "bg-accent hover:bg-accent/90 text-white",
      action: () => {
        if (onGoToZen) onGoToZen();
        else if (onGoToExperience) onGoToExperience();
      },
    };
  }, [
    ritual.id,
    onGoToAncestorAltar,
    onGoToRegionalExperience,
    onGoToGoodDay,
    onGoToZen,
    onGoToExperience,
  ]);

  const relatedRituals: RitualGuideItem[] = [];

  return (
    <div className="screen-shell relative">
      {/* Top Gold Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 z-50 transition-all duration-150 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
        style={{ width: `${readingProgress}%` }}
        aria-hidden="true"
      />

      <main className="page-container max-w-6xl pt-4 pb-20">
        {ritualSaveError && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm leading-relaxed text-danger"
          >
            {ritualSaveError}
          </p>
        )}

        {/* Top Breadcrumb & Reading Accessibility Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted mb-6 pb-3 border-b border-line/40">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onBackToRitualList}
              className="hover:text-accent cursor-pointer transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Khám phá</span>
            </button>
            <span className="text-muted/60">›</span>
            <button
              type="button"
              onClick={onBackToRitualList}
              className="hover:text-accent cursor-pointer transition-colors font-medium"
            >
              Cẩm nang nghi lễ
            </button>
            <span className="text-muted/60">›</span>
            <span className="text-accent font-semibold truncate max-w-[240px] sm:max-w-md">
              {ritual.title}
            </span>
          </div>

          {/* Reading Accessibility Toolbar */}
          <div className="flex items-center gap-2">
            {/* Font Size Adjuster */}
            <div className="flex items-center bg-surface border border-line rounded-lg p-0.5 text-xs">
              <button
                type="button"
                title="Cỡ chữ chuẩn"
                onClick={() => setTextSize("normal")}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  textSize === "normal"
                    ? "bg-accent/15 text-accent font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                A
              </button>
              <button
                type="button"
                title="Cỡ chữ vừa"
                onClick={() => setTextSize("medium")}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  textSize === "medium"
                    ? "bg-accent/15 text-accent font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                A+
              </button>
              <button
                type="button"
                title="Cỡ chữ lớn"
                onClick={() => setTextSize("large")}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  textSize === "large"
                    ? "bg-accent/15 text-accent font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                A++
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              title="In hướng dẫn nghi lễ"
              className="p-1.5 rounded-lg border border-line bg-surface hover:border-accent hover:text-accent transition-colors flex items-center gap-1 text-xs text-muted cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In</span>
            </button>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={handleToggleBookmark}
              title={isBookmarked ? "Bỏ đánh dấu" : "Đánh dấu cẩm nang"}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                isBookmarked
                  ? "border-accent bg-accent/10 text-accent font-semibold"
                  : "border-line bg-surface text-muted hover:border-accent hover:text-accent"
              }`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`}
              />
              <span className="hidden sm:inline">
                {isBookmarked ? "Đã lưu" : "Lưu"}
              </span>
            </button>

            {/* Share / Copy Link */}
            <button
              type="button"
              onClick={handleShare}
              title="Sao chép liên kết chia sẻ"
              className="p-1.5 rounded-lg border border-line bg-surface hover:border-accent hover:text-accent transition-colors flex items-center gap-1 text-xs text-muted cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Đã chép</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chia sẻ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hero Title & Sub-badge Section */}
        <div className="mb-6">
          <Badge
            variant="outline"
            className="mb-3 px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
          >
            ✦ NẾP SỐNG GIA ĐÌNH & ĐẠO HIẾU VIỆT NAM
          </Badge>

          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-ink mb-3 leading-snug">
            {detail.fullTitle}
          </h1>

          {detail.heroImage && !heroImageError && (
            <ScrollReveal variant="scale" className="mb-6">
              <figure className="rounded-3xl overflow-hidden border border-amber-500/30 bg-surface shadow-md">
                <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full overflow-hidden bg-surface">
                  <UnverifiedImage
                    src={detail.heroImage}
                    alt={detail.heroCaption || detail.fullTitle}
                    allowExpand={true}
                    title={detail.fullTitle}
                    description={detail.heroCaption}
                    approvedByContent={detail.heroImageApproved === true}
                    onLoadError={() => setHeroImageError(true)}
                    className="w-full h-full object-cover object-[center_30%]"
                  />
                </div>
                <figcaption className="p-3 bg-surface border-t border-line/60 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                  <span>{detail.heroCaption}</span>
                </figcaption>
              </figure>
            </ScrollReveal>
          )}

          <p className="text-base sm:text-lg text-ink/80 leading-relaxed max-w-3xl mb-5 font-serif">
            {detail.subtitle}
          </p>

          {/* 4 Metadata Pills */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-surface border border-line text-ink font-medium flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-accent" />
              <span>{detail.steps.length ? `${detail.steps.length} bước` : "Chưa có bước hướng dẫn"}</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-surface border border-line text-ink font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              {ritual.timeEstimate && <span>{ritual.timeEstimate}</span>}
            </span>
            <span className="px-3 py-1.5 rounded-full bg-surface border border-line text-ink font-medium flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-accent" />
              <span>{ritual.region}</span>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Điểm an yên: Lắng đọng thân tâm</span>
            </span>
          </div>
        </div>

        {/* Two Columns Layout: Main Guide (8 cols) & Sticky Checklist (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
          {/* Main Left Content */}
          <div className="order-2 lg:order-1 lg:col-span-8 space-y-10">
            {/* Section 01: Ý nghĩa nếp nhà & Điểm tựa đức tin */}
            <ScrollReveal variant="up" as="section" className="space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-line/50">
                <span className="w-2 h-5 rounded-full bg-amber-600"></span>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                  {detail.meaningTitle}
                </h2>
              </div>

              <div className={`space-y-4 text-ink ${textSizeClass}`}>
                {detail.meaningParagraphs.length === 0 && (
                  <p className="text-sm text-muted" role="status">Chưa có nội dung ý nghĩa do BE cung cấp cho hướng dẫn này.</p>
                )}
                {detail.meaningParagraphs.map((paragraph, index) => {
                  if (index === 0) {
                    const firstChar = paragraph.charAt(0);
                    const rest = paragraph.slice(1);
                    return (
                      <p key={index} className="text-justify">
                        <span className="float-left text-4xl sm:text-5xl font-serif font-bold text-accent mr-3 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-2xl shadow-xs leading-none">
                          {firstChar}
                        </span>
                        {rest}
                      </p>
                    );
                  }
                  return (
                    <p key={index} className="text-justify leading-relaxed">
                      {paragraph}
                    </p>
                  );
                })}
              </div>

              {/* Callout Quote Ca Dao nếp nhà */}
              {detail.meaningQuote && (
                <div className="my-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent border-l-4 border-amber-600 shadow-xs relative">
                  <Flower2 className="w-6 h-6 text-amber-600/40 absolute top-4 right-4 pointer-events-none" />
                  <blockquote className="font-serif italic font-semibold text-base sm:text-lg text-amber-900 dark:text-amber-200 leading-relaxed pr-6">
                    “{detail.meaningQuote}”
                  </blockquote>
                </div>
              )}
            </ScrollReveal>

            {/* Section 02: Lễ vật thanh khiết & Bày biện */}
            <ScrollReveal variant="up" as="section" className="space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-line/50">
                <span className="w-2 h-5 rounded-full bg-amber-600"></span>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                  {detail.offeringsTitle || "Lễ vật thanh tịnh & Cách chuẩn bị"}
                </h2>
              </div>

              {/* Lời khuyên hiền triết */}
              {detail.offeringAdvice && <div className="p-4 rounded-2xl bg-amber-500/[0.05] border border-amber-500/25 flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-sm text-ink leading-relaxed">
                  {detail.offeringAdvice}
                </p>
              </div>}

              {/* Offerings Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                {detail.offerings.map((offering) => (
                  <div
                    key={offering.id}
                    className="p-4 rounded-2xl bg-surface border border-line/80 hover:border-amber-500/40 hover:shadow-sm transition-all flex items-start gap-3.5"
                  >
                    <div className="w-7 h-7 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5 border border-amber-500/20">
                      <Check className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <strong className="text-sm sm:text-base text-ink font-bold">
                          {offering.name}
                        </strong>
                        {offering.subname && (
                          <span className="text-xs text-muted italic">
                            {offering.subname}
                          </span>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
                        {offering.desc}
                      </p>
                    </div>
                  </div>
                ))}
                {detail.offerings.length === 0 && <p className="text-sm text-muted" role="status">Chưa có dữ liệu lễ vật do BE cung cấp.</p>}
              </div>
            </ScrollReveal>

            {/* Section 03: Diễn trình các bước thực hành gợi ý */}
            <ScrollReveal variant="up" as="section" className="space-y-5">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-line/50">
                <span className="w-2 h-5 rounded-full bg-amber-600"></span>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                  Diễn trình các bước thực hành gợi ý
                </h2>
              </div>

              <div className="space-y-4">
                {detail.steps.map((st, idx) => (
                  <div
                    key={st.stepNumber}
                    className="p-5 rounded-2xl bg-surface border border-line/80 hover:border-amber-500/30 transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-700 text-white font-bold font-serif text-sm flex items-center justify-center shrink-0 shadow-xs">
                        {idx + 1}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-base sm:text-lg text-ink mb-1.5">
                          {st.title}
                        </h3>
                        <p className={`text-ink/85 leading-relaxed ${textSizeClass}`}>
                          {st.desc}
                        </p>
                      </div>
                    </div>
                    <span className="font-serif font-bold text-2xl sm:text-3xl text-amber-500/20 select-none self-end sm:self-start">
                      {st.stepNumber}
                    </span>
                  </div>
                ))}
                {detail.steps.length === 0 && <p className="text-sm text-muted" role="status">Chưa có bước hướng dẫn do BE cung cấp.</p>}
              </div>
            </ScrollReveal>

            {/* Section 04: Sắc thái văn hóa 3 miền */}
            <ScrollReveal variant="up" as="section" className="space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-line/50">
                <span className="w-2 h-5 rounded-full bg-amber-600"></span>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                  Sắc thái nếp nhà 3 miền (Bắc - Trung - Nam)
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {detail.regionalDetails.map((item) => (
                  <div
                    key={item.region}
                    className="p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.03] to-surface flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base">
                          {item.region.includes("Bắc")
                            ? "⛩️"
                            : item.region.includes("Trung")
                            ? "🌊"
                            : "🚣"}
                        </span>
                        <h3 className="font-display font-bold text-sm sm:text-base text-amber-900 dark:text-amber-200">
                          {item.region}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-ink leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>

            {/* Section 05: An toàn PCCC & Khói lửa nếp nhà */}
            <ScrollReveal variant="up" as="section" className="p-5 sm:p-6 rounded-3xl bg-surface border border-rose-500/30 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                <Flame className="w-5 h-5 text-rose-600 animate-pulse" />
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Nguyên tắc vàng an toàn PCCC tại chung cư & nhà phố</span>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-ink pl-5 list-disc leading-relaxed">
                {detail.fireSafetyRules.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs leading-relaxed text-muted pt-2 border-t border-line/50">
                Tuân thủ quy định PCCC và giữ thiết bị báo khói hoạt động bình thường.
                Thắp tâm hương an lành, phòng ngừa rủi ro cháy nổ cho tổ ấm.
              </p>
            </ScrollReveal>

            {/* Section 06: Văn khấn Nôm tham khảo */}
            <ScrollReveal variant="up">
              <RitualPrayerSection
                key={`${accountId}-${ritual.id}`}
                prayers={detail.prayers}
              />
            </ScrollReveal>

            {/* Section 07: Thẻ triết lý đúc kết */}
            {detail.closingQuote && (
              <ScrollReveal variant="scale">
                <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent border border-amber-500/30 text-center">
                  <p className="font-serif italic font-bold text-base sm:text-lg text-amber-900 dark:text-amber-200">
                    “{detail.closingQuote}”
                  </p>
                </div>
              </ScrollReveal>
            )}

            {/* Section 08: Contextual Bridge Card */}
            <ScrollReveal variant="scale">
              <div className="p-6 sm:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-surface to-surface shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <Badge
                      variant="outline"
                      className={`text-xs px-3 py-0.5 font-bold uppercase ${contextBridge.badgeStyle}`}
                    >
                      {contextBridge.tag}
                    </Badge>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-ink">
                      {contextBridge.title}
                    </h3>
                    <p className="text-sm text-muted max-w-xl leading-relaxed">
                      {contextBridge.desc}
                    </p>
                  </div>
                  <Button
                    onClick={contextBridge.action}
                    className={`shrink-0 font-semibold cursor-pointer shadow-sm min-h-11 px-5 ${contextBridge.btnStyle}`}
                  >
                    <span className="flex items-center gap-2">
                      {contextBridge.icon}
                      <span>{contextBridge.actionLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                </div>
              </div>
            </ScrollReveal>

          </div>

          {/* Right Sticky Sidebar: Checklist & Safety */}
          <div className="order-1 lg:order-2 lg:col-span-4">
            <div className="lg:sticky lg:top-24 space-y-6">
              <ScrollReveal variant="fade" delay={100}>
                {/* Interactive Checklist Card */}
                <Card className="p-6 rounded-3xl bg-surface border-amber-500/30 shadow-sm relative overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-display font-bold text-lg text-ink flex items-center gap-2">
                    <span>Sổ tay chuẩn bị</span>
                  </div>
                  <Badge
                    variant="outline"
                    className="text-xs text-amber-800 dark:text-amber-300 border-amber-500/30 bg-amber-500/10 font-bold"
                  >
                    Tự do
                  </Badge>
                </div>

                <p className="text-xs text-muted leading-relaxed mb-4">
                  Đánh dấu từng việc để theo dõi tiến độ chuẩn bị.
                </p>

                {detail.checklists.length === 0 ? (
                  <p className="text-sm text-muted" role="status">
                    Hướng dẫn này chưa có checklist được lưu. Vui lòng quay lại sau khi nội dung được cập nhật.
                  </p>
                ) : (
                <>

                {reconciledProgress.unmatchedIds.length > 0 && <p className="mb-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200" role="status">
                  Có {reconciledProgress.unmatchedIds.length} mục tiến độ cũ không thể đối chiếu chắc chắn với checklist hiện tại. Tiến độ cũ vẫn được giữ trên thiết bị nhưng không tính vào tổng hoàn thành; hãy xem lại hoặc đặt lại danh sách nếu muốn xóa.
                </p>}

                {/* Progress Bar */}
                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between text-xs font-semibold text-ink">
                    <span>Tiến độ thực hiện:</span>
                    <span className="tabular-nums text-amber-600 font-bold">
                      {completedChecklistCount} / {detail.checklists.length} việc (
                      {Math.round(
                        (completedChecklistCount /
                          Math.max(1, detail.checklists.length)) *
                          100
                      )}
                      %)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-line/60 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-600 to-yellow-500 transition-all duration-300 rounded-full"
                      style={{
                        width: `${
                          (completedChecklistCount /
                            Math.max(1, detail.checklists.length)) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Completion Congratulation Banner */}
                {isAllChecklistDone && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      ✦ Tâm thành viên mãn! Bạn đã chuẩn bị chu toàn cho buổi lễ an lành.
                    </span>
                  </div>
                )}

                {/* Checkboxes List */}
                <div className="space-y-2.5 mb-5 max-h-[380px] overflow-y-auto pr-1">
                  {detail.checklists.map((chk) => {
                    const isDone = reconciledProgress.checkedIds.includes(chk.id);
                    return (
                      <label
                        key={chk.id}
                        className={`flex min-h-11 items-start gap-3 rounded-2xl border p-3 cursor-pointer text-xs sm:text-sm transition-all select-none ${
                          isDone
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200"
                            : "bg-surface border-line/70 hover:border-accent/40 text-ink"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isDone}
                          onChange={() => toggleCheck(chk.id)}
                          className="mt-0.5 h-4 w-4 shrink-0 rounded accent-amber-600 cursor-pointer"
                        />
                        <span
                          className={`leading-relaxed ${
                            isDone ? "line-through opacity-80" : ""
                          }`}
                        >
                          {chk.label}
                        </span>
                      </label>
                    );
                  })}
                </div>

                {/* Reset Checklist Button */}
                {checkedIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetChecklist}
                    className="w-full py-2 text-xs font-semibold text-muted hover:text-ink flex items-center justify-center gap-1.5 transition-colors cursor-pointer border-t border-line/40 pt-3"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Đặt lại danh sách từ đầu</span>
                  </button>
                )}
                </>
                )}
              </Card>

              {/* Serene Tips Box */}
              <div className="p-5 rounded-3xl bg-amber-500/[0.04] border border-amber-500/25 space-y-2 text-xs text-muted">
                <div className="font-display font-bold text-amber-900 dark:text-amber-200 text-sm flex items-center gap-1.5">
                  <Heart className="w-4 h-4 text-amber-600" />
                  <span>Lời dặn dò nếp nhà</span>
                </div>
                <p className="leading-relaxed">
                  Lễ cúng không cốt ở mâm cao cỗ đầy hay vàng mã xa hoa. Điều quý nhất là tấc lòng hiếu kính, sự sum họp hòa thuận và khoảng an trú trong lành của cả gia đình.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>

      {/* Section: Cẩm nang nghi lễ liên quan */}
      <ScrollReveal variant="up" className="pt-10 border-t border-line/60 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
              Cẩm nang nghi lễ liên quan dành cho bạn
            </h2>
            <button
              onClick={onBackToRitualList}
              className="text-xs text-accent font-semibold hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Xem tất cả cẩm nang</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedRituals.map((item) => (
              <Card
                key={item.id}
                onClick={() => onSelectRelatedRitual(item.id)}
                className="rounded-3xl overflow-hidden bg-surface border-line hover:border-amber-500/40 transition-all hover:shadow-md cursor-pointer flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-surface">
                    <UnverifiedImage
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-black/60 text-white backdrop-blur-xs">
                        {item.occasion}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="font-display font-bold text-base text-ink leading-snug mb-2 group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 text-xs font-semibold text-accent flex items-center justify-end gap-1">
                  <span>Xem hướng dẫn</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Card>
            ))}
          </div>
        </ScrollReveal>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-line/50">
          <div className="text-xs uppercase tracking-widest text-muted font-medium">
            © {new Date().getFullYear()} Tin Lắm Tâm Linh • Chiêm nghiệm dân gian đương đại
          </div>
        </div>
      </main>
    </div>
  );
};

export const RitualDetailScreen: React.FC<
  RitualDetailScreenProps
> = (props) => {
  const ritualId =
    props.ritualId ?? "chuan-bi-ngay-ram";

  const [ritual, setRitual] =
    useState<RitualGuideItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setError(null);
    setNotFound(false);
    setRitual(null);

    void loadRitual(ritualId)
      .then((remote) => {
        if (!active) return;

        setRitual(adaptRemoteRitual(remote));
      })
      .catch((cause: unknown) => {
        if (!active) return;

        const unavailable =
          cause instanceof ApiError &&
          cause.status === 404;

        setNotFound(unavailable);

        setError(
          unavailable
            ? "Hướng dẫn này không còn được phát hành hoặc đường dẫn không tồn tại."
            : "Chưa tải được hướng dẫn. Bạn hãy kiểm tra kết nối rồi thử lại.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [ritualId, loadAttempt]);

  if (loading) {
    return (
      <div className="screen-shell">
        <main className="page-container">
          <p
            role="status"
            className="py-16 text-center text-muted"
          >
            Đang tải hướng dẫn nghi lễ…
          </p>
        </main>
      </div>
    );
  }

  if (notFound) {
    return (
      <DetailNotFound
        title={error || "Không tìm thấy hướng dẫn"}
        backLabel="Về Cẩm nang nghi lễ"
        onBack={props.onBackToRitualList}
      />
    );
  }

  if (error || !ritual) {
    return (
      <div className="screen-shell">
        <main className="page-container max-w-3xl">
          <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <h1 className="page-title mb-3">
              Chưa tải được hướng dẫn
            </h1>

            <p
              role="alert"
              className="text-sm leading-relaxed text-muted"
            >
              {error || "Đã xảy ra lỗi khi tải dữ liệu."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  setLoadAttempt((value) => value + 1);
                }}
              >
                Tải lại
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={props.onBackToRitualList}
              >
                Về danh sách hướng dẫn
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  if (!ritual.detail) {
    return (
      <DetailNotFound
        title="Hướng dẫn này chưa có nội dung chi tiết"
        backLabel="Về Cẩm nang nghi lễ"
        onBack={props.onBackToRitualList}
      />
    );
  }

  return (
    <RitualDetailContent
      {...props}
      ritualId={ritualId}
      ritual={ritual}
      key={`${ritualId}-${ritual.id}-${props.currentUserEmail || "guest"}`}
    />
  );
};
