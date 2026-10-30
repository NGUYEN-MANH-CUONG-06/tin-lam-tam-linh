import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Flower2,
  BookOpen,
  ArrowRight,
  Plus,
  Info,
  CheckCircle2,
  Heart,
  Clock,
  MapPin,
  Trash2,
  Bookmark,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { AppDialog } from "../components/AppDialog";
import {
  CalendarEventType,
  CalendarEventItem,
  getReliableLunarDate,
  getCanChiYear,
  getCanChiDay,
  getCanChiMonth,
  getAuspiciousHoursForDay,
  loadCalendarPersonalNotes,
  saveCalendarPersonalNotes,
} from "../data/calendarData";
import { loadCalendarEvents, type RemoteContentItem } from "../data/contentService";
import { isDemoMode } from "../data/demoMode";

interface CulturalCalendarScreenProps {
  onGoToToday?: () => void;
  onGoToHome?: () => void;
  onSelectEvent: (eventId: string) => void;
  onGoToRituals?: () => void;
  onGoToCulture?: () => void;
  onGoToGoodDays?: () => void;
  currentUserEmail?: string;
}

export const CulturalCalendarScreen: React.FC<CulturalCalendarScreenProps> = ({
  onGoToToday,
  onGoToHome,
  onSelectEvent,
  onGoToRituals,
  onGoToCulture,
  onGoToGoodDays,
  currentUserEmail,
}) => {
  // Lấy thời gian thực tế từ hệ thống (Date)
  const today = useMemo(() => new Date(), []);
  const todayRealDay = today.getDate();
  const todayRealMonth = today.getMonth() + 1;
  const todayRealYear = today.getFullYear();

  // Khởi tạo trạng thái lịch động theo Date hiện tại
  const [selectedYear, setSelectedYear] = useState<number>(todayRealYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(todayRealMonth);
  const [selectedDay, setSelectedDay] = useState<number>(todayRealDay);

  const [activeFilter, setActiveFilter] = useState<"all" | "custom" | "festival" | "personal">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteDesc, setNewNoteDesc] = useState("");
  const [noteSaveError, setNoteSaveError] = useState("");
  const [noteDeleteError, setNoteDeleteError] = useState("");

  // Dữ liệu "Ngày tôi lưu": nạp trực tiếp theo tài khoản riêng biệt
  const [personalNotes, setPersonalNotes] = useState<CalendarEventItem[]>(() =>
    loadCalendarPersonalNotes(currentUserEmail)
  );
  const [remoteEvents, setRemoteEvents] = useState<RemoteContentItem[]>([]);
  const [calendarError, setCalendarError] = useState("");

  useEffect(() => {
    void loadCalendarEvents().then(setRemoteEvents).catch(() => setCalendarError("Chưa tải được sự kiện từ máy chủ. Vui lòng tải lại trang; lịch ngày và ghi chú cá nhân vẫn dùng được."));
  }, []);

  // Khi tài khoản đăng nhập thay đổi hoặc đăng xuất, tự động nạp lại đúng dữ liệu lịch
  useEffect(() => {
    setPersonalNotes(loadCalendarPersonalNotes(currentUserEmail));
  }, [currentUserEmail]);

  // Tổng hợp sự kiện: sự kiện lịch sử văn hóa đã kiểm chứng + ngày cá nhân người dùng thực sự lưu
  const allEvents = useMemo(() => {
    const remotePublicEvents: CalendarEventItem[] = [];
    const daysInYear = new Date(selectedYear, 1, 29).getMonth() === 1 ? 366 : 365;

    // 1. Tự động gắn 2 mốc phong tục quan trọng nhất của nếp nhà truyền thống: Sóc (Mùng 1) và Vọng (Rằm)
    for (let offset = 0; offset < daysInYear; offset += 1) {
      const date = new Date(selectedYear, 0, 1 + offset);
      const d = date.getDate();
      const m = date.getMonth() + 1;
      const lunar = getReliableLunarDate(d, m, selectedYear);
      if (lunar.isFirstDay) {
        remotePublicEvents.push({
          id: `custom:soc:${selectedYear}:${m}:${d}`,
          title: `Ngày Sóc (Mùng Một Âm lịch) - Khởi đầu thanh tịnh`,
          day: d,
          month: m,
          year: selectedYear,
          type: "custom",
          typeLabel: "Phong tục nếp nhà",
          region: "Toàn quốc",
          shortDesc: `Ngày đầu tháng theo nếp xưa: dọn dẹp hương án thanh tịnh, thắp nén trầm mộc và giữ tâm thế an hòa đón tháng mới.`,
          lunarDate: `Âm lịch: 1/${lunar.lunarMonth}${lunar.isLeapMonth ? " nhuận" : ""}`,
          badge: "Mùng 1",
        });
      } else if (lunar.isFullMoon) {
        remotePublicEvents.push({
          id: `custom:vong:${selectedYear}:${m}:${d}`,
          title: `Ngày Vọng (Rằm tháng ${lunar.lunarMonth} Âm lịch) - Trăng tròn viên mãn`,
          day: d,
          month: m,
          year: selectedYear,
          type: "custom",
          typeLabel: "Phong tục nếp nhà",
          region: "Toàn quốc",
          shortDesc: `Ngày rằm trăng sáng tỏ: chuẩn bị chén nước trong, đĩa hoa quả thơm, hướng niệm tri ân cội nguồn tổ tiên và giữ sự hòa thuận trong gia đình.`,
          lunarDate: `Âm lịch: 15/${lunar.lunarMonth}${lunar.isLeapMonth ? " nhuận" : ""}`,
          badge: "Ngày Rằm",
        });
      }
    }

    // 2. Nạp các ngày lễ truyền thống & quốc gia
    for (const item of remoteEvents) {
      if (item.verified !== true) continue;
      const eventDay = Number(item.day);
      const eventMonth = Number(item.month);
      if (!Number.isInteger(eventDay) || !Number.isInteger(eventMonth)) continue;
      const calendar = item.calendar === "SOLAR" ? "SOLAR" : "LUNAR";
      for (let offset = 0; offset < daysInYear; offset += 1) {
        const date = new Date(selectedYear, 0, 1 + offset);
        const lunar = getReliableLunarDate(date.getDate(), date.getMonth() + 1, selectedYear);
        const matches = calendar === "SOLAR"
          ? date.getDate() === eventDay && date.getMonth() + 1 === eventMonth
          : !lunar.isLeapMonth && lunar.lunarDay === eventDay && lunar.lunarMonth === eventMonth;
        if (!matches) continue;
        const region = String(item.region || "Toàn quốc");
        const title = String(item.title || "Sự kiện văn hóa");
        const isCustom = String(item.typeLabel || "").toLowerCase().includes("phong tục") || String(item.typeLabel || "").toLowerCase().includes("nếp nhà");
        remotePublicEvents.push({
          id: `api:${item.id}:${selectedYear}:${date.getMonth() + 1}:${date.getDate()}`,
          title,
          day: date.getDate(),
          month: date.getMonth() + 1,
          year: selectedYear,
          type: isCustom ? "custom" : "festival",
          typeLabel: String(item.typeLabel || "Sự kiện văn hóa"),
          region,
          shortDesc: String(item.shortDesc || ""),
          lunarDate: calendar === "SOLAR"
            ? `Dương lịch: ${eventDay}/${eventMonth} (Âm lịch: ${lunar.lunarDay}/${lunar.lunarMonth})`
            : `Âm lịch: ${lunar.lunarDay}/${lunar.lunarMonth}${lunar.isLeapMonth ? " nhuận" : ""}`,
          verifiedSource: item.verified === true ? String(item.source || "") : undefined,
          badge: title.length > 8 ? title.slice(0, 7) + "…" : title,
        });
      }
    }

    return [...remotePublicEvents, ...personalNotes];
  }, [remoteEvents, personalNotes, selectedYear]);

  const eventsInSelectedMonth = allEvents.filter(
    (event) =>
      event.year === selectedYear &&
      event.month === selectedMonth
  );

  const customCount = eventsInSelectedMonth.filter(
    (event) => event.type === "custom"
  ).length;

  const festivalCount = eventsInSelectedMonth.filter(
    (event) => event.type === "festival"
  ).length;

  const personalCount = personalNotes.filter(
    (event) =>
      event.year === selectedYear &&
      event.month === selectedMonth
  ).length;

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
    // Đảm bảo selectedDay không vượt quá số ngày của tháng mới
    setSelectedDay((prev) => {
      const prevM = selectedMonth === 1 ? 12 : selectedMonth - 1;
      const prevY = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
      const maxDays = new Date(prevY, prevM, 0).getDate();
      return Math.min(prev, maxDays);
    });
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
    setSelectedDay((prev) => {
      const nextM = selectedMonth === 12 ? 1 : selectedMonth + 1;
      const nextY = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
      const maxDays = new Date(nextY, nextM, 0).getDate();
      return Math.min(prev, maxDays);
    });
  };

  // Nút trở về ngày hôm nay theo Date thực tế
  const handleResetToday = () => {
    const now = new Date();
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
    setSelectedDay(now.getDate());
  };

  const handleAddPersonalNote = (
    event: React.FormEvent
  ) => {
    event.preventDefault();
    setNoteSaveError("");

    const cleanTitle = newNoteTitle.trim();

    if (!cleanTitle) {
      setNoteSaveError(
        "Bạn hãy nhập tên ngày hoặc việc muốn ghi nhớ."
      );
      return;
    }

    const lunarInfo = getReliableLunarDate(
      selectedDay,
      selectedMonth,
      selectedYear
    );

    const lunarDate = lunarInfo
      ? `Ngày ${lunarInfo.lunarDay}/${lunarInfo.lunarMonth} Âm lịch (${lunarInfo.canChiYear})`
      : "Dấu mốc tự lưu";

    const newNote: CalendarEventItem = {
      id: crypto.randomUUID(),
      day: selectedDay,
      month: selectedMonth,
      year: selectedYear,
      type: "personal",
      typeLabel: "Ghi chú của tôi",
      region: "Cá nhân",
      title: cleanTitle,
      shortDesc:
        newNoteDesc.trim() ||
        "Dấu mốc nếp nhà bạn ghi nhớ cho riêng mình.",
      lunarDate,
    };

    const updatedNotes = [
      newNote,
      ...personalNotes,
    ];

    const saved = saveCalendarPersonalNotes(
      currentUserEmail,
      updatedNotes
    );

    if (!saved) {
      setNoteSaveError(
        "Chưa lưu được ghi chú trên trình duyệt này. Nội dung bạn nhập vẫn được giữ; hãy thử lại."
      );
      return;
    }

    // Chỉ cập nhật màn hình sau khi lưu thành công.
    setPersonalNotes(updatedNotes);
    setNewNoteTitle("");
    setNewNoteDesc("");
    setNoteSaveError("");
    setShowAddModal(false);
  };

  const handleDeleteNote = (noteId: string) => {
    setNoteDeleteError("");

    const updatedNotes = personalNotes.filter(
      (note) => note.id !== noteId
    );

    const saved = saveCalendarPersonalNotes(
      currentUserEmail,
      updatedNotes
    );

    if (!saved) {
      setNoteDeleteError(
        "Chưa xóa được ghi chú. Nội dung vẫn được giữ nguyên; hãy thử lại."
      );
      return;
    }

    setPersonalNotes(updatedNotes);
  };

  // Các sự kiện hiển thị cho ngày được chọn (hoặc toàn bộ danh sách khi chọn tab "Ngày tôi lưu")
  const selectedDayEvents = useMemo(() => {
    return (
      activeFilter === "personal"
        ? personalNotes
        : allEvents.filter(
            (e) => e.day === selectedDay && e.month === selectedMonth && e.year === selectedYear
          )
    ).filter((e) => (activeFilter === "all" ? true : e.type === activeFilter));
  }, [activeFilter, personalNotes, allEvents, selectedDay, selectedMonth, selectedYear]);

  // Sinh lưới ngày ĐỘNG theo tháng và năm đang chọn (Thứ Hai -> Chủ Nhật)
  const calendarGridDays = useMemo(() => {
    const daysInCurrentMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const prevMonth = selectedMonth === 1 ? 12 : selectedMonth - 1;
    const prevYear = selectedMonth === 1 ? selectedYear - 1 : selectedYear;
    const daysInPrevMonth = new Date(prevYear, prevMonth, 0).getDate();

    // Ngày đầu tiên của tháng: JS getDay() trả về 0 (CN), 1 (T2), ..., 6 (T7)
    // Hệ thống lịch Việt Nam bắt đầu bằng Thứ Hai:
    const firstDayOfWeek = new Date(selectedYear, selectedMonth - 1, 1).getDay();
    const startOffset = (firstDayOfWeek + 6) % 7;

    const grid = [];

    // Các ngày thuộc tháng trước (mờ)
    for (let i = startOffset - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const lunar = getReliableLunarDate(day, prevMonth, prevYear);
      grid.push({
        day,
        month: prevMonth,
        year: prevYear,
        isCurrentMonth: false,
        lunarText: lunar ? `${lunar.lunarDay}/${lunar.lunarMonth}` : undefined,
        hasDot: false,
        hasPersonalNote: false,
        badge: undefined as string | undefined,
        isSpecial: false,
        subText: undefined as string | undefined,
        type: undefined as CalendarEventType | undefined,
      });
    }

    // Các ngày thuộc tháng hiện tại
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const lunar = getReliableLunarDate(day, selectedMonth, selectedYear);
      // Tìm sự kiện kiểm chứng hoặc ghi chú khớp ĐÚNG ngày, tháng và năm
      const dayEvents = allEvents.filter(
        (e) => e.day === day && e.month === selectedMonth && e.year === selectedYear
      );
      const hasPersonal = personalNotes.some(
        (n) => n.day === day && n.month === selectedMonth && n.year === selectedYear
      );
      const mainEvent = dayEvents[0];

      let badge: string | undefined = mainEvent?.badge || mainEvent?.title;
      let type: CalendarEventType | undefined = mainEvent?.type;
      let isSpecial = false;
      let subText: string | undefined = lunar?.solarTerm;

      // Nếu ngày đó không có sự kiện văn hóa riêng nhưng là Rằm hoặc Mùng 1:
      if (!badge && lunar) {
        if (lunar.specialBadge) {
          badge = lunar.specialBadge;
          isSpecial = true;
          type = "festival";
        } else if (lunar.isFullMoon) {
          badge = `Rằm tháng ${lunar.lunarMonth}`;
          isSpecial = true;
          type = "custom";
        } else if (lunar.isFirstDay) {
          badge = `Mùng 1/${lunar.lunarMonth} AL`;
          type = "custom";
        }
      }

      grid.push({
        day,
        month: selectedMonth,
        year: selectedYear,
        isCurrentMonth: true,
        lunarText: lunar ? `${lunar.lunarDay}/${lunar.lunarMonth}` : undefined,
        subText,
        badge,
        isSpecial,
        hasDot: dayEvents.length > 0,
        hasPersonalNote: hasPersonal,
        type,
      });
    }

    // Các ngày thuộc tháng sau để hoàn thiện bảng (35 hoặc 42 ô)
    const nextMonth = selectedMonth === 12 ? 1 : selectedMonth + 1;
    const nextYear = selectedMonth === 12 ? selectedYear + 1 : selectedYear;
    const totalCells = Math.ceil(grid.length / 7) * 7;
    const remaining = totalCells - grid.length;
    for (let day = 1; day <= remaining; day++) {
      const lunar = getReliableLunarDate(day, nextMonth, nextYear);
      grid.push({
        day,
        month: nextMonth,
        year: nextYear,
        isCurrentMonth: false,
        lunarText: lunar ? `${lunar.lunarDay}/${lunar.lunarMonth}` : undefined,
        hasDot: false,
        hasPersonalNote: false,
        badge: undefined,
        isSpecial: false,
        subText: undefined,
        type: undefined,
      });
    }

    return grid;
  }, [selectedYear, selectedMonth, allEvents, personalNotes]);

  // Thông tin âm lịch của ngày đang được chọn trong chi tiết
  const currentSelectedLunar = useMemo(() => {
    return getReliableLunarDate(selectedDay, selectedMonth, selectedYear);
  }, [selectedDay, selectedMonth, selectedYear]);

  const currentCalendarFacts = useMemo(() => {
    const date = new Date(selectedYear, selectedMonth - 1, selectedDay);
    const canChiDay = getCanChiDay(date);
    return {
      canChiDay: canChiDay.name,
      canChiMonth: getCanChiMonth(currentSelectedLunar.lunarMonth, currentSelectedLunar.lunarYear),
      auspiciousHours: getAuspiciousHoursForDay(canChiDay.chi),
    };
  }, [selectedDay, selectedMonth, selectedYear, currentSelectedLunar]);

  // Âm lịch tiêu đề tháng
  const monthHeaderLunar = useMemo(() => {
    return getReliableLunarDate(15, selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear]);

  return (
    <div className="screen-shell">
      <main className="page-container max-w-7xl">
        {calendarError && <p role="alert" className="mb-5 rounded-xl border border-danger/30 p-4 text-sm text-danger">{calendarError}</p>}
        {noteDeleteError && (
          <p
            role="alert"
            className="mb-5 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm leading-relaxed text-danger"
          >
            {noteDeleteError}
          </p>
        )}

        {/* Top Breadcrumb & Status Ribbon */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            <button
              onClick={onGoToHome || onGoToToday}
              className="hover:text-accent cursor-pointer transition-colors"
            >
              Hôm nay
            </button>
            <span>/</span>
            <span className="text-accent font-semibold">Lịch văn hóa</span>
          </div>

          <div className="flex items-center gap-1.5 uppercase font-semibold text-xs text-muted">
            <span className="text-accent">✤</span>
            <span>LỊCH ÂM DƯƠNG · DẤU MỐC CÁ NHÂN</span>
          </div>
        </div>

        {/* Header Title Section */}
        <div className="mb-6">
          <div className="text-xs uppercase font-bold tracking-wider text-accent mb-1.5 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-action"></span>
            <span>DÒNG THỜI GIAN VĂN HÓA</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h1 className="page-title mb-2">
              Lịch văn hóa & Nếp nhà
            </h1>

            <div className="flex items-center gap-2 flex-wrap">
            </div>
          </div>

          <p className="text-sm sm:text-base text-ink max-w-3xl leading-relaxed">
            Tra cứu ngày âm/dương, xem sự kiện văn hóa đã được biên tập
            và lưu những ngày bạn muốn nhớ.
          </p>

          <div className="flex items-center justify-center my-6">
            <div className="h-px w-16 bg-surface-soft"></div>
            <div className="mx-3 text-accent text-sm">❦</div>
            <div className="h-px w-16 bg-surface-soft"></div>
          </div>
        </div>

        {calendarError && (
          <div role="status" className="mb-6 rounded-xl border border-line bg-surface p-4">
            <p className="text-sm text-muted leading-relaxed">{calendarError} Sự kiện văn hóa sẽ xuất hiện khi kết nối máy chủ được khôi phục.</p>
          </div>
        )}

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column (8 cols): Calendar Grid & Cultural Insights */}
          <div className="lg:col-span-8 min-w-0 space-y-6">
            <div className="bg-surface border border-line rounded-panel p-2 sm:p-6 shadow-xs">
              {/* Calendar Controls Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-line">
                {/* Month Navigation */}
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={handlePrevMonth}
                    className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-ink hover:bg-surface transition-colors cursor-pointer"
                    title="Tháng trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <div>
                    <h2 className="section-title text-xl sm:text-2xl min-w-0 text-center">
                      Tháng {selectedMonth}, {selectedYear}
                    </h2>
                    <p className="text-sm text-muted text-center font-medium">
                      {monthHeaderLunar
                        ? `Tháng ${monthHeaderLunar.lunarMonth} Âm lịch • Năm ${monthHeaderLunar.canChiYear}`
                        : "Lịch Âm Dương thuần Việt"}
                    </p>
                  </div>

                  <button
                    onClick={handleNextMonth}
                    className="w-8 h-8 rounded-full border border-line flex items-center justify-center text-ink hover:bg-surface transition-colors cursor-pointer"
                    title="Tháng sau"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleResetToday}
                    className="ml-2 px-3 py-1.5 rounded-xl border border-line text-xs font-semibold text-muted hover:text-accent hover:bg-surface transition-colors flex items-center gap-1.5 cursor-pointer"
                    title="Về ngày hiện tại theo thời gian thực"
                  >
                    <CalendarIcon className="w-3.5 h-3.5 text-accent" />
                    <span>Hôm nay ({todayRealDay}/{todayRealMonth})</span>
                  </button>
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => setActiveFilter("all")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeFilter === "all"
                        ? "bg-action text-white shadow-2xs"
                        : "bg-surface border border-line text-ink hover:border-line"
                    }`}
                  >
                    ● Tất cả
                  </button>

                  <button
                    onClick={() => setActiveFilter("custom")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeFilter === "custom"
                        ? "bg-action text-white shadow-2xs"
                        : "bg-surface border border-line text-ink hover:border-line"
                    }`}
                  >
                    ● Phong tục ({customCount})
                  </button>

                  <button
                    onClick={() => setActiveFilter("festival")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeFilter === "festival"
                        ? "bg-action text-white shadow-2xs"
                        : "bg-surface border border-line text-ink hover:border-line"
                    }`}
                  >
                    ● Lễ hội ({festivalCount})
                  </button>

                  <button
                    onClick={() => setActiveFilter("personal")}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeFilter === "personal"
                        ? "bg-action text-white shadow-2xs"
                        : "bg-surface border border-line text-ink hover:border-line"
                    }`}
                  >
                    ● Ngày tôi lưu ({personalCount})
                  </button>
                </div>
              </div>

              {/* Calendar Days of Week Header (Bắt đầu từ Thứ Hai) */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center text-xs font-bold text-muted mb-3">
                <div>Thứ Hai</div>
                <div>Thứ Ba</div>
                <div>Thứ Tư</div>
                <div>Thứ Năm</div>
                <div>Thứ Sáu</div>
                <div>Thứ Bảy</div>
                <div>Chủ Nhật</div>
              </div>

              {/* Calendar Days Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {calendarGridDays.map((cell, index) => {
                  const isSelected =
                    cell.isCurrentMonth &&
                    cell.day === selectedDay &&
                    cell.month === selectedMonth &&
                    cell.year === selectedYear;

                  const isRealToday =
                    cell.isCurrentMonth &&
                    cell.day === todayRealDay &&
                    cell.month === todayRealMonth &&
                    cell.year === todayRealYear;

                  return (
                    <button
                      key={index}
                      type="button"
                      disabled={!cell.isCurrentMonth}
                      aria-pressed={isSelected}
                      aria-label={`Ngày ${cell.day} tháng ${cell.month}${cell.isSpecial ? ", có sự kiện" : ""}`}
                      onClick={() => {
                        if (cell.isCurrentMonth) {
                          setSelectedDay(cell.day);
                        }
                      }}
                      className={`min-w-0 min-h-[84px] sm:min-h-[110px] p-1 sm:p-2 rounded-control text-left border transition-all flex flex-col justify-between cursor-pointer relative ${
                        !cell.isCurrentMonth
                          ? "bg-surface/40 border-transparent text-subtle opacity-40 cursor-default"
                          : isSelected
                          ? "bg-action border-accent text-white shadow-md ring-2 ring-accent/30 scale-[1.02]"
                          : cell.isSpecial
                          ? "bg-surface border-line text-ink hover:border-accent"
                          : "bg-surface border-line hover:border-line hover:bg-surface text-ink"
                      }`}
                    >
                      {/* Top Row: Solar Day Number + Notification Dot */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span
                            className={`text-xs sm:text-sm font-bold font-sans tabular-nums ${
                              isSelected ? "text-white" : ""
                            }`}
                          >
                            {cell.day}
                          </span>
                          {isRealToday && (
                            <span
                              className={`text-xs px-1 rounded-sm uppercase font-bold tracking-tight ${
                                isSelected ? "bg-surface text-accent" : "bg-surface text-accent"
                              }`}
                              title="Hôm nay theo thời gian thực"
                            >
                              Nay
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {cell.hasPersonalNote && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? "bg-on-action" : "bg-gold"
                              }`}
                              title="Có ghi chú của tôi"
                            />
                          )}
                          {cell.hasDot && (
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSelected ? "bg-on-action" : "bg-action"
                              }`}
                            />
                          )}
                        </div>
                      </div>

                      {/* Middle: Lunar Day indication (Chỉ hiện khi có dữ liệu đáng tin cậy) */}
                      {cell.lunarText && (
                        <div className="text-xs leading-tight font-medium">
                          <span className={isSelected ? "text-on-action" : "text-ink/75"}>
                            AL: {cell.lunarText}
                          </span>
                          {cell.subText && (
                            <span
                              className={`block text-xs italic ${
                                isSelected ? "text-on-action" : "text-accent font-medium"
                              }`}
                            >
                              {cell.subText}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bottom: Event Badge if reliable */}
                      {cell.badge && (
                        <span
                          className={`text-xs px-1 py-0.5 rounded-md font-semibold block text-center truncate ${
                            isSelected
                              ? "bg-white/20 text-white"
                              : cell.isSpecial
                              ? "bg-action text-white"
                              : "bg-surface text-accent border border-line"
                          }`}
                          title={cell.badge}
                        >
                          {cell.badge.startsWith("Mùng 1")
                            ? "Mùng 1"
                            : cell.badge.startsWith("Rằm")
                            ? "Ngày Rằm"
                            : cell.badge.length > 8
                            ? cell.badge.slice(0, 7) + "…"
                            : cell.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Seasonal Term & Folk Living Wisdom */}
            <div className="p-5 sm:p-6 rounded-card bg-amber-500/[0.04] border border-amber-500/20 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-amber-500/15">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 border border-amber-500/25">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                      TIẾT KHÍ & NẾP SỐNG DÂN GIAN
                    </span>
                    <h3 className="font-display font-bold text-base sm:text-lg text-ink">
                      {currentSelectedLunar.solarTerm ? `Tiết ${currentSelectedLunar.solarTerm}` : "Tiết khí thuận hòa"} • {monthHeaderLunar?.canChiYear || "Năm Bính Ngọ"}
                    </h3>
                  </div>
                </div>

                <div className="text-xs text-muted">
                  Âm dương tương hợp, dưỡng thân an tâm
                </div>
              </div>

              <p className="text-xs sm:text-sm text-ink/80 leading-relaxed mb-4">
                Người xưa quan sát 24 tiết khí để điều hòa nhịp sống thuận theo Đất Trời. Vào mùa thu đông, khí trời chuyển mát và se lạnh; nếp nhà giữ ấm thân thể, uống chén trà sen sớm, gìn giữ sự hòa thuận và thanh tịnh nơi tâm hồn.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={onGoToRituals}
                  className="p-3.5 rounded-2xl bg-surface border border-line hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                      <Flower2 className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-ink block group-hover:text-amber-700 transition-colors">
                        Chuẩn bị Ngày Rằm thanh tịnh
                      </strong>
                      <span className="text-xs text-muted">Hương mộc, hoa quả tươi và chén nước trong</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-amber-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>

                <div
                  onClick={onGoToRituals}
                  className="p-3.5 rounded-2xl bg-surface border border-line hover:border-amber-500/40 transition-all cursor-pointer flex items-center justify-between group shadow-2xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="text-xs sm:text-sm font-bold text-ink block group-hover:text-emerald-700 transition-colors">
                        Nghi thức Mùng Một nếp nhà
                      </strong>
                      <span className="text-xs text-muted">Khởi đầu tháng mới an hòa, thuận thảo</span>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted group-hover:text-emerald-600 transition-transform group-hover:translate-x-0.5 shrink-0" />
                </div>
              </div>
            </div>

            {/* Annual Traditional Festivals List (Balanced on left column) */}
            <div className="p-5 sm:p-6 rounded-card bg-surface border border-line shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-line">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    DẤU MỐC CỘI NGUỒN
                  </span>
                  <h3 className="font-display font-bold text-base sm:text-lg text-ink">
                    Các ngày lễ & Lễ hội truyền thống tiêu biểu trong năm
                  </h3>
                </div>
                <span className="text-xs text-muted hidden sm:inline">Đối chiếu lịch Âm Dương thuần Việt</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[...new Map(allEvents.filter((e) => e.type === "festival" && !e.id.startsWith("custom:")).map((e) => [e.title, e])).values()].slice(0, 8).map((event) => (
                  <button
                    key={event.title}
                    type="button"
                    onClick={() => onSelectEvent(event.id)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-line/80 bg-surface-soft/40 hover:bg-surface p-3.5 text-left hover:border-accent/40 transition-all cursor-pointer group shadow-2xs"
                  >
                    <div className="min-w-0">
                      <strong className="block text-xs sm:text-sm text-ink font-bold group-hover:text-accent transition-colors truncate">
                        {event.title}
                      </strong>
                      <span className="text-xs text-muted block mt-0.5 truncate">
                        {event.region} · {event.lunarDate}
                      </span>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted group-hover:text-accent transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols): Day Detail Panel */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <Card className="p-6 rounded-card bg-surface border border-line shadow-xs">
              {/* Day Header Info */}
              <div className="pb-4 mb-4 border-b border-line">
                <div className="flex items-start justify-between gap-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    {activeFilter === "personal" ? "DANH MỤC LƯU RIÊNG" : "CHI TIẾT NGÀY ĐƯỢC CHỌN"}
                  </span>
                  <Button
                    onClick={() => setShowAddModal(true)}
                    size="sm"
                    className="rounded-xl text-xs gap-1.5 py-1.5 px-3 bg-action hover:bg-action text-white shrink-0 cursor-pointer shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ghi chú</span>
                  </Button>
                </div>
                <h3 className="font-display font-bold text-2xl sm:text-[27px] leading-tight text-ink mt-3">
                    {activeFilter === "personal"
                      ? `Các ngày tôi đã lưu (${personalCount})`
                      : `Ngày ${selectedDay} tháng ${selectedMonth}, ${selectedYear}`}
                </h3>
                {activeFilter !== "personal" && currentSelectedLunar && (
                  <div className="mt-4 space-y-3 text-sm text-muted">
                    <p className="rounded-xl bg-surface-soft/60 border border-line/70 px-3 py-2 font-semibold text-ink">
                        Âm lịch: ngày {currentSelectedLunar.lunarDay} tháng {currentSelectedLunar.lunarMonth} ({currentSelectedLunar.canChiYear})
                        {currentSelectedLunar.solarTerm && ` · Tiết ${currentSelectedLunar.solarTerm}`}
                    </p>
                    <div className="space-y-1 leading-relaxed">
                      <p>
                        Can Chi ngày: <strong className="text-ink">{currentCalendarFacts.canChiDay}</strong>
                      </p>
                      <p>
                        Can Chi tháng: <strong className="text-ink">{currentCalendarFacts.canChiMonth}</strong>
                      </p>
                    </div>
                    <div className="rounded-xl border border-accent/20 bg-accent/[0.04] px-3 py-2.5">
                      <p className="mb-1 text-xs font-bold uppercase tracking-wide text-accent">
                        Giờ hoàng đạo
                      </p>
                      <p className="leading-relaxed text-ink/80">
                        {currentCalendarFacts.auspiciousHours.join(", ")}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed text-muted">
                      Thông tin giờ là tham khảo phong tục, không dự báo hay bảo đảm kết quả công việc.
                    </p>
                  </div>
                )}
              </div>

              {/* Event Cards List */}
              <div className="space-y-3.5 mb-5">
                {selectedDayEvents.length > 0 ? (
                  selectedDayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-4 rounded-panel bg-surface border border-line hover:border-line transition-all shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <Badge
                            variant="secondary"
                            className={`text-xs font-semibold px-2 py-0.5 uppercase ${
                              event.type === "festival"
                                ? "bg-gold-soft text-gold border-gold/40"
                                : event.type === "personal"
                                ? "bg-accent-soft text-accent border-accent/30"
                                : "bg-surface text-accent border-line"
                            }`}
                          >
                            {event.typeLabel}
                          </Badge>
                          <span className="text-xs text-muted font-medium">
                            {event.region}
                          </span>
                        </div>

                        <h4 className="font-display font-bold text-sm sm:text-base text-ink mb-1.5">
                          {event.title}
                        </h4>

                        <p className="text-sm text-ink leading-relaxed mb-3">
                          {event.shortDesc}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-line">
                        <span className="text-xs text-muted">{event.lunarDate}</span>

                        <div className="flex items-center gap-2">
                          {event.type === "personal" && (
                            <button
                              onClick={() => handleDeleteNote(event.id)}
                              className="text-xs text-muted hover:text-danger p-1 transition-colors cursor-pointer"
                              title="Xóa ghi chú"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {event.type !== "personal" && (
                            <button
                              onClick={() => {
                                if (event.id.startsWith("custom:soc") || event.id.startsWith("custom:vong")) {
                                  if (onGoToRituals) onGoToRituals();
                                } else {
                                  onSelectEvent(event.id);
                                }
                              }}
                              className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{event.id.startsWith("custom:") ? "Xem cẩm nang" : "Xem chi tiết"}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-6 rounded-panel bg-surface border border-dashed border-line text-center text-xs text-muted">
                    {activeFilter === "personal" ? (
                      <>
                        <p className="font-semibold text-ink mb-1">
                          Bạn chưa lưu ngày văn hóa hay ghi chú cá nhân nào
                        </p>
                        <p className="text-sm text-muted mb-3 leading-relaxed">
                          Chọn một ngày trên lịch và bấm "+ Ghi chú" để lưu lại dấu mốc nếp nhà của bạn.
                        </p>
                        <Button
                          onClick={() => setShowAddModal(true)}
                          size="sm"
                          variant="outline"
                          className="text-xs border-line text-accent"
                        >
                          + Thêm ghi chú ngay
                        </Button>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-ink mb-1">
                          Chưa có sự kiện lễ hội lớn cho ngày này
                        </p>
                        <p className="text-sm text-muted mb-4 leading-relaxed">
                          Ngày thường nhật bình an. Bạn có thể lưu dấu mốc cá nhân hoặc việc cần làm cho ngày này.
                        </p>
                        <div className="flex flex-wrap items-center justify-center gap-2">
                          <Button
                            onClick={() => setShowAddModal(true)}
                            size="sm"
                            className="rounded-xl text-xs bg-action hover:bg-action text-white"
                          >
                            + Thêm ghi chú ngày này
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Ritual Guide Link Widget */}
              {onGoToRituals && (
                <div
                  onClick={onGoToRituals}
                  className="p-4 rounded-panel bg-surface-soft border border-line cursor-pointer hover:border-accent transition-all mb-4 group shadow-2xs"
                >
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Gợi ý nếp nhà • Cẩm nang nghi lễ</span>
                  </div>
                  <p className="text-sm text-ink leading-relaxed group-hover:text-ink transition-colors">
                    Bạn cần chuẩn bị cho ngày lễ sắp tới? Khám phá hướng dẫn tinh gọn, mộc mạc tại{" "}
                    <strong className="text-accent underline">Cẩm nang nghi lễ →</strong>
                  </p>
                </div>
              )}

              {/* Transparency Notice Box */}
              <div className="p-3.5 rounded-panel bg-surface border border-line text-xs text-muted leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold text-ink">Minh bạch tư liệu:</strong>{" "}
                  Ngày âm lịch có thể khác theo cách tính và phong tục từng địa phương.
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Modal: Thêm ngày lưu riêng */}
        {showAddModal && (
          <AppDialog
            labelledBy="calendar-note-dialog-title"
            onClose={() => {
              setShowAddModal(false);
              setNoteSaveError("");
            }}
          >
            <div className="mb-5 pb-4 border-b border-line">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent border border-accent/20">
                    <CalendarIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-accent">
                      Nhật ký nếp nhà
                    </p>
                    <h3 id="calendar-note-dialog-title" className="mt-1 font-display font-bold text-xl leading-tight text-ink">
                      Thêm ghi chú
                    </h3>
                    <p className="mt-1 text-sm text-muted">
                      {selectedDay}/{selectedMonth}/{selectedYear}
                    </p>
                  </div>
                </div>
              <button
                type="button"
                aria-label="Đóng hộp thoại thêm ghi chú"
                onClick={() => {
                  setShowAddModal(false);
                  setNoteSaveError("");
                }}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-control text-muted transition-colors hover:bg-surface-soft hover:text-ink"
              >
                <span aria-hidden="true">✕</span>
              </button>
              </div>
            </div>

            <form onSubmit={handleAddPersonalNote} className="space-y-5">
              {noteSaveError && (
                <p
                  role="alert"
                  className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm leading-relaxed text-danger"
                >
                  {noteSaveError}
                </p>
              )}
              <div>
                <label htmlFor="calendar-note-title" className="mb-2 block text-sm font-bold text-ink">
                  Tiêu đề dấu mốc
                  <span className="ml-1 text-danger">*</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted">Một tên ngắn để bạn dễ nhớ ngày này</span>
                </label>
                <input
                  id="calendar-note-title"
                  type="text"
                  autoFocus
                  required
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Ví dụ: Giỗ cụ cố, Lễ mừng thọ, Họp mặt gia đình..."
                  className="w-full min-h-12 px-4 py-3 rounded-2xl border border-line/80 text-base text-ink placeholder:text-subtle bg-surface shadow-xs transition-shadow focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10"
                />
              </div>

              <div>
                <label htmlFor="calendar-note-description" className="mb-2 block text-sm font-bold text-ink">
                  Ghi chú chi tiết
                  <span className="ml-1 text-xs font-normal text-muted">(không bắt buộc)</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted">Thêm lời dặn, việc cần chuẩn bị hoặc người thân liên quan</span>
                </label>
                <textarea
                  id="calendar-note-description"
                  rows={3}
                  value={newNoteDesc}
                  onChange={(e) => setNewNoteDesc(e.target.value)}
                  placeholder="Chuẩn bị lễ vật mộc mạc, dặn dò các thành viên trong gia đình..."
                  className="w-full px-4 py-3 rounded-2xl border border-line/80 text-base text-ink placeholder:text-subtle bg-surface shadow-xs transition-shadow focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 resize-none"
                />
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-accent/20 bg-accent/[0.05] px-3.5 py-3 text-xs leading-relaxed text-muted">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>Dữ liệu được lưu cục bộ trên thiết bị của bạn và gắn với ngày {selectedDay}/{selectedMonth}/{selectedYear}.</span>
              </div>

              <div className="flex items-center justify-end gap-2.5 border-t border-line/70 pt-5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddModal(false);
                    setNoteSaveError("");
                  }}
                  className="min-h-11 rounded-xl border-line px-4 text-sm font-semibold"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="min-h-11 rounded-xl bg-action px-5 text-sm font-bold text-white shadow-sm hover:bg-action"
                >
                  Lưu vào lịch
                </Button>
              </div>
            </form>
          </AppDialog>
        )}
      </main>
    </div>
  );
};
