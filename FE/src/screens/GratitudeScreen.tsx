import React, { useState, useEffect, useRef } from "react";
import {
  Heart,
  Sparkles,
  ArrowLeft,
  Flame,
  Trash2,
  CheckCircle2,
  BookOpen,
  Info,
  Sun,
  ShieldCheck,
  Flower2,
  Lock,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { UnverifiedImage } from "../components/UnverifiedImage";
import "@/src/styles/GratitudeScreen.css";

interface GratitudeScreenProps {
  onBackToExperience: () => void;
  onBackToHome: () => void;
  onGoToCulture?: () => void;
  user?: { name: string; email: string } | null;
  onSaveGratitude?: (content: string) => boolean | Promise<boolean>;
  onRequireLogin?: (content: string) => void;
  initialContent?: string;
  initialSaveMode?: boolean;
  onDraftChange?: (content: string | null) => void;
}

export const GratitudeScreen: React.FC<GratitudeScreenProps> = ({
  onBackToExperience,
  onBackToHome,
  onGoToCulture,
  user,
  onSaveGratitude,
  onRequireLogin,
  initialContent = "",
  initialSaveMode = false,
  onDraftChange,
}) => {
  const [content, setContent] = useState(initialContent);
  const [sendMode, setSendMode] =
    useState<"ephemeral" | "save">(
      initialSaveMode ? "save" : "ephemeral"
    );
  // Ban đầu hình ảnh chưa thắp nến theo đúng yêu cầu trải nghiệm
  const [isLampLit, setIsLampLit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [releaseStatus, setReleaseStatus] = useState<"idle" | "releasing" | "released">("idle");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const shouldKeepDraft =
      sendMode === "save" &&
      !saveSuccess &&
      releaseStatus === "idle";

    onDraftChange?.(
      shouldKeepDraft ? content : null
    );
  }, [
    content,
    sendMode,
    saveSuccess,
    releaseStatus,
    onDraftChange,
  ]);

  const releaseTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  const resetTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);

  useEffect(() => {
    return () => {
      if (releaseTimerRef.current !== null) {
        clearTimeout(releaseTimerRef.current);
      }

      if (resetTimerRef.current !== null) {
        clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const maxChars = 500;

  const handleChangeSendMode = (
    nextMode: "ephemeral" | "save"
  ) => {
    if (isSubmitting) return;

    setSendMode(nextMode);
    setSaveError("");
  };

  const handleClear = () => {
    setContent("");
    setSaveSuccess(false);
    setSaveError("");
    setReleaseStatus("idle");
  };

  const handleSendOrSave = async () => {
    if (isSubmitting || releaseTimerRef.current !== null) {
      return;
    }

    setSaveError("");

    if (sendMode === "save") {
      if (saveSuccess) return;

      const cleanContent = content.trim();
      if (!cleanContent) return;

      const saved =
        await onSaveGratitude?.(cleanContent) === true;

      if (saved) {
        setSaveSuccess(true);
      } else if (user) {
        setSaveError(
          "Chưa lưu được lời tri ân. Bạn hãy thử lại."
        );
      }

      return;
    }

    if (resetTimerRef.current !== null) {
      clearTimeout(resetTimerRef.current);
      resetTimerRef.current = null;
    }

    setSaveSuccess(false);
    setIsSubmitting(true);
    setReleaseStatus("releasing");

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    releaseTimerRef.current = setTimeout(() => {
      releaseTimerRef.current = null;
      setContent("");
      setIsSubmitting(false);
      setReleaseStatus("released");
      setIsLampLit(true);

      resetTimerRef.current = setTimeout(() => {
        resetTimerRef.current = null;
        setReleaseStatus("idle");
      }, 6000);
    }, reducedMotion ? 200 : 1200);
  };

  return (
    <div className="screen-shell">
      {/* Top Banner & Breadcrumb */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8">
        {/* Top Breadcrumb & Step Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBackToExperience}
              className="hover:text-accent transition-colors cursor-pointer"
            >
              Trải nghiệm
            </button>
            <span>/</span>
            <span className="text-accent font-semibold">Một lời biết ơn</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line text-xs font-semibold uppercase tracking-wider text-muted shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
              <span>Khoảng lặng tri ân</span>
            </div>
          </div>
        </div>

        {/* Page Title & Intro */}
        <div className="mb-8">
          <h1 tabIndex={-1} className="page-title mb-2.5 outline-none focus:outline-none flex items-center gap-2.5 text-2xl sm:text-3xl text-ink font-display">
            <span className="gratitude-seal-badge" aria-hidden="true">恩</span>
            <span>Một nén hương lòng</span>
          </h1>
          <p className="text-sm sm:text-base text-muted max-w-2xl leading-relaxed">
            Dành một nhịp thở chậm giữa bộn bề đời thường để nhớ về cội nguồn, tri ân cha mẹ,
            tiền nhân và những người đã trao gửi ân tình trong đời bạn.
          </p>
        </div>

        {/* Main 2-Column Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (5 Cols): Artwork, Oil Lamp, Quote */}
          <div className="lg:col-span-5 space-y-6">
            {/* Visual Card: Thể hiện rõ trạng thái ban đầu chưa sáng, khi bấm CTA mới thắp sáng */}
            <div className={`gratitude-portrait-card ${isLampLit ? "lamp-lit" : ""}`}>
              <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-soft">
                <UnverifiedImage
                  src="/images/ancestor_portrait.jpg"
                  alt="Chân dung người cao niên trong không gian truyền thống"
                  className={`w-full h-full object-cover transition-all duration-700 ease-out ${
                    isLampLit
                      ? "brightness-[1.08] saturate-[1.15] contrast-[1.05]"
                      : "brightness-[0.62] contrast-[0.9] saturate-[0.7]"
                  }`}
                />

                {/* Hiệu ứng hào quang ấm áp khi đèn thắp sáng */}
                {isLampLit && (
                  <div className="absolute inset-0 bg-radial from-amber-500/25 via-orange-400/10 to-transparent pointer-events-none animate-pulse" />
                )}

                {/* Lớp phủ chuyển sắc thông tin dưới chân ảnh */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

                {/* Status badge in corner */}
                <div className="absolute top-3 right-3 z-10">
                  {isLampLit ? (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-amber-400/50 shadow-lg shadow-amber-500/20">
                      <span className="text-xs">🕯️</span>
                      <span className="text-[11px] font-semibold text-amber-200">Tâm đăng chiếu rạng</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-stone-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-stone-400" />
                      <span className="text-[11px] font-medium">Khoảng lặng tĩnh tâm</span>
                    </div>
                  )}
                </div>

                {/* Respectful Caption Across Bottom */}
                <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-white/90">
                  <span className="text-[11px] font-medium tracking-wide drop-shadow-sm text-stone-200">
                    Kính nhớ ân đức sinh thành & tiền nhân
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-black/40 border border-white/20 text-amber-200">
                    Cội nguồn
                  </span>
                </div>
              </div>

              {/* Lamp Interaction Block */}
              <div className="p-6">
                <div className="flex items-start gap-3.5 mb-4">
                  <div className="w-10 h-10 rounded-panel bg-surface border border-line flex items-center justify-center text-accent shrink-0">
                    <Flower2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-lg text-ink">
                      Không gian tưởng niệm an lành
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mt-1">
                      Khoảnh khắc tĩnh tại để lắng nghe lòng mình, thắp một ngọn đèn lành cho sự bình an nội tại.
                      Không ràng buộc nghi thức, chỉ hướng về lòng thành.
                    </p>
                  </div>
                </div>

                {/* Light Lamp Action Button */}
                <button
                  type="button"
                  aria-pressed={isLampLit}
                  onClick={() => setIsLampLit((prev) => !prev)}
                  className={`gratitude-lamp-btn ${isLampLit ? "active" : ""}`}
                >
                  <Flame
                    className={`w-4 h-4 transition-transform duration-300 ${
                      isLampLit ? "text-amber-600 scale-110 fill-current animate-pulse" : "text-amber-600"
                    }`}
                  />
                  <span>
                    {isLampLit
                      ? "Tâm đăng đang tỏa rạng • Chạm để tắt"
                      : "Thắp sáng ngọn tâm đăng 🕯️"}
                  </span>
                </button>
              </div>
            </div>

            {/* Classical Quote Card */}
            <div className="gratitude-quote-box flex items-start gap-3.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-sm">
                <p className="italic text-ink font-display leading-relaxed text-base">
                  “Cây có gốc mới nở cành xanh ngọn, nước có nguồn mới biển rộng sông sâu.”
                </p>
                <p className="text-xs text-muted mt-1.5 font-medium">
                  — Lời nhắc nhở về cội nguồn và đạo nghĩa ngàn đời.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols): Express & Send Gratitude Form */}
          <div className="lg:col-span-7">
            <div className="gratitude-parchment-box p-6 sm:p-8">
              {/* Form Header */}
              <div className="mb-5">
                <span className="text-xs font-bold tracking-widest text-amber-700 dark:text-amber-400 uppercase">
                  BÀY TỎ & GỬI GẮM TÂM TÌNH
                </span>
                <h2 className="section-title text-2xl mt-1 text-ink">
                  Hôm nay bạn muốn gửi lời tri ân nào?
                </h2>
              </div>

              {/* Text Area */}
              <div className="relative">
                <textarea
                  rows={6}
                  value={content}
                  maxLength={maxChars}
                  disabled={isSubmitting}
                  aria-label="Lời tri ân của bạn"
                  onChange={(event) => {
                    setContent(event.target.value);
                    setSaveSuccess(false);
                    setSaveError("");
                    setReleaseStatus("idle");
                  }}
                  placeholder="Viết đôi dòng nhắn gửi lòng biết ơn đến gia đình, người thương, hoặc tiền nhân đã nâng đỡ bước chân bạn... (Nếu chọn buông xuống, bạn có thể để trống ô này)"
                  className="gratitude-textarea"
                />

                {/* Counter & Clear Button */}
                <div className="flex items-center justify-between text-xs text-muted mt-2 px-1">
                  <button
                    type="button"
                    onClick={handleClear}
                    disabled={isSubmitting || !content}
                    className="inline-flex items-center gap-1 hover:text-amber-700 dark:hover:text-amber-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa nội dung</span>
                  </button>
                  <span className="font-medium">
                    {content.length} / {maxChars} ký tự
                  </span>
                </div>
              </div>

              {/* Send Mode Selection */}
              <div className="mt-6 pt-5 border-t border-amber-900/10 dark:border-amber-400/15">
                <fieldset
                  disabled={isSubmitting}
                  className="min-w-0"
                >
                  <legend className="mb-3 text-sm font-semibold text-ink">
                    Chọn hình thức gửi gắm
                  </legend>

                  <div className="space-y-3">
                    <label
                      className={`gratitude-mode-card ${
                        sendMode === "ephemeral" ? "selected" : ""
                      } ${isSubmitting ? "cursor-wait opacity-60" : "cursor-pointer"}`}
                    >
                      <input
                        type="radio"
                        name="gratitude-send-mode"
                        value="ephemeral"
                        checked={sendMode === "ephemeral"}
                        onChange={() =>
                          handleChangeSendMode("ephemeral")
                        }
                        className="mt-1 h-5 w-5 shrink-0 accent-amber-600"
                      />

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          Thắp hương lòng & Thả trôi buông xả (Vô vi)
                        </span>

                        <span className="mt-1 block text-sm leading-relaxed text-muted">
                          Tâm tình được hòa cùng làn hương trầm thinh không, nhẹ lòng và an yên. Không lưu lại dấu vết nhật ký.
                        </span>

                        <span className="mt-2 block text-xs leading-relaxed text-muted">
                          (Bạn có thể để trống ô nhập nếu chỉ muốn hướng tâm tưởng nhớ)
                        </span>
                      </span>
                    </label>

                    <label
                      className={`gratitude-mode-card ${
                        sendMode === "save" ? "selected" : ""
                      } ${isSubmitting ? "cursor-wait opacity-60" : "cursor-pointer"}`}
                    >
                      <input
                        type="radio"
                        name="gratitude-send-mode"
                        value="save"
                        checked={sendMode === "save"}
                        onChange={() =>
                          handleChangeSendMode("save")
                        }
                        className="mt-1 h-5 w-5 shrink-0 accent-amber-600"
                      />

                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">
                          Lưu giữ riêng tư (Nhật ký ân tình)
                        </span>

                        <span className="mt-1 block text-sm leading-relaxed text-muted">
                          Lưu giữ cẩn trọng trong sổ tay cá nhân tại Góc của tôi để bạn luôn có thể nhìn lại và soi chiếu ân tình.
                        </span>

                        <span className="mt-2 block text-xs leading-relaxed text-muted [overflow-wrap:anywhere]">
                          {user
                            ? `Hồ sơ liên kết: ${user.name}`
                            : "Bạn sẽ được chuyển đến đăng nhập để lưu trữ."}
                        </span>
                      </span>
                    </label>
                  </div>
                </fieldset>
              </div>

              {/* Status Message (Releasing or Saved) */}
              {releaseStatus === "releasing" && (
                <div className="mt-5 p-4 rounded-panel bg-amber-900/10 dark:bg-amber-400/10 border border-amber-500/30 text-center animate-pulse">
                  <div className="text-2xl mb-1">🕊️ ✨</div>
                  <p className="text-xs font-semibold text-amber-800 dark:text-amber-200">
                    Nén hương lòng đang hòa vào thinh không vô vi... Buông thư và an trú.
                  </p>
                </div>
              )}

              {releaseStatus === "released" && (
                <div className="gratitude-success-banner mt-5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-bold">Nén hương lòng đã được gửi đi an hòa</p>
                    <p className="text-sm mt-0.5 leading-relaxed">
                      {content.trim()
                        ? "Lời tri ân chân thành đã hòa vào khói hương vô vi. Chúc tâm bạn luôn an lành và vững vàng."
                        : "Một nén tâm hương vô vi thuần khiết đã được thắp sáng trong tâm tưởng. Nguyện cầu vạn sự lành đến bạn và người thân."}
                    </p>
                  </div>
                </div>
              )}

              {saveSuccess && (
                <div className="gratitude-success-banner mt-5">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <p className="font-bold">Đã lưu vào Góc của tôi</p>
                    <p className="text-sm mt-0.5 leading-relaxed">
                      Bạn có thể xem lại tại mục <strong>“Điều ước & Lời tri ân”</strong> bất cứ lúc nào.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons: Unified Dual Action */}
              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 border-t border-amber-900/10 dark:border-amber-400/15">
                {saveError && (
                  <p role="alert" className="w-full text-sm text-danger mb-2">
                    {saveError}
                  </p>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={onBackToExperience}
                  className="h-12 px-6 rounded-full text-sm font-medium border-line hover:border-amber-500/40 text-muted hover:text-ink cursor-pointer whitespace-nowrap"
                >
                  Quay lại Trải nghiệm
                </Button>
                <button
                  type="button"
                  onClick={handleSendOrSave}
                  disabled={
                    isSubmitting ||
                    (
                      sendMode === "save" &&
                      (!content.trim() || saveSuccess)
                    )
                  }
                  className="gratitude-submit-btn h-12 px-7"
                >
                  <span className="gratitude-btn-sheen" />
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>
                    {isSubmitting
                      ? "Đang gửi nén hương..."
                      : sendMode === "ephemeral"
                        ? "Thắp hương & Buông thư"
                        : saveSuccess
                          ? "Đã lưu lời tri ân"
                          : user
                            ? "Lưu vào Góc của tôi"
                            : "Đăng nhập để lưu"}
                  </span>
                </button>
              </div>

              {/* Bottom culture link */}
              {onGoToCulture && (
                <div className="mt-5 text-center">
                  <button
                    onClick={onGoToCulture}
                    className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-amber-700 dark:hover:text-amber-300 transition-colors cursor-pointer group"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Tìm hiểu phong tục tưởng nhớ gia tiên và đạo hiếu trong văn hóa Việt</span>
                    <span className="group-hover:translate-x-0.5 transition-transform">→</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Reassuring Cultural & Privacy Card */}
        <div className="mt-10 p-4 sm:p-5 rounded-2xl bg-surface/80 border border-line flex items-start gap-3.5 text-xs text-muted leading-relaxed">
          <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-ink block mb-0.5">Không gian tôn trọng sự tĩnh lặng & quyền riêng tư</span>
            Mọi tương tác mang tính biểu tượng văn hóa và chữa lành nội tâm.
            Khi chọn buông xả, lời viết sẽ tan vào khói hương vô vi; khi chọn lưu giữ, nội dung được bảo mật riêng trong tài khoản của bạn.
          </div>
        </div>
      </div>
    </div>
  );
};
