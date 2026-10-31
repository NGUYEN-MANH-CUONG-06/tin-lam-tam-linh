import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Sparkles,
  Home,
  Compass,
  CheckCircle2,
  Check,
  RotateCcw,
  Flower2,
  Info,
  Scale,
  Share2,
  Bookmark,
  ExternalLink,
  ShieldCheck,
  Waves,
  Sun,
  Flame,
  ChevronDown,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { AppDialog } from "../components/AppDialog";
import {
  TopicType,
  XinXamResult,
  XIN_XAM_TOPICS,
} from "../data/xinXamData";
import {
  drawXinXam,
  loadXinXamAvailability,
  type XinXamAvailability,
} from "../data/reflectionService";
import { ApiError } from "../lib/api";
import { hasCompleteXamPoem, isPublishableXamCard, normalizeXamPoemLines } from "../../../shared/xin-xam-publication.mjs";
import { enterDemoMode, isDemoMode } from "../data/demoMode";
import { readDemoValue, writeDemoValue } from "../data/demoStorage";
import { DetailedReadingUnlock } from "../components/DetailedReadingUnlock";

export type XinXamDrawResult = XinXamResult & {
  drawId: string;
};

interface DemoXinXamSnapshot {
  drawId: string;
  result: XinXamResult;
}

function loadDemoXinXamSnapshot(): DemoXinXamSnapshot | null {
  if (!isDemoMode()) return null;
  const value = readDemoValue<unknown>("xin-xam-current-result-v1", null);
  if (!value || typeof value !== "object") return null;
  const snapshot = value as Partial<DemoXinXamSnapshot>;
  const result = snapshot.result;
  if (typeof snapshot.drawId !== "string" || !result || typeof result !== "object") return null;
  const isText = (item: unknown): item is string => typeof item === "string";
  if (!isText(result.stickNumber) || !isText(result.sealText) || !isText(result.title) || !isText(result.quote)
    || !isText(result.regionSub) || !isText(result.topicTag) || !isText(result.insight)
    || !isText(result.culturalAspect) || !isText(result.relatedArticleId) || !isText(result.relatedArticleTitle)
    || !result.poem || ![result.poem.line1, result.poem.line2, result.poem.line3, result.poem.line4].every(isText)
    || !Array.isArray(result.reflectionParagraphs) || !result.reflectionParagraphs.every(isText)
    || !Array.isArray(result.tips) || !result.tips.every((tip) => tip && isText(tip.title) && isText(tip.desc))
    || !result.microAction || !isText(result.microAction.title) || !isText(result.microAction.desc) || !isText(result.microAction.duration)
    || !result.metadata || typeof result.metadata !== "object") return null;
  if (!XIN_XAM_TOPICS.includes(result.topic)) return null;
  return snapshot as DemoXinXamSnapshot;
}

interface XinXamScreenProps {
  onBackToExperienceHome?: () => void;
  onGoToArticle?: (articleId: string) => void;
  onSaveToAccount?: (result: XinXamDrawResult) => boolean | Promise<boolean>;
  onGoToLogin?: () => void;
  onGoToExplore?: () => void;
  onGoToWish?: () => void;
  onGoToXinKeo?: (drawId: string) => void;
  isLoggedIn?: boolean;
  savedXamList?: {
    drawId?: string;
  }[];
}

export const XinXamScreen: React.FC<XinXamScreenProps> = ({
  onBackToExperienceHome,
  onGoToArticle,
  onSaveToAccount,
  onGoToLogin,
  onGoToExplore,
  onGoToWish,
  onGoToXinKeo,
  isLoggedIn = false,
  savedXamList,
}) => {
  const [demoSnapshot] = useState(loadDemoXinXamSnapshot);
  const [step, setStep] = useState<1 | 2 | 3>(demoSnapshot ? 3 : 1);
  const selectedRegion = "Toàn quốc" as const;
  const [selectedTopic, setSelectedTopic] = useState<TopicType>(demoSnapshot?.result.topic ?? "Bình an");

  const [availability, setAvailability] =
    useState<XinXamAvailability | null>(null);

  const [availabilityLoading, setAvailabilityLoading] =
    useState(true);

  const [availabilityError, setAvailabilityError] =
    useState("");

  const [availabilityAttempt, setAvailabilityAttempt] =
    useState(0);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    setAvailability(null);
    setAvailabilityLoading(true);
    setAvailabilityError("");

    void loadXinXamAvailability(
      "Toàn quốc",
      selectedTopic,
      { signal: controller.signal },
    )
      .then((result) => {
        if (!active) return;
        setAvailability(result);
      })
      .catch(() => {
        if (!active) return;

        setAvailabilityError(
          "Chưa kết nối được. Bạn hãy kiểm tra mạng rồi thử lại.",
        );
      })
      .finally(() => {
        if (active) {
          setAvailabilityLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [
    selectedTopic,
    availabilityAttempt,
  ]);

  const availabilityMatchesSelection =
    availability?.region === "Toàn quốc" &&
    availability?.topic === selectedTopic;

  const canContinueDraw =
    !availabilityLoading &&
    !availabilityError &&
    availabilityMatchesSelection &&
    availability?.available === true &&
    availability.count > 0;

  // Step 2 Interactive States
  const [drawPhase, setDrawPhase] = useState<"idle" | "shaking" | "dropped">("idle");
  const [isShaking, setIsShaking] = useState(false);
  const [isGentleMotion, setIsGentleMotion] = useState(true);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Step 3 State
  const [isActionDone, setIsActionDone] = useState(false);
  const [currentDrawId, setCurrentDrawId] =
    useState<string | null>(demoSnapshot?.drawId ?? null);
  const [saveError, setSaveError] = useState("");
  const [drawNotice, setDrawNotice] = useState("");

  const drawTimerRef = useRef<
    ReturnType<typeof setTimeout> | null
  >(null);
  const requestLockRef = useRef(false);

  const [isRequestingDraw, setIsRequestingDraw] =
    useState(false);

  const drawRequestVersionRef = useRef(0);

  const drawRequestControllerRef =
    useRef<AbortController | null>(null);

  const drawRequestTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(null);

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [currentResult, setCurrentResult] = useState<XinXamResult | null>(demoSnapshot?.result ?? null);
  const lastSelectedTopicRef = useRef(selectedTopic);

  const cancelDrawRequest = () => {
    drawRequestVersionRef.current += 1;

    drawRequestControllerRef.current?.abort();
    drawRequestControllerRef.current = null;

    if (drawRequestTimeoutRef.current !== null) {
      clearTimeout(drawRequestTimeoutRef.current);
      drawRequestTimeoutRef.current = null;
    }

    if (drawTimerRef.current !== null) {
      clearTimeout(drawTimerRef.current);
      drawTimerRef.current = null;
    }

    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }

    requestLockRef.current = false;
  };

  // Đổi vùng/chủ đề: hủy lượt cũ và xóa kết quả cũ.
  useEffect(() => {
    if (lastSelectedTopicRef.current === selectedTopic) return;
    lastSelectedTopicRef.current = selectedTopic;
    cancelDrawRequest();

    setCurrentResult(null);
    setCurrentDrawId(null);
    if (isDemoMode()) writeDemoValue("xin-xam-current-result-v1", null);
    setIsRequestingDraw(false);
    setIsShaking(false);
    setDrawPhase("idle");
    setIsActionDone(false);
    setSaveError("");
    setDrawNotice("");
  }, [selectedTopic]);

  // Rời bước rút: không nhận thêm phản hồi của lượt đang chạy.
  // Giữ currentResult để bước 3 vẫn đọc được kết quả đã nhận.
  useEffect(() => {
    if (step !== 2) {
      cancelDrawRequest();

      setIsRequestingDraw(false);
      setIsShaking(false);
      setDrawPhase("idle");
    }
  }, [step]);

  // Rời màn hình: dọn request và timer.
  useEffect(() => {
    return () => {
      cancelDrawRequest();
    };
  }, []);

  const handleStartDraw = async () => {
    if (step !== 2) return;

    if (!canContinueDraw) {
      setDrawNotice(
        "Lựa chọn này chưa sẵn sàng. Hãy quay lại bước chọn và kiểm tra thư viện.",
      );
      return;
    }

    if (
      requestLockRef.current ||
      drawTimerRef.current !== null
    ) {
      return;
    }

    requestLockRef.current = true;

    const version = ++drawRequestVersionRef.current;
    const controller = new AbortController();

    drawRequestControllerRef.current = controller;

    let timedOut = false;

    setIsRequestingDraw(true);
    setCurrentResult(null);
    setCurrentDrawId(null);
    if (isDemoMode()) writeDemoValue("xin-xam-current-result-v1", null);
    setDrawPhase("idle");
    setIsShaking(false);
    setDrawNotice("");
    setSaveError("");

    drawRequestTimeoutRef.current = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 12_000);

    let remote: Awaited<ReturnType<typeof drawXinXam>>;

    try {
      remote = await drawXinXam(
        selectedRegion,
        selectedTopic,
        undefined,
        { signal: controller.signal },
      );
    } catch (error) {
      // Lượt đã bị hủy hoặc thay thế: không cập nhật UI.
      if (version !== drawRequestVersionRef.current) return;

      setDrawNotice(
        timedOut
          ? "Máy chủ phản hồi chậm. Chưa có kết quả được xác nhận để hiển thị. Bạn có thể thử lại."
          : error instanceof ApiError &&
              error.status === 404
            ? "Chủ đề này hiện chưa mở được. Bạn có thể thử lại sau."
            : "Chưa lấy được thẻ. Bạn hãy kiểm tra kết nối rồi thử lại.",
      );

      setIsRequestingDraw(false);
      requestLockRef.current = false;
      return;
    } finally {
      if (version === drawRequestVersionRef.current) {
        if (drawRequestTimeoutRef.current !== null) {
          clearTimeout(drawRequestTimeoutRef.current);
          drawRequestTimeoutRef.current = null;
        }

        drawRequestControllerRef.current = null;
      }
    }

    if (version !== drawRequestVersionRef.current) return;

    if (controller.signal.aborted) {
      setDrawNotice(
        "Yêu cầu đã hết thời gian chờ. Hãy thử lại.",
      );

      setIsRequestingDraw(false);
      requestLockRef.current = false;
      return;
    }

    const poemLines = normalizeXamPoemLines(remote.poem || "");

    const publishable = isDemoMode()
      ? Boolean(remote.source && hasCompleteXamPoem(remote.poem || "") && remote.meaning.trim() && remote.advice.trim())
      : isPublishableXamCard({
      active: remote.active,
      verified: remote.verified,
      xam_type: remote.xamType,
      source: remote.source,
      poem: poemLines,
      interpretations: [
        remote.meaning,
        remote.advice,
      ],
    });

    if (!publishable) {
      setDrawNotice(
        "Lượt xin xăm chưa thể hoàn tất. Bạn hãy thử lại sau.",
      );

      setIsRequestingDraw(false);
      requestLockRef.current = false;
      return;
    }

    const nextDrawId = remote.drawId || remote.id;

    const chosen: XinXamResult = {
      resultToken: remote.resultToken,
      metadata: remote.originalContent.metadata,
      aiExplanation: remote.aiExplanation || undefined,
      source: remote.source || "",
      verified: remote.verified,
      stickNumber: remote.stickNumber,

      region: remote.region as XinXamResult["region"],
      regionSub: remote.region,
      topic: selectedTopic,
      topicTag: remote.category || selectedTopic,

      title:
        `Thẻ xin xăm ${remote.stickNumber} — ${remote.classification}`,

      quote: remote.originalContent.poem || "",

      poem: {
        line1: poemLines[0],
        line2: poemLines[1],
        line3: poemLines[2],
        line4: poemLines[3],
      },

      sealText: remote.classification,
      fortuneType: remote.classification,
      category: remote.category,
      insight: remote.classification,

      reflectionParagraphs: [
        remote.originalContent.meaning,
        remote.disclaimer,
      ],

      tips: [
        ...(remote.proverb
          ? [
              {
                title: "Thành ngữ hoặc tục ngữ đi cùng thẻ",
                desc:
                  `“${remote.proverb.content}” — ` +
                  remote.proverb.meaning,
              },
            ]
          : []),

        {
          title: "Gợi ý chiêm nghiệm",
          desc: remote.originalContent.advice,
        },

        ...(remote.aiExplanation
          ? [
              {
                title: "Gợi ý do AI tạo",
                desc: remote.aiExplanation.content,
              },
            ]
          : []),

        {
          title: "Lưu ý tham khảo",
          desc: remote.interpretation.warning,
        },
      ],

      culturalAspect: "",
      relatedArticleId: "",
      relatedArticleTitle: "",

      microAction: {
        title: "",
        desc: "",
        duration: "",
      },
    };

    setIsRequestingDraw(false);
    setIsShaking(true);
    setIsActionDone(false);
    setDrawPhase("shaking");

    setDrawNotice(
      isLoggedIn
        ? ""
        : "Kết quả chưa được lưu vào tài khoản.",
    );

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (!reducedMotion) {
      try {
        navigator.vibrate?.([60, 40, 60]);
      } catch {
        // Rung chỉ là hiệu ứng bổ trợ.
      }
    }

    drawTimerRef.current = setTimeout(() => {
      if (version !== drawRequestVersionRef.current) return;

      drawTimerRef.current = null;
      requestLockRef.current = false;

      setCurrentResult(chosen);
      setCurrentDrawId(nextDrawId);
      if (isDemoMode()) writeDemoValue("xin-xam-current-result-v1", { drawId: nextDrawId, result: chosen } satisfies DemoXinXamSnapshot);
      setIsShaking(false);
      setDrawPhase("dropped");
    }, reducedMotion ? 200 : 1800);
  };

  const playBambooRattle = () => {
    try {
      const AudioContextType = window.AudioContext;
      if (!AudioContextType) return;
      const context = new AudioContextType();
      const startAt = context.currentTime;
      for (let index = 0; index < 12; index += 1) {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const at = startAt + index * 0.11;
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(620 + Math.random() * 240, at);
        gain.gain.setValueAtTime(0.055, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.045);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(at);
        oscillator.stop(at + 0.05);
      }
      window.setTimeout(() => { void context.close(); }, 1800);
    } catch {
      // Âm thanh là bổ trợ; thao tác vẫn dùng được khi trình duyệt chặn Web Audio.
    }
  };

  const beginHeldDraw = (event: React.PointerEvent<HTMLElement>) => {
    event.preventDefault();
    if (requestLockRef.current || holdTimerRef.current !== null) return;
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      playBambooRattle();
      void handleStartDraw();
    }, 1500);
  };

  const cancelHeldDraw = () => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  const handleKeyboardDraw = (event: React.MouseEvent<HTMLElement>) => {
    if (event.detail === 0) void handleStartDraw();
  };

  const isCardSaved =
    isLoggedIn &&
    currentDrawId !== null &&
    (savedXamList ?? []).some(
      (item) => item.drawId === currentDrawId
    );

  const handleSaveResult = async () => {
    if (isCardSaved) return;

    setSaveError("");

    if (!currentDrawId || !currentResult) {
      setSaveError(
        "Bạn hãy hoàn tất một lượt rút trước khi lưu."
      );
      return;
    }

    if (!onSaveToAccount) {
      setSaveError("Chức năng lưu chưa sẵn sàng trong phiên này.");
      return;
    }

    let saved = false;

    try {
      saved = await onSaveToAccount({
        ...currentResult,
        drawId: currentDrawId,
      }) === true;
    } catch {
      setSaveError("Chưa lưu được thẻ. Bạn hãy thử lại.");
      return;
    }

    if (saved) return;

    // Với khách, callback của App chuyển sang đăng nhập.
    if (isLoggedIn) {
      setSaveError(
        "Chưa lưu được thẻ trên trình duyệt này. Bạn hãy thử lại."
      );
    }
  };

  return (
    <div className="screen-shell">
      <main className="page-container max-w-5xl">
        {isRequestingDraw && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
          >
            Đang chuẩn bị trải nghiệm…
          </p>
        )}
        {step === 1 && availabilityError && (
          <p role="alert" className="mb-5 text-sm leading-relaxed text-danger">
            {availabilityError}
            <button
              type="button"
              className="ml-2 font-semibold underline underline-offset-2"
              onClick={() => setAvailabilityAttempt((value) => value + 1)}
            >
              Thử lại
            </button>
            {!isDemoMode() && (
              <button
                type="button"
                className="ml-3 font-semibold underline underline-offset-2"
                onClick={enterDemoMode}
              >
                Mở bản demo
              </button>
            )}
          </p>
        )}
        {saveError && (
          <p
            role="alert"
            className="mb-5 rounded-panel border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger leading-relaxed"
          >
            {saveError}
          </p>
        )}
        {drawNotice && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted leading-relaxed"
          >
            {drawNotice}
          </p>
        )}
        {/* BƯỚC 1: KHỞI TÂM NGUYỆN */}
        {step === 1 && (
          <div className="min-h-[58vh] flex flex-col justify-between">
            <div>
              {/* Top Breadcrumb & Step Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <span
                    onClick={onBackToExperienceHome}
                    className="hover:text-accent cursor-pointer transition-colors"
                  >
                    Trải nghiệm
                  </span>
                  <span>/</span>
                  <span className="text-accent font-semibold">Xin xăm văn hóa</span>
                </div>

                <div className="flex items-center gap-2.5">
                  {onGoToWish && (
                    <button
                      onClick={onGoToWish}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line text-xs font-medium text-accent hover:bg-surface transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gửi gắm điều ước</span>
                    </button>
                  )}
                  <div className="flex items-center gap-1.5 uppercase font-semibold text-xs text-muted">
                    <span className="w-2 h-2 rounded-full bg-action inline-block"></span>
                    <span>BƯỚC 1 / 3 • KHỞI TÂM NGUYỆN</span>
                  </div>
                </div>
              </div>

              {/* Heading & Subtitle */}
              <div className="mb-6 text-left">
                <h1 className="page-title mb-3">
                  Chọn một điều bạn muốn chiêm nghiệm
                </h1>
                <p className="text-sm sm:text-base text-muted leading-relaxed max-w-2xl m-0">
                  Lắng lòng suy ngẫm về phương diện bạn đang trăn trở nhất lúc này để đón nhận lời gửi gắm chân thành từ quẻ xăm.
                </p>
              </div>

              {/* Chọn chủ đề bạn đang lắng đọng */}
              <fieldset className="min-w-0 mb-6">
                <legend className="mb-3.5 text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  <span>Phương diện tâm nguyện</span>
                </legend>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(
                    XIN_XAM_TOPICS satisfies TopicType[]
                  ).map((topic) => {
                    const isSelected = selectedTopic === topic;
                    return (
                      <label
                        key={topic}
                        className={`flex min-h-16 cursor-pointer items-center justify-between gap-3 rounded-2xl border px-4 py-3.5 transition-all shadow-2xs ${
                          isSelected
                            ? "border-accent bg-accent/8 ring-2 ring-accent/20 text-accent font-semibold shadow-xs"
                            : "border-line bg-surface hover:border-accent/30 text-ink"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-accent/15 text-accent"
                              : "bg-surface-soft text-muted"
                          }`}>
                            {topic === "Học tập" ? (
                              <BookOpen className="w-4 h-4" />
                            ) : topic === "Công việc" ? (
                              <Briefcase className="w-4 h-4" />
                            ) : topic === "Gia đình" ? (
                              <Home className="w-4 h-4" />
                            ) : (
                              <Flower2 className="w-4 h-4" />
                            )}
                          </span>
                          <span className="text-sm font-semibold truncate">{topic}</span>
                        </div>

                        <input
                          type="radio"
                          name="xam-topic"
                          value={topic}
                          checked={isSelected}
                          onChange={() => setSelectedTopic(topic)}
                          className="h-4 w-4 shrink-0 accent-accent"
                        />
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              {/* Selection Summary Callout Box */}
              <Card className="p-5 rounded-2xl bg-surface border border-line flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shadow-2xs">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-accent mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>TÂM NGUYỆN CỦA BẠN</span>
                  </div>
                  <div className="text-lg font-bold text-ink mb-1 font-display">
                    Bạn đã chọn:{" "}
                    <span className="text-accent underline decoration-accent/40 underline-offset-4">
                      {selectedTopic}
                    </span>
                  </div>
                  <div className="text-xs text-muted italic">
                    ✦ Gợi ý: Hãy giữ hơi thở nhẹ nhàng và tâm thế thả lỏng trước khi rút thẻ xăm.
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0">
                  {onBackToExperienceHome && (
                    <button
                      type="button"
                      onClick={onBackToExperienceHome}
                      className="w-full sm:w-auto h-12 px-5 rounded-full border border-line/80 bg-surface hover:bg-surface-soft text-ink/80 text-sm font-medium inline-flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-2xs"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Quay lại Trải nghiệm</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={!canContinueDraw}
                    onClick={() => {
                      if (!canContinueDraw) return;
                      setStep(2);
                      window.scrollTo({ top: 0, behavior: "auto" });
                    }}
                    className={`w-full sm:w-auto h-12 px-6 rounded-full text-sm font-semibold inline-flex items-center justify-center gap-2 transition-all cursor-pointer whitespace-nowrap shadow-sm ${
                      canContinueDraw
                        ? "bg-accent text-white hover:bg-accent/90 hover:shadow-md"
                        : "bg-surface-soft text-muted border border-line cursor-not-allowed opacity-60"
                    }`}
                  >
                    <span>Tiếp tục rút thẻ</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </Card>

              {!availabilityLoading &&
                !availabilityError &&
                availabilityMatchesSelection &&
                !canContinueDraw && (
                  <p role="status" className="mb-5 text-sm text-muted">
                    Chủ đề này hiện chưa mở được. Hãy chọn một chủ đề khác để tiếp tục.
                    {!isDemoMode() && (
                      <button
                        type="button"
                        className="ml-2 font-semibold text-accent underline underline-offset-2"
                        onClick={enterDemoMode}
                      >
                        Mở bản demo
                      </button>
                    )}
                  </p>
                )}
            </div>

            {/* Editorial Principle Disclaimer */}
            <div className="p-4 rounded-xl bg-surface/70 border border-line flex items-center gap-3 text-xs text-muted leading-relaxed mb-6">
              <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
              <span>
                <strong>Lời nhắc:</strong> Lời quẻ là gợi ý văn hóa để suy ngẫm, không dự báo tương lai hoặc thay thế quyết định cá nhân.
              </span>
            </div>
          </div>
        )}

        {/* =========================================================================
            BƯỚC 2: LẮNG ĐỘNG RÚT THẺ (IMAGE 2)
           ========================================================================= */}
        {step === 2 && (
          <div>
            {/* Top Navigation & Step Indicator */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 text-xs text-muted">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="hover:text-accent cursor-pointer transition-colors"
                >
                  Trải nghiệm
                </button>
                <span>/</span>
                <span className="text-muted/80">Xin xăm văn hóa</span>
                <span>/</span>
                <span className="text-accent font-semibold">Rút thẻ</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface border border-line text-xs font-semibold uppercase tracking-wider text-muted shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                  <span>Bước 2 / 3 • Rút thẻ</span>
                </div>
              </div>
            </div>

            {/* Centered Sacred Heading with Active Context Capsule */}
            <div className="text-center max-w-xl mx-auto mb-6">
              {/* Active Topic Capsule Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface/90 border border-line/80 shadow-2xs text-xs text-muted mb-3 hover:border-accent/40 transition-all">
                <Flower2 className="w-3.5 h-3.5 text-accent shrink-0" />
                <span>
                  Tâm nguyện: <strong className="text-ink font-semibold">{selectedTopic}</strong>
                </span>
                <span className="text-line-strong">•</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-accent hover:underline font-semibold cursor-pointer inline-flex items-center gap-1 transition-colors"
                  title="Chọn lại chủ đề tâm nguyện khác"
                >
                  <span>Đổi</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <h1 className="page-title mb-2 text-2xl sm:text-3xl text-ink font-display">
                Lắng lòng và rút một thẻ xăm
              </h1>
              <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-md mx-auto">
                Giữ hơi thở chậm rãi, tĩnh tâm trong một khoảnh khắc ngắn để đón nhận thông điệp phù hợp hôm nay.
              </p>
            </div>

            {/* Center Altar: Sacred Space with Focused Vertical Footprint */}
            <div className="max-w-xl mx-auto py-1 sm:py-2 text-center relative mb-8">
              {/* Concentric Circle Aura Motif */}
              <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto mb-3 flex items-center justify-center">
                {/* Golden/Warm Ambient Aura */}
                <div
                  className={`absolute inset-0 rounded-full transition-all duration-700 pointer-events-none blur-2xl ${
                    drawPhase === "dropped"
                      ? "bg-gradient-to-b from-amber-400/25 via-amber-500/15 to-transparent scale-110"
                      : isShaking
                      ? "bg-gradient-to-b from-amber-500/20 via-amber-500/10 to-transparent animate-pulse"
                      : "bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent"
                  }`}
                />
                <div className="absolute inset-3 rounded-full border border-line/50" />
                <div className="absolute inset-8 rounded-full border border-dashed border-line/40" />

                {/* Khu vực Bó Xăm & Thẻ Tre Rơi */}
                <div className="relative flex flex-col items-center justify-center z-10 w-full">
                  {/* Ống xăm thuần Việt & Bó xăm 13 que đầy đặn */}
                  <div
                    role="button"
                    tabIndex={0}
                    onPointerDown={beginHeldDraw}
                    onPointerUp={cancelHeldDraw}
                    onPointerCancel={cancelHeldDraw}
                    onPointerLeave={cancelHeldDraw}
                    onClick={handleKeyboardDraw}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        void handleStartDraw();
                      }
                    }}
                    className={`relative flex flex-col items-center select-none touch-none transition-transform duration-300 cursor-pointer ${
                      isShaking ? "anim-xam-up-down" : "hover:scale-105 active:scale-95"
                    }`}
                    title={
                      isShaking
                        ? "Đang lắc xăm lên xuống..."
                        : drawPhase === "dropped"
                        ? `Thẻ số ${currentResult?.stickNumber ?? "—"} đã nhô lên`
                        : "Chạm giữ 1,5 giây để lắc ống xăm"
                    }
                  >
                    {/* 1. BÓ QUE XĂM: 13 que cắm san sát dày dặn trong miệng ống */}
                    <div className="flex items-end justify-center -space-x-1 sm:-space-x-1.5 pointer-events-none relative z-10 px-2 overflow-visible">
                      {[
                        { num: "05", h: 84, rot: -7 },
                        { num: "18", h: 90, rot: -5 },
                        { num: "33", h: 86, rot: -4 },
                        { num: "12", h: 93, rot: -3 },
                        { num: "21", h: 88, rot: -2 },
                        { num: "07", h: 95, rot: -1 },
                        // QUE CHÍNH Ở GIỮA
                        { isMain: true, num: currentResult?.stickNumber ?? "—", h: 98, rot: 0 },
                        { num: "16", h: 95, rot: 1 },
                        { num: "28", h: 88, rot: 2 },
                        { num: "45", h: 93, rot: 3 },
                        { num: "68", h: 86, rot: 4 },
                        { num: "79", h: 90, rot: 5 },
                        { num: "88", h: 84, rot: 7 },
                      ].map((s, idx) => {
                        const isChosen = s.isMain;
                        return (
                          <div
                            key={idx}
                            style={{
                              height: `${s.h}px`,
                              transform:
                                isChosen && drawPhase === "dropped"
                                  ? "translateY(-48px) rotate(0deg)"
                                  : isChosen && isShaking
                                  ? "translateY(-28px) rotate(0deg)"
                                  : `rotate(${s.rot}deg)`,
                              transformOrigin: "bottom center",
                            }}
                            className={`w-3.5 sm:w-4 rounded-t-sm flex flex-col overflow-hidden border border-[#8a5525] shadow-xs transition-all duration-500 ${
                              isChosen && drawPhase === "dropped"
                                ? "z-40 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.95)]"
                                : isChosen
                                ? "z-30"
                                : "z-10"
                            } ${
                              isShaking && !isChosen
                                ? idx % 2 === 0
                                ? "anim-stick-bounce"
                                : "anim-stick-bounce-alt"
                                : ""
                            }`}
                          >
                            {/* Nửa trên đỏ son chu sa */}
                            <div
                              className={`w-full h-1/2 flex items-center justify-center ${
                                isChosen
                                  ? "bg-gradient-to-b from-[#bd2626] to-[#871616]"
                                  : "bg-[#9e2424]"
                              }`}
                            >
                              {isChosen && drawPhase === "dropped" && (
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse shadow-xs" />
                              )}
                            </div>

                            {/* Nửa dưới ngà tre khắc số mực đen rõ nét */}
                            <div
                              className={`w-full h-1/2 flex items-start justify-center pt-0.5 ${
                                isChosen
                                  ? "bg-gradient-to-b from-[#fffaf0] to-[#f5ead2]"
                                  : "bg-[#f5ead2]"
                              }`}
                            >
                              <span
                                className={`[writing-mode:vertical-rl] leading-none ${
                                  isChosen
                                    ? "text-[10px] font-black text-[#7a141b] tracking-wider"
                                    : "text-[8px] font-bold text-[#2b180d] opacity-90"
                                }`}
                              >
                                {s.num}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* 2. THÂN ỐNG TRE HÌNH TRỤ CÓ ĐAI ĐỎ CHỮ VIỆT & CHỮ THƯ PHÁP "TÂM" */}
                    <div
                      className="w-34 sm:w-40 h-44 sm:h-48 rounded-2xl relative flex flex-col items-center justify-between p-0 z-20 overflow-hidden shadow-2xl border border-[#7a481d] -mt-3.5"
                      style={{
                        background:
                          "linear-gradient(90deg, #965b25 0%, #c4833f 15%, #df9f58 35%, #f2be7e 50%, #d89852 68%, #ba7733 85%, #884d1c 100%)",
                        boxShadow:
                          "inset 2px 0 5px rgba(255,255,255,0.25), inset -2px 0 6px rgba(0,0,0,0.4), 0 16px 32px rgba(35,20,10,0.35)",
                      }}
                    >
                      {/* Miệng Ống Tre & Đai Đỏ Chữ Việt */}
                      <div className="w-full">
                        <div className="w-full h-1.5 bg-[#663812] border-b border-[#d89750]/40" />

                        <div className="w-full h-9 bg-gradient-to-r from-[#7a1518] via-[#a31f24] to-[#6e1114] border-y border-[#d4af37]/60 flex items-center justify-center shadow-inner">
                          <span
                            className="text-[11px] sm:text-xs font-serif font-bold tracking-[0.2em] uppercase"
                            style={{ color: "#f8e192" }}
                          >
                            ✦ AN NHIÊN ✦
                          </span>
                        </div>
                      </div>

                      {/* Thân Ống Tre: Chữ Thư Pháp Quốc Ngữ "Tâm" Mực Đen Thuần Việt */}
                      <div className="my-auto flex flex-col items-center justify-center select-none py-1">
                        <span
                          className="font-serif italic font-black text-4xl sm:text-5xl tracking-tight leading-none"
                          style={{
                            color: "#18100a",
                            textShadow: "0 1px 2px rgba(255,230,190,0.35)",
                            fontFamily: "var(--font-fraunces), serif",
                          }}
                        >
                          Tâm
                        </span>
                        <span className="text-[9px] uppercase font-bold tracking-widest text-[#5c3716] mt-1">
                          An Lạc
                        </span>
                      </div>

                      {/* Đáy Ống Tre bo cong tự nhiên */}
                      <div className="w-full h-3 bg-gradient-to-t from-[#5a300d] to-transparent rounded-b-2xl border-t border-[#462408]/30" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Indicator & Action Section */}
              <div className="space-y-3 mb-2">
                {drawPhase === "dropped" ? (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Thẻ xăm đã ứng hiện</span>
                      </div>
                      <h3 className="font-display font-bold text-xl sm:text-2xl text-ink">
                        Thẻ xăm số {currentResult?.stickNumber ?? "—"}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted max-w-md mx-auto leading-relaxed">
                        Thẻ tre đã nhô cao đón chào bạn. Mời bạn mở xem lời quẻ chiêm nghiệm và thông điệp dành riêng cho bạn.
                      </p>
                    </div>

                    <div className="flex flex-col items-center gap-2.5 w-full max-w-sm mx-auto pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(3);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className="w-full h-12 sm:h-13 px-6 rounded-full bg-accent hover:bg-accent/90 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 inline-flex items-center justify-center gap-2.5 text-sm sm:text-base cursor-pointer hover:-translate-y-0.5 active:scale-95"
                      >
                        <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
                        <span>Xem chiêm nghiệm thẻ số {currentResult?.stickNumber ?? "—"}</span>
                        <ArrowRight className="w-4 h-4 shrink-0" />
                      </button>

                      <button
                        type="button"
                        onPointerDown={beginHeldDraw}
                        onPointerUp={cancelHeldDraw}
                        onPointerCancel={cancelHeldDraw}
                        onPointerLeave={cancelHeldDraw}
                        onClick={handleKeyboardDraw}
                        disabled={isRequestingDraw || isShaking}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-line bg-surface hover:bg-surface-soft text-xs text-muted hover:text-ink font-medium transition-all cursor-pointer shadow-2xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Giữ 1,5 giây để lắc lại thẻ khác</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs sm:text-sm text-muted font-medium">
                      {isShaking
                        ? "Đang lắng lòng lắc ống xăm, tâm thành ý tịnh…"
                        : "Chạm vào ống xăm hoặc nhấn giữ nút bên dưới trong 1,5 giây"}
                    </p>

                    <div className="flex flex-col items-center justify-center gap-2.5">
                      <button
                        type="button"
                        onPointerDown={beginHeldDraw}
                        onPointerUp={cancelHeldDraw}
                        onPointerCancel={cancelHeldDraw}
                        onPointerLeave={cancelHeldDraw}
                        onClick={handleKeyboardDraw}
                        disabled={isRequestingDraw || isShaking}
                        className={`w-full sm:w-auto h-12 sm:h-13 px-8 rounded-full text-sm sm:text-base font-semibold inline-flex items-center justify-center gap-2.5 transition-all duration-300 shadow-md cursor-pointer select-none active:scale-95 ${
                          isShaking
                            ? "bg-accent/80 text-white cursor-wait animate-pulse"
                            : "bg-accent hover:bg-accent/90 text-white hover:shadow-lg hover:-translate-y-0.5"
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
                        <span>
                          {isRequestingDraw
                            ? "Đang đón thẻ…"
                            : isShaking
                              ? "Đang lắc ống xăm…"
                              : "Giữ 1,5 giây để lắc ống xăm"}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setShowGuideModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface/80 hover:bg-surface border border-line/80 text-xs text-muted hover:text-accent hover:border-accent/40 transition-all cursor-pointer shadow-2xs"
                      >
                        <Info className="w-3.5 h-3.5 text-accent" />
                        <span>Xem hướng dẫn chiêm nghiệm</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 3 Cultural Guidance Cards (Sophisticated Card Grid) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-line/60 mb-8">
              <div className="p-4 sm:p-5 rounded-2xl bg-surface/70 border border-line/70 text-left space-y-2 hover:bg-surface transition-all shadow-2xs hover:shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Flame className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent font-display">
                    01 • Tâm thành ý tịnh
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Trước khi rút thẻ, buông xả toan tính được mất. Giữ lòng thanh thản để đón nhận lời khuyên với tâm thế sáng tỏ.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-surface/70 border border-line/70 text-left space-y-2 hover:bg-surface transition-all shadow-2xs hover:shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Compass className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent font-display">
                    02 • Tự soi chiếu tâm tư
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Lời quẻ dân gian tựa chiếc gương phản chiếu nỗi lòng, giúp nhận ra điều gì cần gìn giữ và điều gì nên buông bỏ.
                </p>
              </div>

              <div className="p-4 sm:p-5 rounded-2xl bg-surface/70 border border-line/70 text-left space-y-2 hover:bg-surface transition-all shadow-2xs hover:shadow-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-accent shrink-0">
                    <Sun className="w-3.5 h-3.5 text-accent" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent font-display">
                    03 • Thuận lẽ tự nhiên
                  </span>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Quẻ lành hay quẻ nhẫn nại đều hướng về đạo lý làm người. Tâm an vạn sự ắt sẽ hanh thông, tự tại.
                </p>
              </div>
            </div>

            {/* Cultural & Legal Philosophy Banner */}
            <Card className="p-5 sm:p-6 rounded-2xl bg-surface/90 border border-line/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 shadow-2xs">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0 shadow-2xs">
                  <Scale className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h4 className="font-display font-bold text-base text-ink mb-1">
                    Chiêm nghiệm văn hóa — Không mê tín dị đoan
                  </h4>
                  <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-xl">
                    Trải nghiệm chiêm nghiệm văn hóa, không phải dự báo chắc chắn tương lai. Tin Lắm Tâm Linh hướng tới việc tiếp nhận di sản tập tục dân gian như một liệu pháp tinh thần tích cực, vun bồi sự bình an và trân trọng khoảnh khắc hiện tại.
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-muted shrink-0 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-line/60 pt-3 sm:pt-0 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-ink/80">Miễn phí trải nghiệm</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-ink/80">Không quảng cáo thương mại</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="font-medium text-ink/80">Bảo mật & riêng tư tuyệt đối</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* =========================================================================
            BƯỚC 3: KẾT QUẢ CHIÊM NGHIỆM (IMAGE 3)
           ========================================================================= */}
        {step === 3 && currentResult && (
          <div>
            {/* Top Consolidated Breadcrumb & Step Badge */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted mb-6 pb-3.5 border-b border-line/80">
              <nav aria-label="Breadcrumb" className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setStep(1)}
                  className="hover:text-accent cursor-pointer transition-colors"
                >
                  Trải nghiệm
                </button>
                <span className="text-line">›</span>
                <button
                  onClick={() => setStep(1)}
                  className="hover:text-accent cursor-pointer transition-colors"
                >
                  Xin xăm ({selectedTopic})
                </button>
                <span className="text-line">›</span>
                <span className="text-accent font-semibold">Thẻ số {currentResult.stickNumber}</span>
              </nav>

              <div className="flex items-center gap-2 uppercase font-medium text-xs text-muted">
                <span className="w-2 h-2 rounded-full bg-action inline-block" />
                <span>BƯỚC 3 / 3 • {currentResult.sealText}</span>
              </div>
            </div>

            {/* Main Editorial Header */}
            <div className="mb-8 text-left max-w-3xl">
              <div className="text-xs font-bold uppercase tracking-wider text-accent mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lời quẻ chiêm nghiệm</span>
              </div>
              <h1 className="page-title mb-3 text-2xl sm:text-3xl lg:text-4xl text-ink font-display">
                Lời gửi gắm từ Thẻ xăm số {currentResult.stickNumber}
              </h1>
              <p className="text-base sm:text-lg text-muted leading-relaxed max-w-2xl">
                Quẻ xăm hướng tâm bạn về phương diện{" "}
                <span className="font-semibold text-accent underline decoration-accent/40 underline-offset-4">
                  {currentResult.topic.toLowerCase()}
                </span>
                {currentResult.insight ? ` — ${currentResult.insight}. Giữ tâm an định để đón nhận điều lành và thấu suốt bài học phía trước.` : " — Hướng về sự tĩnh tâm và sáng tỏ trong tâm hồn."}
              </p>
            </div>

            {/* Two Column Layout: Sacred Bamboo Slip & Literary Essay */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-8 items-start">
              {/* Left Column (5 columns): The Sacred Parchment Bamboo Slip (Sticky on desktop) */}
              <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-24 self-start">
                <div className="rounded-2xl p-5 sm:p-6 bg-surface border border-line shadow-sm relative overflow-hidden text-center flex flex-col justify-between min-h-[480px]">
                  {/* Subtle inner paper glow */}
                  <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-amber-500/5 pointer-events-none" />

                  {/* Card Header */}
                  <div className="relative z-10">
                    <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted font-medium mb-4 border-b border-line/60 pb-3">
                      <span className="flex items-center gap-1.5 font-semibold text-accent">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                        <span>DI SẢN TRUYỀN THỐNG</span>
                      </span>
                      <span className="text-[11px] font-semibold text-muted tracking-wider">
                        {currentResult.region}
                      </span>
                    </div>

                    <div className="text-xs font-bold uppercase tracking-widest text-accent mb-1">
                      THẺ SỐ {currentResult.stickNumber}
                    </div>

                    <h2 className="section-title text-xl sm:text-2xl leading-snug mb-5 text-ink font-display">
                      {currentResult.title}
                    </h2>

                    {/* 4-Line Poem in Center with traditional parchment aesthetic */}
                    <div className="py-6 px-3.5 sm:px-4 rounded-xl bg-gradient-to-b from-amber-500/[0.06] to-amber-500/[0.02] border border-amber-900/15 dark:border-amber-500/20 mb-6 shadow-xs relative">
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-surface border border-amber-900/15 dark:border-amber-500/20 text-[10px] font-serif font-bold text-accent tracking-wider uppercase">
                        Lời thơ xăm
                      </div>
                      <div className="font-serif italic font-medium text-[13px] sm:text-[14px] text-ink leading-relaxed sm:leading-loose text-center space-y-1.5 pt-1">
                        <p className="m-0 whitespace-nowrap">“{currentResult.poem.line1}</p>
                        <p className="m-0 whitespace-nowrap">{currentResult.poem.line2}</p>
                        <p className="m-0 whitespace-nowrap">{currentResult.poem.line3}</p>
                        <p className="m-0 whitespace-nowrap">{currentResult.poem.line4}”</p>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom: Traditional Seal & Insight */}
                  <div className="relative z-10 pt-4 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                    <div className="text-left">
                      <div className="text-[11px] uppercase tracking-wider text-muted">Ý niệm</div>
                      <div className="font-semibold text-ink text-xs sm:text-sm">Tự soi chiếu</div>
                    </div>

                    {/* Red Traditional Lacquer Stamp */}
                    <div className="w-13 h-13 rounded-xl border-2 border-accent text-accent bg-accent-soft/40 flex flex-col items-center justify-center font-bold text-xs leading-tight rotate-[-4deg] shadow-xs">
                      <span>{currentResult.sealText.split(" ")[0]}</span>
                      <span>{currentResult.sealText.split(" ")[1] || "NIỆM"}</span>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-wider text-muted">Ngụ ý thẻ</div>
                      <div className="font-semibold text-ink text-xs sm:text-sm">
                        {currentResult.insight}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="px-2 text-xs text-muted italic text-center">
                  Di sản xăm tre văn hóa dân gian
                </p>
              </div>

              {/* Right Column (7 columns): Seamless Literary Essay (No 4 box cards) */}
              <div className="lg:col-span-7 space-y-8 text-ink">
                {/* Lời gợi mở chính */}
                <section aria-labelledby="xam-reflection-title" className="space-y-4">
                  <h2
                    id="xam-reflection-title"
                    className="font-display text-xl sm:text-2xl font-semibold text-ink"
                  >
                    Một điều để ngẫm
                  </h2>

                  {currentResult.quote && (
                    <blockquote className="border-l-2 border-accent pl-4 py-2 font-serif italic text-sm sm:text-base text-ink/90 bg-accent-soft/20 rounded-r-lg">
                      “{currentResult.quote}”
                    </blockquote>
                  )}

                  {currentResult.reflectionParagraphs[0] && (
                    <p className="text-base text-ink leading-relaxed">
                      {currentResult.reflectionParagraphs[0]}
                    </p>
                  )}

                  {(currentResult.reflectionParagraphs.length > 1 ||
                    currentResult.tips.length > 0) && (
                    <details className="group rounded-card border border-line bg-surface p-4">
                      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-control text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
                        <span>Đọc thêm lời chiêm nghiệm</span>

                        <ChevronDown
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
                        />
                      </summary>

                      <div className="mt-4 space-y-4">
                        {currentResult.reflectionParagraphs
                          .slice(1)
                          .map((paragraph, index) => (
                            <p
                              key={index}
                              className="text-sm sm:text-base text-ink leading-relaxed"
                            >
                              {paragraph}
                            </p>
                          ))}

                        {currentResult.tips.map((tip, index) => (
                          <div
                            key={index}
                            className="border-t border-line pt-4"
                          >
                            <h3 className="mb-2 text-sm font-semibold text-accent">
                              {tip.title}
                            </h3>

                            <p className="text-sm text-muted leading-relaxed">
                              {tip.desc}
                            </p>
                            {tip.title === "Gợi ý do AI tạo" && currentResult.aiExplanation?.metadata.editorialNote && (
                              <p className="mt-2 text-xs text-muted">
                                {currentResult.aiExplanation.metadata.editorialNote}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </section>

                <div className="w-full h-px bg-line/60" />

                {/* Essay Section 2: Thực hành an yên & Nuôi dưỡng tâm lành */}
                {currentResult.microAction.title && currentResult.microAction.desc && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-wider text-accent flex items-center gap-1.5">
                      <Flower2 className="w-3.5 h-3.5" />
                      <span>Thực hành an yên hôm nay</span>
                    </div>
                    <span className="text-xs text-muted font-medium">
                      {currentResult.microAction.duration}
                    </span>
                  </div>

                  <div className="p-5 rounded-xl bg-surface/80 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-display font-semibold text-base text-ink mb-1">
                        {currentResult.microAction.title}
                      </h4>
                      <p className="text-xs sm:text-sm text-muted leading-relaxed">
                        {currentResult.microAction.desc}
                      </p>
                    </div>

                    <button
                      type="button"
                      aria-pressed={isActionDone}
                      onClick={() => setIsActionDone((value) => !value)}
                      className={`min-h-11 px-4 py-2.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                        isActionDone
                          ? "bg-success-soft text-success shadow-2xs"
                          : "bg-surface border border-line text-accent hover:bg-surface-soft"
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {isActionDone ? "Đã thực hiện xong" : "Đánh dấu đã thực hiện"}
                      </span>
                    </button>
                  </div>
                </div>
                )}

                <div className="w-full h-px bg-line/60" />

                {/* Góc nhìn văn hóa chỉ hiện khi được biên tập trong dữ liệu phát hành. */}
                {currentResult.culturalAspect && (
                <details className="group rounded-card border border-line bg-surface p-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-control text-sm font-semibold text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-2">
                      <BookOpen aria-hidden="true" className="h-4 w-4 text-accent" />
                      Góc nhìn văn hóa
                    </span>

                    <ChevronDown
                      aria-hidden="true"
                      className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none"
                    />
                  </summary>

                  <p className="mt-4 text-sm sm:text-base text-muted leading-relaxed">
                    {currentResult.culturalAspect}
                  </p>
                </details>
                )}

                {isDemoMode() && currentDrawId && (
                  <DetailedReadingUnlock
                    key={`xam:${currentDrawId}`}
                    kind="xam"
                    resultId={currentDrawId}
                    sections={[
                      {
                        title: "Ý nghĩa sâu sắc",
                        content:
                          currentResult.reflectionParagraphs.length > 1
                            ? currentResult.reflectionParagraphs.slice(1).join(" ")
                            : `${currentResult.insight} — Giữ nội lực an định, điềm nhiên trước mọi thăng trầm để đón nhận bài học cuộc đời bằng tâm thế thong dong.`
                      },
                      {
                        title: "Biểu tượng của kết quả",
                        content: `Thẻ số ${currentResult.stickNumber} mang thông điệp “${currentResult.sealText}”, biểu trưng cho sự thanh lương, an hòa và bền bỉ. Lời xăm không mang tính định đoạt tương lai, mà gợi mở cho bạn thêm một góc nhìn tỉnh thức để tự soi chiếu những băn khoăn đời thường.`
                      },
                      {
                        title: `Góc nhìn về ${currentResult.topic.toLocaleLowerCase("vi-VN")}`,
                        content: `Đối với phương diện ${currentResult.topic.toLocaleLowerCase("vi-VN")}, quẻ xăm nhắc nhở bạn khởi đầu từ sự an định bên trong trước khi tìm cầu đáp án bên ngoài. Khi tâm trong sáng và vững chãi, những khúc mắc trong cuộc sống sẽ dần tìm thấy lối mở thuận hòa.`
                      },
                      {
                        title: "Lời khuyên thực tế",
                        content: [currentResult.tips.map((t) => `${t.title}: ${t.desc}`).join(" | "), currentResult.microAction.desc].filter(Boolean).join(". ")
                      },
                      {
                        title: "Gợi ý suy ngẫm",
                        content: "Điều gì đang khiến tâm bạn xao động nhất hôm nay, và một hành động nhỏ nào bạn có thể chủ động thực hiện ngay để nuôi dưỡng sự tĩnh lặng trong mình?"
                      },
                    ]}
                  />
                )}

                <div className="space-y-4 border-t border-line pt-6">
                  {/* Tiếp nối nghi thức: Nối quẻ với xin keo */}
                  {onGoToXinKeo && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-accent/8 via-surface to-accent/5 border border-accent/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-2.5">
                        <Waves className="h-5 w-5 text-accent shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-accent uppercase tracking-wider">
                            Tiếp nối nghi thức dân gian
                          </div>
                          <p className="text-xs text-muted mt-0.5 leading-relaxed">
                            Gieo quẻ âm dương để cầu chứng sự tương hợp với thông điệp thẻ xăm vừa nhận.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onGoToXinKeo(currentDrawId || "")}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-accent text-white hover:bg-accent/90 text-xs font-semibold shrink-0 transition-all shadow-xs cursor-pointer"
                      >
                        <span>Gieo keo cầu chứng</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {/* Primary & Secondary Actions */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                      variant="default"
                      size="lg"
                      onClick={handleSaveResult}
                      disabled={isCardSaved}
                      className="w-full min-w-0 whitespace-nowrap px-4 font-semibold shadow-sm"
                    >
                      <Bookmark className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {isCardSaved
                          ? "Đã lưu thẻ"
                          : isLoggedIn
                            ? "Lưu vào Góc của tôi"
                            : "Đăng nhập để lưu"}
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => {
                        setStep(1);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="w-full min-w-0 whitespace-nowrap px-4 text-ink"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      <span>Chọn lại chủ đề</span>
                    </Button>
                  </div>

                  {onGoToExplore && (
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={onGoToExplore}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-muted hover:text-accent transition-colors cursor-pointer"
                      >
                        <span>Khám phá thêm nét đẹp văn hóa</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Caution Banner */}
            <div className="p-4 rounded-xl bg-surface/60 border border-line flex items-center gap-3 text-xs text-muted leading-relaxed mb-12">
              <ShieldCheck className="w-4 h-4 text-accent flex-shrink-0" />
              <span>
                Thông tin dùng để tham khảo và chiêm nghiệm văn hóa dân gian, nuôi dưỡng tâm an; không mang tính dự báo tương lai hay quyết định thay bạn.
              </span>
            </div>
          </div>
        )}

        {/* =========================================================================
            MODAL HƯỚNG DẪN CHIÊM NGHIỆM (Step 2)
           ========================================================================= */}
        {showGuideModal && (
          <AppDialog
            labelledBy="xin-xam-guide-dialog-title"
            onClose={() => setShowGuideModal(false)}
          >
            <div className="mb-5 flex items-start justify-between gap-3 border-b border-line pb-4">
              <h2
                id="xin-xam-guide-dialog-title"
                className="font-display text-xl font-semibold text-ink"
              >
                Hướng dẫn rút thẻ
              </h2>

              <button
                type="button"
                autoFocus
                aria-label="Đóng hướng dẫn rút thẻ"
                onClick={() => setShowGuideModal(false)}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-soft hover:text-ink"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <ol className="list-decimal space-y-4 pl-5 text-sm leading-relaxed text-ink">
              <li>
                <strong>Dừng lại một chút.</strong>{" "}
                Thả lỏng và nghĩ về điều bạn muốn chiêm nghiệm.
              </li>

              <li>
                <strong>Rút một thẻ.</strong>{" "}
                Bấm “Thành tâm lắc ống xăm” để bắt đầu tương tác.
              </li>

              <li>
                <strong>Đọc và chọn điều phù hợp.</strong>{" "}
                Xem lời gợi mở, rồi thử một hành động nhỏ nếu bạn muốn.
                Nội dung không dự đoán tương lai hay quyết định thay bạn.
              </li>
            </ol>

            <p className="mt-5 rounded-xl bg-surface-soft p-4 text-sm leading-relaxed text-muted">
              Số thẻ có thể thay đổi theo thư viện nội dung đã được duyệt.
            </p>

            <Button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="mt-6 w-full"
            >
              Tôi đã hiểu
            </Button>
          </AppDialog>
        )}

      </main>
    </div>
  );
};
