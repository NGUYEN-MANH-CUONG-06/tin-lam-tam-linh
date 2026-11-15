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
import { readDemoValue, writeDemoValue } from "../data/demoStorage";
import { DetailedReadingUnlock } from "../components/DetailedReadingUnlock";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import {
  castXinKeo,
  createXinKeoSession,
  interpretDemoXinKeo,
  loadXinKeoOutcomeCatalog,
  loadXinKeoSession,
} from "../data/reflectionService";
import type {
  XinKeoCast,
  XinKeoOutcomeCatalogItem,
} from "../data/reflectionService";

interface XinKeoScreenProps {
  onBackToExperience: () => void;
  onGoToCulture?: () => void;
  onGoToHome?: () => void;
  onGoToLogin?: () => void;
  drawId?: string | null;
  isLoggedIn?: boolean;
}

type KeoOutcome = XinKeoCast & { badgeColor: string };

const KEO_BADGE_COLORS: Record<XinKeoCast["type"], string> = {
  "nhat-am-nhat-duong": "bg-success-soft text-success border border-success/30",
  "nhi-duong": "bg-gold-soft text-gold border border-gold/40",
  "nhi-am": "bg-surface-soft text-muted border border-line",
};

const toKeoOutcome = (cast: XinKeoCast): KeoOutcome => ({
  ...cast,
  subTitle: cast.subTitle || "",
  badgeColor: KEO_BADGE_COLORS[cast.type],
});

function cleanKeoInterpretationText(text: string): string {
  if (!text) return "";
  return text
    .replace(/(?:quẻ|kết quả)\s+(?:xin keo\s+)?thuận lợi\s*\(\s*YES\s*\)/gi, "thế quẻ Âm Dương Hòa Hợp (Đắc keo)")
    .replace(/(?:quẻ|kết quả)\s+(?:xin keo\s+)?bất lợi\s*\(\s*NO\s*\)/gi, "thế quẻ Nhị Âm (Chưa thuận)")
    .replace(/(?:quẻ|kết quả)\s+(?:xin keo\s+)?không rõ\s*\(\s*UNCLEAR\s*\)/gi, "thế quẻ Nhị Dương (Keo Tiếu)")
    .replace(/\(\s*YES\s*\)/gi, "(Đắc keo)")
    .replace(/\(\s*NO\s*\)/gi, "(Chưa thuận)")
    .replace(/\(\s*UNCLEAR\s*\)/gi, "(Keo Tiếu)")
    .replace(/\bYES\b/g, "Đắc keo")
    .replace(/\bNO\b/g, "Chưa thuận")
    .replace(/\bUNCLEAR\b/g, "Keo Tiếu")
    .replace(
      /các đấng bề trên hoặc thế giới tâm linh,\s*cho thấy con đường phía trước có sự nâng đỡ,\s*thuận buồm xuôi gió/gi,
      "sự tương hòa giữa thiên thời và nhân tâm, là lời động viên tinh thần để bạn thêm tự tin vững bước",
    )
    .replace(/các đấng bề trên hoặc thế giới tâm linh/gi, "triết lý văn hóa âm dương")
    .replace(/thế giới tâm linh/gi, "triết lý nhân sinh");
}

const KEO_TOPICS = [
  { id: "hoctap", label: "Học tập & Thi cử" },
  { id: "congviec", label: "Công việc & Sự nghiệp" },
  { id: "giadinh", label: "Gia đình & Người thân" },
  { id: "binhan", label: "Bình an & Tâm trí" },
];
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
  const innerReturn =
    "C 86,174 77,166 80,151 C 89,115 88,64 78,28 C 75,15 83,7 96,10 Z";
  const fullPath = outerPath + " " + innerReturn;

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative w-28 sm:w-36 h-24 sm:h-30 select-none ${
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
              <stop offset="0%" stopColor="#d8835e" />
              <stop offset="30%" stopColor="#a9472d" />
              <stop offset="70%" stopColor="#6e2419" />
              <stop offset="100%" stopColor="#3b120d" />
            </linearGradient>

            <linearGradient id="rw_am" x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor="#f0ba82" />
              <stop offset="45%" stopColor="#d98d60" />
              <stop offset="80%" stopColor="#b96340" />
              <stop offset="100%" stopColor="#854027" />
            </linearGradient>

            {/* ── Convex dome highlight (Dương) ──────── */}
            <radialGradient
              id="dome_hl"
              cx="50%"
              cy="30%"
              r="60%"
              fx="48%"
              fy="18%"
            >
              <stop offset="0%" stopColor="#ffd2ab" stopOpacity="0.9" />
              <stop offset="30%" stopColor="#e18a64" stopOpacity="0.55" />
              <stop offset="70%" stopColor="#8b3020" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b120d" stopOpacity="0" />
            </radialGradient>

            {/* Gloss lacquer overlay (Dương) */}
            <radialGradient id="gloss" cx="50%" cy="22%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.32" />
              <stop offset="45%" stopColor="#ff9aaa" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>

            {/* ── Wood grain pattern (Âm face) ───────── */}
            <pattern
              id="grain"
              width="28"
              height="28"
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(-30) scale(1)"
            >
              <line
                x1="0"
                y1="2"
                x2="28"
                y2="2"
                stroke="#9c5436"
                strokeWidth="0.7"
                strokeOpacity="0.5"
              />
              <line
                x1="0"
                y1="7"
                x2="28"
                y2="7"
                stroke="#6e321e"
                strokeWidth="1.1"
                strokeOpacity="0.52"
              />
              <line
                x1="0"
                y1="13"
                x2="28"
                y2="13"
                stroke="#bd7048"
                strokeWidth="0.5"
                strokeOpacity="0.5"
              />
              <line
                x1="0"
                y1="19"
                x2="28"
                y2="19"
                stroke="#7e3e26"
                strokeWidth="1.3"
                strokeOpacity="0.48"
              />
              <line
                x1="0"
                y1="25"
                x2="28"
                y2="25"
                stroke="#e8a572"
                strokeWidth="0.5"
                strokeOpacity="0.4"
              />
            </pattern>

            {/* ── Drop shadow filter ──────────────────── */}
            <filter id="kshadow" x="-12%" y="-20%" width="124%" height="150%">
              <feDropShadow
                dx="0"
                dy="7"
                stdDeviation="5"
                floodColor="#000"
                floodOpacity="0.7"
              />
            </filter>
          </defs>

          <g
            transform={mirror ? "translate(180 0) scale(-1 1)" : undefined}
            className={side === "duong" ? "" : "hidden"}
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
            className={side === "am" ? "" : "hidden"}
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
                fill="none"
                stroke="#2e0508"
                strokeWidth="1.0"
                strokeOpacity="0.42"
              />
              <path
                d="M 94,72 Q 120,96 145,132"
                fill="none"
                stroke="#2e0508"
                strokeWidth="0.8"
                strokeOpacity="0.32"
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
              <ellipse
                cx="126"
                cy="84"
                rx="14"
                ry="49"
                fill="#ffffff"
                opacity="0.07"
                transform="rotate(-28 126 84)"
              />
            </g>
          </g>
        </svg>
      </div>

      {/* Ground shadow - nhỏ gọn, mềm mại trong mâm đĩa */}
      <div
        className={`w-20 sm:w-28 h-2 rounded-full bg-black/40 blur-[3px] -mt-1.5 ${
          isCasting
            ? shadowClass
            : hasCast
              ? `transition-none ${settledShadowClass}`
              : "opacity-60 scale-100 transition-all"
        }`}
      />

      {/* Badge nhận diện */}
      <div className="text-center mt-2.5 min-h-[28px] flex items-center justify-center">
        {isCasting ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300 text-[11px] font-semibold animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            <span>Đang gieo quẻ...</span>
          </span>
        ) : hasCast ? (
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors ${
              side === "am"
                ? "bg-amber-500/10 text-amber-800 dark:text-amber-200 border-amber-500/30"
                : "bg-rose-500/10 text-rose-800 dark:text-rose-200 border-rose-500/30"
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                side === "am"
                  ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                  : "bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.8)]"
              }`}
            />
            <span>
              {side === "am"
                ? "Mặt phẳng (Âm • Ngửa)"
                : "Mặt cong (Dương • Úp)"}
            </span>
          </span>
        ) : null}
      </div>
    </div>
  );
};

// Web Audio API: Giả lập âm thanh hai mảnh gỗ gieo lách cách chân thực
const playKeoClackSounds = () => {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const playWoodTick = (
      time: number,
      freq: number,
      decay: number,
      vol = 0.35,
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(
        freq * 0.45,
        time + decay * 0.7,
      );
      gain.gain.setValueAtTime(vol, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + decay);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(time);
      osc.stop(time + decay);
    };

    const now = ctx.currentTime;
    // Nhịp 1: Chạm đĩa lần đầu (t ~ 1.82s trên chu kỳ 2.6s)
    playWoodTick(now + 1.82, 780, 0.1, 0.45);
    playWoodTick(now + 1.88, 620, 0.12, 0.38);

    // Nhịp 2: Nảy nhẹ lần hai (t ~ 2.15s)
    playWoodTick(now + 2.15, 840, 0.08, 0.25);
    playWoodTick(now + 2.2, 690, 0.09, 0.2);

    // Nhịp 3: Trượt yên vị êm ái (t ~ 2.40s)
    playWoodTick(now + 2.4, 920, 0.05, 0.12);
  } catch {
    // Không làm gián đoạn trải nghiệm nếu trình duyệt chặn tự phát âm thanh
  }
};

export const XinKeoScreen: React.FC<XinKeoScreenProps> = ({
  onBackToExperience,
  onGoToCulture,
  onGoToHome,
  onGoToLogin,
  drawId,
  isLoggedIn = false,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>("binhan");
  const selectedTopicLabel =
    KEO_TOPICS.find((topic) => topic.id === selectedTopic)?.label ||
    "Bình an & Tâm trí";
  const requiresLogin = !isLoggedIn && (!isDemoMode() || Boolean(drawId));
  const [reflectionText, setReflectionText] = useState("");
  const [outcomeCatalog, setOutcomeCatalog] = useState<
    XinKeoOutcomeCatalogItem[]
  >([]);
  const [catalogError, setCatalogError] = useState("");
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

  const [isRequestingKeo, setIsRequestingKeo] = useState(false);

  const [sessionLoading, setSessionLoading] = useState(false);

  const [sessionReady, setSessionReady] = useState(!isLoggedIn);

  const [sessionReload, setSessionReload] = useState(0);

  const sessionVersionRef = useRef(0);

  const keoAttemptRef = useRef<{
    sessionId: string;
    requestId: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    void loadXinKeoOutcomeCatalog()
      .then((items) => {
        if (active) setOutcomeCatalog(items);
      })
      .catch(() => {
        if (active)
          setCatalogError("Chưa tải được nội dung các thế keo từ máy chủ.");
      });
    return () => {
      active = false;
    };
  }, []);

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

    const savedSessionId =
      new URLSearchParams(window.location.search).get("keoSessionId") ||
      (isDemoMode()
        ? readDemoValue<string | null>("xin-keo-last-session-id", null)
        : null);

    const canRestoreSession = isLoggedIn || isDemoMode();
    setSessionLoading(Boolean(canRestoreSession && savedSessionId));
    setSessionReady(!canRestoreSession || !savedSessionId);

    if (canRestoreSession && savedSessionId) {
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
            session.throws.some((item) => item.id === pendingAttempt.requestId)
          ) {
            // BE đã xác nhận lượt đang chờ: lần bấm sau là lượt mới.
            keoAttemptRef.current = null;
          }

          setSessionId(session.id);
          setThrowCount(session.throws.length);

          const restoredTopic = KEO_TOPICS.find((topic) =>
            session.question.includes(topic.label),
          );
          setSelectedTopic(restoredTopic?.id || "binhan");
          setReflectionText(
            session.question
              .match(/(?:^|\n)Mong muốn:\s*([\s\S]*)$/i)?.[1]
              ?.trim() || "",
          );

          const last = session.throws.at(-1);

          if (last) {
            const restored = toKeoOutcome(last);

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

    if (isDemoMode()) {
      writeDemoValue("xin-keo-last-session-id", null);
    }

    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );

    setSessionReload((value) => value + 1);
  };

  const handleCastKeo = async () => {
    if (requestLockRef.current || sessionLoading || !sessionReady) {
      return;
    }

    if (drawId && !isLoggedIn) {
      setRequestError(
        "Hãy đăng nhập để sử dụng phiên liên kết với lượt xin xăm.",
      );
      return;
    }

    if (!isLoggedIn && !isDemoMode()) {
      setRequestError(
        "Vui lòng đăng nhập để gieo và lưu kết quả trên máy chủ.",
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
      if (isLoggedIn || isDemoMode()) {
        if (!nextSessionId) {
          const topicLabel =
            KEO_TOPICS.find((item) => item.id === selectedTopic)?.label ||
            "Bình an";
          const wish = reflectionText.trim();
          const sessionQuestion = [
            `Chủ đề: ${topicLabel}`,
            wish ? `Mong muốn: ${wish}` : "",
          ]
            .filter(Boolean)
            .join("\n");

          const session = await createXinKeoSession(
            sessionQuestion,
            drawId || undefined,
          );

          if (version !== sessionVersionRef.current) return;

          nextSessionId = session.id;
          setSessionId(session.id);
          if (isDemoMode())
            writeDemoValue("xin-keo-last-session-id", session.id);

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
          current.throws.some((item) => item.id === pendingAttempt.requestId)
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

        const cast = await castXinKeo(nextSessionId, attempt.requestId);

        // Chỉ bỏ mã sau khi đã nhận được kết quả.
        if (keoAttemptRef.current === attempt) {
          keoAttemptRef.current = null;
        }

        if (version !== sessionVersionRef.current) return;

        setThrowCount(cast.throwNumber);
        outcomeId = cast.id;

        outcome = toKeoOutcome(cast);
      } else {
        throw new Error("Xin keo must be cast by the backend.");
      }

      if (version !== sessionVersionRef.current) return;

      // Không gán landingResult ngay tại t=0s để người dùng CHƯA BIẾT trước kết quả khi đang bay!
      landingOutcomeRef.current = outcome;
      landingCastIdRef.current = outcomeId;
      setCastResult(null);
      setCastResultId(null);
      animationStarted = true;
      setIsCasting(true);

      // Luôn phát âm thanh gỗ lách cách đồng bộ chu kỳ
      playKeoClackSounds();
      settledPiecesRef.current.clear();

      // ĐÚNG KHOẢNH KHẮC CHẠM ĐĨA LẦN 1 (t = 1.82s): LẬT SANG MẶT KẾT QUẢ THỰC TẾ!
      setTimeout(() => {
        if (version !== sessionVersionRef.current) return;
        setLandingResult(outcome);
      }, 1820);

      // Bộ đếm an toàn bảo đảm kết quả luôn hiển thị đầy đủ sau 2.8s
      setTimeout(() => {
        if (version !== sessionVersionRef.current) return;
        if (settledPiecesRef.current.size < 2 && landingOutcomeRef.current) {
          setCastResult(landingOutcomeRef.current);
          setCastResultId(landingCastIdRef.current);
          setIsCasting(false);
          requestLockRef.current = false;
        }
      }, 2800);
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

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-line text-xs font-semibold text-ink shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              <span>
                {sessionLoading
                  ? "Đang khôi phục phiên…"
                  : isRequestingKeo
                    ? "Đang xử lý lượt gieo…"
                    : `Phiên gieo: ${throwCount}/3 lượt`}
              </span>
            </div>

            {sessionReady && throwCount >= 3 && (
              <button
                type="button"
                disabled={isCasting || isRequestingKeo}
                onClick={handleNewSession}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent font-semibold text-xs transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Bắt đầu lại</span>
              </button>
            )}

            {isLoggedIn && !sessionReady && !sessionLoading && (
              <button
                type="button"
                onClick={() => setSessionReload((value) => value + 1)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface border border-line text-muted hover:text-ink text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Tải lại</span>
              </button>
            )}
          </div>
        </div>

        {requestError && (
          <p
            role="status"
            className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted"
          >
            {requestError}
          </p>
        )}
        {drawId && isLoggedIn && (
          <p className="mb-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
            Bạn đang mở xin keo từ một lượt xin xăm. Máy chủ sẽ kiểm tra quyền
            truy cập khi tạo phiên liên kết.
          </p>
        )}

        {/* Top Badge */}
        <div className="mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-line text-xs font-semibold text-accent shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            <span>Chiêm nghiệm âm dương • Lắng nghe tâm tư</span>
          </div>
        </div>

        {/* Header Title Section */}
        <div className="mb-8 sm:mb-10">
          <h1 className="page-title mb-3 flex items-center gap-2.5 text-2xl sm:text-3xl text-ink font-display">
            <span
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 font-serif font-bold text-base shadow-xs"
              aria-hidden="true"
            >
              卦
            </span>
            <span>Xin keo âm dương</span>
          </h1>
          <p className="text-sm sm:text-base text-muted leading-relaxed max-w-3xl">
            Lắng lòng định trí, nương vào triết lý âm dương hòa hợp của tiền
            nhân để tự soi chiếu khúc mắc nội tâm. Lời quẻ là chiếc gương phản
            chiếu tâm thức, gợi mở góc nhìn để bạn sáng suốt đưa ra quyết định
            của chính mình.
          </p>
        </div>

        {/* Two Column Layout: Left (Step 1 Form) | Right (Step 2 Sacred Altar) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start mb-12">
          {/* Left Column (5 cols): Step 1 Form */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 sm:p-7 rounded-2xl bg-surface border border-line shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-3">
                <span className="w-5 h-5 rounded-full bg-action text-white flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <span>KHỞI TÂM TỊNH NIỆM</span>
              </div>

              <h2 className="font-display font-bold text-lg text-ink mb-1">
                Chọn chủ đề chính
              </h2>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Chọn điều bạn muốn tập trung trong lượt gieo này:
              </p>

              {/* Topic Buttons Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-5">
                {KEO_TOPICS.map((t) => {
                  const isSelected = selectedTopic === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      aria-pressed={isSelected}
                      disabled={
                        isCasting ||
                        isRequestingKeo ||
                        sessionLoading ||
                        Boolean(sessionId) ||
                        throwCount > 0
                      }
                      onClick={() => setSelectedTopic(t.id)}
                      className={`p-3.5 rounded-xl border text-left text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "bg-accent/10 border-accent text-accent shadow-2xs"
                          : "bg-surface border-line text-ink hover:border-accent/40"
                      }`}
                    >
                      <span>{t.label}</span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-accent" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Reflection Text Input (Optional) */}
              <div>
                <label
                  htmlFor="keo-reflection"
                  className="block text-xs font-semibold text-ink mb-1.5"
                >
                  Điều bạn mong muốn{" "}
                  <span className="font-normal text-muted">
                    (không bắt buộc)
                  </span>
                </label>
                <textarea
                  id="keo-reflection"
                  rows={3}
                  maxLength={1800}
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  disabled={
                    isCasting ||
                    isRequestingKeo ||
                    sessionLoading ||
                    Boolean(sessionId) ||
                    throwCount > 0
                  }
                  placeholder={
                    selectedTopic === "giadinh"
                      ? "Ví dụ: Mong gia đình luôn mạnh khỏe, bình an."
                      : selectedTopic === "hoctap"
                        ? "Ví dụ: Mong kỳ thi tới làm bài tốt, đạt mục tiêu điểm số."
                        : selectedTopic === "congviec"
                          ? "Ví dụ: Mong công việc ổn định và có cơ hội phát triển."
                          : "Ví dụ: Mong lòng bớt lo và tìm được sự bình an."
                  }
                  className="w-full p-3.5 rounded-panel border border-line focus:border-accent focus:ring-1 focus:ring-accent text-xs outline-none resize-none bg-surface/70 placeholder:text-subtle text-ink leading-relaxed"
                />
              </div>
            </div>

            {/* Cultural Context Box */}
            <div className="p-5 rounded-2xl bg-surface/60 border border-line flex items-start gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-surface border border-line flex items-center justify-center text-accent shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-accent" />
              </div>
              <div className="text-xs">
                <h4 className="font-display font-bold text-sm text-ink mb-1">
                  Triết lý âm dương trong văn hóa Việt
                </h4>
                <p className="text-muted leading-relaxed mb-2.5">
                  Hai mảnh keo gỗ mít hình trăng khuyết thể hiện sự vận động
                  không ngừng của trời đất và lòng người.
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
          <div className="lg:col-span-7 lg:sticky lg:top-24 self-start">
            <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent">
                  <span className="w-5 h-5 rounded-full bg-action text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <span>KHAI TÂM ĐỊNH TRÍ • Không gian gieo keo</span>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs border-line transition-colors ${
                    castResult
                      ? "border-accent/40 bg-accent/10 text-accent font-semibold"
                      : "text-muted"
                  }`}
                >
                  Trạng thái:{" "}
                  {isCasting
                    ? "Đang gieo quẻ..."
                    : castResult
                      ? `${castResult.statusLabel} • Lượt ${throwCount}/3`
                      : "Tĩnh lặng"}
                </Badge>
              </div>

              {/* Sacred Altar Tray with Ambient Aura */}
              <div
                id="keo-altar-tray"
                className={`relative rounded-3xl overflow-visible py-6 sm:py-8 px-4 sm:px-6 bg-gradient-to-b from-surface-soft/90 via-surface/70 to-surface-soft border border-amber-600/25 ring-1 ring-amber-500/10 text-center mb-6 transition-all duration-700 shadow-sm ${
                  isCasting ? "border-amber-500/60 shadow-xl shadow-amber-500/15" : ""
                }`}
              >
                {/* Ambient Golden Glow Aura */}
                <div
                  className={`absolute inset-0 bg-radial from-amber-500/20 via-orange-500/5 to-transparent pointer-events-none rounded-2xl transition-opacity duration-700 ${isCasting ? "opacity-100" : "opacity-60"}`}
                />

                {/* Circular Stone/Woven Mat Platform */}
                <div
                  className={`relative mx-auto max-w-lg rounded-2xl border border-accent/25 bg-surface/90 backdrop-blur-xs p-5 sm:p-7 shadow-inner ${isCasting ? "anim-keo-tray-impact" : ""}`}
                >
                  <div
                    className="flex items-center justify-center gap-3 sm:gap-6 py-2"
                    aria-live="polite"
                  >
                    {/* Keo Piece 1 */}
                    <CrescentKeoPiece
                      side={landingResult ? landingResult.piece1 : "duong"}
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

                  <div className="h-px w-24 mx-auto bg-line/80 my-3.5" />
                  <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]" />
                      <span>
                        <strong className="text-ink">
                          Mặt cong (Dương / Úp):
                        </strong>{" "}
                        Lưng vòm cong
                      </span>
                    </span>
                    <span className="text-line">•</span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />
                      <span>
                        <strong className="text-ink">
                          Mặt phẳng (Âm / Ngửa):
                        </strong>{" "}
                        Thớ gỗ phẳng
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Primary Action Button */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={requiresLogin ? onGoToLogin : handleCastKeo}
                  disabled={
                    isCasting ||
                    isRequestingKeo ||
                    sessionLoading ||
                    !sessionReady ||
                    throwCount >= 3 ||
                    (requiresLogin && !onGoToLogin)
                  }
                  className="w-full h-13 sm:h-14 rounded-full font-bold text-sm sm:text-base text-white bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 hover:from-amber-700 hover:to-amber-700 shadow-md shadow-amber-950/20 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 transition-all active:scale-[0.99] relative overflow-hidden group"
                >
                  <Sparkles
                    className={`w-5 h-5 text-amber-200 ${isCasting ? "animate-spin" : ""}`}
                  />
                  <span>
                    {isCasting
                      ? "Đang gieo keo trong chánh niệm..."
                      : requiresLogin
                        ? "Đăng nhập để gieo"
                        : castResult
                          ? throwCount < 3
                            ? `Gieo tiếp lượt ${throwCount + 1}/3`
                            : "Bắt đầu phiên mới (Hết lượt)"
                          : "Gieo keo âm dương"}
                  </span>
                </button>
                <p className="text-xs text-muted mt-2.5">
                  Chạm để gieo — Hãy hít một hơi thật sâu và buông lỏng tâm trí
                  trước khi bắt đầu
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Result Display or Reference of 3 States */}
        <section
          id="keo-result"
          aria-live="polite"
          className="mb-12 scroll-mt-24"
        >
          {castResult ? (
            /* ================= ACTIVE RESULT: SEAMLESS LITERARY ESSAY ================= */
            <div className="p-6 sm:p-10 rounded-3xl bg-surface border-2 border-amber-600/30 shadow-card relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-line mb-6">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent">
                  <span className="w-5 h-5 rounded-full bg-action text-white flex items-center justify-center text-xs font-bold">
                    3
                  </span>
                  <span>ĐỐI THOẠI NỘI TÂM • KẾT QUẢ CHIÊM NGHIỆM</span>
                </div>
                <Badge
                  className={`text-xs px-3.5 py-1 font-semibold ${castResult.badgeColor}`}
                >
                  {castResult.statusLabel}
                </Badge>
              </div>

              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex flex-wrap items-baseline gap-2.5">
                    <h3 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                      {castResult.title}
                    </h3>
                    <span className="text-xs text-muted font-medium">
                      ({castResult.subTitle})
                    </span>
                  </div>

                  {/* Triện son phong thủy (Seal Stamp) - Dòng chảy tự nhiên, không bị đè */}
                  <div className="inline-flex items-center justify-center select-none rotate-2">
                    <div className="px-3 py-1 rounded-xl border-2 border-red-700/70 bg-red-700/[0.05] shadow-2xs">
                      <div className="border border-dashed border-red-700/50 rounded-lg px-2.5 py-0.5 flex items-center gap-2">
                        <span className="font-serif font-black text-xs text-red-700 tracking-widest uppercase">
                          {castResult.type === "nhat-am-nhat-duong"
                            ? "ĐẮC KEO"
                            : castResult.type === "nhi-duong"
                              ? "KEO TIẾU"
                              : "TỊNH TRÍ"}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-red-700/50" />
                        <span className="text-[10px] font-serif font-bold text-red-700/80 tracking-wider">
                          {castResult.type === "nhat-am-nhat-duong"
                            ? "HÒA HỢP"
                            : castResult.type === "nhi-duong"
                              ? "HOAN HỶ"
                              : "QUY TÂM"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Poetic Couplet / Seal Message */}
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent border-l-4 border-amber-600 mb-6">
                  <div className="flex items-center gap-2 mb-1.5 text-xs font-serif font-bold uppercase tracking-wider text-accent">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    <span>Thông điệp khai mở</span>
                  </div>
                  <p className="font-serif text-base sm:text-lg text-ink font-medium leading-relaxed italic">
                    {castResult.type === "nhat-am-nhat-duong"
                      ? "“Một mảnh ngửa, một mảnh úp — Âm dương hòa hợp, trời đất giao thoa. Vạn sự khởi từ tâm, tâm an ắt vạn sự định.”"
                      : castResult.type === "nhi-duong"
                        ? "“Hai mảnh cùng sấp — Nụ cười hoan hỷ nhưng duyên cơ chưa hội đủ. Hãy lắng lòng suy xét, chớ nóng vội bước vội.”"
                        : "“Hai mảnh cùng ngửa — Vạn vật quy tịnh, tiền nhân khuyên ta tạm dừng chân soi xét kỹ lưỡng trước khi quyết định.”"}
                  </p>
                </div>

                {/* Sacred Intention & Reflection Box */}
                <div className="p-5 sm:p-6 rounded-2xl bg-surface-soft border border-line/80 shadow-2xs text-sm sm:text-base text-ink leading-relaxed mb-6 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-3">
                    <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span>
                        Chủ đề chiêm nghiệm:{" "}
                        <strong className="text-ink">{selectedTopicLabel}</strong>
                      </span>
                    </span>
                    <span className="text-xs text-muted font-serif">
                      Lượt gieo: {throwCount}/3
                    </span>
                  </div>

                  {reflectionText.trim() && (
                    <div className="p-3.5 rounded-xl bg-surface border border-line text-xs sm:text-sm text-ink/90 leading-relaxed">
                      <span className="text-accent font-bold block mb-1">
                        Nỗi niềm bạn gửi gắm:
                      </span>
                      <p className="italic text-ink/80 whitespace-pre-wrap break-words">
                        “{reflectionText.trim()}”
                      </p>
                    </div>
                  )}

                  <div className="pt-1">
                    <strong className="text-accent font-bold block mb-1 font-serif text-sm">
                      Gợi mở từ kết quả và chủ đề:
                    </strong>
                    <p className="text-sm text-ink/90 leading-relaxed">
                      {castResult.guidance}
                    </p>
                  </div>

                  {castResult.proverb && (
                    <div className="mt-4 pt-3.5 border-t border-line/60">
                      <strong className="text-accent font-bold block mb-1 font-serif text-xs uppercase tracking-wider">
                        Lời vàng tiền nhân (Thành ngữ / Ca dao):
                      </strong>
                      <blockquote className="italic font-serif text-ink text-sm sm:text-base">
                        “{castResult.proverb.content}”
                      </blockquote>
                      <p className="mt-1 text-xs text-muted leading-relaxed">
                        {castResult.proverb.meaning}
                      </p>
                    </div>
                  )}
                </div>

                {/* Secondary Actions (Non-duplicated) */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  {throwCount >= 3 ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleNewSession}
                      disabled={isCasting || isRequestingKeo}
                      className="h-11 px-5 rounded-full text-xs sm:text-sm font-semibold gap-2 bg-action text-white cursor-pointer shadow-xs"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Bắt đầu phiên mới (Đã hết 3 lượt)</span>
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const trayEl = document.getElementById("keo-altar-tray");
                        if (trayEl) {
                          trayEl.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                          });
                        }
                      }}
                      className="h-11 px-5 rounded-full text-xs sm:text-sm font-semibold gap-2 border-accent/40 bg-accent/5 hover:bg-accent/10 text-accent cursor-pointer shadow-2xs"
                    >
                      <Sparkles className="w-4 h-4 text-accent" />
                      <span>Cuộn lên khay đĩa để gieo lượt {throwCount + 1}/3 ↑</span>
                    </Button>
                  )}

                  {onGoToCulture && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onGoToCulture}
                      className="h-11 px-5 rounded-full text-xs sm:text-sm font-semibold border-line text-ink hover:text-accent cursor-pointer shadow-2xs"
                    >
                      <BookOpen className="w-4 h-4 text-accent" />
                      <span>Đọc bài khảo cứu tục gieo keo</span>
                    </Button>
                  )}
                </div>

                {isDemoMode() && castResultId && (
                  <DetailedReadingUnlock
                    key={`keo:${castResultId}`}
                    kind="keo"
                    resultId={castResultId}
                    onInterpretation={async () => {
                      if (!castResult.resultToken)
                        throw new Error(
                          "Thiếu mã kết quả Xin keo do máy chủ ký.",
                        );
                      const result = await interpretDemoXinKeo(
                        castResult.resultToken,
                      );
                      return [
                        { title: "Tổng quan", content: cleanKeoInterpretationText(result.summary) },
                        {
                          title: "Ý nghĩa và biểu tượng",
                          content: cleanKeoInterpretationText(`${result.traditionalMeaning}\n\n${result.symbolicAnalysis}`),
                        },
                        {
                          title: "Liên hệ câu hỏi",
                          content: cleanKeoInterpretationText(result.contextualInterpretation),
                        },
                        ...result.practicalAdvice.map((content, index) => ({
                          title: `Gợi ý thực tế ${index + 1}`,
                          content: cleanKeoInterpretationText(content),
                        })),
                        ...result.cautions.map((content, index) => ({
                          title: `Điều cần lưu ý ${index + 1}`,
                          content: cleanKeoInterpretationText(content),
                        })),
                      ];
                    }}
                    sections={[
                      {
                        title: "Kết quả lượt gieo",
                        content: `${castResult.title} — ${castResult.statusLabel}. ${castResult.meaning}`,
                      },
                      {
                        title: "Gợi mở theo phương diện đã chọn",
                        content: castResult.guidance,
                      },
                    ]}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 rounded-card bg-surface border border-line shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-3">
                <span className="w-5 h-5 rounded-full bg-accent/15 text-accent flex items-center justify-center">
                  <BookOpen className="w-3 h-3" />
                </span>
                <span>KIẾN THỨC DÂN GIAN • Ý NGHĨA BA THẾ KEO</span>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-6">
                Mỗi lượt gieo tạo thành một trong ba thế keo. Nội dung ý nghĩa
                được tải từ máy chủ.
              </p>
              {catalogError ? (
                <p className="text-sm text-muted" role="status">
                  {catalogError}
                </p>
              ) : outcomeCatalog.length === 0 ? (
                <p className="text-sm text-muted" role="status">
                  Đang tải nội dung các thế keo…
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {outcomeCatalog.map((outcome) => (
                    <div
                      key={outcome.result}
                      className="p-5 rounded-panel border border-line bg-surface/80"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <h4 className="font-display font-bold text-sm text-ink">
                          {outcome.title}
                        </h4>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-surface-soft text-muted border border-line">
                          {outcome.subTitle || outcome.statusLabel}
                        </span>
                      </div>
                      <p className="text-xs text-ink/80 leading-relaxed">
                        {outcome.meaning}
                      </p>
                      <p className="text-xs text-muted leading-relaxed mt-3">
                        {outcome.guidance}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Disclaimer / Transparency Box */}
        <div className="p-4 rounded-panel bg-surface/80 border border-line flex items-start gap-3.5 text-xs text-muted leading-relaxed mb-10">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-ink">
              Lưu ý từ Tin Lắm Tâm Linh:{" "}
            </span>
            Đây là hoạt động tương tác mang tính biểu tượng văn hóa dân gian.
            Nền tảng tôn trọng tự do tâm thức, không khuyến khích mê tín, không
            dự đoán tương lai và không bao giờ yêu cầu trả phí để gieo lại.
          </div>
        </div>
      </main>
    </div>
  );
};
