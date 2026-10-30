import { useState, type FormEvent } from "react";
import { Button } from "./ui/button";
import {
  GOOD_DAY_PURPOSES,
  lookupGoodDays,
  parseDateInput,
  validateGoodDayQuery,
  type GoodDayPurpose,
  type GoodDayQuery,
  type GoodDayResult,
} from "../data/goodDayLookup";
import {
  Sparkles,
  Calendar,
  Clock,
  Compass,
  BookmarkCheck,
  Check,
  ArrowRight,
  ShieldCheck,
  CalendarDays,
  Heart,
  ChevronRight,
} from "lucide-react";

interface DayPlan {
  title: string;
  day: number;
  month: number;
  year: number;
}

interface GoodDayLookupPanelProps {
  onSaveDayToCalendar: (plan: DayPlan) => Promise<boolean>;
  onGoToCalendar: () => void;
}

export function GoodDayLookupPanel({
  onSaveDayToCalendar,
  onGoToCalendar,
}: GoodDayLookupPanelProps) {
  const [purpose, setPurpose] = useState<GoodDayPurpose>("family");

  // Mặc định khoảng ngày: 15 ngày tới kể từ hôm nay
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const next15Days = new Date(today.getTime() + 15 * 86400000);
  const next15DaysStr = next15Days.toISOString().split("T")[0];

  const [from, setFrom] = useState(todayStr);
  const [to, setTo] = useState(next15DaysStr);
  const [searchedQuery, setSearchedQuery] = useState<GoodDayQuery | null>(null);
  const [results, setResults] = useState<GoodDayResult[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [savingId, setSavingId] = useState("");

  const handleQuickRange = (days: number) => {
    const start = new Date();
    const end = new Date(start.getTime() + days * 86400000);
    setFrom(start.toISOString().split("T")[0]);
    setTo(end.toISOString().split("T")[0]);
  };

  const search = (event: FormEvent) => {
    event.preventDefault();

    const query: GoodDayQuery = { purpose, from, to };
    const validationError = validateGoodDayQuery(query);

    if (validationError) {
      setResults([]);
      setSearchedQuery(null);
      setError(validationError);
      return;
    }

    try {
      const next = lookupGoodDays(query);
      setResults(next);
      setSearchedQuery(query);
      setError("");
      setMessage("");
    } catch {
      setResults([]);
      setSearchedQuery(null);
      setError("Chưa tra cứu được dữ liệu. Bạn hãy chọn lại khoảng ngày.");
    }
  };

  const saveResult = async (result: GoodDayResult) => {
    if (savingId) return;
    const date = parseDateInput(result.date);

    if (!date) {
      setError("Ngày trong kết quả chưa hợp lệ.");
      return;
    }

    setError("");
    setMessage("");
    setSavingId(result.id);

    try {
      const saved = await onSaveDayToCalendar({
        title: result.title,
        year: date.year,
        month: date.month,
        day: date.day,
      });

      if (!saved) {
        setError("Chưa lưu được vào lịch. Bạn hãy thử lại.");
        return;
      }

      setSavedIds((current) =>
        current.includes(result.id) ? current : [...current, result.id]
      );

      setMessage(`✓ Đã lưu ngày ${result.date} vào Lịch văn hóa nếp nhà của bạn.`);
    } catch {
      setError("Chưa lưu được vào lịch. Bạn hãy thử lại.");
    } finally {
      setSavingId("");
    }
  };

  return (
    <section
      aria-labelledby="good-day-lookup-title"
      className="mb-10 rounded-3xl border border-amber-500/30 bg-gradient-to-b from-surface via-surface to-amber-500/[0.03] p-6 sm:p-10 shadow-sm relative overflow-hidden"
    >
      {/* Decorative Accents */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-amber-500/10 to-transparent pointer-events-none rounded-bl-full" />

      {/* Header */}
      <div className="relative z-10 pb-6 border-b border-line">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/30">
            <Compass className="w-3.5 h-3.5 text-amber-600" />
            <span>TRA CỨU NGÀY THAM KHẢO</span>
          </span>
          <span className="text-xs text-stone-500">·</span>
          <span className="text-xs text-stone-500">Nếp nhà hưng thịnh</span>
        </div>

        <h2
          id="good-day-lookup-title"
          className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight"
        >
          Chọn ngày lành theo mục đích
        </h2>

        <p className="mt-2 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-stone-300 max-w-2xl">
          Bản minh họa tham khảo ngày âm, Can Chi, 12 Trực và giờ theo chi ngày. Đây chưa phải lịch chọn ngày đã thẩm định;
          đừng dùng làm căn cứ duy nhất cho việc trọng đại.
        </p>
      </div>

      <form onSubmit={search} className="mt-8 space-y-6">
        {/* Purpose Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400 mb-3">
            1. Bạn muốn chuẩn bị cho việc gì?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {GOOD_DAY_PURPOSES.map((item) => {
              const isSelected = item.id === purpose;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setPurpose(item.id);
                    setSearchedQuery(null);
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-amber-500/15 border-amber-500/50 shadow-xs ring-1 ring-amber-500/30 font-semibold"
                      : "bg-surface border-line hover:border-amber-500/30 hover:bg-amber-500/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{item.icon}</span>
                    <span className="text-xs sm:text-sm text-ink">{item.label}</span>
                  </div>
                  {isSelected && (
                    <BookmarkCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Range Selector */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 dark:text-stone-400">
              2. Khoảng thời gian dự kiến (Tối đa 45 ngày)
            </label>
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-stone-500 mr-1">Chọn nhanh:</span>
              <button
                type="button"
                onClick={() => handleQuickRange(7)}
                className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-amber-500/40 text-stone-600 text-[11px] cursor-pointer"
              >
                7 ngày tới
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange(15)}
                className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-amber-500/40 text-stone-600 text-[11px] cursor-pointer"
              >
                15 ngày tới
              </button>
              <button
                type="button"
                onClick={() => handleQuickRange(30)}
                className="px-2.5 py-1 rounded-lg bg-surface border border-line hover:border-amber-500/40 text-stone-600 text-[11px] cursor-pointer"
              >
                1 tháng tới
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-stone-500 block mb-1">Từ ngày</span>
              <input
                required
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
            <div>
              <span className="text-xs text-stone-500 block mb-1">Đến ngày</span>
              <input
                required
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <Button
            type="submit"
            className="min-h-11 px-7 rounded-xl bg-gradient-to-r from-red-800 via-amber-700 to-amber-900 text-white font-semibold cursor-pointer shadow-md gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
          <span>Xem gợi ý tham khảo</span>
          </Button>

          <div className="text-xs text-stone-500 flex items-center gap-1.5 italic">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Dựa trên lịch pháp dân gian & Nếp nhà thực tế</span>
          </div>
        </div>
      </form>

      {error && (
        <div role="alert" className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-xs sm:text-sm text-red-700 font-medium">
          {error}
        </div>
      )}

      {message && (
        <div role="status" className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-medium flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{message}</span>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onGoToCalendar}
            className="text-xs text-emerald-800 dark:text-emerald-300 hover:underline cursor-pointer"
          >
            Mở xem lịch ngay
          </Button>
        </div>
      )}

      {/* Results Section */}
      {searchedQuery && (
        <div className="mt-10 pt-8 border-t border-line space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-display text-lg sm:text-xl font-bold text-ink">
                Gợi ý minh họa ({results.length} ngày)
              </h3>
              <p className="text-xs text-stone-500 mt-0.5">
                Khoảng thời gian: {from} đến {to}
              </p>
            </div>
            {results.length > 0 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onGoToCalendar}
                className="rounded-xl border-amber-500/40 text-amber-800 dark:text-amber-300 text-xs font-semibold cursor-pointer gap-1.5 self-start sm:self-auto"
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Xem trên Lịch văn hóa</span>
              </Button>
            )}
          </div>

          {results.length === 0 ? (
            <div className="p-8 rounded-2xl bg-surface border border-line text-center text-xs sm:text-sm text-stone-500">
              Không có ngày phù hợp với tiêu chí minh họa trong khoảng này. Bạn có thể chọn khoảng khác.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {results.map((item) => {
                const isSaved = savedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="p-5 sm:p-6 rounded-2xl border border-amber-500/30 bg-surface shadow-xs hover:border-amber-500/50 transition-all space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-line">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-400/30">
                            ✦ THAM KHẢO MINH HỌA
                          </span>
                          <span className="text-xs text-stone-500">
                            {item.lunarDateStr}
                          </span>
                        </div>
                        <h4 className="font-display text-base sm:text-lg font-bold text-ink">
                          {item.title}
                        </h4>
                      </div>

                      <Button
                        type="button"
                        size="sm"
                        disabled={isSaved || Boolean(savingId)}
                        onClick={() => void saveResult(item)}
                        className={`rounded-xl text-xs min-h-9 px-4 font-semibold cursor-pointer gap-1.5 shrink-0 self-start sm:self-auto ${
                          isSaved
                            ? "bg-emerald-600 text-white"
                            : "bg-gradient-to-r from-red-800 to-amber-700 text-white shadow-xs"
                        }`}
                      >
                        {isSaved ? <Check className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                        <span>{isSaved ? "Đã lưu vào lịch" : "Lưu vào Lịch nếp nhà"}</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                      <div className="space-y-1.5 p-3.5 rounded-xl bg-amber-500/[0.04] border border-amber-500/15">
                        <span className="font-bold text-amber-900 dark:text-amber-300 block">
                          Ý nghĩa dân gian:
                        </span>
                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                          {item.explanation}
                        </p>
                      </div>

                      <div className="space-y-1.5 p-3.5 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/15">
                        <span className="font-bold text-emerald-900 dark:text-emerald-300 block">
                          Gợi ý chuẩn bị nếp nhà:
                        </span>
                        <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                          {item.practicalAdvice}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span><strong>Giờ theo chi ngày (chưa thẩm định):</strong> {item.auspiciousHours}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
