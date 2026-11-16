import React, { Suspense, useEffect, useRef, useState } from "react";
import { UnverifiedImage } from "../components/UnverifiedImage";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Lock,
  Trash2,
  Lightbulb,
  ExternalLink,
  Flower2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import "../styles/WishScreen.css";
import { SchoolSupportNotice } from "../components/SchoolSupportNotice";
import {
  WISH_RELEASE_SESSION_KEY,
  WISH_RELEASE_SCENE_VERSION,
  type ReleasedLanternWish,
} from "../data/wishReleaseSession";

const SouthernRiverScene = React.lazy(() =>
  import("../components/SouthernRiverScene").then((module) => ({
    default: module.SouthernRiverScene,
  })),
);

export type WishTopic = "Bình an" | "Gia đạo" | "Công danh" | "Tình duyên";
export type WishMode = "journal" | "ephemeral";

interface RestoredLanternSession {
  wishes: ReleasedLanternWish[];
  label: string | null;
}

function readWishReleaseForCurrentRoute(): RestoredLanternSession {
  if (window.location.pathname.replace(/\/$/, "") !== "/wish") {
    return { wishes: [], label: null };
  }
  try {
    const saved = sessionStorage.getItem(WISH_RELEASE_SESSION_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : null;
    if (typeof parsed === "object" && parsed !== null) {
      const session = parsed as {
        sceneVersion?: unknown;
        wishes?: unknown;
        wish?: unknown;
        label?: unknown;
      };
      if (session.sceneVersion !== WISH_RELEASE_SCENE_VERSION) {
        sessionStorage.removeItem(WISH_RELEASE_SESSION_KEY);
        return { wishes: [], label: null };
      }
      const wishes = Array.isArray(session.wishes)
        ? session.wishes.flatMap((entry): ReleasedLanternWish[] => {
            if (typeof entry === "string" && entry.trim()) {
              return [{ text: entry, royal: false }];
            }
            if (typeof entry !== "object" || entry === null) return [];
            const record = entry as {
              text?: unknown;
              wish?: unknown;
              royal?: unknown;
            };
            const text =
              typeof record.text === "string" ? record.text : record.wish;
            return typeof text === "string" && text.trim()
              ? [{ text, royal: record.royal === true }]
              : [];
          })
        : typeof session.wish === "string" && session.wish.trim()
          ? [{ text: session.wish, royal: false }]
          : [];
      return {
        wishes,
        label: typeof session.label === "string" ? session.label : null,
      };
    }
  } catch {
    // The release can still be used normally when session storage is unavailable.
  }
  return { wishes: [], label: null };
}

interface WishScreenProps {
  onBackToExperience: () => void;
  onGoToDiary: () => void;
  onGoToHome: () => void;
  onGoToExplore: () => void;
  onSaveJournal?: (
    text: string,
    topic: WishTopic,
    requestId: string,
  ) => boolean | Promise<boolean>;
  isLoggedIn?: boolean;
  initialContent?: string;
  initialCategory?: string;
  onDraftChange?: (content: string | null, category: string) => void;
  currentUserEmail?: string;
}

const SAMPLE_WISHES: Record<WishTopic, string> = {
  "Bình an":
    "Mong cho những ngày sắp tới trong lòng bớt xao động, công việc dẫu còn bộn bề nhưng mỗi chiều về nhà vẫn tìm được một khoảng bình an bên mâm cơm ấm.",
  "Gia đạo":
    "Mong mình có khoảng riêng để nghĩ về điều cần thiết trong các mối quan hệ và giữ những giới hạn phù hợp.",
  "Công danh":
    "Mong cho tâm trí luôn sáng suốt, bền chí trước những kỳ thi và thu nhận được nhiều tri thức hữu ích để vững bước trên con đường tương lai.",
  "Tình duyên":
    "Mong mỗi cuộc gặp gỡ được nuôi dưỡng bằng sự chân thành, lắng nghe và tôn trọng lựa chọn của nhau.",
};

class LanternSceneBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) {
      return (
        <div
          role="status"
          className="flex min-h-80 flex-col items-center justify-center gap-3 p-6 text-center text-stone-200"
        >
          <p className="font-semibold">Chưa mở được cảnh hoa đăng.</p>

          <p className="max-w-md text-sm leading-relaxed">
            Bạn vẫn có thể đọc lời vừa viết ở phía trên. Nội dung chưa được lưu
            vào tài khoản. Bạn có thể viết lời khác hoặc trở về Hôm nay.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export const WishScreen: React.FC<WishScreenProps> = ({
  onBackToExperience,
  onGoToDiary,
  onGoToHome,
  onGoToExplore,
  onSaveJournal,
  isLoggedIn = false,
  initialContent = "",
  initialCategory = "Bình an",
  onDraftChange,
  currentUserEmail,
}) => {
  // Keep the just-released lantern available when this tab reloads /wish.
  const [restoredLanternSession] = useState(readWishReleaseForCurrentRoute);

  useEffect(() => {
    return () => {
      // Keep wishes through a page refresh, but start a fresh river after
      // navigating away from the wish experience.
      if (window.location.pathname.replace(/\/$/, "") !== "/wish") {
        try {
          sessionStorage.removeItem(WISH_RELEASE_SESSION_KEY);
        } catch {
          // The next visit still starts fresh when session storage is unavailable.
        }
      }
    };
  }, []);

  const [viewState, setViewState] = useState<"form" | "variantA" | "variantB">(
    restoredLanternSession.wishes.length > 0 ? "variantB" : "form",
  );

  // Form State - default to empty string so user never accidentally saves sample text
  const [content, setContent] = useState(initialContent);

  const [topic, setTopic] = useState<WishTopic>(() => {
    const validTopics: WishTopic[] = [
      "Bình an",
      "Gia đạo",
      "Công danh",
      "Tình duyên",
    ];

    return validTopics.find((value) => value === initialCategory) ?? "Bình an";
  });
  const [mode, setMode] = useState<WishMode>("journal");
  const [hasActuallySaved, setHasActuallySaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const saveAttemptRef = useRef<{
    requestId: string;
    content: string;
    topic: WishTopic;
  } | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);
  const [pendingLanternWishes, setPendingLanternWishes] = useState(
    restoredLanternSession.wishes,
  );
  const pendingLanternWishesRef = useRef(restoredLanternSession.wishes);
  const [pendingLanternWishLabel, setPendingLanternWishLabel] = useState<
    string | null
  >(restoredLanternSession.label);

  useEffect(() => {
    const shouldKeepDraft =
      mode === "journal" && viewState === "form" && !hasActuallySaved;

    onDraftChange?.(shouldKeepDraft ? content : null, topic);
  }, [content, topic, mode, viewState, hasActuallySaved, onDraftChange]);

  const TOPICS: WishTopic[] = ["Gia đạo", "Công danh", "Tình duyên", "Bình an"];

  const handleApplySample = () => {
    if (content.trim()) {
      setSaveError(
        "Ô viết đang có nội dung. Nếu muốn dùng mẫu, bạn hãy xóa nội dung trước.",
      );
      return;
    }

    setContent(SAMPLE_WISHES[topic]);
    setSaveError("");
  };

  const handleWriteAnother = () => {
    saveAttemptRef.current = null;

    if (submitLockRef.current) return;

    setContent("");
    setHasActuallySaved(false);
    setSaveError("");
    setViewState("form");

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Ref khóa ngay, kể cả trước khi React cập nhật giao diện.
    if (submitLockRef.current) return;

    setSaveError("");

    const cleanContent = content.trim();

    if (!cleanContent) {
      setSaveError("Bạn hãy viết lời gửi gắm trước khi tiếp tục.");
      return;
    }

    if (cleanContent.length > 1000) {
      setSaveError("Lời gửi gắm tối đa 1000 ký tự.");
      return;
    }

    if (mode === "ephemeral") {
      const nextWishes = [
        ...pendingLanternWishesRef.current,
        { text: cleanContent, royal: false },
      ];
      try {
        sessionStorage.setItem(
          WISH_RELEASE_SESSION_KEY,
          JSON.stringify({
            sceneVersion: WISH_RELEASE_SCENE_VERSION,
            wishes: nextWishes,
            label: topic,
          }),
        );
      } catch {
        // The current release still works for this page view.
      }
      pendingLanternWishesRef.current = nextWishes;
      setPendingLanternWishes(nextWishes);
      setPendingLanternWishLabel(topic);
      setContent("");
      setHasActuallySaved(false);
      setViewState("variantB");

      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    if (!onSaveJournal) {
      setSaveError("Chức năng lưu chưa sẵn sàng trong phiên này.");
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    try {
      let attempt = saveAttemptRef.current;

      if (
        !attempt ||
        attempt.content !== cleanContent ||
        attempt.topic !== topic
      ) {
        attempt = {
          requestId: crypto.randomUUID(),
          content: cleanContent,
          topic,
        };

        saveAttemptRef.current = attempt;
      }

      const saved = await onSaveJournal(
        attempt.content,
        attempt.topic,
        attempt.requestId,
      );

      // App có thể đã chuyển khách sang trang đăng nhập.
      if (!mountedRef.current) return;

      if (saved !== true) {
        if (isLoggedIn) {
          setSaveError(
            "Chưa xác nhận được việc lưu. Bạn hãy kiểm tra Góc của tôi trước khi lưu lại để tránh trùng nội dung.",
          );
        }
        return;
      }

      setHasActuallySaved(true);
      setViewState("variantA");

      window.scrollTo({ top: 0, behavior: "auto" });
    } catch {
      if (mountedRef.current) {
        setSaveError(
          "Chưa xác nhận được việc lưu. Nội dung vẫn còn ở đây; bạn hãy kiểm tra Góc của tôi trước khi thử lại.",
        );
      }
    } finally {
      submitLockRef.current = false;

      if (mountedRef.current) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="screen-shell">
      <main
        className={`page-container ${
          viewState === "variantB" ? "wish-release-page" : "max-w-5xl"
        }`}
      >
        {/* =========================================================================
            VIEW 1: FORM SOẠN ĐIỀU ƯỚC (IMAGE 1)
           ========================================================================= */}
        {viewState === "form" && (
          <div>
            {/* Top Breadcrumb & Step Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 text-xs text-muted">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onBackToExperience}
                  className="hover:text-accent cursor-pointer transition-colors"
                >
                  Trải nghiệm
                </button>
                <span>/</span>
                <span className="text-accent font-semibold">
                  Lời nguyện hoa đăng
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line text-xs font-semibold uppercase tracking-wider text-muted shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  <span>Khoảng lặng tự soi chiếu</span>
                </div>
              </div>
            </div>

            {/* Main Header */}
            <div className="mx-auto mb-6 max-w-2xl text-center">
              <h1
                tabIndex={-1}
                className="wish-page-title mb-2.5 outline-none focus:outline-none flex items-center justify-center gap-2 text-2xl sm:text-3xl text-ink font-display"
              >
                <span className="wish-seal-badge" aria-hidden="true">
                  願
                </span>
                <span>Lời nguyện & Gửi gắm tâm tư</span>
              </h1>

              <p className="text-sm leading-relaxed text-muted max-w-lg mx-auto">
                Viết ra những điều bạn đang ấp ủ. Bạn có thể lưu giữ vào sổ tay
                cá nhân để đọc lại, hoặc thả trôi nhẹ nhàng cùng ánh hoa đăng
                buông xả.
              </p>
            </div>

            {/* Two Column Layout: Form and Cultural Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
              {/* Left Column: Form & Options (7 columns) */}
              <div className="lg:col-span-7 space-y-6">
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  aria-busy={isSubmitting}
                >
                  <fieldset
                    disabled={isSubmitting}
                    className="min-w-0 space-y-6 border-0 p-0"
                  >
                    {/* Card 1: Textarea Card (Parchment Box) */}
                    <div className="wish-parchment-box">
                      <div className="flex items-center justify-between mb-2">
                        <label
                          htmlFor="wish-content"
                          className="text-base font-semibold text-ink font-display flex items-center gap-2"
                        >
                          <span>Án thư tâm nguyện</span>
                          <span className="text-xs font-normal text-muted/80">
                            • Giấy dó truyền thống
                          </span>
                        </label>

                        <button
                          type="button"
                          onClick={handleApplySample}
                          className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                        >
                          <Lightbulb className="w-3.5 h-3.5" />
                          <span>Gợi ý mẫu tâm sự</span>
                        </button>
                      </div>

                      <p
                        id="wish-content-help"
                        className="mb-3 text-xs sm:text-sm leading-relaxed text-muted"
                      >
                        Hãy thả lỏng tâm trí và giãi bày chân thật. Tránh nhập
                        thông tin cá nhân nhạy cảm.
                      </p>

                      <div className="relative mb-2">
                        <textarea
                          id="wish-content"
                          rows={6}
                          required
                          maxLength={1000}
                          value={content}
                          onChange={(event) => {
                            setContent(event.target.value);
                            setSaveError("");
                          }}
                          aria-describedby="wish-content-help wish-content-count"
                          placeholder="Chắp bút gửi gắm những ấp ủ, ước nguyện thiện lành hôm nay..."
                          className="wish-parchment-textarea"
                        />
                      </div>

                      <SchoolSupportNotice text={content} />
                      {/* Counter & Clear Button */}
                      <div className="flex items-center justify-between text-xs text-muted mb-5">
                        <span
                          id="wish-content-count"
                          className="text-xs text-muted font-mono"
                        >
                          {content.length}/1000 ký tự
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            setContent("");
                            setSaveError("");
                          }}
                          className="text-muted hover:text-accent flex items-center gap-1.5 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Xóa nội dung</span>
                        </button>
                      </div>

                      {/* Category Tags */}
                      <div>
                        <div className="text-xs font-semibold text-ink mb-2.5 flex items-center justify-between">
                          <span>Gắn chủ đề để ước nguyện thêm chu toàn:</span>
                          <span className="text-[11px] text-muted font-normal">
                            Tự động gắn dải lụa cây ước nguyện
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          {TOPICS.map((t) => {
                            const isActive = topic === t;
                            const topicIcons: Record<WishTopic, string> = {
                              "Bình an": "🕊️",
                              "Gia đạo": "🏡",
                              "Công danh": "🌟",
                              "Tình duyên": "🌸",
                            };
                            return (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setTopic(t)}
                                className={`wish-topic-pill ${
                                  isActive ? "wish-topic-pill--active" : ""
                                }`}
                              >
                                <span className="mr-1.5 text-xs">
                                  {topicIcons[t]}
                                </span>
                                <span>{t}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    <fieldset className="space-y-4">
                      <legend className="text-base font-semibold text-ink font-display flex items-center gap-2">
                        <span>Hình thức gửi gắm tâm tư</span>
                        <span className="text-xs font-normal text-muted/80">
                          (Chọn nghi thức phù hợp)
                        </span>
                      </legend>

                      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                        {/* Option 1: Journal Mode */}
                        <label
                          className={`wish-mode-card ${
                            mode === "journal" ? "wish-mode-card--active" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="wish-mode"
                            value="journal"
                            checked={mode === "journal"}
                            onChange={() => {
                              setMode("journal");
                              setSaveError("");
                            }}
                            className="sr-only"
                          />

                          <div className="flex items-start gap-3 w-full">
                            <div
                              className={`wish-mode-icon-badge ${mode === "journal" ? "wish-mode-icon-badge--journal" : ""}`}
                            >
                              <BookOpen className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="block text-sm font-bold text-ink font-display">
                                  Niêm phong vào Sổ tâm tư
                                </span>
                                <span
                                  className={`wish-mode-radio-indicator ${mode === "journal" ? "wish-mode-radio-indicator--active" : ""}`}
                                />
                              </div>

                              <p className="mt-1 text-xs leading-relaxed text-muted">
                                {isLoggedIn
                                  ? "Lưu an toàn vào Góc của tôi để bạn xem lại bất cứ lúc nào, bảo mật riêng tư tuyệt đối."
                                  : "Đăng nhập để lưu vào Góc của tôi và theo dõi hành trình nội tâm an nhiên của bạn."}
                              </p>

                              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-accent">
                                <Lock className="w-3 h-3" />
                                <span>Lưu trữ vĩnh viễn • Riêng tư 100%</span>
                              </div>
                            </div>
                          </div>
                        </label>

                        {/* Option 2: Ephemeral Lotus Mode */}
                        <label
                          className={`wish-mode-card ${
                            mode === "ephemeral" ? "wish-mode-card--active" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="wish-mode"
                            value="ephemeral"
                            checked={mode === "ephemeral"}
                            onChange={() => {
                              setMode("ephemeral");
                              setSaveError("");
                            }}
                            className="sr-only"
                          />

                          <div className="flex items-start gap-3 w-full">
                            <div
                              className={`wish-mode-icon-badge ${mode === "ephemeral" ? "wish-mode-icon-badge--ephemeral" : ""}`}
                            >
                              <Flower2 className="w-5 h-5" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <span className="block text-sm font-bold text-ink font-display">
                                  Thả hoa đăng buông xả
                                </span>
                                <span
                                  className={`wish-mode-radio-indicator ${mode === "ephemeral" ? "wish-mode-radio-indicator--active" : ""}`}
                                />
                              </div>

                              <p className="mt-1 text-xs leading-relaxed text-muted">
                                Hóa thành ánh hoa đăng trôi trên dòng sông 3D.
                                Tâm tư nhẹ nhàng buông xả, không lưu lại dữ
                                liệu.
                              </p>

                              <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-700 dark:text-amber-300">
                                <Sparkles className="w-3 h-3" />
                                <span>Dòng sông hoa đăng 3D • Buông xả</span>
                              </div>
                            </div>
                          </div>
                        </label>
                      </div>

                      {/* Trust banner */}
                      <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-surface-soft/60 border border-line/60 text-xs text-muted">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span>
                          {mode === "journal"
                            ? "Bảo mật an tâm: Lời gửi gắm được mã hóa và chỉ hiển thị duy nhất với tài khoản riêng của bạn."
                            : "Buông xả trọn vẹn: Lời viết hóa vào ánh hoa đăng sông nước và tự động tan biến khi kết thúc phiên."}
                        </span>
                      </div>
                    </fieldset>

                    {saveError && (
                      <p
                        role="alert"
                        className="text-sm text-danger font-medium"
                      >
                        {saveError}
                      </p>
                    )}

                    {/* Action Buttons Row */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                      <button
                        type="button"
                        onClick={onBackToExperience}
                        className="w-full sm:w-auto h-12 px-6 rounded-full border border-line/80 bg-surface hover:bg-surface-soft text-ink/80 text-sm font-medium inline-flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                      >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Quay lại Trải nghiệm</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting || !content.trim()}
                        className={`wish-submit-btn w-full sm:w-auto h-12 px-8 rounded-full whitespace-nowrap inline-flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer ${
                          mode === "ephemeral" ? "wish-submit-btn--lantern" : ""
                        }`}
                      >
                        <span className="wish-btn-sheen" />
                        <span>
                          {isSubmitting
                            ? "Đang gửi gắm…"
                            : mode === "journal"
                              ? isLoggedIn
                                ? "Niêm phong vào Góc của tôi 📜"
                                : "Đăng nhập để niêm phong 📜"
                              : "Thả hoa đăng buông xả 🪷"}
                        </span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </fieldset>
                </form>
              </div>

              {/* Sacred Wishing Tree & Silk Streamer Companion */}
              <aside className="self-start lg:col-span-5 lg:sticky lg:top-24">
                <div className="wishing-sacred-tree-card">
                  <div className="wishing-tree-visual">
                    <UnverifiedImage
                      src="/images/temple_bac_bo.jpg"
                      alt="Cây ước nguyện cổ thụ sân đình"
                      loading="lazy"
                      className="h-full w-full object-cover filter brightness-95"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/35" />

                    {/* Dải lụa đỏ son đung đưa theo gió */}
                    <div className="wishing-silk-streamer">
                      {topic.toUpperCase()}
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-amber-200 font-semibold">
                      <span className="flex items-center gap-1.5 tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> CÂY
                        NGUYỆN ƯỚC DÂN GIAN
                      </span>
                      <span className="bg-black/60 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-amber-400/40 text-[11px] text-amber-300">
                        Dải lụa gửi tâm tư
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        Ý niệm văn hóa
                      </span>
                      <span className="text-xs text-muted">
                        • Tĩnh tâm & Soi chiếu
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-ink font-display">
                      Gửi gắm ước vọng thiện lành
                    </h2>

                    <p className="text-sm leading-relaxed text-muted">
                      Người xưa tin rằng, khi dải lụa đỏ mang theo ước nguyện
                      được buộc lên cành cây cổ thụ, hoặc ánh hoa đăng rực rỡ
                      trôi theo dòng nước, từng ngọn gió hay con sóng sẽ chở lời
                      khẩn cầu hòa vào đất trời.
                    </p>

                    <details className="border-t border-line/70 pt-3">
                      <summary className="cursor-pointer py-1 text-sm font-semibold text-ink hover:text-accent transition-colors flex items-center justify-between">
                        <span>Gợi ý hướng dòng suy nghĩ</span>
                        <span className="text-xs text-muted">▾</span>
                      </summary>

                      <ul className="mt-2.5 list-disc space-y-2 pl-5 text-xs sm:text-sm leading-relaxed text-muted">
                        <li>
                          Điều gì khiến bạn băn khoăn hay trăn trở nhất lúc này?
                        </li>
                        <li>
                          Có lời tri ân hoặc lời chúc nào bạn muốn gửi đến người
                          thân yêu?
                        </li>
                        <li>
                          Một việc thiện lành, một thói quen tích cực bạn tự nhủ
                          sẽ thực hiện?
                        </li>
                      </ul>
                    </details>

                    <div className="rounded-xl p-3 bg-amber-500/5 border border-amber-500/20 text-xs leading-relaxed text-muted flex items-start gap-2.5">
                      <Flower2 className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        Dải lụa và hoa đăng là biểu tượng văn hóa tâm linh giúp
                        tâm trí an định, gột rửa âu lo và hướng tới những điều
                        tốt đẹp.
                      </span>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 2: VARIANT A - XÁC NHẬN LƯU GIỮ (IMAGE 2)
           ========================================================================= */}
        {viewState === "variantA" && (
          <div>
            {/* Top Bar with Variant Switchers */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 text-xs text-muted">
              <nav
                aria-label="Đường dẫn"
                className="flex flex-wrap items-center gap-2"
              >
                <button
                  type="button"
                  onClick={onBackToExperience}
                  className="min-h-11 hover:text-accent"
                >
                  Trải nghiệm
                </button>

                <span aria-hidden="true">/</span>

                <button
                  type="button"
                  onClick={handleWriteAnother}
                  className="min-h-11 hover:text-accent"
                >
                  Lời gửi gắm
                </button>

                <span aria-hidden="true">/</span>

                <span aria-current="page" className="font-semibold text-accent">
                  Đã lưu
                </span>
              </nav>

              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-action text-white font-semibold text-xs">
                  ● Lưu vào nhật ký cá nhân
                </span>
              </div>
            </div>

            <div className="text-center mb-8">
              {hasActuallySaved && (
                <span className="inline-block text-xs uppercase font-bold tracking-wider text-muted bg-surface px-3.5 py-1 rounded-full border border-line mb-6">
                  ● KHOẢNG LẶNG TỰ NHÌN LẠI • ĐÃ LƯU VÀO TÀI KHOẢN
                </span>
              )}

              {/* Big Red Book Seal Icon */}
              <div className="w-20 h-20 mx-auto rounded-card bg-surface border-2 border-line flex items-center justify-center text-accent shadow-md mb-4 relative">
                <BookOpen className="w-10 h-10" />
                <span className="absolute -top-2 -right-2 text-xs font-sans tabular-nums font-bold px-1.5 py-0.5 rounded-full bg-action text-white">
                  ✓
                </span>
              </div>

              <h1
                tabIndex={-1}
                className="wish-page-title mb-3 outline-none focus:outline-none flex items-center justify-center"
              >
                <span className="wish-seal-badge" aria-hidden="true">
                  願
                </span>
                <span>Đã lưu vào Góc của tôi</span>
              </h1>
              <p className="text-sm text-muted max-w-xl mx-auto leading-relaxed">
                Lời gửi gắm đã được lưu vào Góc của tôi qua tài khoản. Bạn có
                thể mở lại để đọc hoặc xóa khi muốn.
              </p>
            </div>

            {/* Central Privacy Card (Parchment Result Card) */}
            <div className="wish-result-card max-w-2xl mx-auto mb-8 relative">
              <div className="flex items-start gap-3.5 mb-6 pb-6 border-b border-line">
                <div className="w-10 h-10 rounded-panel bg-surface flex items-center justify-center text-accent flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-ink mb-1 flex items-center gap-1.5 font-display">
                    <span>Lưu riêng trong tài khoản</span>
                    <span className="text-xs text-accent">🛡</span>
                  </h4>
                  <p className="text-sm text-muted leading-relaxed">
                    Backend mã hóa nội dung trước khi lưu vào cơ sở dữ liệu và
                    chỉ trả nội dung theo tài khoản đã đăng nhập. Đây không phải
                    mã hóa đầu cuối; backend vẫn có thể giải mã để phục vụ ứng
                    dụng.
                  </p>
                </div>
              </div>

              {/* 3 Status Meta Boxes */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                <div className="p-3.5 rounded-panel bg-surface/90 border border-line">
                  <div className="text-xs text-muted uppercase mb-0.5">
                    Chủ đề gắn kèm
                  </div>
                  <div className="font-bold text-sm text-accent">{topic}</div>
                </div>

                <div className="p-3.5 rounded-panel bg-surface/90 border border-line">
                  <div className="text-xs text-muted uppercase mb-0.5">
                    Nơi lưu
                  </div>

                  <div className="font-semibold text-sm text-ink">
                    Góc của tôi
                  </div>
                </div>

                <div className="p-3.5 rounded-panel bg-surface/90 border border-line">
                  <div className="text-xs text-muted uppercase mb-0.5">
                    Trạng thái
                  </div>
                  <div className="font-semibold text-xs text-ink">
                    {content.trim().length} ký tự đã lưu
                  </div>
                </div>
              </div>

              {/* Quote */}
              <div className="text-center py-2 text-xs text-muted italic border-t border-line">
                “Hít một hơi thật sâu, thả lỏng đôi vai. Bạn vừa trao cho chính
                mình một cơ hội được thấu hiểu.”
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button
                variant="default"
                size="lg"
                onClick={onGoToDiary}
                className="w-full sm:w-auto px-8 py-3.5 font-semibold shadow-md gap-2"
              >
                <span>📖 Xem trong Góc của tôi</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="default"
                onClick={onGoToHome}
                className="text-xs text-muted hover:text-accent"
              >
                Trở về Hôm nay
              </Button>

              <Button
                variant="ghost"
                size="default"
                onClick={handleWriteAnother}
                className="text-xs text-muted hover:text-accent"
              >
                Viết điều khác nếu cần
              </Button>
            </div>

            <div className="max-w-2xl mx-auto mb-8 rounded-card border border-line bg-surface p-5">
              <h2 className="mb-2 text-base font-semibold text-ink font-display">
                Khi muốn đọc lại
              </h2>

              <p className="text-sm leading-relaxed text-muted">
                Mở Góc của tôi và chọn mục Điều ước & Lời tri ân. Bạn có thể xem
                nội dung, đánh dấu yêu thích hoặc xóa bản ghi.
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            VIEW 3: VARIANT B - BUÔNG BỎ ƯU TƯ / HOA ĐĂNG (IMAGE 3)
           ========================================================================= */}
        {viewState === "variantB" && (
          <div>
            {/* Top Bar with Variant Switchers */}
            <div className="wish-release-topbar">
              <nav aria-label="Đường dẫn" className="wish-release-breadcrumb">
                <button
                  type="button"
                  onClick={onBackToExperience}
                  className="min-h-11 hover:text-accent"
                >
                  Trải nghiệm
                </button>

                <span aria-hidden="true">/</span>

                <button
                  type="button"
                  onClick={handleWriteAnother}
                  className="min-h-11 hover:text-accent"
                >
                  Lời gửi gắm
                </button>

                <span aria-hidden="true">/</span>

                <span aria-current="page" className="font-semibold text-accent">
                  Đã thả hoa đăng
                </span>
              </nav>

              <span className="wish-release-private">
                <Lock aria-hidden="true" />
                Phiên riêng · Không lưu
              </span>
            </div>

            <header className="wish-release-hero">
              <span className="wish-seal-badge" aria-hidden="true">
                願
              </span>
              <div>
                <p className="wish-release-kicker">
                  ● HOA ĐĂNG AN YÊN • BUÔNG BỎ ƯU TƯ
                </p>
                <h1 tabIndex={-1} className="wish-release-title">
                  Lời nguyện đã được thả
                </h1>
                <p className="wish-release-subtitle">
                  Lời bạn gửi gắm đang hòa vào ánh hoa đăng, nhẹ nhàng trôi theo
                  con nước Nam Bộ.
                </p>
              </div>
            </header>

            <section
              className="wish-release-stage"
              aria-label="Cảnh sông hoa đăng"
            >
              <div className="wish-release-scene-frame">
                <LanternSceneBoundary>
                  <Suspense
                    fallback={
                      <div
                        role="status"
                        className="flex min-h-80 items-center justify-center p-6 text-sm text-stone-200"
                      >
                        Đang chuẩn bị cảnh hoa đăng…
                      </div>
                    }
                  >
                    <SouthernRiverScene
                      key={currentUserEmail || "guest"}
                      initialWishes={pendingLanternWishes}
                      currentUserEmail={currentUserEmail}
                      onWishReleased={(wish) => {
                        const nextWishes = [
                          ...pendingLanternWishesRef.current,
                          wish,
                        ];
                        pendingLanternWishesRef.current = nextWishes;
                        setPendingLanternWishes(nextWishes);
                        setPendingLanternWishLabel("Tâm nguyện riêng");
                        try {
                          sessionStorage.setItem(
                            WISH_RELEASE_SESSION_KEY,
                            JSON.stringify({
                              sceneVersion: WISH_RELEASE_SCENE_VERSION,
                              wishes: nextWishes,
                              label: "Tâm nguyện riêng",
                            }),
                          );
                        } catch {
                          // The current 3D scene remains usable if storage is unavailable.
                        }
                      }}
                    />
                  </Suspense>
                </LanternSceneBoundary>
              </div>
            </section>

            <section className="wish-release-details">
              {pendingLanternWishes.length > 0 && (
                <article className="wish-release-wish relative">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-line/60">
                    <span className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Thiệp hoa đăng tâm nguyện</span>
                    </span>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-medium border border-amber-500/25">
                      {pendingLanternWishLabel ?? topic}
                    </span>
                  </div>

                  <div className="wish-release-wishes">
                    {pendingLanternWishes.map((wish, index) => (
                      <div
                        key={`${index}-${wish.text}`}
                        className={`wish-release-entry ${wish.royal ? "wish-release-entry--royal" : "wish-release-entry--standard"}`}
                      >
                        <span
                          className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold ${wish.royal ? "border-amber-400/40 bg-amber-500/10 text-amber-800 dark:text-amber-200" : "border-rose-300/40 bg-rose-500/5 text-rose-800 dark:text-rose-200"}`}
                        >
                          {wish.royal
                            ? "♛ Hoa đăng hoàng gia"
                            : "🪷 Hoa đăng an yên"}
                        </span>
                        <blockquote className="wish-release-wish-quote">
                          “{wish.text}”
                        </blockquote>
                      </div>
                    ))}

                    {/* Dấu triện son phong ấn an nhiên */}
                    <div className="flex items-center justify-between pt-3 mt-2 border-t border-line/40 text-xs text-muted">
                      <span className="italic text-[11px] opacity-80">
                        Tâm niệm phát khởi, hòa theo ánh nến xuôi dòng buông xả
                        muộn phiền.
                      </span>
                      <span className="w-7 h-7 rounded-md bg-accent text-[#fde8c4] flex items-center justify-center font-serif font-bold text-xs shadow-xs shrink-0 select-none border border-amber-300/40">
                        安
                      </span>
                    </div>
                  </div>
                </article>
              )}
            </section>

            {/* Action Buttons */}
            <div className="wish-release-actions flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-4">
              <Button
                variant="default"
                size="lg"
                onClick={handleWriteAnother}
                className="wish-submit-btn--lantern w-full sm:w-auto h-12 px-7 rounded-full font-bold text-sm text-white shadow-lg cursor-pointer inline-flex items-center justify-center gap-2"
              >
                <Flower2 className="w-4 h-4" />
                <span>Thả thêm một ước nguyện 🪷</span>
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={onGoToHome}
                className="w-full sm:w-auto h-12 px-6 rounded-full border border-line bg-surface hover:bg-surface-soft text-ink text-sm font-medium inline-flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
              >
                <span>Trở về Hôm nay</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              {onGoToExplore && (
                <button
                  type="button"
                  onClick={onGoToExplore}
                  className="h-11 px-4 text-xs sm:text-sm font-semibold text-accent hover:underline inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Khám phá phong thổ 3 miền</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="wish-release-aftercare flex items-center justify-center gap-2 text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>
                Hãy dành vài phút tĩnh lặng, lắng nghe tiếng nước chảy và ngắm
                nhìn ánh sáng trôi xa...
              </span>
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
