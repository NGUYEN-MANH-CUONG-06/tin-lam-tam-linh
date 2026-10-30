import { toast } from "../components/ui/Toast";
import { UnverifiedImage } from "../components/UnverifiedImage";
import React, { useState, useEffect, useMemo } from "react";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Sparkles,
  Clock,
  Compass,
  Flower2,
  BookOpen,
  ArrowRight,
  Printer,
  Share2,
  Bookmark,
  CheckCircle2,
  CalendarPlus,
  ShieldCheck,
  Download,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { getReliableLunarDate, CalendarEventItem } from "../data/calendarData";
import { loadCalendarEvent } from "../data/contentService";
import { DetailNotFound } from "../components/DetailNotFound";
import { ScrollReveal } from "../components/ScrollReveal";

interface EventDetailScreenProps {
  eventId?: string;
  currentUserEmail?: string;
  onBackToCalendar: () => void;
  onGoToRituals?: () => void;
  onGoToHome: () => void;
  onGoToExplore?: () => void;
}

type TextSize = "normal" | "medium" | "large";

const EventDetailContent: React.FC<EventDetailScreenProps> = ({
  eventId = "le-soc-vong-ngay-ram",
  currentUserEmail,
  onBackToCalendar,
  onGoToRituals,
  onGoToHome,
  onGoToExplore,
}) => {
  const [remoteEvent, setRemoteEvent] = useState<CalendarEventItem | null>(null);
  const [remoteLoadFailed, setRemoteLoadFailed] = useState(false);
  const eventParts = eventId.split(":");
  const isApiEvent = eventParts.length === 5 && eventParts[0] === "api";
  const isDynamicEvent = isApiEvent;
  const event = remoteEvent || {
    id: eventId,
    title: "Đang tải sự kiện",
    day: Number(eventParts[4]) || 1,
    month: Number(eventParts[3]) || 1,
    year: Number(eventParts[2]) || new Date().getFullYear(),
    type: "festival" as const,
    typeLabel: "Sự kiện văn hóa",
    region: "Việt Nam",
    shortDesc: "",
    lunarDate: "",
  };

  const [readingProgress, setReadingProgress] = useState(0);
  const [textSize, setTextSize] = useState<TextSize>("normal");
  const [copiedLink, setCopiedLink] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    try {
      const key = `tltl-calendar-bookmark-${currentUserEmail || "guest"}-${eventId}`;
      return localStorage.getItem(key) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isDynamicEvent) {
      setRemoteEvent(null);
      setRemoteLoadFailed(false);
      return;
    }
    let cancelled = false;
    setRemoteEvent(null);
    setRemoteLoadFailed(false);
    void loadCalendarEvent(eventParts[1]).then((item) => {
      if (cancelled) return;
      if (item.verified !== true) throw new Error("Sự kiện này chưa được duyệt xuất bản.");
      const day = Number(eventParts[4]);
      const month = Number(eventParts[3]);
      const year = Number(eventParts[2]);
      const lunar = getReliableLunarDate(day, month, year);
      setRemoteEvent({
        id: eventId,
        title: String(item.title || "Sự kiện văn hóa"),
        day,
        month,
        year,
        type: "festival",
        typeLabel: String(item.typeLabel || "Sự kiện văn hóa"),
        region: String(item.region || "Việt Nam"),
        shortDesc: String(item.shortDesc || ""),
        lunarDate: `Âm lịch: ${lunar.lunarDay}/${lunar.lunarMonth}${lunar.isLeapMonth ? " nhuận" : ""}`,
        verifiedSource: item.verified === true ? String(item.source || "") : undefined,
      });
    }).catch(() => {
      if (!cancelled) setRemoteLoadFailed(true);
    });
    return () => { cancelled = true; };
  }, [eventId, isDynamicEvent]);

  const eventDate = new Date(event.year, event.month - 1, event.day);
  const eventDateLabel = eventDate.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const isPastEvent = eventDate < startOfToday;

  // Track scroll reading progress
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });

    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(
          100,
          Math.max(0, (window.scrollY / totalHeight) * 100)
        );
        setReadingProgress(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [eventId]);

  const toggleBookmark = () => {
    const nextState = !isBookmarked;
    setIsBookmarked(nextState);
    try {
      const key = `tltl-calendar-bookmark-${currentUserEmail || "guest"}-${eventId}`;
      if (nextState) {
        localStorage.setItem(key, "true");
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
  };

  const handleCopyLink = () => {
    try {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      toast.info("Bạn có thể sao chép liên kết từ thanh địa chỉ trình duyệt.", "Chia sẻ");
    }
  };

  const textSizeClass = useMemo(() => {
    switch (textSize) {
      case "medium":
        return "text-[18px] sm:text-[19px] leading-[2.0]";
      case "large":
        return "text-[20px] sm:text-[21px] leading-[2.1]";
      default:
        return "text-[16px] sm:text-[17px] leading-[1.85]";
    }
  }, [textSize]);

  // Generate Google Calendar Link
  const googleCalendarUrl = useMemo(() => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dateStr = `${event.year}${pad(event.month)}${pad(event.day)}`;
    const startTime = `${dateStr}T010000Z`;
    const endTime = `${dateStr}T120000Z`;

    const title = encodeURIComponent(`[Lịch Văn Hóa] ${event.title}`);
    const details = encodeURIComponent(
      `${event.shortDesc}\n\nÂm lịch: ${event.lunarDate}\nÝ nghĩa: ${event.coreMeaning || "Tri ân cội nguồn"}`
    );
    const location = encodeURIComponent(event.scope || event.region || "Việt Nam");

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTime}/${endTime}&details=${details}&location=${location}`;
  }, [event]);

  // Download iCal (.ics) file
  const handleDownloadIcs = () => {
    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
    const dateStr = `${event.year}${pad(event.month)}${pad(event.day)}`;

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Thich Cung Kieng//Lich Van Hoa Viet//VI",
      "CALSCALE:GREGORIAN",
      "BEGIN:VEVENT",
      `UID:${event.id}-${dateStr}@thichcungkieng.com`,
      `DTSTAMP:${dateStr}T000000Z`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${dateStr}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.shortDesc} - Âm lịch: ${event.lunarDate}`,
      `LOCATION:${event.scope || event.region}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `${event.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Contextual Bridge CTA
  const contextBridge = useMemo(() => {
    if (event.id === "mung-mot-thang-chin" || event.id === "le-soc-vong-ngay-ram") {
      return {
        tag: "CẨM NANG NGHI LỄ TẠI GIA",
        title: "Xem Hướng dẫn Chuẩn bị Nghi thức & Văn khấn tại gia",
        desc: "Chuẩn bị chén nước trong, nén hương mộc và bài văn khấn Nôm cổ truyền trang nghiêm trước bàn thờ gia tiên.",
        actionLabel: "Xem Cẩm nang Nghi lễ",
        btnStyle: "bg-amber-600 hover:bg-amber-700 text-white",
        icon: <BookOpen className="w-4 h-4" />,
        action: () => {
          if (onGoToRituals) onGoToRituals();
          else if (onGoToExplore) onGoToExplore();
        },
      };
    }

    if (event.id === "le-hoi-kate") {
      return {
        tag: "KHÁM PHÁ VĂN HÓA DÂN TỘC",
        title: "Khám phá Di sản Tháp Chăm & Tín ngưỡng Nam Trung Bộ",
        desc: "Tìm hiểu kiến trúc đền tháp độc bản, điệu múa quạt huyền ảo và phong tục giao hòa Chăm - Việt.",
        actionLabel: "Khám phá Văn hóa",
        btnStyle: "bg-teal-600 hover:bg-teal-700 text-white",
        icon: <Compass className="w-4 h-4" />,
        action: () => {
          if (onGoToExplore) onGoToExplore();
          else if (onGoToRituals) onGoToRituals();
        },
      };
    }

    if (event.id === "hoi-chua-keo-mua-thu") {
      return {
        tag: "KHÔNG GIAN KIẾN TRÚC GỖ CỔ TRUYỀN",
        title: "Khám phá Di sản Đình làng & Cổ tự Bắc Bộ",
        desc: "Chiêm ngưỡng kiệt tác Gác chuông Chùa Keo 3 tầng 12 mái và đạo vị thiền học thời Lý - Trần.",
        actionLabel: "Khám phá Đình chùa 3D",
        btnStyle: "bg-amber-700 hover:bg-amber-800 text-white",
        icon: <Sparkles className="w-4 h-4" />,
        action: () => {
          if (onGoToExplore) onGoToExplore();
          else if (onGoToRituals) onGoToRituals();
        },
      };
    }

    return {
      tag: "KHOẢNG LẶNG CHIÊM NGHIỆM",
      title: "Góc Tĩnh tâm & Chiêm nghiệm Đạo hiếu mùa thu",
      desc: "Dành vài phút thưởng thức chén trà ấm, hồi tưởng nếp xưa và gửi trao lời chúc trường thọ tới người thân yêu.",
      actionLabel: "Về Trang chủ hôm nay",
      btnStyle: "bg-accent hover:bg-accent/90 text-white",
      icon: <Flower2 className="w-4 h-4" />,
      action: onGoToHome,
    };
  }, [event.id, onGoToRituals, onGoToExplore, onGoToHome]);

  if (isDynamicEvent && !remoteEvent) {
    return remoteLoadFailed
      ? <DetailNotFound title="Không tìm thấy sự kiện" backLabel="Quay lại lịch" onBack={onBackToCalendar} />
      : <div role="status" className="screen-shell grid place-items-center text-muted">Đang tải sự kiện…</div>;
  }

  return (
    <div className="screen-shell relative">
      {/* Top Gold Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 z-50 transition-all duration-150 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
        style={{ width: `${readingProgress}%` }}
        aria-hidden="true"
      />

      <main className="page-container max-w-6xl pt-4 pb-20">
        {/* Top Breadcrumb & Reading Accessibility Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted mb-6 pb-3 border-b border-line/40">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onGoToHome}
              className="hover:text-accent cursor-pointer transition-colors font-medium"
            >
              Hôm nay
            </button>
            <span className="text-muted/60">›</span>
            <button
              type="button"
              onClick={onBackToCalendar}
              className="hover:text-accent cursor-pointer transition-colors font-medium"
            >
              Lịch văn hóa
            </button>
            <span className="text-muted/60">›</span>
            <span className="text-accent font-semibold truncate max-w-[220px] sm:max-w-md">
              {event.title}
            </span>
          </div>

          {/* Reading Accessibility Toolbar */}
          <div className="flex items-center gap-2">
            {/* Font size switcher */}
            <div className="flex items-center bg-surface border border-line rounded-lg p-0.5 text-xs">
              <button
                type="button"
                title="Cỡ chữ chuẩn"
                onClick={() => setTextSize("normal")}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  textSize === "normal"
                    ? "bg-accent/15 text-accent font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                A
              </button>
              <button
                type="button"
                title="Cỡ chữ vừa"
                onClick={() => setTextSize("medium")}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  textSize === "medium"
                    ? "bg-accent/15 text-accent font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                A+
              </button>
              <button
                type="button"
                title="Cỡ chữ lớn"
                onClick={() => setTextSize("large")}
                className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                  textSize === "large"
                    ? "bg-accent/15 text-accent font-bold"
                    : "text-muted hover:text-ink"
                }`}
              >
                A++
              </button>
            </div>

            {/* Print Button */}
            <button
              type="button"
              onClick={() => window.print()}
              title="In thông tin sự kiện văn hóa"
              className="p-1.5 rounded-lg border border-line bg-surface hover:border-accent hover:text-accent transition-colors flex items-center gap-1 text-xs text-muted cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">In</span>
            </button>

            {/* Bookmark Button */}
            <button
              type="button"
              onClick={toggleBookmark}
              title={isBookmarked ? "Bỏ đánh dấu sự kiện" : "Lưu vào danh sách yêu thích"}
              className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs cursor-pointer ${
                isBookmarked
                  ? "border-accent bg-accent/10 text-accent font-semibold"
                  : "border-line bg-surface text-muted hover:border-accent hover:text-accent"
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? "fill-current" : ""}`} />
              <span className="hidden sm:inline">{isBookmarked ? "Đã lưu" : "Lưu"}</span>
            </button>

            {/* Share / Copy Link Button */}
            <button
              type="button"
              onClick={handleCopyLink}
              title="Sao chép liên kết chia sẻ"
              className="p-1.5 rounded-lg border border-line bg-surface hover:border-accent hover:text-accent transition-colors flex items-center gap-1 text-xs text-muted cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-emerald-600 font-semibold">Đã chép</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Chia sẻ</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Badges Strip Header */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <Badge
            variant="outline"
            className="text-xs font-semibold px-3 py-1 uppercase bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30 rounded-full"
          >
            ✦ {event.typeLabel}
          </Badge>

          <Badge
            variant="outline"
            className="text-xs font-medium px-3 py-1 bg-surface text-ink border-line rounded-full"
          >
            {event.region}
          </Badge>

          {event.badge && (
            <Badge className="text-xs font-semibold px-3 py-1 bg-gradient-to-r from-red-800 to-amber-700 text-white shadow-xs rounded-full">
              {event.badge}
            </Badge>
          )}

        </div>

        {/* Main Title & Solar/Lunar Date Bar */}
        <div className="mb-6">
          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-ink mb-3 leading-snug">
            {event.title}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-sm sm:text-base text-accent font-semibold mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-amber-600" />
              <span>{eventDateLabel}</span>
            </span>
            <span className="text-muted/60">•</span>
            <span className="text-amber-800 dark:text-amber-300 font-medium">
              Âm lịch: {event.lunarDate}
            </span>
          </div>

          {isPastEvent && (
            <div className="mb-4 rounded-2xl border border-line/80 bg-surface-soft/60 px-4 py-3 text-xs sm:text-sm text-muted leading-relaxed">
              <span>✤ Sự kiện đã diễn ra trong chu kỳ lịch. Tư liệu văn hóa được lưu giữ trọn vẹn để bạn chiêm nghiệm và đối chiếu thường niên.</span>
            </div>
          )}

          <p className="text-sm sm:text-base text-ink/85 leading-relaxed max-w-4xl font-serif">
            {event.shortDesc}
          </p>
        </div>

        {/* 3 Meta Info Strip Cards */}
        <ScrollReveal variant="up" delay={75} className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-surface border border-line/80 flex items-center gap-3.5 shadow-2xs hover:border-amber-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-muted">
                  Thời điểm diễn ra
                </div>
                <div className="font-semibold text-xs sm:text-sm text-ink">
                  {event.timing || event.lunarDate}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-line/80 flex items-center gap-3.5 shadow-2xs hover:border-amber-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/20">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-muted">
                  Phạm vi lưu truyền
                </div>
                <div className="font-semibold text-xs sm:text-sm text-ink">
                  {event.scope || event.region}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-surface border border-line/80 flex items-center gap-3.5 shadow-2xs hover:border-amber-500/30 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wider font-bold text-muted">
                  Ý nghĩa cốt lõi
                </div>
                <div className="font-semibold text-xs sm:text-sm text-ink line-clamp-1">
                  {event.coreMeaning || "Tri ân cội nguồn & Nuôi dưỡng tâm lành"}
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* 2-Column Content Layout: Left Body (8 cols) & Right Sticky Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start mb-16">
          {/* Left Column (8 cols): Hero Image, Meaning, Customs, Youth Actions, Regional */}
          <div className="lg:col-span-8 space-y-8">
            {/* Hero Artwork Image Card */}
            <ScrollReveal variant="scale">
              <div className="rounded-3xl overflow-hidden bg-surface border border-amber-500/30 shadow-md">
                <div className="relative aspect-[16/9] sm:aspect-[21/9] w-full bg-surface overflow-hidden">
                  <UnverifiedImage
                    src={event.heroImage || "/images/ritual_ram.jpg"}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                  {event.heroCaption && (
                    <div className="absolute bottom-3 left-4 right-4 text-white/90 text-xs sm:text-sm font-medium drop-shadow-md">
                      {event.heroCaption}
                    </div>
                  )}
                </div>
              </div>
            </ScrollReveal>

            {/* Section 1: Chiều sâu ý nghĩa văn hóa & Drop Cap */}
            <ScrollReveal variant="up" as="section" className="space-y-4">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-line/50">
                <span className="w-2 h-5 rounded-full bg-amber-600"></span>
                <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                  Chiều sâu nếp sống & Ý nghĩa văn hóa truyền đời
                </h2>
              </div>

              <div className={`space-y-4 text-ink ${textSizeClass}`}>
                {event.culturalMeaning?.paragraphs ? (
                  event.culturalMeaning.paragraphs.map((p, idx) => {
                    if (idx === 0) {
                      const firstChar = p.charAt(0);
                      const rest = p.slice(1);
                      return (
                        <p key={idx} className="text-justify">
                          <span className="float-left text-4xl sm:text-5xl font-serif font-bold text-accent mr-3 px-3 py-1 bg-amber-500/10 border border-amber-500/25 rounded-2xl shadow-xs leading-none">
                            {firstChar}
                          </span>
                          {rest}
                        </p>
                      );
                    }
                    return (
                      <p key={idx} className="text-justify leading-relaxed">
                        {p}
                      </p>
                    );
                  })
                ) : (
                  <p className="text-justify leading-relaxed">
                    Mỗi phong tục hay lễ hội trong văn hóa Việt đều là một nhịp cầu nối kết con người với tổ tiên, với cộng đồng và với đất trời. Dành thời gian tìm hiểu về ngày này giúp người trẻ thấu hiểu mạch nguồn văn hóa, giữ được nếp nhà thanh tao mà không vướng bận vào những hủ tục mê tín dị đoan.
                  </p>
                )}
              </div>

              {/* Callout Pull-Quote */}
              {event.culturalMeaning?.quote && (
                <div className="my-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/[0.04] to-transparent border-l-4 border-amber-600 shadow-xs relative">
                  <Flower2 className="w-6 h-6 text-amber-600/40 absolute top-4 right-4 pointer-events-none" />
                  <blockquote className="font-serif italic font-semibold text-base sm:text-lg text-amber-900 dark:text-amber-200 leading-relaxed pr-6">
                    “{event.culturalMeaning.quote}”
                  </blockquote>
                </div>
              )}
            </ScrollReveal>

            {/* Section 2: Thực hành phong tục truyền thống */}
            {event.customs && event.customs.length > 0 && (
              <ScrollReveal variant="up" as="section" className="space-y-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-line/50">
                  <span className="w-2 h-5 rounded-full bg-amber-600"></span>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                    Những việc thường làm giản dị mà trang trọng
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {event.customs.map((custom, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-2xl bg-surface border border-line/80 hover:border-amber-500/40 hover:shadow-xs transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-600 shrink-0" />
                          <h3 className="font-display font-bold text-sm sm:text-base text-ink">
                            {custom.title}
                          </h3>
                        </div>
                        <p className="text-xs sm:text-sm text-ink/80 leading-relaxed">
                          {custom.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {/* Section 3: Người trẻ thực hành & Nếp sống đương đại */}
            {event.youthActions && event.youthActions.length > 0 && (
              <ScrollReveal variant="up" as="section" className="space-y-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-line/50">
                  <span className="w-2 h-5 rounded-full bg-amber-600"></span>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                    Hành động gợi ý cho người trẻ hôm nay
                  </h2>
                </div>

                <div className="space-y-3.5">
                  {event.youthActions.map((action) => (
                    <div
                      key={action.step}
                      className="p-4 sm:p-5 rounded-2xl bg-surface border border-line/80 hover:border-amber-500/30 transition-all flex items-start gap-4 shadow-2xs"
                    >
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-600 to-amber-700 text-white font-bold font-serif text-sm flex items-center justify-center shrink-0 shadow-xs">
                        0{action.step}
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-sm sm:text-base text-ink mb-1">
                          {action.title}
                        </h3>
                        <p className={`text-ink/85 leading-relaxed ${textSizeClass}`}>
                          {action.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            )}

            {/* Section 4: Sắc thái văn hóa vùng miền */}
            {event.regionalNuances && (
              <ScrollReveal variant="up" as="section" className="space-y-4">
                <div className="flex items-center gap-2 mb-2 pb-2 border-b border-line/50">
                  <span className="w-2 h-5 rounded-full bg-amber-600"></span>
                  <h2 className="font-display font-bold text-xl sm:text-2xl text-ink">
                    Sắc thái phong tục ba miền Bắc — Trung — Nam
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.03] to-surface">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5">
                      <span>⛩️ Miền Bắc</span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink leading-relaxed">
                      {event.regionalNuances.bac}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.03] to-surface">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5">
                      <span>🌊 Miền Trung</span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink leading-relaxed">
                      {event.regionalNuances.trung}
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.03] to-surface">
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1.5">
                      <span>🚣 Miền Nam</span>
                    </div>
                    <p className="text-xs sm:text-sm text-ink leading-relaxed">
                      {event.regionalNuances.nam}
                    </p>
                  </div>
                </div>

                {event.regionalNuances.note && (
                  <div className="p-4 rounded-2xl bg-amber-500/[0.04] border border-amber-500/20 text-xs text-muted leading-relaxed">
                    <strong>Ghi chú từ Ban Biên Tập:</strong> {event.regionalNuances.note}
                  </div>
                )}
              </ScrollReveal>
            )}

            {/* Section 5: Contextual Bridge Card */}
            <ScrollReveal variant="scale">
              <div className="p-6 sm:p-7 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-surface to-surface shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <Badge
                      variant="outline"
                      className="text-xs px-3 py-0.5 font-bold uppercase bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/30"
                    >
                      {contextBridge.tag}
                    </Badge>
                    <h3 className="font-display font-bold text-lg sm:text-xl text-ink">
                      {contextBridge.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted max-w-xl leading-relaxed">
                      {contextBridge.desc}
                    </p>
                  </div>
                  <Button
                    onClick={contextBridge.action}
                    className={`shrink-0 font-semibold cursor-pointer shadow-sm min-h-11 px-5 ${contextBridge.btnStyle}`}
                  >
                    <span className="flex items-center gap-2">
                      {contextBridge.icon}
                      <span>{contextBridge.actionLabel}</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </Button>
                </div>
              </div>
            </ScrollReveal>

          </div>

          {/* Right Column (4 cols): Sticky Sidebar Widgets */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            <ScrollReveal variant="fade" delay={150}>
              {/* Widget 1: Thêm vào lịch cá nhân (Google Calendar & iCal) */}
              <Card className="p-6 rounded-3xl bg-surface border border-amber-500/30 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-line/50">
                  <CalendarPlus className="w-5 h-5 text-amber-600" />
                  <h2 className="font-display font-bold text-base text-ink">
                    Đồng bộ Lịch cá nhân
                  </h2>
                </div>

                <p className="text-xs text-muted leading-relaxed">
                  Thêm sự kiện này vào ứng dụng lịch điện thoại hoặc máy tính của bạn để nhận thông báo chuẩn bị nếp nhà chu đáo.
                </p>

                <div className="space-y-2.5 pt-1">
                  {/* Google Calendar Link */}
                  <a
                    href={googleCalendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full min-h-11 px-4 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Thêm vào Google Calendar</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  {/* Download .ICS file */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleDownloadIcs}
                    className="w-full min-h-11 px-4 rounded-xl border-line hover:border-amber-500/40 text-xs font-semibold text-ink flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải file Lịch (.ics cho iPhone/Mac/Outlook)</span>
                  </Button>
                </div>
              </Card>

              {/* Widget 2: Cẩm nang nghi lễ Shortcut */}
              {onGoToRituals && (
                <Card className="mt-6 p-6 rounded-3xl bg-gradient-to-br from-amber-500/[0.04] to-surface border border-line shadow-xs space-y-3">
                  <div className="text-[11px] uppercase tracking-wider font-bold text-amber-800 dark:text-amber-300">
                    CẨM NANG NGHI LỄ TẠI GIA
                  </div>

                  <h3 className="font-display font-bold text-base text-ink leading-snug">
                    Sửa soạn tiết lễ chu đáo, tinh giản
                  </h3>

                  <p className="text-xs text-muted leading-relaxed">
                    Xem chi tiết cách chuẩn bị chén nước thanh tịnh, đĩa quả mùa, nén hương mộc và bài văn khấn Nôm cổ truyền.
                  </p>

                  <Button
                    type="button"
                    onClick={onGoToRituals}
                    className="w-full min-h-10 text-xs font-bold bg-amber-700 hover:bg-amber-800 text-white rounded-xl gap-1.5 shadow-xs cursor-pointer"
                  >
                    <span>Xem cẩm nang nghi lễ</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Card>
              )}

              {/* Widget 3: Classical Quote Card */}
              <div className="mt-6 text-center p-5 rounded-3xl bg-amber-500/[0.03] border border-amber-500/20 text-xs text-muted italic leading-relaxed space-y-1.5">
                <Flower2 className="w-4 h-4 text-amber-600 mx-auto" />
                <p>“Cây có cội mới trổ cành xanh ngọn, nước có nguồn mới biển rộng sông sâu.”</p>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="pt-6 border-t border-line/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Button
            variant="outline"
            onClick={onBackToCalendar}
            className="rounded-xl border-line text-xs font-semibold text-muted hover:text-ink gap-2 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Quay lại Lịch văn hóa</span>
          </Button>

          <Button
            variant="default"
            onClick={onGoToHome}
            className="rounded-xl bg-accent text-white text-xs font-semibold gap-2 shadow-xs cursor-pointer"
          >
            <span>Về trang chủ Hôm nay</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export const EventDetailScreen: React.FC<EventDetailScreenProps> = (props) => {
  const eventId = props.eventId ?? "le-soc-vong-ngay-ram";
  const isApiEvent = eventId.startsWith("api:");
  if (!isApiEvent) {
    return (
      <DetailNotFound
        title="Không tìm thấy sự kiện văn hóa"
        backLabel="Về Lịch văn hóa"
        onBack={props.onBackToCalendar}
      />
    );
  }

  return <EventDetailContent {...props} eventId={eventId} key={eventId} />;
};
