import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  BookOpen,
  Sparkles,
  Heart,
  Clock,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Flower2,
  Calendar,
  Compass,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { UnverifiedImage } from "../components/UnverifiedImage";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import {
  adaptRemoteRitual,
  RitualOccasionKey,
  RitualRegionKey,
  RitualGuideItem,
} from "../data/ritualData";
import { loadRituals } from "../data/contentService";

const normalizeRitualSearch = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

function RitualCardImage({ image, title, approvedByContent }: { image: string; title: string; approvedByContent: boolean }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [image]);
  if (!image || failed) return null;
  return (
    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-surface-soft md:h-44 md:w-full md:rounded-none">
      <UnverifiedImage
        src={image}
        alt={title}
        loading="lazy"
        decoding="async"
        approvedByContent={approvedByContent}
        onLoadError={() => setFailed(true)}
        className="h-full w-full object-cover object-[center_35%] transition-transform duration-500 group-hover:scale-105"
      />
    </div>
  );
}

interface RitualGuideScreenProps {
  onSelectRitual: (id: string) => void;
  onGoToCulture?: () => void;
}

export const RitualGuideScreen: React.FC<
  RitualGuideScreenProps
> = ({
  onSelectRitual,
  onGoToCulture,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOccasion, setSelectedOccasion] = useState<RitualOccasionKey>("all");
  const [selectedRegion, setSelectedRegion] = useState<RitualRegionKey>("all");
  const [visibleCount, setVisibleCount] = useState(6);
  const [rituals, setRituals] = useState<RitualGuideItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setLoadError("");
    setRituals([]);

    void loadRituals()
      .then((remote) => {
        if (!active) return;

        setRituals(remote.map(adaptRemoteRitual));
      })
      .catch(() => {
        if (!active) return;

        setLoadError(
          "Không thể tải hướng dẫn nghi lễ. Bạn hãy kiểm tra kết nối rồi thử lại.",
        );
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const OCCASIONS: { key: RitualOccasionKey; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "Rằm", label: "Rằm" },
    { key: "Mùng một", label: "Mùng một" },
    { key: "Tết Nguyên Đán", label: "Tết Nguyên Đán" },
    { key: "Dịp gia đình", label: "Dịp gia đình" },
  ];

  const REGIONS: { key: RitualRegionKey; label: string }[] = [
    { key: "all", label: "Tất cả vùng miền" },
    { key: "Bắc Bộ", label: "Bắc Bộ" },
    { key: "Trung Bộ", label: "Trung Bộ" },
    { key: "Nam Bộ", label: "Nam Bộ" },
    { key: "Thích ứng đa vùng", label: "Thích ứng đa vùng" },
  ];

  const filteredItems = useMemo(() => {
    const query = normalizeRitualSearch(searchQuery);

    return rituals.filter((item) => {
      const matchesOccasion =
        selectedOccasion === "all" ||
        item.occasion === selectedOccasion;

      const matchesRegion =
        selectedRegion === "all" ||
        item.region === selectedRegion;

      const searchableText = normalizeRitualSearch(
        [
          item.title,
          item.desc,
          item.occasion,
          item.region,
        ].join(" ")
      );

      return (
        matchesOccasion &&
        matchesRegion &&
        (!query || searchableText.includes(query))
      );
    });
  }, [rituals, searchQuery, selectedOccasion, selectedRegion]);

  const visibleItems = filteredItems.slice(
    0,
    visibleCount
  );

  const hasMoreItems =
    visibleItems.length < filteredItems.length;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedOccasion("all");
    setSelectedRegion("all");
    setVisibleCount(6);
  };

  return (
    <div className="screen-shell">
      <main className="page-container max-w-6xl">
        {/* Top Breadcrumb & Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 text-xs text-muted">
          <div className="flex items-center gap-2">
            {onGoToCulture ? (
              <button
                type="button"
                onClick={onGoToCulture}
                className="inline-flex min-h-11 items-center rounded-sm hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                Khám phá
              </button>
            ) : (
              <span>Khám phá</span>
            )}
            <span>/</span>
            <span className="text-accent font-semibold">Cẩm nang nghi lễ</span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 uppercase font-semibold text-xs text-muted">
              <span className="w-2 h-2 rounded-full bg-action inline-block"></span>
              <span>PHONG TỤC TRONG ĐỜI SỐNG GIA ĐÌNH</span>
            </div>
          </div>
        </div>

        {/* Header Title Section */}
        <div className="mb-6">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent mb-2">
            <BookOpen className="w-4 h-4" />
            <span>TÌM HIỂU & CHUẨN BỊ</span>
          </div>

          <h1 className="page-title mb-3">
            Cẩm nang nghi lễ tại gia
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
            Tìm hướng dẫn theo dịp và vùng miền.
            Tham khảo cách chuẩn bị chu đáo, rồi linh hoạt điều chỉnh theo
            nếp nhà và điều kiện thực tế của bạn.
          </p>
        </div>

        {/* Philosophy Pledge Banner */}
        <Card className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-line mb-8 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent-soft border border-accent/20 flex items-center justify-center text-accent shrink-0">
              <Flower2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-accent mb-1 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>NGUYÊN TẮC TÙY DUYÊN & TÂM THÀNH LÀM TRỌNG</span>
              </div>
              <p className="text-xs sm:text-sm text-ink/85 leading-relaxed max-w-3xl">
                Phong tục có thể khác nhau giữa các vùng và nếp nhà. Các hướng dẫn dưới đây là gợi ý tham khảo; bạn có thể linh hoạt điều chỉnh theo hoàn cảnh và điều kiện thực tế của gia đình.
              </p>
            </div>
          </div>
        </Card>

        {/* Search & Filter Toolbar */}
        <div className="py-6 border-y border-line mb-10 space-y-5">
          {/* Search Row */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              aria-label="Tìm hướng dẫn nghi lễ"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(6);
              }}
              placeholder="Tìm nghi lễ, ngày rằm, mùng một, giỗ..."
              className="w-full pl-11 pr-4 py-3 rounded-panel bg-surface border border-line text-base text-ink placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
            />
          </div>

          {/* Filter: Theo Dịp */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-muted flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Theo Dịp:</span>
            </span>
            {OCCASIONS.map((occ) => {
              const isActive = selectedOccasion === occ.key;
              return (
                <button
                  key={occ.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setSelectedOccasion(occ.key);
                    setVisibleCount(6);
                  }}
                  className={`min-h-11 px-3 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-action text-white shadow-2xs font-semibold"
                      : "bg-surface border border-line text-ink hover:border-line"
                  }`}
                >
                  {occ.label}
                </button>
              );
            })}
          </div>

          {/* Filter: Vùng Miền */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1 border-t border-line/70">
            <span className="font-semibold text-muted flex items-center gap-1 mr-1">
              <Compass className="w-3.5 h-3.5" />
              <span>Vùng miền:</span>
            </span>
            {REGIONS.map((reg) => {
              const isActive = selectedRegion === reg.key;
              return (
                <button
                  key={reg.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => {
                    setSelectedRegion(reg.key);
                    setVisibleCount(6);
                  }}
                  className={`min-h-11 px-3 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-action text-on-action shadow-2xs font-semibold"
                      : "bg-surface border border-line text-ink hover:border-line"
                  }`}
                >
                  {reg.label}
                </button>
              );
            })}
          </div>
        </div>

        <p
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="mb-4 text-sm text-muted"
        >
          Tìm thấy <strong>{filteredItems.length}</strong> hướng dẫn
        </p>

        {/* 6 Cards Grid (3 Columns) */}
        {filteredItems.length > 0 ? (
          <>
            <div
              id="ritual-guide-list"
              className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:grid-cols-3"
            >
              {visibleItems.map((item) => {
                const isHighlight =
                  item.id === "chuan-bi-ngay-ram";

                const href =
                  `/ritual-detail?ritualId=${encodeURIComponent(
                    item.id
                  )}`;

                const handleOpen = (
                  event: React.MouseEvent<HTMLAnchorElement>
                ) => {
                  if (
                    event.button !== 0 ||
                    event.ctrlKey ||
                    event.metaKey ||
                    event.shiftKey ||
                    event.altKey
                  ) {
                    return;
                  }

                  event.preventDefault();
                  onSelectRitual(item.id);
                };

                return (
                  <Card
                    key={item.id}
                    className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 bg-surface hover:shadow-md ${
                      isHighlight
                        ? "border-accent/60 ring-1 ring-accent/20"
                        : "border-line hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-start gap-4 p-4 md:block md:p-0">
                      <RitualCardImage image={item.image} title={item.title} approvedByContent={item.imageApproved === true} />

                      <div className="min-w-0 flex-1 md:p-5">
                        <p className="mb-1.5 text-xs font-semibold text-accent flex items-center gap-1.5">
                          <span>{item.occasion}</span>
                          <span aria-hidden="true" className="text-muted">·</span>
                          <span>{item.region}</span>
                        </p>

                        <h2 className="mb-2 font-display text-base font-bold leading-snug text-ink group-hover:text-accent transition-colors md:text-xl">
                          <a
                            href={href}
                            onClick={handleOpen}
                            className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                          >
                            {item.title}
                          </a>
                        </h2>

                        <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                          {item.desc}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2.5 md:px-5">
                      <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                        <span>{item.stepsCount}</span>
                        {item.timeEstimate && <><span aria-hidden="true">·</span><span>{item.timeEstimate}</span></>}
                      </p>

                      <a
                        href={href}
                        onClick={handleOpen}
                        aria-label={`Xem hướng dẫn: ${item.title}`}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-accent hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                      >
                        <span>Xem hướng dẫn</span>
                        <ArrowRight
                          className="h-4 w-4 transition-transform group-hover:translate-x-1"
                          aria-hidden="true"
                        />
                      </a>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="mb-10 mt-6 flex flex-col items-center gap-3">
              <p
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="text-sm text-muted"
              >
                Đang hiển thị {visibleItems.length} /{" "}
                {filteredItems.length} hướng dẫn.
              </p>

              {filteredItems.length > 6 && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasMoreItems}
                  aria-controls="ritual-guide-list"
                  onClick={() =>
                    setVisibleCount((count) => count + 6)
                  }
                  className="min-h-11 w-full sm:w-auto cursor-pointer"
                >
                  {hasMoreItems
                    ? `Xem thêm ${Math.min(
                        6,
                        filteredItems.length -
                          visibleItems.length
                      )} hướng dẫn`
                    : "Đã hiển thị tất cả"}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="p-8 sm:p-12 text-center rounded-card bg-surface border border-line mb-16">
            <h2 className="font-display text-xl font-semibold text-ink mb-3">
              {loading
                ? "Đang tải hướng dẫn"
                : loadError
                  ? "Chưa tải được hướng dẫn"
                  : rituals.length === 0
                    ? "Cẩm nang đang được cập nhật"
                    : "Không tìm thấy hướng dẫn phù hợp"}
            </h2>

            <p
              role={loadError ? "alert" : "status"}
              className="text-sm leading-relaxed text-muted mb-5"
            >
              {loading
                ? "Đang tải các hướng dẫn đã được duyệt…"
                : loadError
                  ? loadError
                  : rituals.length === 0
                    ? "Chưa có hướng dẫn được phát hành. Bạn có thể quay lại sau."
                    : "Hãy thử từ khóa khác hoặc đặt lại bộ lọc."}
            </p>

            {!loading && loadError && (
              <Button
                type="button"
                onClick={() => {
                  setLoadAttempt((value) => value + 1);
                }}
              >
                Tải lại hướng dẫn
              </Button>
            )}

            {!loading && !loadError && rituals.length > 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={handleResetFilters}
              >
                Đặt lại bộ lọc
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
