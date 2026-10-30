import React, { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  Info,
  Check,
  RotateCcw,
  Compass,
  Heart,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { isDemoMode } from "../data/demoMode";
import { DetailedReadingUnlock } from "../components/DetailedReadingUnlock";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import {
  castXinKeo,
  createXinKeoSession,
  loadXinKeoSession,
} from "../data/reflectionService";
import type { SourcedProverb } from "../data/reflectionService";

interface XinKeoScreenProps {
  onBackToExperience: () => void;
  onGoToCulture?: () => void;
  onGoToHome?: () => void;
  onGoToLogin?: () => void;
  drawId?: string | null;
  isLoggedIn?: boolean;
}

type KeoResultType = "nhat-am-nhat-duong" | "nhi-duong" | "nhi-am";

interface KeoOutcome {
  type: KeoResultType;
  title: string;
  subTitle: string;
  statusLabel: string;
  badgeColor: string;
  meaning: string;
  guidance: string;
  piece1: "am" | "duong"; // am = ngua (phang), duong = up (cong)
  piece2: "am" | "duong";
  proverb?: SourcedProverb | null;
}

const KEO_OUTCOMES: Record<KeoResultType, KeoOutcome> = {
  "nhat-am-nhat-duong": {
    type: "nhat-am-nhat-duong",
    title: "Nhất Âm Nhất Dương",
    subTitle: "Một Ngửa (Âm) • Một Úp (Dương)",
    statusLabel: "Một âm • Một dương",
    badgeColor: "bg-success-soft text-success border border-success/30",
    meaning: "Lượt gieo này cho kết quả một mặt âm và một mặt dương.",
    guidance:
      "Hãy xem đây là lời nhắc để cân nhắc câu hỏi từ nhiều phía. Kết quả gieo ngẫu nhiên không xác nhận quyết định nào là đúng; hãy dựa vào thông tin thực tế và trao đổi với người bạn tin cậy.",
    piece1: "am",
    piece2: "duong",
  },
  "nhi-duong": {
    type: "nhi-duong",
    title: "Nhị Dương",
    subTitle: "Cùng Sấp • Hai mặt cong úp xuống",
    statusLabel: "Hai mặt dương",
    badgeColor: "bg-gold-soft text-gold border border-gold/40",
    meaning: "Lượt gieo này cho kết quả hai mặt dương.",
    guidance:
      "Nếu câu hỏi vẫn còn băn khoăn, hãy dành thời gian kiểm tra giả định, rủi ro và phương án dự phòng trước khi quyết định.",
    piece1: "duong",
    piece2: "duong",
  },
  "nhi-am": {
    type: "nhi-am",
    title: "Nhị Âm",
    subTitle: "Cùng Ngửa • Hai mặt phẳng ngửa lên",
    statusLabel: "Hai mặt âm",
    badgeColor: "bg-surface-soft text-muted border border-line",
    meaning: "Lượt gieo này cho kết quả hai mặt âm.",
    guidance:
      "Kết quả này không dự báo điều xấu. Hãy xem lại điều mình biết, điều còn chưa rõ và người có thể giúp bạn đánh giá tình huống.",
    piece1: "am",
    piece2: "am",
  },
};

// SVG Crescent Moon Divination Piece
// Keo âm dương — hình lưỡi liềm gỗ hương đỏ cổ truyền
// Hình dạng: crescent nằm ngang, dày ở giữa, 2 đầu bo tròn
// Mặt Dương (Úp)  = lưng cong vòm bóng loáng (thấy mặt cong)
// Mặt Âm  (Ngửa) = mặt phẳng xẻ gỗ, thớ gỗ nổi rõ
const CrescentKeoPiece: React.FC<{
  side: "am" | "duong";
  mirror?: boolean;
  rotationClass: string;
  isCasting: boolean;
  hasCast: boolean;
  animClass?: string;
  shadowClass?: string;
  settledClass?: string;
  settledShadowClass?: string;
  onSettle?: () => void;
}> = ({
  side,
  mirror = false,
  rotationClass,
  isCasting,
  hasCast,
  animClass = "",
  shadowClass = "",
  settledClass = "",
  settledShadowClass = "",
  onSettle,
}) => {
  // Keo thật là nửa bầu dục dựng đứng: mép ngoài tròn, mép trong cắt cong.
  const outerPath = "M 96,10 C 140,18 164,52 162,94 C 160,137 133,166 98,172";
  const innerReturn = "C 86,174 77,166 80,151 C 89,115 88,64 78,28 C 75,15 83,7 96,10 Z";
  const fullPath = outerPath + " " + innerReturn;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative w-44 sm:w-56 h-28 sm:h-36 select-none ${
          isCasting
            ? animClass
            : hasCast
            ? `transition-none ${settledClass}`
            : `transition-transform duration-700 ${rotationClass}`
        }`}
        onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && isCasting) onSettle?.();
        }}
      >
        <svg viewBox="0 0 180 180" className="w-full h-full overflow-visible">
          <defs>
            {/* ── Base rosewood gradient ─────────────── */}
            <linearGradient id="rw_duong" x1="30%" y1="0%" x2="70%" y2="100%">
              <stop offset="0%"   stopColor="#d8835e" />
              <stop offset="30%"  stopColor="#a9472d" />
              <stop offset="70%"  stopColor="#6e2419" />
              <stop offset="100%" stopColor="#3b120d" />
            </linearGradient>

            <linearGradient id="rw_am" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%"   stopColor="#f0ba82" />
              <stop offset="45%"  stopColor="#d98d60" />
              <stop offset="80%"  stopColor="#b96340" />
              <stop offset="100%" stopColor="#854027" />
            </linearGradient>

            {/* ── Convex dome highlight (Dương) ──────── */}
            <radialGradient id="dome_hl" cx="50%" cy="30%" r="60%" fx="48%" fy="18%">
              <stop offset="0%"   stopColor="#ffd2ab" stopOpacity="0.9" />
              <stop offset="30%"  stopColor="#e18a64" stopOpacity="0.55" />
              <stop offset="70%"  stopColor="#8b3020" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b120d" stopOpacity="0" />
            </radialGradient>

            {/* Gloss lacquer overlay (Dương) */}
            <radialGradient id="gloss" cx="50%" cy="22%" r="55%">
              <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.32" />
              <stop offset="45%"  stopColor="#ff9aaa" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            {/* ── Wood grain pattern (Âm face) ───────── */}
            <pattern id="grain" width="28" height="28"
              patternUnits="userSpaceOnUse" patternTransform="rotate(-30) scale(1)">
              <line x1="0" y1="2"  x2="28" y2="2"  stroke="#9c5436" strokeWidth="0.7" strokeOpacity="0.5" />
              <line x1="0" y1="7"  x2="28" y2="7"  stroke="#6e321e" strokeWidth="1.1" strokeOpacity="0.52" />
              <line x1="0" y1="13" x2="28" y2="13" stroke="#bd7048" strokeWidth="0.5" strokeOpacity="0.5" />
              <line x1="0" y1="19" x2="28" y2="19" stroke="#7e3e26" strokeWidth="1.3" strokeOpacity="0.48" />
              <line x1="0" y1="25" x2="28" y2="25" stroke="#e8a572" strokeWidth="0.5" strokeOpacity="0.4"/>
            </pattern>

            {/* ── Drop shadow filter ──────────────────── */}
            <filter id="kshadow" x="-12%" y="-20%" width="124%" height="150%">
              <feDropShadow dx="0" dy="7" stdDeviation="5" floodColor="#000" floodOpacity="0.7" />
            </filter>
          </defs>

          <g
            transform={mirror ? "translate(180 0) scale(-1 1)" : undefined}
            className={isCasting ? `keo-toss-face keo-toss-face-duong keo-toss-face--lands-${side}` : side === "duong" ? "" : "hidden"}
          >
            {/* Mặt úp (dương): lưng gỗ cong, phủ sơn bóng. */}
            <g filter="url(#kshadow)">
              {/* Phần thành/rìa dày tối ở mép dưới (hiệu ứng 3D chiều dày) */}
              <path
                d="M 98,172 C 133,166 160,137 162,94 L 168,100
                   C 166,143 139,174 102,180 Z"
                fill="#1e0306"
                opacity="0.85"
              />
              {/* Thân chính — mặt lưng cong */}
              <path
                d={fullPath}
                fill="url(#rw_duong)"
                stroke="#1e0306"
                strokeWidth="1.5"
              />
              {/* Radial dome highlight — tạo cảm giác vòm tròn 3D */}
              <path d={fullPath} fill="url(#dome_hl)" />
              {/* Gloss lacquer */}
              <path d={fullPath} fill="url(#gloss)" />
              {/* Đường gân sáng dọc theo sống lưng vòm */}
              <path
                d="M 101,20 C 134,28 151,57 150,92"
                fill="none"
                stroke="#ef8090"
                strokeWidth="1.6"
                strokeOpacity="0.45"
                strokeLinecap="round"
              />
            </g>
          </g>
          <g
            transform={mirror ? "translate(180 0) scale(-1 1)" : undefined}
            className={isCasting ? `keo-toss-face keo-toss-face-am keo-toss-face--lands-${side}` : side === "am" ? "" : "hidden"}
          >
            {/* Mặt ngửa (âm): mặt gỗ phẳng với thớ gỗ rõ nét. */}
            <g filter="url(#kshadow)">
              {/* Viền rìa/thành mỏng tối bên dưới (cho thấy chiều dày gỗ) */}
              <path
                d="M 98,172 C 133,166 160,137 162,94 L 168,100
                   C 166,143 139,174 102,180 Z"
                fill="#280408"
                opacity="0.9"
              />
              {/* Mặt phẳng chính */}
              <path
                d={fullPath}
                fill="url(#rw_am)"
                stroke="#280408"
                strokeWidth="1.5"
              />
              {/* Thớ gỗ nổi rõ trên mặt phẳng */}
              <path d={fullPath} fill="url(#grain)" opacity="0.95" />
              {/* Vòng tuổi gỗ tự nhiên (annual rings) trên mặt xẻ */}
              <path
                d="M 96,38 Q 126,63 151,100"
                fill="none" stroke="#2e0508" strokeWidth="1.0" strokeOpacity="0.42"
              />
              <path
                d="M 94,72 Q 120,96 145,132"
                fill="none" stroke="#2e0508" strokeWidth="0.8" strokeOpacity="0.32"
              />
              {/* Vát mép bên trong (chamfer) */}
              <path
                d="M 96,14 C 136,22 159,54 157,94
                   C 155,132 131,160 100,168 C 90,168 84,162 87,151
                   C 96,113 95,64 83,27 C 81,19 87,12 96,14 Z"
                fill="none"
                stroke="#e08090"
                strokeWidth="0.8"
                strokeOpacity="0.35"
              />
              {/* Ánh sáng khuếch tán nhẹ (mặt phẳng phản chiếu ánh sáng đều) */}
              <ellipse cx="126" cy="84" rx="14" ry="49" fill="#ffffff" opacity="0.07" transform="rotate(-28 126 84)" />
            </g>
          </g>
        </svg>
      </div>

      {/* Ground shadow */}
      <div
        className={`w-36 sm:w-48 h-3.5 rounded-full bg-black/55 blur-[5px] -mt-3 ${
          isCasting
            ? shadowClass
            : hasCast
            ? `transition-none ${settledShadowClass}`
            : "opacity-60 scale-100 transition-all"
        }`}
      />

      {/* Badge nhận diện */}
      <div className="text-center mt-3">
        <div
          className={`inline-flex flex-col items-center px-3 py-1.5 rounded-xl border text-xs font-medium ${
            side === "am"
              ? "bg-amber-950/70 text-amber-200 border-amber-600/50"
              : "bg-rose-950/70 text-rose-200 border-rose-700/50"
          }`}
        >
          <span className="font-bold tracking-wide uppercase text-[11px] flex items-center gap-1.5">
            {side === "am" ? (
              <><span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.9)]" />MẶT PHẲNG (ÂM • NGỬA)</>
            ) : (
              <><span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.9)]" />MẶT CONG (DƯƠNG • ÚP)</>
            )}
          </span>
          <span className="text-[10px] opacity-80 mt-0.5">
            {side === "am" ? "Thớ gỗ xẻ • mặt phẳng ngửa lên" : "Vòm cong bóng loáng • úp xuống đĩa"}
          </span>
        </div>
      </div>
    </div>
  );
};

export const XinKeoScreen: React.FC<XinKeoScreenProps> = ({
  onBackToExperience,
  onGoToCulture,
  onGoToHome,
  drawId,
  isLoggedIn = false,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>("binhan");
  const [reflectionText, setReflectionText] = useState("");
  const [isCasting, setIsCasting] = useState(false);
  const [castResult, setCastResult] = useState<KeoOutcome | null>(null);
  const [castResultId, setCastResultId] = useState<string | null>(null);
  // Chốt quẻ trước khi tung. Nhờ vậy mặt nhìn thấy trong lúc xoay chính là
  // mặt sẽ chạm đĩa, không bị thay hình ở khoảnh khắc animation kết thúc.
  const [landingResult, setLandingResult] = useState<KeoOutcome | null>(null);
  const landingOutcomeRef = useRef<KeoOutcome | null>(null);
  const landingCastIdRef = useRef<string | null>(null);
  const settledPiecesRef = useRef(new Set<string>());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [throwCount, setThrowCount] = useState(0);
  const [requestError, setRequestError] = useState("");
  const requestLockRef = useRef(false);

  const [isRequestingKeo, setIsRequestingKeo] =
    useState(false);

  const [sessionLoading, setSessionLoading] =
    useState(false);

  const [sessionReady, setSessionReady] =
    useState(!isLoggedIn);

  const [sessionReload, setSessionReload] =
    useState(0);

  const sessionVersionRef = useRef(0);

  const keoAttemptRef = useRef<{
    sessionId: string;
    requestId: string;
  } | null>(null);

  useEffect(() => {
    const version = ++sessionVersionRef.current;

    requestLockRef.current = false;

    setSessionId(null);
    setThrowCount(0);
    setCastResult(null);
    setCastResultId(null);
    landingCastIdRef.current = null;
    setLandingResult(null);
    setIsCasting(false);
    setIsRequestingKeo(false);
    setRequestError("");

    const savedSessionId = new URLSearchParams(
      window.location.search,
    ).get("keoSessionId");

    setSessionLoading(Boolean(isLoggedIn && savedSessionId));
    setSessionReady(!isLoggedIn || !savedSessionId);

    if (isLoggedIn && savedSessionId) {
      void loadXinKeoSession(savedSessionId)
        .then((session) => {
          if (version !== sessionVersionRef.current) return;

          if ((session.drawId || null) !== (drawId || null)) {
            throw new Error(
              "Phiên xin keo không khớp với lượt xin xăm đang mở.",
            );
          }

          const pendingAttempt = keoAttemptRef.current;

          if (
            pendingAttempt?.sessionId === session.id &&
            session.throws.some(
              (item) => item.id === pendingAttempt.requestId
            )
          ) {
            // BE đã xác nhận lượt đang chờ: lần bấm sau là lượt mới.
            keoAttemptRef.current = null;
          }

          setSessionId(session.id);
          setThrowCount(session.throws.length);

          const last = session.throws.at(-1);

          if (last) {
            const restored: KeoOutcome = {
              ...KEO_OUTCOMES[last.type],
              piece1: last.piece1,
              piece2: last.piece2,
              proverb: last.proverb,
            };

            setLandingResult(restored);
            setCastResult(restored);
            setCastResultId(last.id);
            landingCastIdRef.current = last.id;
          }

          setSessionReady(true);
        })
        .catch(() => {
          if (version !== sessionVersionRef.current) return;

          setSessionReady(false);
          setRequestError(
            "Chưa khôi phục được phiên. Hãy kiểm tra kết nối và tài khoản rồi tải lại phiên.",
          );
        })
        .finally(() => {
          if (version === sessionVersionRef.current) {
            setSessionLoading(false);
          }
        });
    }

    return () => {
      sessionVersionRef.current += 1;
    };
  }, [drawId, isLoggedIn, sessionReload]);

  const handleNewSession = () => {
    if (requestLockRef.current || sessionLoading) return;

    keoAttemptRef.current = null;

    const url = new URL(window.location.href);
    url.searchParams.delete("keoSessionId");

    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );

    setSessionReload((value) => value + 1);
  };

  const topics = [
    { id: "hoctap", label: "Học tập & Thi cử" },
    { id: "congviec", label: "Công việc & Sự nghiệp" },
    { id: "giadinh", label: "Gia đình & Người thân" },
    { id: "binhan", label: "Bình an & Tâm trí" },
  ];

  const handleCastKeo = async () => {
    if (
      requestLockRef.current ||
      sessionLoading ||
      !sessionReady
    ) {
      return;
    }

    if (drawId && !isLoggedIn) {
      setRequestError(
        "Hãy đăng nhập để sử dụng phiên liên kết với lượt xin xăm.",
      );
      return;
    }

    if (throwCount >= 3) {
      setRequestError(
        "Phiên đã đủ ba lượt. Bạn có thể bắt đầu phiên mới nếu muốn.",
      );
      return;
    }

    const version = sessionVersionRef.current;
    let animationStarted = false;

    requestLockRef.current = true;
    setIsRequestingKeo(true);
    setRequestError("");

    let nextSessionId = sessionId;
    let outcome: KeoOutcome;
    let outcomeId: string;

    try {
      if (isLoggedIn) {
        if (!nextSessionId) {
          const topicLabel =
            topics.find((item) => item.id === selectedTopic)
              ?.label || "Bình an";

          const session = await createXinKeoSession(
            `Chủ đề: ${topicLabel}`,
            drawId || undefined,
          );

          if (version !== sessionVersionRef.current) return;

          nextSessionId = session.id;
          setSessionId(session.id);

          const url = new URL(window.location.href);
          url.searchParams.set("keoSessionId", session.id);

          window.history.replaceState(
            window.history.state,
            "",
            `${url.pathname}${url.search}${url.hash}`,
          );
        }

        // Lấy số lượt thật trước khi gieo tiếp.
        const current = await loadXinKeoSession(nextSessionId);

        if (version !== sessionVersionRef.current) return;

        if ((current.drawId || null) !== (drawId || null)) {
          throw new Error("Phiên không khớp lượt xin xăm.");
        }

        const pendingAttempt = keoAttemptRef.current;

        if (
          pendingAttempt?.sessionId === current.id &&
          current.throws.some(
            (item) => item.id === pendingAttempt.requestId
          )
        ) {
          keoAttemptRef.current = null;
        }

        setThrowCount(current.throws.length);

        if (current.throws.length >= 3) {
          setRequestError(
            "Phiên đã đủ ba lượt. Hãy xem lại kết quả hoặc chủ động bắt đầu phiên mới.",
          );

          setSessionReload((value) => value + 1);
          return;
        }

        let attempt = keoAttemptRef.current;

        if (!attempt || attempt.sessionId !== nextSessionId) {
          attempt = {
            sessionId: nextSessionId,
            requestId: crypto.randomUUID(),
          };

          keoAttemptRef.current = attempt;
        }

        const cast = await castXinKeo(
          nextSessionId,
          attempt.requestId
        );

        // Chỉ bỏ mã sau khi đã nhận được kết quả.
        if (keoAttemptRef.current === attempt) {
          keoAttemptRef.current = null;
        }

        if (version !== sessionVersionRef.current) return;

        setThrowCount(cast.throwNumber);
        outcomeId = cast.id;

        outcome = {
          ...KEO_OUTCOMES[cast.type],
          piece1: cast.piece1,
          piece2: cast.piece2,
          proverb: cast.proverb,
        };
      } else {
        const sides = new Uint8Array(2);
        crypto.getRandomValues(sides);

        const piece1 = sides[0] & 1 ? "duong" : "am";
        const piece2 = sides[1] & 1 ? "duong" : "am";
        outcomeId = `demo-keo-${crypto.randomUUID()}`;

        const type: KeoResultType =
          piece1 !== piece2
            ? "nhat-am-nhat-duong"
            : piece1 === "duong"
              ? "nhi-duong"
              : "nhi-am";

        outcome = {
          ...KEO_OUTCOMES[type],
          piece1,
          piece2,
          proverb: null,
        };

        setThrowCount((count) => count + 1);
        setRequestError(
          "Lượt gieo cục bộ, chưa được lưu vào tài khoản.",
        );
      }

      if (version !== sessionVersionRef.current) return;

      setLandingResult(outcome);
      landingOutcomeRef.current = outcome;
      landingCastIdRef.current = outcomeId;
      setCastResult(null);
      setCastResultId(null);
      animationStarted = true;
      setIsCasting(true);

      const reducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      settledPiecesRef.current.clear();
      if (reducedMotion) {
        requestAnimationFrame(() => {
          if (version !== sessionVersionRef.current) return;
          setCastResult(outcome);
          setCastResultId(outcomeId);
          setIsCasting(false);
          requestLockRef.current = false;
        });
      }
    } catch {
      if (version !== sessionVersionRef.current) return;

      setRequestError(
        "Chưa xác nhận được lượt gieo. Hãy tải lại phiên để kiểm tra kết quả trước khi gieo tiếp.",
      );

      if (isLoggedIn && nextSessionId) {
        setSessionReady(false);
      }
    } finally {
      if (version === sessionVersionRef.current) {
        setIsRequestingKeo(false);
        if (!animationStarted) {
          requestLockRef.current = false;
        }
      }
    }
  };

  return (
    <div className="screen-shell">
      <main className="page-container max-w-6xl">
        <section className="mb-5 rounded-xl border border-line bg-surface p-4">
          <p role="status" className="text-sm text-muted">
            {sessionLoading
              ? "Đang khôi phục phiên…"
              : isRequestingKeo
                ? "Đang xử lý lượt gieo…"
                : !sessionReady
                  ? "Cần tải lại phiên trước khi tiếp tục."
                  : `Đã gieo ${throwCount}/3 lượt trong phiên này.`}
          </p>

          {isLoggedIn && !sessionReady && !sessionLoading && (
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              onClick={() => {
                setSessionReload((value) => value + 1);
              }}
            >
              Tải lại phiên
            </Button>
          )}

          {sessionReady && throwCount >= 3 && (
            <Button
              type="button"
              variant="outline"
              className="mt-3"
              disabled={isCasting || isRequestingKeo}
              onClick={handleNewSession}
            >
              Bắt đầu phiên mới
            </Button>
          )}
        </section>
        {requestError && <p role="status" className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">{requestError}</p>}
        {drawId && isLoggedIn && <p className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">Bạn đang mở xin keo từ một lượt xin xăm. Máy chủ sẽ kiểm tra quyền truy cập khi tạo phiên liên kết.</p>}
        {/* Top Breadcrumb & Status Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 text-xs text-muted">
          <div className="flex items-center gap-2">
            <button
              onClick={onGoToHome}
              className="hover:text-accent cursor-pointer transition-colors"
            >
              Hôm nay
            </button>
            <span>/</span>
            <button
              onClick={onBackToExperience}
              className="hover:text-accent cursor-pointer transition-colors"
            >
              Trải nghiệm
            </button>
            <span>/</span>
            <span className="text-accent font-semibold">Xin keo âm dương</span>
          </div>

          <button
            onClick={onBackToExperience}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-accent transition-colors cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Về danh mục trải nghiệm</span>
          </button>
        </div>

        {/* Top Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wider bg-surface text-accent border border-line flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-action animate-pulse"></span>
            CHIÊM NGHIỆM DÂN GIAN • LẮNG NGHE TÂM TƯ
          </span>
          <span className="text-xs text-muted">
            • Không gian phản tư tinh thần • Không mang tính phán quyết
          </span>
        </div>

        {/* Header Title Section */}
        <div className="mb-10">
          <h1 className="page-title mb-3">
            Xin keo âm dương
          </h1>
          <p className="text-sm sm:text-base text-ink leading-relaxed max-w-4xl">
            Trên ứng dụng, hai mặt keo được gieo ngẫu nhiên. Kết quả chỉ mô tả tổ hợp xuất hiện;
            phần gợi mở giúp bạn tự cân nhắc, không xác nhận ý nguyện, dự đoán tương lai hay thay
            bạn đưa ra quyết định.
          </p>
        </div>

        {/* Two Column Layout: Left (Step 1 Form) | Right (Step 2 Sacred Altar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-12">
          {/* Left Column (5 cols): Step 1 Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-7 rounded-card bg-surface border border-line shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-3">
                <span className="w-5 h-5 rounded-full bg-action text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>KHỞI TÂM TỊNH NIỆM</span>
              </div>

              <h2 className="font-display font-bold text-lg text-ink mb-1">
                Chọn phương diện chiêm nghiệm
              </h2>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Hãy định tâm vào một phương diện bạn đang tìm kiếm sự tĩnh trí hoặc muốn được gợi mở góc nhìn:
              </p>

              {/* Topic Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {topics.map((t) => {
                  const isSelected = selectedTopic === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={
                        isCasting ||
                        isRequestingKeo ||
                        sessionLoading ||
                        Boolean(sessionId) ||
                        throwCount > 0
                      }
                      onClick={() => setSelectedTopic(t.id)}
                      className={`p-3 rounded-panel border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-accent/10 border-accent text-accent shadow-2xs"
                          : "bg-surface border-line text-ink hover:border-accent/40"
                      }`}
                    >
                      <span>{t.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                    </button>
                  );
                })}
              </div>

              {/* Reflection Text Input (Optional) */}
              <div>
                <label htmlFor="keo-reflection" className="block text-xs font-semibold text-ink mb-1.5">
                  Nỗi niềm muốn gửi gắm{" "}
                  <span className="font-normal text-muted">(không bắt buộc)</span>
                </label>
                <textarea
                  id="keo-reflection"
                  rows={3}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  placeholder="Ví dụ: Mong cho dự định sắp tới được hanh thông, lòng bớt âu lo..."
                  className="w-full p-3.5 rounded-panel border border-line focus:border-accent focus:ring-1 focus:ring-accent text-xs outline-none resize-none bg-surface/70 placeholder:text-subtle text-ink leading-relaxed"
                />
                <p className="text-xs text-muted mt-2 leading-relaxed">
                  {isDemoMode()
                    ? "Ghi chú và kết quả demo chỉ lưu trên trình duyệt này, không gửi lên máy chủ."
                    : "Ghi chú chỉ nằm trong màn hình này, không được gửi lên máy chủ và sẽ mất khi tải lại hoặc rời màn hình. Khi đăng nhập và gieo, hệ thống lưu chủ đề và kết quả vào tài khoản."}
                </p>
              </div>
            </div>

            {/* Cultural Context Box */}
            <div className="p-5 rounded-panel bg-surface/60 border border-line flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-surface border border-line flex items-center justify-center text-accent shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-accent" />
              </div>
              <div className="text-xs">
                <h4 className="font-display font-bold text-sm text-ink mb-1">
                  Triết lý âm dương trong văn hóa Việt
                </h4>
                <p className="text-ink/80 leading-relaxed mb-2.5">
                  Hai mảnh keo gỗ mít hình trăng khuyết thể hiện sự vận động không ngừng của trời đất và lòng người.
                </p>
                {onGoToCulture && (
                  <button
                    onClick={onGoToCulture}
                    className="text-accent font-semibold hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <span>Khảo cứu chuyên sâu về tục gieo keo</span>
                    <span>→</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols): Step 2 Sacred Open Altar */}
          <div className="lg:col-span-7">
            <div className="p-6 sm:p-8 rounded-card bg-surface border border-line shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                  <span className="w-5 h-5 rounded-full bg-action text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>KHAI TÂM ĐỊNH TRÍ • Không gian gieo keo</span>
                </div>
                <Badge variant="outline" className="text-xs border-line text-muted">
                  Trạng thái: {isCasting ? "Đang gieo..." : castResult ? "Đã gieo" : "Tĩnh lặng"}
                </Badge>
              </div>

              {/* Sacred Altar Tray with Ambient Aura */}
              <div className="relative rounded-card overflow-visible pt-16 sm:pt-20 bg-gradient-to-b from-surface-soft/80 via-surface/60 to-surface-soft border border-line p-6 sm:p-12 text-center mb-6">
                {/* Ambient Golden Glow Aura */}
                <div className="absolute inset-0 bg-radial from-amber-500/15 via-orange-500/5 to-transparent pointer-events-none rounded-card" />

                {/* Circular Stone/Woven Mat Platform */}
                <div className="relative mx-auto max-w-lg rounded-3xl border border-accent/25 bg-surface/90 backdrop-blur-xs p-6 sm:p-10 shadow-inner">
                  <div className="flex items-center justify-center gap-6 sm:gap-10 py-4" aria-live="polite">
                    {/* Keo Piece 1 */}
                    <CrescentKeoPiece
                      side={landingResult ? landingResult.piece1 : "am"}
                      mirror
                      rotationClass={
                        landingResult
                          ? landingResult.piece1 === "am"
                            ? "rotate-12"
                            : "-rotate-12"
                          : "rotate-6"
                      }
                      isCasting={isCasting}
                      hasCast={!!castResult}
                      animClass="anim-keo-toss-left"
                      shadowClass="anim-keo-shadow-left"
                      settledClass="keo-settled-left"
                      settledShadowClass="keo-shadow-settled-left"
                      onSettle={() => {
                        settledPiecesRef.current.add("left");
                        if (settledPiecesRef.current.size === 2) {
                          if (landingOutcomeRef.current) {
                            setCastResult(landingOutcomeRef.current);
                            setCastResultId(landingCastIdRef.current);
                          }
                          setIsCasting(false);
                          requestLockRef.current = false;
                        }
                      }}
                    />

                    {/* Keo Piece 2 */}
                    <CrescentKeoPiece
                      side={landingResult ? landingResult.piece2 : "duong"}
                      rotationClass={
                        landingResult
                          ? landingResult.piece2 === "am"
                            ? "-rotate-12"
                            : "rotate-12"
                          : "-rotate-6"
                      }
                      isCasting={isCasting}
                      hasCast={!!castResult}
                      animClass="anim-keo-toss-right"
                      shadowClass="anim-keo-shadow-right"
                      settledClass="keo-settled-right"
                      settledShadowClass="keo-shadow-settled-right"
                      onSettle={() => {
                        settledPiecesRef.current.add("right");
                        if (settledPiecesRef.current.size === 2) {
                          if (landingOutcomeRef.current) {
                            setCastResult(landingOutcomeRef.current);
                            setCastResultId(landingCastIdRef.current);
                          }
                          setIsCasting(false);
                          requestLockRef.current = false;
                        }
                      }}
                    />
                  </div>

                  <div className="h-px w-28 mx-auto bg-line/80 my-4" />
                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-ink/80">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-[0_0_6px_rgba(244,63,94,0.6)]"></span>
                      <span><strong>Mặt cong (Dương / Úp):</strong> Lưng vòm cong tròn</span>
                    </span>
                    <span className="hidden sm:inline text-muted">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block shadow-[0_0_6px_rgba(251,191,36,0.6)]"></span>
                      <span><strong>Mặt phẳng (Âm / Ngửa):</strong> Thớ gỗ xẻ phẳng</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="text-center">
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleCastKeo}
                  disabled={
                    isCasting ||
                    isRequestingKeo ||
                    sessionLoading ||
                    !sessionReady ||
                    throwCount >= 3
                  }
                  className="w-full py-4 text-base font-semibold shadow-md bg-action text-white hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-5 h-5 shrink-0" />
                  <span>
                    {isCasting
                      ? "Đang gieo keo trong chánh niệm..."
                      : castResult
                      ? "Gieo lại lần khác"
                      : "Gieo keo âm dương"}
                  </span>
                </Button>
                <p className="text-xs text-muted mt-2.5">
                  Chạm để gieo — Hãy hít một hơi thật sâu và buông lỏng tâm trí trước khi bắt đầu
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Result Display or Reference of 3 States */}
        <section className="mb-12">
          {castResult ? (
            /* ================= ACTIVE RESULT: SEAMLESS LITERARY ESSAY ================= */
            <div className="p-8 sm:p-12 rounded-card bg-surface border border-accent/30 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line mb-8">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
                  <span className="w-5 h-5 rounded-full bg-action text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>ĐỐI THOẠI NỘI TÂM • KẾT QUẢ CHIÊM NGHIỆM</span>
                </div>
                <Badge className={`text-xs px-3.5 py-1 font-semibold ${castResult.badgeColor}`}>
                  {castResult.statusLabel}
                </Badge>
              </div>

              <div className="max-w-3xl">
                <div className="flex items-baseline gap-3 mb-4">
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                    {castResult.title}
                  </h3>
                  <span className="text-xs text-muted font-medium">({castResult.subTitle})</span>
                </div>

                <p className="text-base sm:text-lg text-ink leading-relaxed mb-6 first-letter:text-4xl first-letter:font-serif first-letter:font-bold first-letter:mr-2.5 first-letter:float-left first-letter:text-accent first-letter:leading-none">
                  {castResult.meaning}
                </p>

                <div className="p-5 sm:p-6 rounded-panel bg-surface-soft border border-line text-sm sm:text-base text-ink leading-relaxed mb-8">
                  <strong className="text-accent font-bold block mb-1">
                    Gợi mở tâm thế hôm nay:
                  </strong>
                  {castResult.guidance}
                  {castResult.proverb && (
                    <div className="mt-4 pt-4 border-t border-line">
                      <strong className="text-accent font-bold block mb-1">
                        Thành ngữ hoặc tục ngữ đi cùng lần gieo:
                      </strong>
                      <blockquote>“{castResult.proverb.content}”</blockquote>
                      <p className="mt-1 text-muted">{castResult.proverb.meaning}</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleCastKeo}
                    disabled={isCasting}
                    className="gap-2 bg-action text-white cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Gieo lại lần khác</span>
                  </Button>

                  {onGoToCulture && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onGoToCulture}
                      className="border-line text-ink hover:text-accent cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 text-accent" />
                      <span>Đọc bài khảo cứu phong tục</span>
                    </Button>
                  )}
                </div>

                {isDemoMode() && castResultId && (
                  <DetailedReadingUnlock
                    key={`keo:${castResultId}`}
                    kind="keo"
                    resultId={castResultId}
                    sections={[
                      { title: "Kết quả lượt gieo", content: `${castResult.title} — ${castResult.statusLabel}. ${castResult.meaning}` },
                      { title: "Ý nghĩa biểu tượng trong lượt demo", content: `Hai mặt keo của lượt này là ${castResult.piece1 === "am" ? "một mặt âm" : "một mặt dương"} và ${castResult.piece2 === "am" ? "một mặt âm" : "một mặt dương"}. Đây là mô tả hình thức của kết quả gieo, không xác nhận một ý nguyện hay sự việc.` },
                      { title: "Cách diễn giải theo kết quả", content: castResult.type === "nhat-am-nhat-duong" ? "Có thể dùng hình ảnh hai mặt khác nhau để tự hỏi mình đã cân nhắc đủ các góc nhìn chưa; kết quả không thay cho trao đổi hoặc quyết định dựa trên dữ kiện." : castResult.type === "nhi-duong" ? "Lượt gieo có hai mặt dương. Phần suy ngẫm có thể tập trung vào việc kiểm tra giả định và chuẩn bị phương án dự phòng, không xem đây là dấu hiệu chắc chắn thuận lợi." : "Lượt gieo có hai mặt âm. Có thể tạm dừng để làm rõ điều còn thiếu; kết quả không dự báo bất lợi hay khẳng định điều gì sẽ xảy ra." },
                      { title: "Điều nên cân nhắc", content: castResult.guidance },
                      { title: "Gợi ý suy ngẫm", content: "Thông tin thực tế nào sẽ giúp bạn đánh giá câu hỏi này rõ hơn trước khi chọn bước tiếp theo?" },
                    ]}
                  />
                )}
              </div>
            </div>
          ) : (
            /* ================= REFERENCE GUIDE (WHEN NOT YET CAST) ================= */
            <div className="p-6 sm:p-8 rounded-card bg-surface border border-line shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-3">
                <span className="w-5 h-5 rounded-full bg-action text-white flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <span>BA THẾ KEO DÂN GIAN • Ý NGHĨA BIỂU TƯỢNG</span>
              </div>

                <p className="text-sm text-muted leading-relaxed mb-6">
                Dưới đây là ba tổ hợp có trong ứng dụng. Tên gọi mô tả mặt keo xuất hiện; chúng không dự báo tương lai hoặc quyết định thay bạn:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
                {/* Card 1 */}
                <div className="p-5 rounded-panel border border-line bg-surface/80">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display font-bold text-sm text-ink">
                      Nhất Âm Nhất Dương
                    </h4>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success-soft text-success border border-success/30">
                      1 Ngửa + 1 Úp
                    </span>
                  </div>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    Đây là tổ hợp một mặt ngửa và một mặt úp. Hãy tự cân nhắc các dữ kiện liên quan trước khi quyết định.
                  </p>
                </div>

                {/* Card 2 */}
                <div className="p-5 rounded-panel border border-line bg-surface/80">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display font-bold text-sm text-ink">
                      Nhị Dương (Keo Tiếu)
                    </h4>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gold-soft text-gold border border-gold/40">
                      Cùng Sấp
                    </span>
                  </div>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    Đây là tổ hợp hai mặt úp. Tên gọi chỉ mô tả kết quả gieo, không phải lời khuyên hành động.
                  </p>
                </div>

                {/* Card 3 */}
                <div className="p-5 rounded-panel border border-line bg-surface/80">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display font-bold text-sm text-ink">
                      Nhị Âm
                    </h4>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-soft text-muted border border-line">
                      Cùng Ngửa
                    </span>
                  </div>
                  <p className="text-xs text-ink/80 leading-relaxed">
                    Đây là tổ hợp hai mặt ngửa. Tên gọi chỉ mô tả kết quả gieo, không dự báo thuận lợi hay bất lợi.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-panel bg-surface-soft border border-line text-xs text-ink/80 italic leading-relaxed text-center">
                “Kết quả gieo không phải lời phán quyết của thần linh hay số phận. Hãy dựa vào dữ kiện thực tế và lựa chọn của chính bạn.”
              </div>
            </div>
          )}
        </section>

        {/* Disclaimer / Transparency Box */}
        <div className="p-4 rounded-panel bg-surface/80 border border-line flex items-start gap-3.5 text-xs text-muted leading-relaxed mb-10">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-ink">Lưu ý từ Tin Lắm Tâm Linh: </span>
            Đây là hoạt động tương tác mang tính biểu tượng văn hóa dân gian. Nền tảng tôn trọng tự do tâm thức, không khuyến khích mê tín, không dự đoán tương lai và không bao giờ yêu cầu trả phí để gieo lại.
          </div>
        </div>
      </main>
    </div>
  );
};

