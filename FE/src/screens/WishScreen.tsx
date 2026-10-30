import React, {
  Suspense,
  useEffect,
  useRef,
  useState,
} from "react";
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
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import "../styles/WishScreen.css";
import { SchoolSupportNotice } from "../components/SchoolSupportNotice";
import { WISH_RELEASE_SESSION_KEY } from "../data/wishReleaseSession";

const SouthernRiverScene = React.lazy(() =>
  import("../components/SouthernRiverScene").then((module) => ({
    default: module.SouthernRiverScene,
  }))
);

export type WishTopic = "Bình an" | "Gia đạo" | "Công danh" | "Tình duyên";
export type WishMode = "journal" | "ephemeral";

function readWishReleaseForCurrentRoute(): string {
  if (window.location.pathname.replace(/\/$/, "") !== "/wish") return "";
  try {
    const saved = sessionStorage.getItem(WISH_RELEASE_SESSION_KEY);
    const parsed: unknown = saved ? JSON.parse(saved) : null;
    if (
      typeof parsed === "object" && parsed !== null &&
      "wish" in parsed && typeof parsed.wish === "string"
    ) return parsed.wish;
  } catch {
    // The release can still be used normally when session storage is unavailable.
  }
  return "";
}

interface WishScreenProps {
  onBackToExperience: () => void;
  onGoToDiary: () => void;
  onGoToHome: () => void;
  onGoToExplore: () => void;
  onSaveJournal?: (
    text: string,
    topic: WishTopic,
    requestId: string
  ) => boolean | Promise<boolean>;
  isLoggedIn?: boolean;
  initialContent?: string;
  initialCategory?: string;
  onDraftChange?: (
    content: string | null,
    category: string
  ) => void;
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
          <p className="font-semibold">
            Chưa mở được cảnh hoa đăng.
          </p>

          <p className="max-w-md text-sm leading-relaxed">
            Bạn vẫn có thể đọc lời vừa viết ở phía trên.
            Nội dung chưa được lưu vào tài khoản.
            Bạn có thể viết lời khác hoặc trở về Hôm nay.
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
  const [restoredLanternWish] = useState(readWishReleaseForCurrentRoute);
  const [viewState, setViewState] = useState<"form" | "variantA" | "variantB">(
    restoredLanternWish ? "variantB" : "form"
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

    return (
      validTopics.find((value) => value === initialCategory) ??
      "Bình an"
    );
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
  const [pendingLanternWish, setPendingLanternWish] = useState(restoredLanternWish);

  useEffect(() => {
    const shouldKeepDraft =
      mode === "journal" &&
      viewState === "form" &&
      !hasActuallySaved;

    onDraftChange?.(
      shouldKeepDraft ? content : null,
      topic
    );
  }, [
    content,
    topic,
    mode,
    viewState,
    hasActuallySaved,
    onDraftChange,
  ]);

  const TOPICS: WishTopic[] = ["Gia đạo", "Công danh", "Tình duyên", "Bình an"];

  const handleApplySample = () => {
    if (content.trim()) {
      setSaveError(
        "Ô viết đang có nội dung. Nếu muốn dùng mẫu, bạn hãy xóa nội dung trước."
      );
      return;
    }

    setContent(SAMPLE_WISHES[topic]);
    setSaveError("");
  };

  const handleWriteAnother = () => {
    saveAttemptRef.current = null;

    try {
      sessionStorage.removeItem(WISH_RELEASE_SESSION_KEY);
    } catch {
      // No-op when session storage is unavailable.
    }

    if (submitLockRef.current) return;

    setContent("");
    setPendingLanternWish("");
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
      try {
        sessionStorage.setItem(
          WISH_RELEASE_SESSION_KEY,
          JSON.stringify({ wish: cleanContent })
        );
      } catch {
        // The current release still works for this page view.
      }
      setPendingLanternWish(cleanContent);
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
        attempt.requestId
      );

      // App có thể đã chuyển khách sang trang đăng nhập.
      if (!mountedRef.current) return;

      if (saved !== true) {
        if (isLoggedIn) {
          setSaveError(
            "Chưa xác nhận được việc lưu. Bạn hãy kiểm tra Góc của tôi trước khi lưu lại để tránh trùng nội dung."
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
          "Chưa xác nhận được việc lưu. Nội dung vẫn còn ở đây; bạn hãy kiểm tra Góc của tôi trước khi thử lại."
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
                <span className="text-accent font-semibold">Lời nguyện hoa đăng</span>
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
              <h1 tabIndex={-1} className="wish-page-title mb-2.5 outline-none focus:outline-none flex items-center justify-center gap-2 text-2xl sm:text-3xl text-ink font-display">
                <span className="wish-seal-badge" aria-hidden="true">願</span>
                <span>Lời nguyện & Gửi gắm tâm tư</span>
              </h1>

              <p className="text-sm leading-relaxed text-muted max-w-lg mx-auto">
                Viết ra những điều bạn đang ấp ủ. Bạn có thể lưu giữ vào sổ tay cá nhân để đọc lại, hoặc thả trôi nhẹ nhàng cùng ánh hoa đăng buông xả.
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
                        className="text-base font-semibold text-ink font-display"
                      >
                        Điều bạn muốn viết
                      </label>

                      <button
                        type="button"
                        onClick={handleApplySample}
                        className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                      >
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Gợi ý mẫu</span>
                      </button>
                    </div>

                    <p
                      id="wish-content-help"
                      className="mb-3 text-xs sm:text-sm leading-relaxed text-muted"
                    >
                      Không cần viết thật hay. Tránh nhập thông tin cá nhân nhạy cảm.
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
                        placeholder="Hôm nay, mình muốn gửi gắm..."
                        className="wish-parchment-textarea"
                      />
                    </div>

                    <SchoolSupportNotice text={content} />
                    {/* Counter & Clear Button */}
                    <div className="flex items-center justify-between text-xs text-muted mb-5">
                      <span id="wish-content-count" className="text-xs text-muted">
                        {content.length}/1000 ký tự
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setContent("");
                          setSaveError("");
                        }}
                        className="text-muted hover:text-accent flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Xóa nội dung</span>
                      </button>
                    </div>

                    {/* Category Tags */}
                    <div>
                      <div className="text-xs font-semibold text-ink mb-2">
                        Gắn chủ đề để dễ nhìn lại (tùy ý):
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {TOPICS.map((t) => {
                          const isActive = topic === t;
                          return (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setTopic(t)}
                              className={`wish-topic-pill ${
                                isActive ? "wish-topic-pill--active" : ""
                              }`}
                            >
                              {isActive ? `● ${t}` : t}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <fieldset className="space-y-3">
                    <legend className="text-base font-semibold text-ink font-display">
                      Bạn muốn giữ lại lời viết này thế nào?
                    </legend>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {(
                        [
                          {
                            value: "journal",
                            title: "Lưu để đọc lại",
                            description: isLoggedIn
                              ? "Lưu vào Góc của tôi để bạn có thể xem lại bất cứ lúc nào, bảo mật an tâm."
                              : "Đăng nhập để lưu vào Góc của tôi và theo dõi hành trình nội tâm của bạn.",
                          },
                          {
                            value: "ephemeral",
                            title: "Thả hoa đăng buông xả",
                            description:
                              "Gửi gắm lời viết thành ánh hoa đăng trôi trên dòng sông 3D. Lời nguyện sẽ tan biến nhẹ nhàng sau phiên này, không lưu trữ.",
                          },
                        ] satisfies {
                          value: WishMode;
                          title: string;
                          description: string;
                        }[]
                      ).map((option) => (
                        <label
                          key={option.value}
                          className={`wish-mode-card ${
                            mode === option.value ? "wish-mode-card--active" : ""
                          }`}
                        >
                          <input
                            type="radio"
                            name="wish-mode"
                            value={option.value}
                            checked={mode === option.value}
                            onChange={() => {
                              setMode(option.value);
                              setSaveError("");
                            }}
                            className="mt-1 h-4 w-4 shrink-0 accent-accent"
                          />

                          <span>
                            <span className="block text-sm font-semibold text-ink">
                              {option.title}
                            </span>

                            <span className="mt-1 block text-xs sm:text-sm leading-relaxed text-muted">
                              {option.description}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted/90 pt-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                      <span>
                        {mode === "journal"
                          ? "Lời gửi gắm được lưu giữ an tâm trong tài khoản riêng tư của bạn, không chia sẻ công khai."
                          : "Ở chế độ hoa đăng, lời viết chỉ xuất hiện trong phiên này để bạn buông xả và không lưu lại bất cứ đâu."}
                      </span>
                    </div>
                  </fieldset>

                  {saveError && (
                    <p role="alert" className="text-sm text-danger">
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
                      className="wish-submit-btn w-full sm:w-auto h-12 px-8 rounded-full whitespace-nowrap inline-flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer"
                    >
                      <span className="wish-btn-sheen" />
                      <span>
                        {isSubmitting
                          ? "Đang gửi gắm…"
                          : mode === "journal"
                            ? isLoggedIn
                              ? "Lưu vào Góc của tôi"
                              : "Đăng nhập để lưu"
                            : "Thả hoa đăng buông xả"}
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
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/30" />
                    
                    {/* Dải lụa đỏ son đung đưa theo gió */}
                    <div className="wishing-silk-streamer">
                      BÌNH AN
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-amber-200 font-semibold">
                      <span>CÂY NGUYỆN ƯỚC DÂN GIAN</span>
                      <span className="bg-black/50 px-2.5 py-0.5 rounded-full border border-amber-400/30 text-[11px] text-amber-300">
                        Dải lụa gửi tâm tư
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 p-5">
                    <h2 className="text-lg font-semibold text-ink font-display">
                      Gửi gắm ước vọng thiện lành
                    </h2>

                    <p className="text-sm leading-relaxed text-muted">
                      Người xưa tin rằng, khi dải lụa đỏ mang theo ước nguyện được buộc lên cành cây cổ thụ,
                      từng cơn gió thoảng qua sẽ chở lời khẩn cầu hòa vào đất trời.
                    </p>

                    <details className="border-t border-line pt-3">
                      <summary className="cursor-pointer py-2 text-sm font-medium text-ink hover:text-accent transition-colors">
                        Gợi ý hướng dòng suy nghĩ ▾
                      </summary>

                      <ul className="mt-2 list-disc space-y-2 pl-5 text-xs sm:text-sm leading-relaxed text-muted">
                        <li>Điều gì khiến bạn băn khoăn nhất lúc này?</li>
                        <li>Có điều gì bạn muốn ghi lại hoặc gửi đến ai đó, nếu thấy phù hợp?</li>
                        <li>Một việc thiện lành bạn tự nhủ sẽ làm trong hôm nay?</li>
                      </ul>
                    </details>

                    <p className="border-t border-line pt-3 text-xs leading-relaxed text-muted">
                      Hoa đăng và dải lụa là hình ảnh văn hóa tượng trưng, giúp tâm trí định an và hướng thiện.
                    </p>
                  </div>
                </div>
              </aside>
            </div>

            {/* Bottom Privacy Banner */}
            <div className="p-6 rounded-card bg-surface border border-line flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-panel bg-surface flex items-center justify-center text-accent flex-shrink-0">
                  <Lock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ink mb-0.5">
                    Thông tin lưu trữ
                  </h4>
                  <p className="text-sm text-muted leading-relaxed max-w-2xl">
                    Chọn lưu để đưa nội dung vào Góc của tôi qua tài khoản.
                    Chọn hiệu ứng buông bỏ để kết thúc mà không ghi nội dung vào nhật ký.
                  </p>
                </div>
              </div>
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

              <h1 tabIndex={-1} className="wish-page-title mb-3 outline-none focus:outline-none flex items-center justify-center">
                <span className="wish-seal-badge" aria-hidden="true">願</span>
                <span>Đã lưu vào Góc của tôi</span>
              </h1>
              <p className="text-sm text-muted max-w-xl mx-auto leading-relaxed">
                Lời gửi gắm đã được lưu vào Góc của tôi qua tài khoản. Bạn có thể
                mở lại để đọc hoặc xóa khi muốn.
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
                    Backend mã hóa nội dung trước khi lưu vào cơ sở dữ liệu và chỉ
                    trả nội dung theo tài khoản đã đăng nhập. Đây không phải mã hóa
                    đầu cuối; backend vẫn có thể giải mã để phục vụ ứng dụng.
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
                “Hít một hơi thật sâu, thả lỏng đôi vai. Bạn vừa trao cho chính mình một cơ
                hội được thấu hiểu.”
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
                Mở Góc của tôi và chọn mục Điều ước & Lời tri ân.
                Bạn có thể xem nội dung, đánh dấu yêu thích hoặc xóa bản ghi.
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
              <nav
                aria-label="Đường dẫn"
                className="wish-release-breadcrumb"
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
                  Đã thả hoa đăng
                </span>
              </nav>

              <span className="wish-release-private">
                <Lock aria-hidden="true" />
                Phiên riêng · Không lưu
              </span>
            </div>

            <header className="wish-release-hero">
              <span className="wish-release-mark" aria-hidden="true">
                <Flower2 />
              </span>
              <div>
                <p className="wish-release-kicker">Hoa đăng an yên</p>
                <h1 tabIndex={-1} className="wish-release-title">
                  Lời nguyện đã được thả
                </h1>
                <p className="wish-release-subtitle">
                  Lời bạn gửi đang trôi trong khung cảnh riêng của phiên này.
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
                      initialWish={pendingLanternWish}
                      currentUserEmail={currentUserEmail}
                    />
                  </Suspense>
                </LanternSceneBoundary>
              </div>
            </section>

            <section className="wish-release-details">
              {pendingLanternWish && (
                <article className="wish-release-wish">
                  <p className="wish-release-detail-label">Lời gửi gắm của bạn</p>
                  <blockquote>{pendingLanternWish}</blockquote>
                </article>
              )}

              <aside className="wish-release-privacy">
                <span className="wish-release-privacy-icon" aria-hidden="true">
                  <Lock />
                </span>
                <div>
                  <h2>Riêng tư trong phiên này</h2>
                  <p>
                    Lời viết không được gửi lên máy chủ, lưu vào nhật ký hay chia sẻ công khai.
                    Rời màn hình sẽ kết thúc phiên hoa đăng.
                  </p>
                </div>
              </aside>
            </section>

            {/* Action Buttons */}
            <div className="wish-release-actions">
              <Button
                variant="default"
                size="lg"
                onClick={onGoToHome}
                className="w-full sm:w-auto px-8 py-3.5 font-semibold shadow-md gap-2"
              >
                <span>Trở về Hôm nay</span>
                <ArrowRight className="w-4 h-4" />
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={handleWriteAnother}
                className="text-xs text-muted border-line"
              >
                Viết điều khác
              </Button>

              {onGoToExplore && (
                <button
                  onClick={onGoToExplore}
                  className="min-h-11 px-3 text-sm font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Khám phá phong thổ văn hóa 3 miền</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <p className="wish-release-aftercare">
              Bạn có thể dừng lại một chút rồi tiếp tục khi thấy sẵn sàng.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
