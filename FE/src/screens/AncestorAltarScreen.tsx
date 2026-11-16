import React, {
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Landmark,
  Send,
  Sparkles,
  RotateCcw,
  Clock,
  ShieldCheck,
  Heart,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Textarea } from "@/src/components/ui/textarea";
import { useJadeDecoration } from "../hooks/useJadeDecoration";
import {
  JadeDecorationControl,
  MAIN_OFFERING_CATALOG,
  DECORATION_CATALOG,
  type OfferingCardItem,
} from "../components/JadeDecorationControl";
import { isDemoMode } from "../data/demoMode";
import { loadDemoCommerceState, consumeDemoInventory } from "../data/demoCommerceService";
import type { DecorationId } from "../components/createDigitalDecoration";

const ALL_OFFERINGS: OfferingCardItem[] = [...MAIN_OFFERING_CATALOG];

const SanctuaryScene = lazy(() =>
  import("../components/SanctuaryScene").then((module) => ({
    default: module.SanctuaryScene,
  })),
);

interface AncestorAltarScreenProps {
  currentUserEmail?: string;
  onBack: () => void;
  isLoggedIn: boolean;
  onSaveTribute: (content: string) => boolean | Promise<boolean>;
  initialContent?: string;
  onDraftChange?: (content: string | null) => void;
}

interface SubmittedPrayer {
  id: string;
  content: string;
  offeringName: string;
  submittedAt: Date;
}

const sceneIds: Record<string, DecorationId | null> = {
  BOILED_CHICKEN: "boiled-chicken",
  STICKY_RICE: "sticky-rice",
  WATERMELON: "watermelon",
  FRUIT_PLATE: "fruit-plate",
};

const TRIBUTE_SUGGESTIONS = [
  {
    label: "Nhớ ông bà",
    text: "Con kính nhớ công ơn dưỡng dục sinh thành của ông bà tổ tiên. Nguyện sống trọn đạo, gìn giữ nếp nhà thảo thơm.",
  },
  {
    label: "Gia đình bình an",
    text: "Cúi xin tiên tổ chở che cho gia đạo thuận hòa, trong ấm ngoài êm, mẹ cha mạnh khỏe, cháu con an vui.",
  },
  {
    label: "Một lời cảm ơn",
    text: "Hôm nay lòng con lắng lại, thành tâm gửi nén tâm nhang tri ân cội nguồn đã cho con hình hài và cuộc sống hôm nay.",
  },
  {
    label: "Mùa thi & Vượt khó",
    text: "Con cúi xin ông bà tổ tiên độ trì cho con vững tâm bền chí, trí tuệ hanh thông, vượt qua kỳ thi và thử thách sắp tới.",
  },
];

export const AncestorAltarScreen: React.FC<AncestorAltarScreenProps> = ({
  currentUserEmail,
  onBack,
  isLoggedIn,
  onSaveTribute,
  initialContent = "",
  onDraftChange,
}) => {
  const [tribute, setTribute] = useState(initialContent);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [itemError, setItemError] = useState("");
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [incenseTrigger, setIncenseTrigger] = useState(0);
  const [recentPrayers, setRecentPrayers] = useState<SubmittedPrayer[]>([]);
  const [pendingSuggestion, setPendingSuggestion] = useState<string | null>(
    null,
  );

  const audioRef = useRef<HTMLAudioElement>(null);
  const jadeDecoration = useJadeDecoration(currentUserEmail);

  // Danh sách các mã lễ vật đang được chọn xem trước trên bàn thờ 3D (mặc định trống thanh tịnh khi mới vào)
  const [selectedCodes, setSelectedCodes] = useState<string[]>(() => []);

  // Danh sách các mã lễ vật đã được dâng lễ thành công
  const [placedCodes, setPlacedCodes] = useState<string[]>([]);

  // Bật/tắt chọn từng lễ vật (Multi-select)
  const handleToggleCode = (code: string) => {
    setSelectedCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  // Làm mới bàn thờ về thanh tịnh
  const handleClearAltar = () => {
    setSelectedCodes([]);
    setPlacedCodes([]);
  };

  // Map các mã đang chọn sang DecorationId cho Three.js scene
  const activeSceneDecorations: DecorationId[] = useMemo(() => {
    const ids: DecorationId[] = [];
    for (const code of selectedCodes) {
      const decId = sceneIds[code];
      if (decId) ids.push(decId);
    }
    return ids;
  }, [selectedCodes]);

  useEffect(() => {
    onDraftChange?.(submitted ? null : tribute);
  }, [tribute, submitted, onDraftChange]);

  // Audio background manager
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    let disposed = false;
    audio.volume = 0.2;

    const playBackgroundMusic = async () => {
      try {
        await audio.play();
        if (!disposed) setMusicPlaying(true);
      } catch {
        if (!disposed) setMusicPlaying(false);
      }
    };

    void playBackgroundMusic();

    const resumeOnGesture = (event: Event) => {
      const target = event.target;
      if (target instanceof Element && target.closest("[data-audio-toggle]")) {
        return;
      }
      if (audio.paused) void playBackgroundMusic();
    };
    document.addEventListener("pointerdown", resumeOnGesture, { once: true });

    return () => {
      disposed = true;
      document.removeEventListener("pointerdown", resumeOnGesture);
      audio.pause();
    };
  }, []);

  const toggleMusic = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!audio.paused) {
      audio.pause();
      setMusicPlaying(false);
      return;
    }

    try {
      await audio.play();
      setMusicPlaying(true);
    } catch {
      setMusicPlaying(false);
    }
  };

  // Quick suggestion handler with safe confirmation when content exists
  const handleApplySuggestion = (text: string) => {
    const current = tribute.trim();
    if (current && current !== text) {
      setPendingSuggestion(text);
    } else {
      setTribute(text);
      setSubmitted(false);
      setSaveError("");
    }
  };

  const confirmApplySuggestion = () => {
    if (pendingSuggestion) {
      setTribute(pendingSuggestion);
      setPendingSuggestion(null);
      setSubmitted(false);
      setSaveError("");
    }
  };

  // Complete offering and tribute submission
  const handleCompleteOffering = async () => {
    const cleanContent = tribute.trim();
    if (!cleanContent || isSubmitting || selectedCodes.length === 0) return;

    setIsSubmitting(true);
    setSaveError("");
    setItemError("");

    let itemSuccess = true;
    let itemErrorMessage = "";

    // Step 1: Kiểm tra quyền sở hữu và tiêu hao lễ vật tương ứng
    if (isDemoMode()) {
      const commerce = loadDemoCommerceState();
      const missingOfferings: string[] = [];

      for (const code of selectedCodes) {
        if (code === "BOILED_CHICKEN" && (commerce.inventory.virtualChickens ?? 0) < 1) {
          missingOfferings.push("Đĩa gà luộc");
        } else if (code === "STICKY_RICE" && (commerce.inventory.stickyRice ?? 0) < 1) {
          missingOfferings.push("Đĩa xôi gấc");
        } else if (code === "WATERMELON" && (commerce.inventory.watermelons ?? 0) < 1) {
          missingOfferings.push("Cặp dưa hấu");
        } else if (code === "FRUIT_PLATE" && (commerce.inventory.fruitPlates ?? 0) < 1) {
          missingOfferings.push("Mâm ngũ quả");
        }
      }

      if (missingOfferings.length > 0) {
        itemSuccess = false;
        itemErrorMessage = `Bạn chưa thỉnh: ${missingOfferings.join(", ")}. Vui lòng thỉnh trước khi dâng lên bàn thờ.`;
      } else {
        try {
          for (const code of selectedCodes) {
            if (code === "BOILED_CHICKEN") {
              consumeDemoInventory("virtualChickens", 1, `altar-chicken:${crypto.randomUUID()}`);
            } else if (code === "STICKY_RICE") {
              consumeDemoInventory("stickyRice", 1, `altar-sticky-rice:${crypto.randomUUID()}`);
            } else if (code === "WATERMELON") {
              consumeDemoInventory("watermelons", 1, `altar-watermelon:${crypto.randomUUID()}`);
            } else if (code === "FRUIT_PLATE") {
              consumeDemoInventory("fruitPlates", 1, `altar-fruit-plate:${crypto.randomUUID()}`);
            }
          }
          window.dispatchEvent(new Event("tltl-demo-inventory-change"));
        } catch (err) {
          itemSuccess = false;
          itemErrorMessage =
            err instanceof Error ? err.message : "Chưa thể tiêu hao lễ vật trong kho.";
        }
      }
    } else {
      if (selectedCodes.includes("BOILED_CHICKEN")) {
        try {
          await jadeDecoration.change("BOILED_CHICKEN");
        } catch (err) {
          itemSuccess = false;
          itemErrorMessage =
            err instanceof Error ? err.message : "Chưa thể dâng đĩa gà luộc.";
        }
      }
    }

    // Step 2: Lưu lời tri ân
    let tributeSuccess = false;
    try {
      tributeSuccess = await onSaveTribute(cleanContent);
    } catch {
      tributeSuccess = false;
    }

    // Step 3: Đánh giá kết quả độc lập từng phần
    if (tributeSuccess && itemSuccess) {
      setSubmitted(true);
      // Ghi nhận toàn bộ các món đang chọn thành Đã bày
      setPlacedCodes(Array.from(new Set([...placedCodes, ...selectedCodes])));
      // Kích hoạt thắp hương lòng & chuông ngân 3D
      setIncenseTrigger((prev) => prev + 1);

      const offeringNames = selectedCodes
        .map((code) => ALL_OFFERINGS.find((o) => o.code === code)?.name)
        .filter(Boolean)
        .join(", ");

      setRecentPrayers((prayers) => [
        {
          id: crypto.randomUUID(),
          content: cleanContent,
          offeringName: offeringNames || "Lễ vật gia tiên",
          submittedAt: new Date(),
        },
        ...prayers,
      ]);
    } else {
      if (!tributeSuccess && itemSuccess) {
        setSaveError(
          "Lễ vật đã được bài trí trang nghiêm, nhưng chưa lưu được lời tri ân. Bạn hãy nhấn thử lại.",
        );
      } else if (tributeSuccess && !itemSuccess) {
        setItemError(
          `Lời tri ân đã được ghi nhận, nhưng lễ vật chưa dâng được (${itemErrorMessage}). Bạn có thể thử dâng lại lễ vật.`,
        );
      } else {
        setSaveError(
          `Chưa hoàn tất nghi thức dâng lễ (${itemErrorMessage || "Lỗi lưu lời nguyện"}). Bạn hãy thử lại.`,
        );
      }
    }

    setIsSubmitting(false);
  };

  const handleResetForNewTribute = () => {
    setSubmitted(false);
    setTribute("");
    setSaveError("");
    setItemError("");
  };

  const placedOfferingObjects = ALL_OFFERINGS.filter((o) =>
    placedCodes.includes(o.code),
  );
  const currentOfferingName =
    placedOfferingObjects.length > 0
      ? placedOfferingObjects.map((o) => o.name).join(", ")
      : selectedCodes.length > 0
        ? selectedCodes
            .map((c) => ALL_OFFERINGS.find((o) => o.code === c)?.name)
            .filter(Boolean)
            .join(", ")
        : "Chưa bày lễ vật";

  return (
    <div className="screen-shell">
      {/* Background audio element */}
      <audio ref={audioRef} src="/audio/somnium.mp3" loop preload="auto" />

      <main className="page-container max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
        {/* Compact Header: Nav & Title */}
        <header className="mb-2.5 sm:mb-3">
          <div className="flex items-center justify-between gap-3 text-xs mb-1 text-stone-600 dark:text-stone-400">
            <button
              onClick={onBack}
              className="inline-flex cursor-pointer items-center gap-1.5 font-medium transition-colors hover:text-accent"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Về Trải nghiệm</span>
            </button>
            <Badge
              variant="outline"
              className="border-amber-400/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300"
            >
              Nếp nhà Việt · Cội nguồn tâm linh
            </Badge>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <div>
              <h1
                tabIndex={-1}
                className="font-display text-2xl sm:text-3xl font-bold text-ink outline-none tracking-tight"
              >
                Không gian gia tiên
              </h1>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 mt-0.5">
                Một khoảng lặng để hướng về nguồn cội và gửi lời biết ơn.
              </p>
            </div>
          </div>
        </header>

        {/* Desktop 2-column layout (~60–65% left 3D, ~35–40% right action panel) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
          {/* CỘT TRÁI: 3D Altar Scene (lg:col-span-7 xl:col-span-8, sticky on desktop) */}
          <section
            aria-label="Cảnh bàn thờ 3D tương tác"
            className="lg:col-span-7 xl:col-span-8 w-full flex flex-col lg:sticky lg:top-3 z-10"
          >
            <div className="h-[380px] sm:h-[440px] lg:h-[510px] xl:h-[540px] w-full">
              <Suspense
                fallback={
                  <div
                    role="status"
                    className="rounded-2xl border border-line bg-surface p-12 text-center shadow-xs flex flex-col items-center justify-center h-full min-h-[360px]"
                  >
                    <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                    <p className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      Đang chuẩn bị không gian bàn thờ gia tiên…
                    </p>
                  </div>
                }
              >
                <SanctuaryScene
                  decorations={activeSceneDecorations}
                  triggerIncense={incenseTrigger}
                  musicPlaying={musicPlaying}
                  onToggleMusic={toggleMusic}
                />
              </Suspense>
            </div>
          </section>

          {/* CỘT PHẢI: Bảng thao tác 3 bước (lg:col-span-5 xl:col-span-4) */}
          <section
            aria-label="Bảng thao tác dâng lễ gia tiên"
            className="lg:col-span-5 xl:col-span-4 flex flex-col gap-3 w-full"
          >
            {/* 1. CHỌN LỄ VẬT (Hỗ trợ chọn nhiều món, gà, xôi, dưa hấu, trái cây) */}
            <JadeDecorationControl
              state={jadeDecoration}
              allowDemoChickenOffering
              selectedCodes={selectedCodes}
              onToggleCode={handleToggleCode}
              placedCodes={placedCodes}
              onClearPlaced={handleClearAltar}
            />

            {/* 2. VIẾT LỜI TRI ÂN HOẶC THẺ TÓM TẮT THÀNH CÔNG */}
            {!submitted ? (
              <div className="rounded-2xl border border-line bg-surface p-3.5 sm:p-4 shadow-xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-line/60 pb-2">
                  <label
                    htmlFor="tribute-input"
                    className="text-xs sm:text-sm font-bold tracking-wide text-ink font-serif flex items-center gap-1.5"
                  >
                    <Heart className="w-3.5 h-3.5 text-accent" />
                    <span>2. Lời tri ân của bạn</span>
                  </label>
                  <span className="text-[11px] font-mono text-muted">
                    {tribute.length} / 1000
                  </span>
                </div>

                {/* 3 Quick Suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-medium text-muted">
                      Gợi ý tâm tình:
                    </span>
                    <span className="text-[10px] text-stone-400">
                      Bấm để điền mẫu
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {TRIBUTE_SUGGESTIONS.map((sugg) => (
                      <button
                        key={sugg.label}
                        type="button"
                        onClick={() => handleApplySuggestion(sugg.text)}
                        className="rounded-full border border-line bg-surface-soft hover:bg-surface hover:border-amber-600/40 px-2.5 py-0.5 text-[11px] font-medium text-stone-700 dark:text-stone-300 transition-colors cursor-pointer"
                      >
                        {sugg.label}
                      </button>
                    ))}
                  </div>

                  {/* Confirmation prompt when overwriting custom text */}
                  {pendingSuggestion && (
                    <div
                      role="alert"
                      className="mt-2 p-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-950 dark:text-amber-200 flex flex-col gap-1.5 animate-fadeIn"
                    >
                      <div className="flex items-start gap-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <span>
                          Bạn đang viết dở một lời tri ân. Bạn có muốn thay thế
                          bằng nội dung gợi ý này không?
                        </span>
                      </div>
                      <div className="flex justify-end gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => setPendingSuggestion(null)}
                          className="px-2 py-0.5 text-xs rounded-lg border border-line bg-surface text-stone-600 hover:text-ink cursor-pointer"
                        >
                          Giữ lời đang viết
                        </button>
                        <button
                          type="button"
                          onClick={confirmApplySuggestion}
                          className="px-2 py-0.5 text-xs rounded-lg font-semibold bg-amber-700 text-white hover:bg-amber-800 cursor-pointer"
                        >
                          Thay thế gợi ý
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Textarea input */}
                <Textarea
                  id="tribute-input"
                  value={tribute}
                  onChange={(event) => {
                    setTribute(event.target.value);
                    setSaveError("");
                    setItemError("");
                    setPendingSuggestion(null);
                  }}
                  aria-label="Lời tri ân của bạn"
                  maxLength={1000}
                  placeholder="Viết điều bạn muốn gửi đến ông bà, tổ tiên…"
                  className="min-h-20 sm:min-h-22 rounded-xl border border-line bg-surface-soft/60 p-2.5 text-xs sm:text-sm leading-relaxed text-ink placeholder:text-stone-400 focus:border-amber-600 focus:bg-surface focus:ring-2 focus:ring-amber-500/20"
                />

                {/* Error announcements */}
                {saveError && (
                  <p
                    role="alert"
                    className="text-xs text-danger font-medium flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{saveError}</span>
                  </p>
                )}

                {itemError && (
                  <p
                    role="alert"
                    className="text-xs text-amber-700 dark:text-amber-300 font-medium flex items-center gap-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{itemError}</span>
                  </p>
                )}

                {/* Action button: Dâng lễ và gửi lời tri ân */}
                <div className="pt-0.5">
                  <Button
                    type="button"
                    onClick={handleCompleteOffering}
                    disabled={
                      !tribute.trim() ||
                      isSubmitting ||
                      jadeDecoration.busy ||
                      selectedCodes.length === 0
                    }
                    className="w-full min-h-11 cursor-pointer gap-2 rounded-xl px-5 font-bold text-xs sm:text-sm tracking-wide shadow-md transition-all active:scale-[0.98] bg-gradient-to-r from-red-900 via-amber-800 to-red-900 text-white hover:from-red-800 hover:to-amber-700 shadow-amber-950/25 border border-amber-500/40 hover:border-amber-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Đang dâng lễ &amp; gửi lời tri ân…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-amber-200" />
                        <span>Dâng lễ và gửi lời tri ân</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* THẺ TÓM TẮT HOÀN TẤT TRẢI NGHIỆM (Tribute Summary Card) */
              <div className="rounded-2xl border border-amber-600/35 bg-gradient-to-b from-amber-500/[0.08] to-amber-500/[0.03] p-5 shadow-xs space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2.5 border-b border-amber-600/20 pb-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-sm text-ink">
                      Đã kính dâng lễ &amp; gửi tâm nguyện
                    </h3>
                    <p className="text-[11px] text-muted">
                      Hương thơm đã tỏa, lòng thành đã thấu
                    </p>
                  </div>
                </div>

                {/* Offering Placed Info */}
                <div className="bg-surface/80 rounded-xl p-3 border border-line text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted">
                      Lễ vật trên bàn thờ:
                    </span>
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 text-amber-800 dark:text-amber-200 bg-amber-500/10 text-[10px]"
                    >
                      {currentOfferingName}
                    </Badge>
                  </div>
                </div>

                {/* Tribute Text Quote */}
                <div className="bg-surface/90 rounded-xl p-3.5 border border-amber-500/20 space-y-2">
                  <span className="text-[10px] font-semibold tracking-wider text-muted uppercase font-serif">
                    Tâm thư tri ân
                  </span>
                  <p className="text-xs sm:text-sm text-ink leading-relaxed font-serif italic whitespace-pre-wrap">
                    “{tribute}”
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-line/40 text-[10px] text-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-stone-400" />
                      <span>
                        {new Date().toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-medium">
                      <ShieldCheck className="w-3 h-3" />
                      <span>
                        {isLoggedIn && !isDemoMode()
                          ? "Đã lưu vào tài khoản"
                          : "Đã lưu trong trình duyệt"}
                      </span>
                    </span>
                  </div>
                </div>

                {/* CTA to submit another tribute */}
                <div className="pt-1 flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetForNewTribute}
                    className="w-full text-xs font-semibold border-amber-600/30 text-accent hover:bg-accent/5 cursor-pointer flex items-center justify-center gap-1.5 min-h-10 rounded-xl"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Gửi lời tri ân khác</span>
                  </Button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Danh sách lời nguyện vừa gửi gần đây */}
        {recentPrayers.length > 0 && (
          <section aria-labelledby="recent-prayers-title" className="mt-8 mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Clock
                className="h-4 w-4 text-amber-700 dark:text-amber-400"
                aria-hidden="true"
              />
              <h2
                id="recent-prayers-title"
                className="font-display text-sm font-bold text-ink"
              >
                Tâm nguyện vừa gửi trong phiên
              </h2>
            </div>
            <ul className="space-y-2.5">
              {recentPrayers.map((prayer) => (
                <li
                  key={prayer.id}
                  className="rounded-xl border border-line bg-surface/80 p-3.5 text-xs text-ink space-y-1.5"
                >
                  <div className="flex items-center justify-between text-[11px] text-muted">
                    <span className="font-semibold text-accent">
                      {prayer.offeringName}
                    </span>
                    <span>
                      {prayer.submittedAt.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed font-serif italic text-stone-800 dark:text-stone-200">
                    “{prayer.content}”
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
};
