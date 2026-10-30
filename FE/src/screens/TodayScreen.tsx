import React, { useState, useRef, useEffect } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Flower2,
  BookOpen,
  Compass,
  Bell,
  Sparkles,
  Calendar,
  CalendarDays,
  Clock3,
} from "lucide-react";

import type { MoodKey, SignalData } from "../data/demoSignals";
import { Button } from "@/src/components/ui/button";
import { TodayReminderCard } from "../components/TodayReminderCard";
import { AboutSourcesSection } from "../components/AboutSourcesSection";
import {
  CULTURAL_TOPICS,
  sanitizeCulturalTopics,
} from "../data/culturalTopics";
import { UnverifiedImage } from "../components/UnverifiedImage";
import {
  getAuspiciousHoursForDay,
  getCanChiDay,
  getCanChiMonth,
  getReliableLunarDate,
  getTraditionalDayDeity,
} from "../data/calendarData";
import "../styles/TodayScreen.css";

interface TodayScreenProps {
  signal?: SignalData | null;
  isCheckedIn?: boolean;
  isActionDone?: boolean;
  mood?: MoodKey;
  onSelectMoodClick: () => void;
  onViewSignalDetails: () => void;
  selectedTopics?: string[];
  onGoToCulture: () => void;
  onGoToExperience: () => void;
  onGoToZen: () => void;
  currentUserEmail?: string;
  onGoToReminders: () => void;
  onGoToXinXam: () => void;
  onGoToRituals: () => void;
  onGoToGratitude: () => void;
  onGoToCultureMap: () => void;
}

export const TodayScreen: React.FC<TodayScreenProps> = ({
  signal,
  isCheckedIn = false,
  isActionDone = false,
  mood = "Chênh vênh",
  onSelectMoodClick,
  onViewSignalDetails,
  selectedTopics = [],
  onGoToCulture,
  onGoToExperience,
  onGoToZen,
  currentUserEmail,
  onGoToReminders,
  onGoToXinXam,
  onGoToRituals,
  onGoToGratitude,
  onGoToCultureMap,
}) => {
  const [bellRinging, setBellRinging] = useState(false);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const today = new Date();
  const currentHour = today.getHours();

  // Lời chào theo buổi trong ngày
  const timeGreeting =
    currentHour < 12
      ? "Chào buổi sáng"
      : currentHour < 18
      ? "Chào buổi chiều"
      : "Chào buổi tối";

  const timeSubtext =
    currentHour < 12
      ? "Khởi đầu ngày mới an tĩnh. Bạn muốn ghi nhận tâm trạng hay tìm kiếm một cẩm nang nghi lễ?"
      : currentHour < 18
      ? "Một khoảng lặng giữa ngày bận rộn để lắng đọng tâm tư và tái tạo năng lượng."
      : "Dành cho mình vài phút thở chậm lại và an trú sau một ngày bộn bề.";

  const timeHeroTag =
    currentHour < 12
      ? "Bắt đầu ngày mới từ cảm xúc"
      : currentHour < 18
      ? "Khoảng thở thả lỏng giữa ngày"
      : "Lắng đọng tâm trí cuối ngày";

  const localDateISO = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");
  const lunarToday = getReliableLunarDate(
    today.getDate(),
    today.getMonth() + 1,
    today.getFullYear(),
  );
  const canChiDay = getCanChiDay(today);
  const canChiMonth = getCanChiMonth(lunarToday.lunarMonth, lunarToday.lunarYear);
  const dayDeity = getTraditionalDayDeity(today, canChiDay.chi);
  const weekday = today.toLocaleDateString("vi-VN", { weekday: "long" });
  const auspiciousHours = getAuspiciousHoursForDay(canChiDay.chi);

  const formattedSolarDate = `${String(today.getDate()).padStart(2, "0")}-${String(today.getMonth() + 1).padStart(2, "0")}-${today.getFullYear()}`;
  const formattedLunarDate = `${String(lunarToday.lunarDay).padStart(2, "0")}-${String(lunarToday.lunarMonth).padStart(2, "0")}-${lunarToday.lunarYear}`;

  // Web Audio chuông thiền
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

  const handleRingBell = () => {
    setBellRinging(true);
    playZenBellSound();
    setTimeout(() => setBellRinging(false), 900);
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

  const activities = [
    {
      title: "Đọc bài viết văn hóa",
      description:
        "Khám phá các bài viết sâu sắc về phong tục, tín ngưỡng và di sản ba miền.",
      icon: BookOpen,
      image: "/images/temple_bac_bo.jpg",
      onClick: onGoToCulture,
      buttonLabel: "Tìm bài viết",
    },
    {
      title: "Cẩm nang nghi lễ",
      description:
        "Xem các bước chuẩn bị và lưu ý thực hành nghi lễ chu đáo theo nếp nhà.",
      icon: Compass,
      image: "/images/ritual_ram.jpg",
      onClick: onGoToRituals,
      buttonLabel: "Mở cẩm nang nghi lễ",
    },
    {
      title: "Không gian thiền an trú",
      description:
        "Lắng đọng tâm tư, thả lỏng thân tâm và tìm lại sự bình an nội tại.",
      icon: Flower2,
      image: "/images/zen_meditation.jpg",
      onClick: onGoToZen,
      buttonLabel: "Vào không gian thiền",
    },
  ];

  type CulturalTopicId = (typeof CULTURAL_TOPICS)[number]["id"];

  const topicSuggestions: Record<
    CulturalTopicId,
    {
      title: string;
      description: string;
      buttonLabel: string;
      onClick: () => void;
    }
  > = {
    cadao: {
      title: "Một lời chiêm nghiệm",
      description:
        "Chọn cảm xúc và bối cảnh để xem nội dung gợi ý.",
      buttonLabel: "Chọn tâm trạng",
      onClick: onSelectMoodClick,
    },
    xinxam: {
      title: "Xin xăm theo chủ đề",
      description:
        "Chọn một chủ đề để mở quẻ chiêm nghiệm trong không gian chung.",
      buttonLabel: "Mở xin xăm",
      onClick: onGoToXinXam,
    },
    bamien: {
      title: "Khám phá văn hóa ba miền",
      description:
        "Xem bài viết về phong tục, lễ hội và tín ngưỡng theo vùng miền.",
      buttonLabel: "Chọn vùng văn hóa",
      onClick: onGoToCultureMap,
    },
    nghile: {
      title: "Phong tục và nghi lễ",
      description:
        "Xem các bước chuẩn bị và lưu ý; cách thực hành có thể khác theo địa phương.",
      buttonLabel: "Mở cẩm nang",
      onClick: onGoToRituals,
    },
    trian: {
      title: "Gửi một lời tri ân",
      description:
        "Viết lời biết ơn hoặc dành một khoảng nhỏ lắng đọng nhớ về nguồn cội.",
      buttonLabel: "Mở góc tri ân",
      onClick: onGoToGratitude,
    },
  };

  const validTopicIds = sanitizeCulturalTopics(
    selectedTopics
  ) as CulturalTopicId[];

  // Cẩm nang nghi lễ đã có thẻ riêng ở phần khám phá phía dưới.
  const preferredSuggestions = validTopicIds.filter((id) => id !== "nghile" && id !== "cadao").slice(0, 3).map((id) => ({
    id,
    ...topicSuggestions[id],
  }));

  return (
    <div className="screen-shell">
      <main className="page-container max-w-6xl py-6 sm:py-8">
        {/* ========================================================= */}
        {/* 1. HEADER NGÀY MỚI CÓ LỜI CHÀO ĐỘNG & NÚT THỈNH CHUÔNG     */}
        {/* ========================================================= */}
        <header className="mb-8">
          <div className="today-header-row">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm text-muted">
              <Calendar className="w-4 h-4 text-accent" />
              <time dateTime={localDateISO} className="font-medium text-ink capitalize">
                {weekday}, {formattedSolarDate}
              </time>
              <span className="text-line">•</span>
              <span className="text-accent font-medium">Tin Lắm Tâm Linh</span>
            </div>

            {/* Nút Thỉnh chuông thiền sớm */}
            <button
              type="button"
              onClick={handleRingBell}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-amber-700/25 bg-amber-500/8 hover:bg-amber-500/15 text-xs sm:text-sm font-medium text-amber-900 dark:text-amber-200 transition-all cursor-pointer shadow-xs ${
                bellRinging ? "scale-105 border-amber-600 bg-amber-500/20" : ""
              }`}
              title="Thỉnh chuông tĩnh tâm"
            >
              <Bell className={`w-3.5 h-3.5 ${bellRinging ? "animate-bounce text-amber-600" : ""}`} />
                <span>Phát tiếng chuông</span>
            </button>
          </div>

          <h1
            tabIndex={-1}
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold text-ink tracking-tight mb-2 flex items-center flex-wrap outline-none focus:outline-none focus-visible:outline-none focus:ring-0"
          >
            <span className="today-seal-badge" title="Dấu ấn An">
              安
            </span>
            <span>{timeGreeting}</span>
          </h1>

          <p className="text-base text-muted leading-relaxed max-w-2xl">
            {timeSubtext}
          </p>

          <section
            aria-label="Chi tiết lịch âm dương hôm nay"
            className="today-calendar-detail mt-5"
          >
            <div className="today-calendar-header">
              <div className="today-calendar-title-wrap">
                <span className="today-calendar-title-icon" aria-hidden="true">
                  <CalendarDays />
                </span>
                <div>
                  <p className="today-calendar-eyebrow">Âm dương lịch · hôm nay</p>
                  <h2 className="today-calendar-title">Ngày trong lịch Việt</h2>
                </div>
              </div>
              <span className="today-calendar-zone">Việt Nam <span aria-hidden="true">·</span> UTC+7</span>
            </div>
            <div className="today-calendar-content">
              <div className="today-calendar-primary">
                <div className="today-calendar-date-row">
                  <span className="today-calendar-date-label">Dương lịch</span>
                  <strong className="today-calendar-date today-calendar-date--solar">{formattedSolarDate}</strong>
                </div>
                <div className="today-calendar-date-row">
                  <span className="today-calendar-date-label">Âm lịch</span>
                  <strong className="today-calendar-date today-calendar-date--lunar">
                    {formattedLunarDate}{lunarToday.isLeapMonth ? " · tháng nhuận" : ""}
                  </strong>
                </div>
                <div className="today-calendar-meta">
                  <div>
                    <span>Ngày trong tuần</span>
                    <strong className="capitalize">{weekday}</strong>
                  </div>
                  <div>
                    <span>Can Chi</span>
                    <strong>{canChiDay.name} · {canChiMonth} · {lunarToday.canChiYear}</strong>
                  </div>
                </div>
              </div>
              <div className="today-calendar-aside">
                <div className="today-calendar-deity">
                  <p className="today-calendar-section-label">Ngày theo lịch dân gian</p>
                  <h3>{dayDeity ?? "Chưa có dữ liệu"}</h3>
                  <p>
                    {dayDeity === "Huyền Vũ"
                      ? "Theo quan niệm dân gian, ngày Huyền Vũ thường được khuyên cân nhắc việc xuất hành vì gắn với cãi cọ, việc không thuận."
                      : "Vị thần trực ngày theo cách tính lịch truyền thống; nội dung chỉ mang tính tham khảo văn hóa."}
                  </p>
                </div>
                <div className="today-calendar-hours">
                  <h3><Clock3 aria-hidden="true" /> Giờ Hoàng Đạo</h3>
                  <div className="today-calendar-hour-list">
                    {auspiciousHours.map((hour) => (
                      <span key={hour}>{hour.replace(/(\d{2})[–-](\d{2})/, (_match, start: string, end: string) => `${Number(start)}-${Number(end)}`)}</span>
                    ))}
                  </div>
                </div>
                <p className="today-calendar-disclaimer">
                  Quan niệm ngày giờ tốt xấu là tập tục dân gian, không dự báo hay bảo đảm kết quả.
                </p>
              </div>
            </div>
          </section>
        </header>

        {/* ========================================================= */}
        {/* 2. KHU VỰC TRỌNG TÂM: ĐÃ CHECK-IN HOẶC CHƯA CHECK-IN       */}
        {/* ========================================================= */}
        {isCheckedIn && signal ? (
          /* TRƯỜNG HỢP A: BỨC TRƯỚNG LỜI GỢI MỞ CHIÊM NGHIỆM */
          <section
            aria-labelledby="today-signal-title"
            className="today-scroll-card"
          >
            <div className="today-scroll-golden-rim" aria-hidden="true" />

            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold text-xs sm:text-sm tracking-wide">
                <Flower2 className="w-3.5 h-3.5" aria-hidden="true" />
                <h2 id="today-signal-title" className="font-medium">
                  Lời chiêm nghiệm hôm nay
                </h2>
              </div>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-accent text-on-accent px-3 py-1 text-xs font-semibold shadow-xs">
                <Sparkles className="w-3 h-3 text-amber-200" aria-hidden="true" />
                <span>Tâm trạng: {mood}</span>
              </span>
            </div>

            {/* Hai câu biên soạn minh họa */}
            <blockquote className="today-poem-quote">
              <p className="mb-1">{signal.poem.line1}</p>
              <p>{signal.poem.line2}</p>
            </blockquote>

            <p className="text-sm sm:text-base text-muted italic max-w-2xl leading-relaxed mt-2">
              {signal.poem.subtext}
            </p>

            {/* Thẻ Một việc nhỏ nuôi dưỡng tâm an */}
            <div className="today-action-box">
              <div className="flex items-start gap-3">
                {isActionDone ? (
                  <div className="w-8 h-8 rounded-full bg-success/15 border border-success/30 flex items-center justify-center text-success shrink-0 mt-0.5">
                    <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-full bg-accent/12 border border-accent/25 flex items-center justify-center text-accent shrink-0 mt-0.5">
                    <Flower2 className="w-4 h-4" aria-hidden="true" />
                  </div>
                )}

                <div className="flex-1">
                  <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-0.5">
                    {isActionDone
                      ? "Đã hoàn thành hôm nay"
                      : `Gợi ý thực hành · ${signal.action.duration}`}
                  </p>
                  <p className="text-base font-semibold text-ink leading-snug">
                    {signal.action.title}
                  </p>
                </div>
              </div>
            </div>

            {/* Các nút hành động */}
            <div className="flex flex-col sm:flex-row gap-3.5 mt-6">
              <button
                type="button"
                onClick={onViewSignalDetails}
                className="today-primary-btn group"
              >
                <span className="today-btn-sheen" />
                <span>
                  {isActionDone
                    ? "Xem lại lời chiêm nghiệm"
                    : "Đọc tiếp và thực hành"}
                </span>
                <ArrowRight
                  className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </button>

              <Button
                type="button"
                variant="outline"
                size="default"
                onClick={onSelectMoodClick}
                className="hover:border-accent/40"
              >
                Cập nhật lại tâm trạng
              </Button>
            </div>
          </section>
        ) : (
          /* TRƯỜNG HỢP B: BÀN TRÀ SỚM MỜI GỌI CHECK-IN */
          <section
            aria-labelledby="today-checkin-title"
            className="today-tea-intro-card grid grid-cols-1 md:grid-cols-12 overflow-hidden"
          >
            <div className="md:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-accent mb-3">
                <Flower2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isCheckedIn ? "Lần check-in trước" : timeHeroTag}</span>
              </div>

              <h2
                id="today-checkin-title"
                className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink leading-snug mb-3"
              >
                {isCheckedIn ? "Bạn đang cảm thấy thế nào hôm nay?" : "Hôm nay bạn đang cảm thấy thế nào?"}
              </h2>

              <p className="text-base text-muted leading-relaxed max-w-lg mb-6">
                Chạm vào cảm xúc để nhận một lời gợi mở chiêm nghiệm và một hành động nhỏ dịu dàng nuôi dưỡng tâm hồn bạn.
              </p>

              <div>
                <button
                  type="button"
                  onClick={onSelectMoodClick}
                  className="today-primary-btn group"
                >
                  <span className="today-btn-sheen" />
                  <span>{isCheckedIn ? "Cập nhật tâm trạng" : "Chọn tâm trạng ngay"}</span>
                  <ArrowRight
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </button>
              </div>

              <p className="mt-3.5 text-xs text-muted flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-gold" />
                <span>Chỉ mất 1 phút · Không bắt buộc đăng nhập</span>
              </p>
            </div>

            <div className="md:col-span-5 p-4 sm:p-6 flex items-center justify-center">
              <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-sm border border-line/60 bg-surface-soft relative">
                <img
                  src="/images/tea_bowl.jpg"
                  alt="Chén trà trong không gian yên tĩnh thanh tịnh"
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-103"
                />
                {/* Làn khói trà bốc lên nhẹ nhàng */}
                <div className="tea-steam-layer" aria-hidden="true">
                  <div className="tea-steam-emitter">
                    <span className="tea-steam-tendril tea-steam-tendril--1" />
                    <span className="tea-steam-tendril tea-steam-tendril--2" />
                    <span className="tea-steam-tendril tea-steam-tendril--3" />
                    <span className="tea-steam-tendril tea-steam-tendril--4" />
                    <span className="tea-steam-tendril tea-steam-tendril--5" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Nhắc lịch cá nhân nếu có */}
        <div className="mt-7">
          <TodayReminderCard
            email={currentUserEmail}
            onOpenReminders={onGoToReminders}
          />
        </div>

        {/* ========================================================= */}
        {/* 3. THEO CHỦ ĐỀ QUAN TÂM (NẾU CÓ CÀI ĐẶT)                   */}
        {/* ========================================================= */}
        {preferredSuggestions.length > 0 && (
          <section
            aria-labelledby="today-preferred-title"
            className="mt-10 sm:mt-12"
          >
            <div className="mb-5">
              <h2
                id="today-preferred-title"
                className="font-display text-xl sm:text-2xl font-semibold text-ink"
              >
                Gợi ý theo chủ đề bạn yêu thích
              </h2>
              <p className="text-sm sm:text-base text-muted mt-1">
                Nội dung được cá nhân hóa dựa trên sở thích bạn đã chọn trong Cài đặt.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {preferredSuggestions.map((suggestion) => (
                <article
                  key={suggestion.id}
                  className="today-heritage-card p-6"
                >
                  <CornerOrnament className="today-card-corner today-card-corner--tl" />
                  <CornerOrnament className="today-card-corner today-card-corner--br" />

                  <div>
                    <h3 className="font-display text-lg font-semibold text-ink mb-2">
                      {suggestion.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed mb-5">
                      {suggestion.description}
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={suggestion.onClick}
                    className="w-full justify-between hover:border-accent/40"
                  >
                    <span>{suggestion.buttonLabel}</span>
                    <ArrowRight className="h-4 w-4 text-accent" aria-hidden="true" />
                  </Button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* ========================================================= */}
        {/* 4. BA HÀNH TRÌNH TĨNH TẠI — THẺ BÀI CỔ PHONG               */}
        {/* ========================================================= */}
        <section
          aria-labelledby="today-explore-title"
          className="mt-10 sm:mt-14"
        >
          <div className="mb-6">
            <h2
              id="today-explore-title"
              className="font-display text-xl sm:text-2xl font-semibold text-ink mb-1.5"
            >
              Bạn muốn tìm gì?
            </h2>
            <p className="text-sm sm:text-base text-muted">
              Chọn bài viết văn hóa hoặc hướng dẫn nghi lễ.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {activities.map((activity) => {
              const Icon = activity.icon;

              return (
                <article
                  key={activity.title}
                  className="today-heritage-card overflow-hidden flex flex-col"
                >
                  <CornerOrnament className="today-card-corner today-card-corner--tl" />
                  <CornerOrnament className="today-card-corner today-card-corner--br" />

                  {activity.image && (
                    <div className="today-card-image-box">
                      <img
                        src={activity.image}
                        alt={activity.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-103"
                      />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="w-8 h-8 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center text-accent shrink-0">
                        <Icon className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <h3 className="font-display text-lg font-semibold text-ink">
                        {activity.title}
                      </h3>
                    </div>

                    <p className="text-sm text-muted leading-relaxed mb-5">
                      {activity.description}
                    </p>

                    <Button
                      type="button"
                      variant="outline"
                      onClick={activity.onClick}
                      className="mt-auto w-full justify-between hover:border-accent hover:bg-surface-soft"
                    >
                      <span>{activity.buttonLabel}</span>
                      <ArrowRight className="w-4 h-4 text-accent" aria-hidden="true" />
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
        <AboutSourcesSection />
      </main>
    </div>
  );
};

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
