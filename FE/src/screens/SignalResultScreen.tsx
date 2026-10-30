import React, { useEffect, useState } from "react";
import { UnverifiedImage } from "../components/UnverifiedImage";
import {
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  Clock3,
  Compass,
  Flower2,
  Heart,
  RotateCw,
  Share2,
  Sparkles,
  BookOpen,
  Sparkle,
} from "lucide-react";

import {
  MOOD_CONTEXTS,
  getSignalsByMood,
  type MoodContextKey,
  type MoodKey,
  type SignalData,
} from "../data/demoSignals";

import type { CultureArticle } from "../data/cultureData";
import { loadCultureArticles } from "../data/contentService";
import { toCultureArticle } from "../data/cultureAdapter";
import { Button } from "@/src/components/ui/button";
import { loadSignals } from "../data/moodSignalService";
import { trackProductEvent } from "../data/productAnalytics";
import "../styles/SignalResultScreen.css";

interface SignalResultScreenProps {
  journalText?: string;
  requestNotice?: string;
  isLoggedIn?: boolean;
  mood?: MoodKey;
  signal: SignalData;
  isActionDone: boolean;
  onToggleAction: (completed: boolean) => void;
  onGoToCompletion?: () => void;
  isSaved?: boolean;
  onSaveToAccount: () => void;
  onRefreshSignal: () => void;
  onGoToDiary: () => void;
  onChangeContext: (contextKey: MoodContextKey) => void;
  onOpenCultureArticle: (articleId: string) => void;
}

// Icon tương ứng từng hoàn cảnh
const CONTEXT_ICONS: Record<MoodContextKey, string> = {
  general: "🌱",
  study: "📖",
  work: "💼",
  family: "🏡",
  relationship: "💖",
};

const formatRegion = (region?: string): string => {
  if (!region || region.includes("Không gán")) return "";
  if (region === "Hướng dẫn toàn cầu" || region === "Toàn cầu") return "Chiêm nghiệm chung";
  return region;
};

export const SignalResultScreen: React.FC<SignalResultScreenProps> = ({
  journalText = "",
  requestNotice,
  isLoggedIn = false,
  signal,
  isActionDone,
  onToggleAction,
  onGoToCompletion,
  isSaved = false,
  onSaveToAccount,
  onRefreshSignal,
  onGoToDiary,
  onChangeContext,
  onOpenCultureArticle,
}) => {
  const [copyState, setCopyState] = useState<
    "idle" | "copying" | "success" | "error"
  >("idle");

  useEffect(() => {
    setCopyState("idle");
  }, [signal.id]);

  const shareUrl = new URL("/result", window.location.origin);
  shareUrl.searchParams.set("signalId", signal.id);

  const handleCopyLink = async () => {
    setCopyState("copying");
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error("Clipboard unavailable");
      }
      await navigator.clipboard.writeText(shareUrl.toString());
      trackProductEvent("share_link_copied");
      setCopyState("success");
      setTimeout(() => setCopyState("idle"), 3000);
    } catch {
      setCopyState("error");
    }
  };

  const quotationLabel = "Lời chiêm nghiệm";

  const contextKey = signal.contextKey ?? "general";

  const contextLabel =
    MOOD_CONTEXTS.find((context) => context.key === contextKey)?.label ??
    "Tổng quan";

  const [availableCount, setAvailableCount] = useState<number | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    let active = true;
    loadSignals(signal.mood, contextKey)
      .then((res) => {
        if (active && Array.isArray(res?.items)) {
          setAvailableCount(res.items.length);
        }
      })
      .catch(() => {
        if (active) {
          const fallbackCount = getSignalsByMood(signal.mood).filter(
            (item) => (item.contextKey ?? "general") === contextKey
          ).length;
          setAvailableCount(fallbackCount);
        }
      });
    return () => {
      active = false;
    };
  }, [signal.mood, contextKey]);

  const fallbackCount = getSignalsByMood(signal.mood).filter(
    (item) => (item.contextKey ?? "general") === contextKey
  ).length;

  const canRefresh = availableCount !== null ? availableCount > 1 : fallbackCount > 1;

  const handleRefreshClick = async () => {
    if (!canRefresh || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.resolve(onRefreshSignal());
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  const suggestedReading: Record<
    MoodContextKey,
    {
      articleId: string;
      reason: string;
    }
  > = {
    general: {
      articleId: "dinh-lang-bac-bo",
      reason: "Một hướng tìm hiểu không gian sinh hoạt và ký ức cộng đồng.",
    },
    study: {
      articleId: "bai-choi-hoi-an",
      reason: "Tìm hiểu cách nghệ thuật dân gian được truyền dạy và tiếp nối.",
    },
    work: {
      articleId: "le-hoi-cau-ngu",
      reason:
        "Khám phá tín ngưỡng gắn với đời sống và nghề nghiệp của cộng đồng ven biển.",
    },
    family: {
      articleId: "dinh-lang-bac-bo",
      reason: "Tìm hiểu ký ức cộng đồng và sự kết nối giữa các thế hệ.",
    },
    relationship: {
      articleId: "tien-dung-chu-dong-tu",
      reason:
        "Tìm hiểu một câu chuyện văn hóa có liên hệ với chủ đề bạn đang suy ngẫm.",
    },
  };

  const readingSuggestion = suggestedReading[contextKey];
  const [suggestedArticle, setSuggestedArticle] = useState<CultureArticle>();

  useEffect(() => {
    let active = true;
    void loadCultureArticles().then((items) => {
      const approved = items.find((item) => item.id === readingSuggestion.articleId && item.verified === true);
      if (active) setSuggestedArticle(approved ? toCultureArticle(approved) : undefined);
    }).catch(() => {
      if (active) setSuggestedArticle(undefined);
    });
    return () => { active = false; };
  }, [readingSuggestion.articleId]);

  return (
    <div className="screen-shell relative overflow-x-clip">
      {/* Vầng sáng nền cổ phong ấm áp */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[42rem] sm:w-[54rem] h-[26rem] rounded-full bg-gradient-to-b from-accent/10 via-gold/5 to-transparent blur-3xl"
        aria-hidden="true"
      />

      <main className="page-container max-w-5xl relative z-10 py-6 sm:py-10">
        {/* ========================================================= */}
        {/* 1. HEADER KHỞI TÂM & TRIỆN SON "KHẢI" (啓)                */}
        {/* ========================================================= */}
        <header className="mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/8 border border-accent/20 text-accent font-medium text-xs sm:text-sm tracking-wide shadow-xs backdrop-blur-xs mb-4">
            <Sparkles className="w-4 h-4 text-accent" aria-hidden="true" />
            <span>Lời chiêm nghiệm hôm nay · Khơi nguồn an yên</span>
          </div>

          <h1
            tabIndex={-1}
            className="signal-page-title font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink leading-tight tracking-tight mb-3 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0"
          >
            <span className="signal-seal-badge" title="Dấu triện Khải (Khai sáng tâm trí)">
              啓
            </span>
            <span>Một lời gợi mở dành cho bạn</span>
          </h1>

          <p className="text-base sm:text-lg text-muted leading-relaxed max-w-2xl">
            Khi tâm trạng đang{" "}
            <span className="font-semibold text-accent underline decoration-accent/40 underline-offset-4">
              {signal.mood.toLowerCase()}
            </span>
            , hãy đọc chậm rãi, thở êm và giữ lại điều chạm tới lòng mình.
          </p>

          {/* Dải phân cách hoa văn thanh mảnh */}
          <div className="flex items-center gap-3 my-4" aria-hidden="true">
            <div className="h-px w-14 bg-gradient-to-r from-transparent to-accent/40" />
            <div className="w-1.5 h-1.5 rotate-45 bg-accent/70" />
            <div className="h-px w-28 bg-accent/30" />
            <div className="w-1.5 h-1.5 rotate-45 bg-accent/70" />
            <div className="h-px w-14 bg-gradient-to-l from-transparent to-accent/40" />
          </div>
        </header>

        {requestNotice && (
          <div role="status" aria-live="polite" className="mb-6 rounded-panel border border-line bg-canvas p-4 text-sm leading-relaxed text-muted">
            {requestNotice}
          </div>
        )}

        {/* ========================================================= */}
        {/* 2. DẢI LỤA CHỌN HOÀN CẢNH (CONTEXT PILLS 10/10)           */}
        {/* ========================================================= */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent">
              <Compass className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Gắn với hoàn cảnh của bạn</span>
            </div>
            <span className="text-xs text-muted/80">Chọn hoàn cảnh để đón nhận lời khuyên tương ứng</span>
          </div>

          <div className="signal-context-bar" role="tablist" aria-label="Chọn hoàn cảnh">
            {MOOD_CONTEXTS.map((context) => {
              const isSelected = contextKey === context.key;
              return (
                <button
                  key={context.key}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => onChangeContext(context.key)}
                  className={`signal-context-pill ${
                    isSelected ? "signal-context-pill--active" : ""
                  }`}
                >
                  <span aria-hidden="true">{CONTEXT_ICONS[context.key]}</span>
                  <span>{context.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. KHỐI NHẬT KÝ ĐÃ GHI CHÉP (NẾU CÓ)                      */}
        {/* ========================================================= */}
        {journalText.trim() && (
          <details className="group mb-8 signal-journal-box">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-ink focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-accent" />
                <span>Ghi chép tâm sự của bạn trong lượt này</span>
              </div>
              <ChevronDown
                aria-hidden="true"
                className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="px-5 pb-5 pt-1 border-t border-line/50">
              <p className="whitespace-pre-wrap text-sm sm:text-base text-ink leading-relaxed italic border-l-2 border-accent/40 pl-4 my-2">
                “{journalText}”
              </p>
              <p className="mt-3 text-xs text-muted leading-relaxed">
                Lời chiêm nghiệm được chọn theo tâm trạng để bạn tự soi chiếu.
                {isLoggedIn
                  ? "Đoạn này đã được gửi cùng check-in tới máy chủ và không nằm trong liên kết chia sẻ."
                  : "Đoạn này không nằm trong liên kết chia sẻ. Nếu lưu kết quả sau khi đăng nhập, nội dung sẽ được gửi cùng bản lưu."}
              </p>
            </div>
          </details>
        )}

        {/* ========================================================= */}
        {/* 4. CỤM TRUNG TÂM: BỨC TRƯỚNG THƯ PHÁP & PHIẾN NGỌC HÀNH ĐỘNG */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
          {/* CỘT TRÁI (7 cols): LỜI GỢI MỞ & TRANH MINH HỌA */}
          <section
            aria-labelledby="reflection-scroll-title"
            className="lg:col-span-7 signal-scroll-card group"
          >
            <div className="signal-scroll-golden-rim" />
            <CornerOrnament className="signal-scroll-corner signal-scroll-corner--tl" />
            <CornerOrnament className="signal-scroll-corner signal-scroll-corner--br" />

            <div>
              {/* Header bức trướng: Badge triện & Kiểm định */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent bg-accent/8 px-3 py-1 rounded-full border border-accent/15">
                  <Flower2 className="w-3.5 h-3.5" />
                  <span>{signal.badge || "Chiêm nghiệm tâm an"}</span>
                </span>
              </div>

              {/* Hai câu biên soạn minh họa; không trình bày như trích dẫn dân gian */}
              <blockquote className="signal-poem-quote">
                <p className="m-0">{signal.poem.line1}</p>
                <p className="m-0 mt-1">{signal.poem.line2}</p>
              </blockquote>

              {/* Lời diễn giải chiêm nghiệm */}
              {signal.poem.subtext && (
                <p className="text-sm text-muted leading-relaxed mt-2 mb-5">
                  {signal.poem.subtext.includes("thử nghiệm") || signal.poem.subtext.includes("không phải nguyên văn")
                    ? "Lời gợi mở chiêm nghiệm đương đại · Đồng hành cùng tâm an."
                    : signal.poem.subtext}
                </p>
              )}

              {/* Khung tranh di sản nghệ thuật (Artwork) - Chú thích tách biệt nằm dưới ảnh, KHÔNG ĐÈ LÊN ẢNH */}
              {signal.artwork?.image && (
                <figure className="signal-artwork-frame my-5">
                  <div className="signal-artwork-img-box">
                    <UnverifiedImage
                      src={signal.artwork.image}
                      alt={signal.artwork.caption || "Minh họa di sản văn hóa"}
                      title={signal.artwork.caption}
                      description={signal.research?.region}
                      allowExpand={true}
                      loading="lazy"
                      decoding="async"
                      className="signal-artwork-img cursor-pointer"
                    />
                  </div>
                  <figcaption className="signal-artwork-caption">
                    <span className="flex items-center gap-1.5">
                      <Sparkle className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>{signal.artwork.caption}</span>
                    </span>
                    {formatRegion(signal.research?.region) && (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent shrink-0">
                        {formatRegion(signal.research?.region)}
                      </span>
                    )}
                  </figcaption>
                </figure>
              )}

              {/* Lời khuyên ấm áp & chiêm nghiệm thực tế */}
              <div className="signal-advice-box">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                  <Sparkle className="w-3.5 h-3.5" />
                  <span>Lời gửi gắm cho ngày hôm nay</span>
                </div>
                <p className="text-sm sm:text-base text-ink leading-relaxed m-0">
                  {signal.reflection.advice}
                </p>
              </div>

              {signal.aiExplanation && (
                <div className="mt-4 rounded-control border border-accent/20 bg-accent/5 p-4">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Gợi ý AI, tách riêng với nội dung gốc</span>
                  </div>
                  <p className="text-sm sm:text-base text-ink leading-relaxed m-0">
                    {signal.aiExplanation.reflection}
                  </p>
                  <p className="mt-3 text-sm text-muted leading-relaxed">
                    {signal.aiExplanation.action.title}: {signal.aiExplanation.action.description}
                  </p>
                </div>
              )}
            </div>

            {/* Các nút hành động bức trướng */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-7 pt-5 border-t border-line/60">
              <div>
                {canRefresh ? (
                  <button
                    type="button"
                    disabled={isRefreshing}
                    onClick={handleRefreshClick}
                    className="signal-secondary-btn group"
                    title="Đổi một lời gợi mở khác cho tâm trạng này"
                  >
                    <RotateCw
                      className={`w-4 h-4 text-accent transition-transform duration-500 ${
                        isRefreshing ? "animate-spin" : "group-hover:rotate-180"
                      }`}
                    />
                    <span>
                      {isRefreshing
                        ? "Đang đổi gợi mở..."
                        : "Đổi lời gợi mở khác"}
                    </span>
                  </button>
                ) : (
                  <div
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-muted bg-surface-soft/80 border border-line/60 rounded-full select-none"
                    title="Lời gợi mở hiện tại là lời đúc kết phù hợp nhất cho lựa chọn này"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-accent/70 shrink-0" />
                    <span>Đã hiển thị gợi mở phù hợp nhất</span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCopyLink}
                disabled={copyState === "copying"}
                className="signal-secondary-btn"
                title="Sao chép liên kết để lưu lại hoặc gửi bạn bè"
              >
                {copyState === "success" ? (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-success">Đã sao chép liên kết</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-4 h-4 text-accent" />
                    <span>
                      {copyState === "copying"
                        ? "Đang sao chép..."
                        : "Sao chép liên kết"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* CỘT PHẢI (5 cols): PHIẾN NGỌC GIEO DUYÊN (HÀNH ĐỘNG NHỎ) */}
          <section
            aria-labelledby="action-card-title"
            className="lg:col-span-5 signal-action-card"
          >
            <div className="signal-action-rim" />

            <div>
              {/* Header thẻ việc nhỏ */}
              <div className="flex items-center justify-between gap-2 mb-4">
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-success">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Một việc nhỏ an yên</span>
                </div>

                <span className="inline-flex items-center gap-1 text-xs font-medium text-muted bg-surface-soft px-2.5 py-1 rounded-full border border-line/60">
                  <Clock3 className="w-3.5 h-3.5 text-accent" />
                  <span>{signal.action.duration}</span>
                </span>
              </div>

              <h2
                id="action-card-title"
                className="font-display font-semibold text-xl sm:text-2xl text-ink leading-snug mb-3"
              >
                {signal.action.title}
              </h2>

              <p className="text-sm sm:text-base text-muted leading-relaxed mb-6">
                {signal.action.description}
              </p>

              {/* Nút hành động "Tôi đã thực hiện" */}
              <button
                type="button"
                onClick={() => onToggleAction(!isActionDone)}
                aria-pressed={isActionDone}
                className={`signal-action-btn ${
                  isActionDone ? "signal-action-btn--done" : ""
                }`}
              >
                <span className="signal-action-sheen" />
                {isActionDone ? (
                  <Check className="w-4 h-4 shrink-0 text-emerald-100" strokeWidth={2.5} />
                ) : (
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-200" />
                )}
                <span>
                  {isActionDone ? "Đã thực hiện xong ✓" : "Tôi đã thực hiện"}
                </span>
              </button>

              {isActionDone && (
                <p className="mt-2.5 text-xs text-center text-emerald-700 dark:text-emerald-400 font-medium">
                  Tâm an thì vạn sự an. Bạn có thể bấm lần nữa để bỏ đánh dấu.
                </p>
              )}

              {/* Nút "Hoàn tất lượt chiêm nghiệm" */}
              {isActionDone && onGoToCompletion && (
                <Button
                  type="button"
                  onClick={onGoToCompletion}
                  className="w-full mt-3 h-11 text-sm font-semibold"
                >
                  <span>Hoàn tất lượt chiêm nghiệm</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Khối lưu vào Góc của tôi */}
            <div className="mt-6 pt-5 border-t border-line/60">
              <button
                type="button"
                onClick={isSaved ? onGoToDiary : onSaveToAccount}
                className={`signal-save-btn ${
                  isSaved ? "signal-save-btn--saved" : ""
                }`}
              >
                <Bookmark
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isSaved ? "fill-accent text-accent scale-110" : "text-accent"
                  }`}
                />
                <span>
                  {isSaved
                    ? "Đã lưu — Xem trong Góc của tôi"
                    : "Lưu vào Góc của tôi"}
                </span>
              </button>

              <p className="mt-2.5 text-xs text-center text-muted leading-relaxed">
                Bạn có thể lưu giữ lời chiêm nghiệm này vào sổ tay bất cứ lúc nào.
              </p>
              <p className="mt-2 text-[11.5px] text-center text-muted/75 italic">
                “Vạn dặm đường xa, khởi từ bước chân vững vàng.”
              </p>
            </div>
          </section>
        </div>

        {/* ========================================================= */}
        {/* 5. ĐỌC THÊM & NGUỒN KHẢO CỨU (RESEARCH DETAILS)          */}
        {/* ========================================================= */}
        <div className="mt-8 space-y-4">
          {signal.reflection?.content && (
            <details className="group rounded-2xl border border-line bg-surface overflow-hidden shadow-2xs">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-ink focus-visible:outline-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-accent" />
                  <span>Đọc thêm góc nhìn chiêm nghiệm sâu sắc</span>
                </span>
                <ChevronDown
                  className="w-4 h-4 text-muted shrink-0 transition-transform group-open:rotate-180"
                  aria-hidden="true"
                />
              </summary>

              <div className="px-5 pb-5 pt-1 border-t border-line/50">
                <p className="text-sm text-muted leading-relaxed mb-3">
                  Lời gợi mở được đúc kết từ triết lý nhân sinh truyền thống:
                </p>
                <p className="text-base text-ink leading-relaxed">
                  {signal.reflection.content}
                </p>
              </div>
            </details>
          )}

          <details className="group rounded-2xl border border-line bg-surface overflow-hidden shadow-2xs">
            <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 p-4 text-sm font-semibold text-ink focus-visible:outline-none [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-gold" />
                <span>Bối cảnh nội dung</span>
              </span>
              <ChevronDown
                className="w-4 h-4 text-muted shrink-0 transition-transform group-open:rotate-180"
                aria-hidden="true"
              />
            </summary>

            <div className="px-5 pb-5 pt-3.5 border-t border-line/50 divide-y divide-line/40 text-sm">
              <div className="py-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="font-semibold text-ink shrink-0 sm:w-24">Vùng miền:</span>
                <span className="text-ink/85 leading-relaxed">
                  {formatRegion(signal.research.region) || signal.research.region}
                </span>
              </div>

              <div className="pt-2.5 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                <span className="font-semibold text-ink shrink-0 sm:w-24">Ghi chú:</span>
                <span className="text-muted leading-relaxed">
                  {signal.research.note && (signal.research.note.includes("chưa qua đối chiếu") || signal.research.note.includes("thử nghiệm"))
                    ? "Đúc kết từ triết lý nhân sinh và nét đẹp văn hóa truyền thống, hướng người đọc về sự định tâm và sáng suốt."
                    : signal.research.note}
                </span>
              </div>
            </div>
          </details>
        </div>

        {/* ========================================================= */}
        {/* 6. THẺ BÀI KHÁM PHÁ VĂN HÓA LIÊN KẾT (SUGGESTED ARTICLE)  */}
        {/* ========================================================= */}
        {suggestedArticle && (
          <section
            aria-labelledby="result-reading-title"
            className="mt-10 signal-culture-card"
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Cội nguồn câu chuyện · Di sản liên kết</span>
              </div>

              <h2
                id="result-reading-title"
                className="font-display text-xl sm:text-2xl font-semibold text-ink leading-snug mb-2"
              >
                {suggestedArticle.title}
              </h2>

              <p className="text-xs sm:text-sm text-muted mb-3 italic">
                {readingSuggestion.reason}
              </p>

              <p className="text-sm text-muted line-clamp-2 leading-relaxed mb-5">
                {suggestedArticle.excerpt}
              </p>

              <button
                type="button"
                onClick={() => onOpenCultureArticle(suggestedArticle.id)}
                className="guest-secondary-btn text-xs sm:text-sm h-10 px-4 group"
              >
                <span>Đọc bài văn hóa</span>
                <ArrowRight className="w-4 h-4 text-accent transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </div>

            {suggestedArticle.image && (
              <figure className="m-0">
                  <UnverifiedImage
                  src={suggestedArticle.image}
                  alt={suggestedArticle.title}
                  loading="lazy"
                  decoding="async"
                  className="signal-culture-thumb"
                />
              </figure>
            )}
          </section>
        )}

        {/* ========================================================= */}
        {/* 7. DÒNG CAM KẾT VĂN HÓA PHI MÊ TÍN                        */}
        {/* ========================================================= */}
        <p className="mt-8 text-xs sm:text-sm text-center text-muted leading-relaxed">
          Nội dung hướng đến chiêm nghiệm tâm hồn và khám phá vẻ đẹp văn hóa dân tộc,
          không mang tính chất bói toán hay dự báo tương lai.
        </p>
      </main>
    </div>
  );
};

/** Hoa văn góc cổ phong đồng bộ với toàn hệ thống */
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
