import { useState } from "react";
import { useScreenWakeLock } from "../hooks/useScreenWakeLock";
import type { RitualPrayer } from "../data/ritualData";
import { Button } from "./ui/button";
import { BookOpen, Copy, Check, Sparkles, Type } from "lucide-react";

interface Props {
  prayers?: RitualPrayer[];
}

export function RitualPrayerSection({ prayers = [] }: Props) {
  const [selectedId, setSelectedId] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [copying, setCopying] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const wakeStatus = useScreenWakeLock(readingMode);
  const [fontSize, setFontSize] = useState<"normal" | "large" | "xlarge">("large");

  const available = prayers.filter(
    (prayer) =>
      prayer.title.trim() &&
      prayer.paragraphs.some((paragraph) => paragraph.trim()) &&
      prayer.metadata.contentKind === "editorial" &&
      prayer.metadata.editorialStatus === "approved" &&
      prayer.metadata.quotationVerified &&
      ["confirmed", "public-domain"].includes(
        prayer.metadata.usageRights?.status ?? "unknown"
      ) &&
      prayer.metadata.sources.some((source) =>
        Boolean(source.url || source.bibliographicReference) &&
        Boolean(source.locator)
      )
  );

  const selected =
    available.find((prayer) => prayer.id === selectedId) ?? available[0];
  const copyPrayer = async () => {
    if (!selected || copying) return;

    setCopying(true);
    setCopyStatus("");

    try {
      await navigator.clipboard.writeText(
        [selected.title, ...selected.paragraphs].join("\n\n")
      );
      setCopyStatus("Đã sao chép toàn bộ bài văn khấn.");
      setTimeout(() => setCopyStatus(""), 3500);
    } catch {
      setCopyStatus(
        "Chưa sao chép được. Bạn có thể bôi đen văn bản để sao chép trực tiếp."
      );
      setTimeout(() => setCopyStatus(""), 4000);
    } finally {
      setCopying(false);
    }
  };

  const getFontSizeClass = () => {
    switch (fontSize) {
      case "normal":
        return "text-[15px] sm:text-[16px] leading-[2.0]";
      case "xlarge":
        return "text-[19px] sm:text-[21px] leading-[2.2]";
      case "large":
      default:
        return "text-[17px] sm:text-[18px] leading-[2.1]";
    }
  };

  return (
    <section
      aria-labelledby="ritual-prayer-title"
      style={readingMode ? { background: "#1c1917", color: "#fafaf9" } : undefined}
      className="my-8 rounded-3xl border border-amber-500/25 bg-gradient-to-b from-amber-500/[0.04] via-surface to-surface p-5 sm:p-7 shadow-xs relative overflow-hidden"
    >
      <button type="button" aria-pressed={readingMode} className="mb-4 rounded-lg border px-4 py-2" onClick={() => { setReadingMode(!readingMode); setFontSize("xlarge"); }}>
        {readingMode ? "Thoát chế độ đọc trang nghiêm" : "Đọc trang nghiêm · giữ màn hình sáng"}
      </button>
      {readingMode && <p role="status" className="mb-3 text-sm">{wakeStatus}</p>}
      {/* Subtle corner ornament */}
      <div
        className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <h2
              id="ritual-prayer-title"
              className="font-display text-lg sm:text-xl font-bold text-ink"
            >
              Văn khấn Nôm tham khảo
            </h2>
            <p className="text-xs text-muted">
              Chỉ hiển thị nội dung đã được duyệt và có quyền sử dụng
            </p>
          </div>
        </div>

        {/* Font size switcher for reading comfort at the altar */}
        {selected && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-surface/80 border border-line rounded-xl p-1 text-xs">
            <span className="text-muted text-[11px] px-1 flex items-center gap-1">
              <Type className="w-3 h-3 text-accent" />
              <span>Cỡ chữ:</span>
            </span>
            <button
              type="button"
              onClick={() => setFontSize("normal")}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                fontSize === "normal"
                  ? "bg-accent text-white font-semibold shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Nhỏ
            </button>
            <button
              type="button"
              onClick={() => setFontSize("large")}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                fontSize === "large"
                  ? "bg-accent text-white font-semibold shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Vừa
            </button>
            <button
              type="button"
              onClick={() => setFontSize("xlarge")}
              className={`px-2 py-0.5 rounded-lg transition-colors cursor-pointer ${
                fontSize === "xlarge"
                  ? "bg-accent text-white font-semibold shadow-xs"
                  : "text-muted hover:text-ink"
              }`}
            >
              Lớn
            </button>
          </div>
        )}
      </div>

      {!selected ? (
        <div className="py-8 text-center">
          <p className="text-sm leading-relaxed text-muted max-w-md mx-auto">
            Hiện chưa có bài văn khấn đủ điều kiện để xuất bản. Gia chủ vẫn có thể dùng checklist và tự khấn nguyện theo lòng thành.
          </p>
        </div>
      ) : available.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-line bg-surface-soft p-4 text-sm leading-relaxed text-muted">
          Chưa có bài văn khấn đủ điều kiện để xuất bản. Bạn vẫn có thể dùng checklist và chế độ đọc cho phần hướng dẫn nghi lễ.
        </p>
      ) : (
        <>
          {/* Tabs for Multiple Prayers */}
          {available.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {available.map((prayer) => {
                const isActive = prayer.id === selected.id;
                return (
                  <button
                    key={prayer.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(prayer.id);
                      setCopyStatus("");
                    }}
                    className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isActive
                        ? "bg-amber-600 text-white shadow-sm border border-amber-600"
                        : "bg-surface border border-line text-muted hover:text-ink hover:border-accent/40"
                    }`}
                  >
                    <span>{prayer.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Current Prayer Info */}
          <div className="mt-5 p-4 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px] font-bold tracking-wider uppercase border border-amber-500/20">
                {selected.kind}
              </span>
              <span className="text-xs text-muted flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>Phạm vi: {selected.applicableTo}</span>
              </span>
            </div>

            <h3 className="font-display text-base sm:text-lg font-bold text-ink">
              {selected.title}
            </h3>
          </div>

          {/* Prayer Body Content */}
          <div
            style={readingMode ? { background: "#292524", color: "#fafaf9" } : undefined}
            className={`mt-6 p-5 sm:p-7 rounded-2xl bg-surface/90 border border-line/70 font-serif text-ink tracking-wide space-y-4 shadow-inner ${getFontSizeClass()}`}
          >
            {selected.paragraphs.map((paragraph, index) => (
              <p key={index} className="whitespace-pre-wrap break-words">
                {paragraph}
              </p>
            ))}
          </div>

          {selected.usageNote && (
            <div className="mt-4 px-3 py-2 rounded-xl bg-surface/60 border border-line text-xs leading-relaxed text-muted italic flex items-center gap-2">
              <span className="text-accent font-semibold not-italic shrink-0">
                Lưu ý:
              </span>
              <span>{selected.usageNote}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={copying}
              onClick={copyPrayer}
              className="gap-2 text-xs sm:text-sm font-semibold border-amber-500/30 hover:border-amber-500 hover:bg-amber-500/10 text-ink"
            >
              {copying ? (
                <span>Đang sao chép…</span>
              ) : copyStatus ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700 dark:text-emerald-300">
                    Đã sao chép!
                  </span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-accent" />
                  <span>Sao chép bài văn khấn</span>
                </>
              )}
            </Button>

            {copyStatus && (
              <p
                role="status"
                className="text-xs font-medium text-emerald-700 dark:text-emerald-300 animate-fade-in"
              >
                {copyStatus}
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
