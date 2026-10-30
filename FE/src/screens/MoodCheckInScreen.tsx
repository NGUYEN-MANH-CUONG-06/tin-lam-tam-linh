import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Flower2,
  Waves,
  HelpCircle,
  Wind,
  Heart,
  Moon,
  Sparkles,
  PenLine,
  Bell,
  Briefcase,
  Home,
  UserCheck,
  Compass,
  ShieldCheck,
} from "lucide-react";

import {
  MoodKey,
  MOODS_LIST,
  MOOD_CONTEXTS,
  type MoodContextKey,
} from "../data/demoSignals";
import { isDemoMode } from "../data/demoMode";
import { Button } from "@/src/components/ui/button";
import { Textarea } from "@/src/components/ui/textarea";
import "../styles/MoodCheckInScreen.css";

import { SchoolSupportNotice } from "../components/SchoolSupportNotice";

interface MoodCheckInScreenProps {
  selectedMood: MoodKey;
  onSelectMood: (mood: MoodKey) => void;
  journalText: string;
  onChangeJournal: (text: string) => void;
  onBackToToday: () => void;
  onSubmit: (contextKey: MoodContextKey) => void;
  isSubmitting?: boolean;
  isLoggedIn?: boolean;
  contextKey: MoodContextKey;
  onChangeContext: (contextKey: MoodContextKey) => void;
}

const getMoodIcon = (iconType: string, isSelected: boolean) => {
  const className = "w-5 h-5";

  switch (iconType) {
    case "lotus":
      return <Flower2 className={className} />;
    case "waves":
      return <Waves className={className} />;
    case "question":
      return <HelpCircle className={className} />;
    case "wind":
      return <Wind className={className} />;
    case "heart":
      return <Heart className={className} />;
    case "moon":
      return <Moon className={className} />;
    default:
      return <Sparkles className={className} />;
  }
};

const MOOD_SHORT_DESCRIPTIONS: Record<MoodKey, string> = {
  "An yên": "Bình tĩnh, thanh thản, thấy ổn",
  "Chênh vênh": "Thấy mất cân bằng, hụt hẫng",
  "Băn khoăn": "Có điều trăn trở chưa lời giải",
  "Nôn nóng": "Muốn mọi việc diễn ra nhanh hơn",
  "Biết ơn": "Trân trọng những điều đang có",
  "Cần điểm tựa": "Muốn được lắng nghe, vỗ về",
  "Áp lực": "Nhiều việc và kỳ vọng dồn nén",
  "Cô đơn": "Cần một khoảng kết nối ấm áp",
  "Vui vẻ": "Có niềm vui tươi sáng muốn giữ",
  "Mông lung": "Chưa rõ phương hướng bước tiếp",
};

const MOOD_EMPATHY_QUOTES: Record<MoodKey, string> = {
  "An yên": "Tâm tĩnh lặng là phúc lành lớn nhất của ngày hôm nay.",
  "Chênh vênh": "Mọi ngọn sóng rồi sẽ trả lại mặt nước phẳng lặng. Hít sâu một hơi bạn nhé.",
  "Băn khoăn": "Mọi nút thắt trong lòng rồi sẽ dần hé mở theo thời gian.",
  "Nôn nóng": "Cây đơm hoa kết trái cần có mùa. Hãy cho bản thân thêm chút kiên nhẫn.",
  "Biết ơn": "Trân trọng những điều bình dị là cội nguồn của an lạc dài lâu.",
  "Cần điểm tựa": "Bạn không hề đơn độc. Luôn có một chốn an trú sẵn sàng đón bạn.",
  "Áp lực": "Gánh nặng hôm nay bạn hoàn toàn có thể đặt xuống một phần.",
  "Cô đơn": "Khoảng lặng này là cơ hội để bạn ôm ấp và lắng nghe chính mình.",
  "Vui vẻ": "Nuôi dưỡng niềm hân hoan này và lan tỏa năng lượng ấm áp nhé.",
  "Mông lung": "Khi chưa rõ đường đi, chỉ cần bước từng bước nhỏ ngay dưới chân.",
};

const CONTEXT_ICONS: Record<string, React.ReactNode> = {
  general: <Compass className="w-4 h-4 text-accent" />,
  work: <Briefcase className="w-4 h-4 text-accent" />,
  family: <Home className="w-4 h-4 text-accent" />,
  relationship: <Heart className="w-4 h-4 text-accent" />,
  self: <UserCheck className="w-4 h-4 text-accent" />,
};

export const MoodCheckInScreen: React.FC<MoodCheckInScreenProps> = ({
  selectedMood,
  onSelectMood,
  journalText,
  onChangeJournal,
  onBackToToday,
  onSubmit,
  isSubmitting = false,
  isLoggedIn = false,
  contextKey,
  onChangeContext,
}) => {
  const [bellRinging, setBellRinging] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playSynthesizedBell = (ctx: AudioContext, now: number) => {
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 8.5);
    masterGain.connect(ctx.destination);

    const freqs = [216, 432, 648, 864, 1296];
    const decays = [8.5, 6.2, 4.8, 3.5, 2.2];
    const amps = [0.4, 0.25, 0.15, 0.08, 0.04];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(amps[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + decays[idx]);
      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(now);
      osc.stop(now + decays[idx]);
    });
  };

  const playZenBellSound = () => {
    try {
      const audio = new Audio("/audio/meditation-bowl.mp3");
      audio.volume = 0.8;
      audioElementRef.current = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          try {
            const AudioCtx =
              window.AudioContext ||
              (window as unknown as { webkitAudioContext: typeof AudioContext })
                .webkitAudioContext;
            if (AudioCtx) {
              const ctx = new AudioCtx();
              audioCtxRef.current = ctx;
              playSynthesizedBell(ctx, ctx.currentTime);
            }
          } catch {}
        });
      }
    } catch {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          audioCtxRef.current = ctx;
          playSynthesizedBell(ctx, ctx.currentTime);
        }
      } catch {}
    }
  };

  const lastBellTimeRef = useRef<number>(0);

  const handleRingBell = () => {
    const now = Date.now();
    if (now - lastBellTimeRef.current < 450) return;
    lastBellTimeRef.current = now;
    setBellRinging(true);
    playZenBellSound();
    setTimeout(() => setBellRinging(false), 1000);
  };

  useEffect(() => {
    return () => {
      if (audioElementRef.current) {
        audioElementRef.current.pause();
        audioElementRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    };
  }, []);

  return (
    <div className="screen-shell">
      <main className="page-container max-w-5xl pb-40 sm:pb-16 py-6 sm:py-8">
        {/* ========================================================= */}
        {/* 1. HEADER LẮNG ĐỌNG & TRIỆN SON "TÂM"                     */}
        {/* ========================================================= */}
        <header className="mb-6 sm:mb-9">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-accent font-semibold tracking-wide">
              <Flower2 className="w-4 h-4" aria-hidden="true" />
              <span>Khoảng nghỉ nuôi dưỡng tâm hồn</span>
            </div>

            {/* Nút Thỉnh chuông tĩnh tâm có sóng âm */}
            <div className="relative inline-flex items-center">
              {bellRinging && <span className="today-bell-ripple" aria-hidden="true" />}
              <button
                type="button"
                onClick={handleRingBell}
                className={`relative z-1 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-700/25 bg-amber-500/8 hover:bg-amber-500/15 text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200 transition-all cursor-pointer shadow-xs active:scale-95 ${
                  bellRinging ? "border-amber-600 bg-amber-500/25 ring-2 ring-amber-400/30" : ""
                }`}
                title="Thỉnh chuông tĩnh tâm"
              >
                <Bell className={`w-3.5 h-3.5 ${bellRinging ? "animate-bounce text-amber-600 dark:text-amber-300" : ""}`} />
                <span>Thỉnh chuông tĩnh tâm</span>
              </button>
            </div>
          </div>

          <h1
            tabIndex={-1}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink tracking-tight mb-2 flex items-center flex-wrap outline-none focus:outline-none focus-visible:outline-none focus:ring-0"
          >
            <span className="mood-seal-badge" title="Dấu ấn Tâm">
              心
            </span>
            <span>Hôm nay bạn cảm thấy thế nào?</span>
          </h1>

          <p className="text-base text-muted leading-relaxed max-w-xl">
            Chọn cảm xúc gần nhất với bạn lúc này.
            Không cần phải thấy ổn mới bắt đầu — mọi tâm sự đều được lắng nghe chân thành.
          </p>
        </header>

        {/* ========================================================= */}
        {/* 2. 10 PHIẾN NGỌC CẢM XÚC (JADE EMOTION TILES)             */}
        {/* ========================================================= */}
        <section aria-labelledby="mood-selection-title" className="mb-8">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2
              id="mood-selection-title"
              className="text-sm font-semibold uppercase tracking-wider text-ink"
            >
              Chọn một cảm xúc của bạn
            </h2>
            <span className="text-xs text-muted">
              Đang chọn: <strong className="text-accent">{selectedMood}</strong>
            </span>
          </div>

          {/* Dynamic Empathy Card: Lời thấu cảm tức thì */}
          <div className="mb-4 p-3.5 rounded-2xl bg-gradient-to-r from-accent/8 via-accent/4 to-transparent border border-accent/20 flex items-center gap-3 transition-all duration-300 shadow-2xs">
            <div className="w-7 h-7 rounded-full bg-accent/15 flex items-center justify-center text-accent shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-accent animate-pulse" />
            </div>
            <p className="text-xs sm:text-sm font-medium text-ink italic leading-relaxed">
              “{MOOD_EMPATHY_QUOTES[selectedMood]}”
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-3.5">
            {MOODS_LIST.map((mood) => {
              const isSelected = selectedMood === mood.key;

              return (
                <button
                  key={mood.key}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onSelectMood(mood.key)}
                  className={`mood-tile-card ${
                    isSelected ? "mood-tile-card--selected" : ""
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span
                      aria-hidden="true"
                      className={`mood-tile-icon-box ${
                        isSelected
                          ? "bg-accent text-on-accent shadow-sm"
                          : "bg-accent/8 text-accent"
                      }`}
                    >
                      {getMoodIcon(mood.iconType, isSelected)}
                    </span>

                    <span
                      aria-hidden="true"
                      className={`mood-tile-check ${
                        isSelected
                          ? "bg-accent text-on-accent"
                          : "border border-line/80 text-transparent"
                      }`}
                    >
                      {isSelected ? (
                        <Check className="h-3 w-3 stroke-[3]" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-line/60" />
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="block font-display text-base font-semibold leading-snug text-ink sm:text-lg mb-0.5">
                      {mood.name}
                    </span>

                    <span className="block text-xs sm:text-sm leading-snug text-muted line-clamp-1">
                      {MOOD_SHORT_DESCRIPTIONS[mood.key]}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ========================================================= */}
        {/* 3. NGỮ CẢNH: CHỌN MỐI BẬN LÒNG (PILL CHIPS THAY CHO RADIO) */}
        {/* ========================================================= */}
        <fieldset className="mb-8 border-0 p-0 m-0">
          <legend className="mb-2 font-display text-lg font-semibold text-ink">
            Bạn muốn lời gợi mở hướng về điều gì?
          </legend>

          <p className="mb-4 text-xs sm:text-sm leading-relaxed text-muted">
            Không bắt buộc. Lời gợi mở biên soạn và việc nhỏ sẽ được chọn theo ngữ cảnh bạn gửi gắm.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {MOOD_CONTEXTS.map((context) => {
              const isActive = contextKey === context.key;

              return (
                <div
                  key={context.key}
                  onClick={() => onChangeContext(context.key)}
                  className={`mood-context-chip ${
                    isActive ? "mood-context-chip--active" : ""
                  }`}
                  role="radio"
                  aria-checked={isActive}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onChangeContext(context.key);
                    }
                  }}
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <div className="flex items-center gap-2.5">
                      {CONTEXT_ICONS[context.key] || <Compass className="w-4 h-4 text-accent" />}
                      <span className="text-sm font-semibold text-ink">
                        {context.label}
                      </span>
                    </div>
                    {isActive && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-accent text-on-accent text-[11px] font-bold shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </fieldset>

        {/* Thông tin bảo mật riêng tư nhẹ nhàng */}
        <details className="mb-6 rounded-xl border border-line/70 bg-surface/50 p-3.5 group transition-all">
          <summary className="cursor-pointer text-xs font-medium text-muted flex items-center justify-between list-none hover:text-ink">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Ghi chép tâm tư luôn được bảo mật riêng tư trên thiết bị của bạn</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-muted transition-transform duration-200 group-open:rotate-180 shrink-0" />
          </summary>
          <div className="mt-2.5 pt-2.5 border-t border-line/50 space-y-1.5 text-xs leading-relaxed text-muted">
            <p>
              • {isDemoMode()
                ? "Dữ liệu tâm tư chỉ lưu cục bộ trên trình duyệt cá nhân của bạn, hoàn toàn không gửi lên máy chủ bên ngoài."
                : "Không gian an toàn, riêng tư. Mọi chia sẻ cảm xúc chỉ phục vụ mục đích chiêm nghiệm cá nhân của bạn."}
            </p>
            <p>
              • Lời gợi mở mang tính nuôi dưỡng tinh thần và nâng đỡ cảm xúc an lành, không thay thế tư vấn y khoa chuyên môn.
            </p>
          </div>
        </details>

        {/* ========================================================= */}
        {/* 4. TRANG GIẤY DÓ TÂM SỰ (GHI CHÉP TÙY CHỌN)               */}
        {/* ========================================================= */}
        <details className="group mood-letter-container mb-8">
          <summary className="mood-letter-summary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
            <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <PenLine className="w-4 h-4" aria-hidden="true" />
            </div>

            <div className="flex-1">
              <span className="block text-sm font-semibold text-ink">
                Trút bớt tâm tư nếu bạn muốn
              </span>
              <span className="block text-xs text-muted mt-0.5">
                {journalText.trim()
                  ? "Đã lưu lại vài dòng tâm sự của bạn"
                  : "Không bắt buộc. Đôi khi chỉ một vài dòng chữ cũng giúp lòng nhẹ hơn."}
              </span>
            </div>

            <ChevronDown
              className="w-4 h-4 text-muted transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <div className="px-5 pb-5 pt-1 border-t border-line/60">
            <label
              htmlFor="mood-journal"
              className="block font-display text-sm font-medium text-ink mb-2 mt-2"
            >
              Đôi dòng trải lòng lúc này…
            </label>

            <Textarea
              id="mood-journal"
              value={journalText}
              onChange={(event) => onChangeJournal(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Một chuyện vừa diễn ra, một điều làm bạn bận lòng, hoặc đơn giản là một dòng thở phào..."
              aria-describedby="mood-journal-note"
              className="resize-y bg-surface-soft/60 border-line focus:border-accent text-sm leading-relaxed rounded-xl shadow-inner"
            />

            <div className="flex items-center justify-between text-xs text-muted mt-2">
              <p id="mood-journal-note" className="text-muted/80 leading-relaxed text-[11px]">
                {isLoggedIn
                  ? "Cuốn sổ tay riêng tư của bạn. Bạn có thể xem lại những dòng này trong trang cá nhân."
                  : "Ghi chép được giữ riêng tư trên thiết bị này như một cuốn nhật ký cá nhân."}
              </p>
              <span className="shrink-0 text-[11px] tabular-nums">{journalText.length}/2000 ký tự</span>
            </div>
          </div>
        </details>

        {/* ========================================================= */}
        {/* 5. THANH HÀNH ĐỘNG CỐ ĐỊNH CHÂN TRANG                     */}
        {/* ========================================================= */}
        <div
          className={[
            "fixed inset-x-0 bottom-0 z-30",
            "border-t border-line/80 bg-surface/95 backdrop-blur-md",
            "px-4 pt-3.5",
            "pb-[calc(0.85rem+env(safe-area-inset-bottom))]",
            "sm:static sm:mt-10 sm:border-0",
            "sm:bg-transparent sm:p-0",
          ].join(" ")}
        >
          <div className="mx-auto max-w-3xl flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={onBackToToday}
              className="shrink-0 hover:border-accent/40"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
              <span>Quay lại</span>
            </Button>

            <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-soft border border-line text-xs shadow-xs">
              <span className="text-muted">Đang gửi gắm:</span>
              <strong className="text-accent">{selectedMood}</strong>
              <span className="text-line select-none">·</span>
              <span className="text-muted font-medium">{MOOD_CONTEXTS.find((c) => c.key === contextKey)?.label || "Tự do"}</span>
            </div>

            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => onSubmit(contextKey)}
              aria-label="Đón nhận thông điệp"
              className="mood-submit-btn flex-1 sm:flex-none sm:min-w-64"
            >
              <span className="mood-submit-sheen" />
              <Flower2 className="w-4 h-4 text-amber-200/90 shrink-0 hidden sm:block" aria-hidden="true" />
              <span>{isSubmitting ? "Đang gửi gắm…" : "Đón nhận thông điệp"}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-amber-200 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
            </button>
          </div>
        </div>
        <SchoolSupportNotice text={journalText} />
      </main>
    </div>
  );
};
