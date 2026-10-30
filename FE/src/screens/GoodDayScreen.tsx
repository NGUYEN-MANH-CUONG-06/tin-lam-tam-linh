import React, { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Sparkles,
  Heart,
  CheckCircle2,
  Compass,
  Flower2,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import {
  getAuspiciousHoursForDay,
  getCanChiDay,
  getCanChiMonth,
  getReliableLunarDate,
} from "@/src/data/calendarData";

interface DayPlan {
  title: string;
  day: number;
  month: number;
  year: number;
}

interface GoodDayScreenProps {
  onBackToCulture: () => void;
  onGoToHome?: () => void;
  onGoToCalendar: () => void;
  onGoToRituals: () => void;
  onSaveDayToCalendar: (plan: DayPlan) => Promise<boolean>;
}

export const GoodDayScreen: React.FC<GoodDayScreenProps> = ({
  onBackToCulture,
  onGoToCalendar,
  onGoToRituals,
  onSaveDayToCalendar,
}) => {
  const [dateValue, setDateValue] = useState("");
  const [title, setTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const calendarFacts = useMemo(() => {
    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return null;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);
    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) return null;

    const lunar = getReliableLunarDate(day, month, year);
    const canChiDay = getCanChiDay(date);
    return {
      lunar,
      canChiDay,
      canChiMonth: getCanChiMonth(lunar.lunarMonth, lunar.lunarYear),
      hours: getAuspiciousHoursForDay(canChiDay.chi),
    };
  }, [dateValue]);

  const resetStatus = () => {
    setSaveStatus("idle");
    setErrorMessage("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    resetStatus();

    const match = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

    if (!match || !title.trim()) {
      setErrorMessage("Bạn hãy chọn ngày và nhập việc muốn ghi lại.");
      setSaveStatus("error");
      return;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const date = new Date(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      setErrorMessage("Ngày đã chọn chưa hợp lệ.");
      setSaveStatus("error");
      return;
    }

    setSaving(true);
    let saved = false;
    try {
      saved = await onSaveDayToCalendar({ title: title.trim(), day, month, year });
    } catch {
      saved = false;
    } finally {
      setSaving(false);
    }

    if (!saved) {
      setErrorMessage("Chưa lưu được ghi chú. Bạn hãy thử lại.");
      setSaveStatus("error");
      return;
    }

    setSaveStatus("success");
    setTitle("");
  };

  return (
    <div className="screen-shell">
      <main className="page-container max-w-5xl">
        {/* Top Breadcrumb Nav */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 text-xs text-stone-600 dark:text-stone-400">
          <button
            type="button"
            onClick={onBackToCulture}
            className="inline-flex items-center gap-1.5 hover:text-accent font-medium cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Quay lại Khám phá di sản</span>
          </button>

          <Badge
            variant="outline"
            className="text-xs px-3 py-0.5 border-amber-400/40 text-amber-800 dark:text-amber-300 bg-amber-500/10 font-medium self-start sm:self-auto"
          >
              ✦ LỊCH ÂM DƯƠNG · KẾ HOẠCH CÁ NHÂN
          </Badge>
        </div>

        {/* Hero Magazine Section */}
        <section className="mb-10 p-6 sm:p-10 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-surface via-surface to-amber-500/[0.04] shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none rounded-bl-full" />

          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-amber-800 dark:text-amber-300">
                LỊCH CÁ NHÂN
              </span>
              <span className="text-xs text-stone-400">·</span>
              <span className="text-xs text-stone-500">Chủ động an tâm</span>
            </div>

            <h1 className="page-title font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-ink leading-tight">
              Ghi lại ngày bạn muốn chuẩn bị
            </h1>

            <p className="font-display text-base sm:text-lg text-amber-800 dark:text-amber-300 font-medium leading-relaxed">
              Lập kế hoạch theo ngày dương lịch và lưu vào lịch cá nhân của bạn.
            </p>

            <div className="p-4 rounded-2xl border-l-3 border-amber-600 bg-amber-500/[0.07] border border-amber-500/20">
              <p className="font-display italic text-xs sm:text-sm text-stone-800 dark:text-stone-200 leading-relaxed">
                “Một kế hoạch rõ ràng giúp mình chủ động chuẩn bị và dành thời gian cho điều quan trọng.”
              </p>
            </div>

            <p className="text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              Trang này lưu dự định cá nhân; ứng dụng hiện không xếp ngày hoặc giờ thành tốt, xấu hay dự báo kết quả.
            </p>
          </div>
        </section>

        <section role="status" className="mb-8 rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-ink mb-2">Tra cứu ngày cát lành đang được hoàn thiện</h2>
          <p className="text-sm leading-relaxed text-muted">
            Trang này không xếp ngày thành tốt hoặc xấu. Bạn có thể xem lịch âm/dương và tự lưu ngày dự định vào lịch cá nhân.
          </p>
          <Button type="button" variant="outline" className="mt-4" onClick={onGoToCalendar}>
            Mở lịch âm dương
          </Button>
        </section>

        {calendarFacts && (
          <section
            aria-labelledby="selected-date-calendar-facts"
            className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/[0.04] p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="selected-date-calendar-facts" className="font-display text-lg font-bold text-ink">
                  Thông tin lịch truyền thống cho ngày đã chọn
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Dữ liệu tra theo ngày dương lịch; không phải đánh giá ngày tốt/xấu cho việc cụ thể.
                </p>
              </div>
            </div>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-line bg-surface p-3">
                <dt className="text-xs text-muted">Ngày âm lịch</dt>
                <dd className="mt-1 font-semibold text-ink">
                  {calendarFacts.lunar.lunarDay}/{calendarFacts.lunar.lunarMonth}/{calendarFacts.lunar.lunarYear}
                  {calendarFacts.lunar.isLeapMonth ? " (tháng nhuận)" : ""}
                </dd>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3">
                <dt className="text-xs text-muted">Can Chi ngày</dt>
                <dd className="mt-1 font-semibold text-ink">{calendarFacts.canChiDay.name}</dd>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3">
                <dt className="text-xs text-muted">Can Chi tháng âm</dt>
                <dd className="mt-1 font-semibold text-ink">{calendarFacts.canChiMonth}</dd>
              </div>
              <div className="rounded-xl border border-line bg-surface p-3">
                <dt className="text-xs text-muted">Tiết khí</dt>
                <dd className="mt-1 font-semibold text-ink">{calendarFacts.lunar.solarTerm || "Không có dữ liệu"}</dd>
              </div>
            </dl>
            <div className="mt-3 rounded-xl border border-line bg-surface p-4">
              <h3 className="text-sm font-semibold text-ink">Giờ hoàng đạo theo quy ước lịch truyền thống</h3>
              <p className="mt-1 text-sm text-muted">{calendarFacts.hours.join(" · ") || "Không có dữ liệu"}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted">
                Đây là thông tin quy ước văn hóa để tham khảo, không bảo đảm kết quả và không thay thế tư vấn theo phong tục địa phương.
              </p>
            </div>
          </section>
        )}

        {/* Manual Plan Entry Form */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl border border-line bg-surface p-6 sm:p-8 shadow-xs space-y-5"
        >
          <div className="flex items-center gap-2.5 pb-3 border-b border-line">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-700">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-ink">
                Tự ghi lại một ngày dự định của bạn
              </h2>
              <p className="text-xs text-stone-500">
                Lưu vào lịch văn hóa cá nhân để thuận tiện theo dõi và chuẩn bị
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="planned-date"
                className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2"
              >
                1. Ngày dự định (Dương lịch)
              </label>
              <input
                id="planned-date"
                type="date"
                required
                value={dateValue}
                onChange={(event) => {
                  setDateValue(event.target.value);
                  resetStatus();
                }}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            <div>
              <label
                htmlFor="planned-title"
                className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-2"
              >
                2. Việc bạn muốn chuẩn bị
              </label>
              <input
                id="planned-title"
                type="text"
                required
                maxLength={120}
                value={title}
                onChange={(event) => {
                  setTitle(event.target.value);
                  resetStatus();
                }}
                placeholder="Ví dụ: Lễ cúng gia tiên, Họp mặt đại gia đình, Mở hàng đầu tháng…"
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>

          <div aria-live="polite" aria-atomic="true">
            {saveStatus === "error" && (
              <p className="p-3 rounded-xl bg-red-500/10 text-xs text-red-700 border border-red-500/30 font-medium">
                {errorMessage}
              </p>
            )}

            {saveStatus === "success" && (
              <p className="p-3 rounded-xl bg-emerald-500/10 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>✓ Đã lưu ngày dự định vào Lịch văn hóa cá nhân thành công.</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <Button
              type="submit"
              disabled={saving}
              className="min-h-11 px-6 rounded-xl bg-gradient-to-r from-red-800 to-amber-700 hover:from-red-700 hover:to-amber-800 text-white font-semibold cursor-pointer shadow-md gap-2"
            >
              <CalendarDays className="w-4 h-4" />
              <span>{saving ? "Đang lưu…" : "Lưu ngày dự định vào lịch"}</span>
            </Button>

            <span className="text-xs text-stone-500 italic">
              * Khách lưu trên thiết bị; tài khoản cần kết nối máy chủ để đồng bộ
            </span>
          </div>
        </form>

        {/* Quick Nav Footnotes */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-8 pt-6 border-t border-line">
          <Button
            type="button"
            variant="outline"
            onClick={onGoToCalendar}
            className="rounded-xl border-amber-500/40 text-amber-800 dark:text-amber-300 font-semibold cursor-pointer gap-2 w-full sm:w-auto min-h-11 px-5"
          >
            <span>Mở Lịch văn hóa toàn diện</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onGoToRituals}
            className="text-xs text-stone-600 hover:text-amber-800 cursor-pointer gap-1.5"
          >
            <BookOpen className="w-4 h-4" />
            <span>Xem Cẩm nang nghi lễ tại gia</span>
          </Button>
        </div>
      </main>
    </div>
  );
};
