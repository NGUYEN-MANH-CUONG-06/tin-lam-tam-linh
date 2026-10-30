import React, { useEffect, useState, useMemo } from "react";
import {
  Search,
  Compass,
  Tag,
  RotateCcw,
  ArrowRight,
  ShieldCheck,
  BookOpen,
  Clock,
  Sparkles,
  Quote,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import { RegionKey, CultureCategoryKey } from "../data/cultureData";
import { loadCultureArticles } from "../data/contentService";
import { canShowArticleImage, toCultureArticle } from "../data/cultureAdapter";
import { UnverifiedImage } from "../components/UnverifiedImage";

const normalizeSearchText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

interface CultureScreenProps {
  onSelectArticle: (id: string) => void;
  onGoToHome: () => void;
}

export const CultureScreen: React.FC<CultureScreenProps> = ({
  onSelectArticle,
  onGoToHome,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [visibleCount, setVisibleCount] = useState(6);
  const [articles, setArticles] = useState<ReturnType<typeof toCultureArticle>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    setIsLoading(true);
    setLoadError("");
    setArticles([]);

    void loadCultureArticles()
      .then((remote) => {
        if (!active) return;

        setArticles(
          remote
            .filter((item) => item.verified === true)
            .map(toCultureArticle),
        );
      })
      .catch(() => {
        if (!active) return;

        setLoadError(
          "Không thể tải bài viết. Bạn hãy kiểm tra kết nối mạng rồi thử lại.",
        );
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [loadAttempt]);

  const REGIONS = [
    { key: "all", label: "Tất cả" },
    { key: "Bắc Bộ", label: "Bắc Bộ" },
    { key: "Trung Bộ", label: "Trung Bộ" },
    { key: "Nam Bộ", label: "Nam Bộ" },
    { key: "Toàn quốc", label: "Toàn quốc" },
  ];

  const CATEGORIES = [
    { key: "all", label: "Tất cả" },
    ...Array.from(new Set(articles.map((article) => article.category).filter((value): value is string => typeof value === "string" && value.trim().length > 0)))
      .sort((left, right) => left.localeCompare(right, "vi"))
      .map((category) => ({ key: category, label: category })),
  ];

  const filteredArticles = useMemo(() => {
    const query = normalizeSearchText(searchQuery);

    return articles.filter((article) => {
      const matchesRegion =
        selectedRegion === "all" ||
        article.region === selectedRegion;

      const matchesCategory =
        selectedCategory === "all" ||
        article.category === selectedCategory;

      const searchableText = normalizeSearchText(
        [
          article.title,
          article.subtitle,
          article.excerpt,
          article.region,
          article.category,
        ].join(" ")
      );

      const matchesSearch =
        !query || searchableText.includes(query);

      return (
        matchesRegion &&
        matchesCategory &&
        matchesSearch
      );
    });
  }, [articles, selectedRegion, selectedCategory, searchQuery]);

  const featuredArticle = useMemo(() => {
    if (articles.length === 0) return null;
    return articles.find((a) => Boolean(a.image) && canShowArticleImage(a)) || articles[0];
  }, [articles]);

  const isDefaultView =
    selectedRegion === "all" && selectedCategory === "all" && !searchQuery.trim();

  const catalogArticles = useMemo(() => {
    if (isDefaultView && featuredArticle && filteredArticles.length > 1) {
      return filteredArticles.filter((article) => article.id !== featuredArticle.id);
    }
    return filteredArticles;
  }, [isDefaultView, featuredArticle, filteredArticles]);

  const visibleArticles = catalogArticles.slice(
    0,
    visibleCount
  );

  const hasMoreArticles =
    visibleArticles.length < catalogArticles.length;

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedRegion("all");
    setSelectedCategory("all");
    setVisibleCount(6);
  };

  const handleArticleLinkClick = (
    event: React.MouseEvent<HTMLAnchorElement>,
    articleId: string
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
    onSelectArticle(articleId);
  };

  return (
    <div className="screen-shell">
      <main className="page-container max-w-7xl py-6 sm:py-8">
        {/* Breadcrumb & Top Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 text-xs text-muted">
          <div className="flex items-center gap-2">
            <button
              onClick={onGoToHome}
              className="hover:text-accent cursor-pointer transition-colors"
            >
              Trang chủ
            </button>
            <span>›</span>
            <span className="text-accent font-semibold">Khám phá văn hóa</span>
          </div>

          <div className="flex items-center gap-2 uppercase font-medium tracking-wider text-xs text-muted">
            <span className="text-accent">✦</span>
            <span>CÂU CHUYỆN VĂN HÓA VIỆT</span>
          </div>
        </div>

        {/* Editorial Masthead Opening */}
        <div className="culture-masthead mb-8">
          {/* Left Column: Editorial Introduction */}
          <div className="flex flex-col justify-center py-1 space-y-5">
            <div className="space-y-3.5">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="px-3.5 py-1 text-xs font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-400/40 rounded-full"
                >
                  Kho tàng tri thức
                </Badge>
                <span className="text-xs text-stone-500 dark:text-stone-400">
                  · Phong tục, tín ngưỡng & nếp sống
                </span>
              </div>

              <h1
                tabIndex={-1}
                className="page-title font-display text-3xl sm:text-4xl lg:text-[42px] font-bold text-ink outline-none focus:outline-none focus-visible:outline-none focus:ring-0 border-0 leading-tight"
              >
                Khám phá văn hóa Việt
              </h1>

              <p className="text-sm sm:text-base text-stone-700 dark:text-stone-300 leading-relaxed max-w-2xl">
                Nơi lưu giữ và soi chiếu những giá trị truyền thống, phong tục tập quán cùng nếp sống ngàn đời của người Việt qua lăng kính đương đại sâu sắc và chuẩn mực.
              </p>
            </div>

            {/* Thẻ giá trị lấp đầy khoảng trống & cân bằng thị giác */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl bg-surface/90 border border-line flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">Hòa sắc ba miền</div>
                  <div className="text-[11px] text-muted truncate">Bắc · Trung · Nam</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface/90 border border-line flex items-center gap-3 shadow-2xs">
                <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-ink truncate">Tư liệu chuẩn mực</div>
                  <div className="text-[11px] text-muted truncate">Khảo chứng uy tín</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1 text-xs text-stone-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Gìn giữ nếp xưa trong nhịp sống đương đại</span>
            </div>
          </div>

          {/* Right Column: Featured Cover Story or Cultural Wisdom Banner */}
          <div className="relative flex flex-col justify-center">
            {featuredArticle && canShowArticleImage(featuredArticle) ? (
              <Card
                onClick={() => onSelectArticle(featuredArticle.id)}
                className="group cursor-pointer overflow-hidden rounded-2xl border-line bg-surface/95 p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Khung ảnh trọn vẹn, không bị chữ đè lên */}
                  <div className="relative overflow-hidden rounded-xl bg-surface-soft aspect-16/9 mb-3.5">
                    <UnverifiedImage
                      src={featuredArticle.image}
                      approvedByContent={canShowArticleImage(featuredArticle)}
                      alt={featuredArticle.caption || featuredArticle.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <Badge className="absolute top-2.5 left-2.5 bg-amber-600/90 text-white border-0 text-[11px] font-semibold tracking-wider uppercase px-2.5 py-0.5 shadow-xs">
                      ✦ Chuyên đề nổi bật
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-stone-500 mb-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>{featuredArticle.readingTime}</span>
                    <span>·</span>
                    <span className="font-medium text-amber-700 dark:text-amber-400">{featuredArticle.region}</span>
                    <span>·</span>
                    <span>{featuredArticle.category}</span>
                  </div>

                  <h3 className="font-display font-bold text-base sm:text-lg text-ink leading-snug line-clamp-2 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors mb-1.5">
                    {featuredArticle.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                    {featuredArticle.excerpt}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-line flex items-center justify-between text-xs font-semibold text-amber-800 dark:text-amber-300 group-hover:text-amber-600 transition-colors">
                  <span>Đọc chuyên đề</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            ) : (
              <div className="relative overflow-hidden rounded-2xl shadow-md border border-line/80 bg-gradient-to-br from-amber-500/10 via-surface-soft to-amber-900/10 p-7 sm:p-8 min-h-[300px] h-full flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <Badge
                    variant="outline"
                    className="bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-400/40 text-[11px] font-semibold tracking-wider uppercase"
                  >
                    ✦ Lời ngỏ di sản
                  </Badge>
                  <Quote className="w-7 h-7 text-amber-600/30 dark:text-amber-400/30" />
                </div>

                <div className="space-y-3 my-auto py-2">
                  <p className="font-display text-base sm:text-lg text-ink font-semibold italic leading-relaxed">
                    &ldquo;Giữ lấy nếp xưa trong nhịp sống nay. Mỗi phong tục, tập quán là một mạch nguồn nối dài cội rễ dân tộc.&rdquo;
                  </p>
                  <p className="text-xs text-stone-600 dark:text-stone-400">
                    Mời bạn cùng chúng tôi lật mở từng trang tư liệu quý giá về đời sống văn hóa Việt qua năm tháng.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-line/60 text-xs text-muted">
                  <BookOpen className="w-3.5 h-3.5 text-accent" />
                  <span>Tin Lắm Tâm Linh · Chiêm nghiệm dân gian đương đại</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <Card className="p-5 sm:p-7 rounded-2xl border-line bg-surface/90 backdrop-blur-sm shadow-xs mb-10 space-y-5">
          {/* Search Input Box */}
          <div className="relative">
            <input
              type="search"
              aria-label="Tìm kiếm bài viết văn hóa"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setVisibleCount(6);
              }}
              placeholder="Tìm bài viết, phong tục, lễ hội dân gian..."
              className="w-full pl-11 pr-4 min-h-12 rounded-xl bg-surface-soft/60 focus:bg-surface border border-line text-base text-ink placeholder:text-stone-500 focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all"
            />
            <Search className="w-5 h-5 text-stone-500 absolute left-3.5 top-3.5" />
          </div>

          {/* Region Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-3 border-t border-line/50">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 min-w-[120px]">
              <Compass className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Vùng miền:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {REGIONS.map((r) => {
                const isActive = selectedRegion === r.key;
                return (
                  <button
                    key={r.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setSelectedRegion(r.key);
                      setVisibleCount(6);
                    }}
                    className={`min-h-10 px-4 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-red-800 via-amber-700 to-amber-900 text-white font-semibold shadow-xs"
                        : "bg-surface-soft/60 text-stone-700 dark:text-stone-300 border border-line hover:border-amber-500/40 hover:text-amber-800 dark:hover:text-amber-300"
                    }`}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Filters Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 pt-3 border-t border-line/50">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 min-w-[120px]">
              <Tag className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Chủ đề:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {CATEGORIES.map((c) => {
                const isActive = selectedCategory === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => {
                      setSelectedCategory(c.key);
                      setVisibleCount(6);
                    }}
                    className={`min-h-10 px-4 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-gradient-to-r from-red-800 via-amber-700 to-amber-900 text-white font-semibold shadow-xs"
                        : "bg-surface-soft/60 text-stone-700 dark:text-stone-300 border border-line hover:border-amber-500/40 hover:text-amber-800 dark:hover:text-amber-300"
                    }`}
                  >
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-line/50 text-xs text-stone-600 dark:text-stone-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-pulse"></span>
              <span role="status" aria-live="polite" aria-atomic="true">
                Tìm thấy <strong className="text-ink">{filteredArticles.length}</strong> bài viết văn hóa
              </span>
            </div>

            {(selectedRegion !== "all" || selectedCategory !== "all" || searchQuery.trim()) && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-semibold hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Đặt lại bộ lọc</span>
              </button>
            )}
          </div>
        </Card>

        {/* Section Heading for Catalog Grid */}
        {!isLoading && filteredArticles.length > 0 && (
          <div className="flex items-center justify-between gap-4 mb-6 pb-3 border-b border-line">
            <div className="flex items-center gap-2.5">
              <span className="w-1.5 h-5 bg-gradient-to-b from-red-800 to-amber-600 rounded-full"></span>
              <h2 className="font-display font-bold text-lg sm:text-xl text-ink">
                {isDefaultView ? "Kho tàng bài viết" : "Kết quả tìm kiếm"}
              </h2>
            </div>
            <span className="text-xs font-medium text-stone-500">
              {catalogArticles.length} bài viết
            </span>
          </div>
        )}

        {/* Skeleton Loading State */}
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card
                key={i}
                className="animate-pulse rounded-2xl border-line bg-surface/90 p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="aspect-16/10 rounded-xl bg-stone-200 dark:bg-stone-800 mb-4" />
                  <div className="h-4 w-28 bg-stone-200 dark:bg-stone-800 rounded mb-3" />
                  <div className="h-6 w-3/4 bg-stone-200 dark:bg-stone-800 rounded mb-2" />
                  <div className="h-4 w-full bg-stone-200 dark:bg-stone-800 rounded mb-1" />
                  <div className="h-4 w-2/3 bg-stone-200 dark:bg-stone-800 rounded" />
                </div>
                <div className="pt-4 mt-6 border-t border-line/60 flex items-center justify-between">
                  <div className="h-3 w-24 bg-stone-200 dark:bg-stone-800 rounded" />
                  <div className="h-4 w-16 bg-stone-200 dark:bg-stone-800 rounded" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredArticles.length === 0 ? (
          /* Articles Empty State or Error State */
          <Card className="p-12 text-center rounded-2xl bg-surface/95 border-line max-w-lg mx-auto shadow-xs my-10">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/15 border border-amber-400/30 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-xl text-ink mb-2">
              {loadError
                ? "Chưa tải được bài viết"
                : articles.length === 0
                  ? "Thư viện đang được hoàn thiện"
                  : "Không tìm thấy bài viết phù hợp"}
            </h3>
            <p
              role={loadError ? "alert" : "status"}
              className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed mb-6"
            >
              {loadError
                ? loadError
                : articles.length === 0
                  ? "Kho tàng bài viết đang được nghiên cứu và chọn lọc tư liệu. Mời bạn quay lại thưởng thức sau ít lâu."
                  : "Không có bài viết khớp với lựa chọn hiện tại. Bạn hãy thử từ khóa khác hoặc đặt lại bộ lọc."}
            </p>
            {loadError && (
              <Button
                type="button"
                onClick={() => setLoadAttempt((value) => value + 1)}
                className="min-h-11 px-6 rounded-xl bg-gradient-to-r from-red-800 via-amber-700 to-amber-900 text-white font-semibold cursor-pointer shadow-md"
              >
                Tải lại bài viết
              </Button>
            )}
            {!loadError && (searchQuery || selectedRegion !== "all" || selectedCategory !== "all") && (
              <Button
                type="button"
                onClick={handleResetFilters}
                className="min-h-11 px-6 rounded-xl bg-gradient-to-r from-red-800 via-amber-700 to-amber-900 text-white font-semibold cursor-pointer shadow-md"
              >
                Đặt lại tất cả bộ lọc
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div
              id="culture-article-list"
              className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mb-10"
            >
              {visibleArticles.map((article) => (
                <Card
                  key={article.id}
                  onClick={() => onSelectArticle(article.id)}
                  className="group cursor-pointer rounded-2xl border-line bg-surface/95 hover:bg-surface-soft/80 p-5 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-amber-500/40 transition-all duration-300"
                >
                  <div>
                    <div className="relative overflow-hidden rounded-xl bg-surface-soft aspect-16/10 mb-4">
                      {canShowArticleImage(article) ? (
                        <UnverifiedImage
                          src={article.image}
                          approvedByContent={canShowArticleImage(article)}
                          alt={article.caption || article.title}
                          className="h-full w-full object-cover object-[center_25%] transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full flex-col items-center justify-center px-5 text-center bg-gradient-to-br from-amber-500/10 via-surface-soft to-stone-900/10 text-stone-500">
                          <BookOpen className="w-8 h-8 text-amber-700/40 dark:text-amber-400/40 mb-2" />
                          <span className="text-xs font-medium text-stone-600 dark:text-stone-400">Tư liệu văn hóa dân gian</span>
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-surface/90 backdrop-blur-md text-xs font-semibold text-amber-800 dark:text-amber-300 border-amber-400/40"
                      >
                        {article.region}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 mb-2">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>{article.readingTime}</span>
                      <span>·</span>
                      <span className="font-medium text-amber-700 dark:text-amber-400">{article.category}</span>
                    </div>

                    <h3 className="font-display text-lg font-bold leading-snug text-ink mb-2 group-hover:text-amber-800 dark:group-hover:text-amber-400 transition-colors min-h-[3.25rem] line-clamp-2">
                      <a
                        href={`/culture-detail?articleId=${encodeURIComponent(
                          article.id
                        )}`}
                        onClick={(event) =>
                          handleArticleLinkClick(event, article.id)
                        }
                        className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                      >
                        {article.title}
                      </a>
                    </h3>

                    <p className="line-clamp-2 text-sm leading-relaxed text-stone-600 dark:text-stone-300 mb-4">
                      {article.excerpt}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-line flex items-center justify-between">
                    <span className="text-xs text-stone-500">
                      {article.region} · Văn hóa truyền thống
                    </span>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectArticle(article.id);
                      }}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300 hover:text-amber-600 transition-colors cursor-pointer"
                    >
                      <span>Đọc bài viết</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </Card>
              ))}
            </div>

            {catalogArticles.length > 6 && (
              <div className="mb-12 flex flex-col items-center gap-3">
                <p
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                  className="text-xs sm:text-sm text-stone-500"
                >
                  Đang hiển thị {visibleArticles.length} / {catalogArticles.length} bài viết
                </p>

                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasMoreArticles}
                  aria-controls="culture-article-list"
                  onClick={() => setVisibleCount((count) => count + 6)}
                  className="min-h-11 px-7 rounded-xl border-line text-ink hover:text-accent font-semibold cursor-pointer"
                >
                  {hasMoreArticles
                    ? `Xem thêm ${Math.min(
                        6,
                        catalogArticles.length - visibleArticles.length
                      )} bài viết`
                    : "Đã hiển thị tất cả bài viết"}
                </Button>
              </div>
            )}
          </>
        )}

        {/* Editorial Principles Callout Banner */}
        <Card className="p-6 sm:p-8 rounded-2xl border-line bg-surface/95 flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-16 shadow-xs backdrop-blur-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700 dark:text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-stone-500 font-semibold mb-0.5">
                Góc nhìn của Tin Lắm Tâm Linh
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 mb-1.5">
                NGUYÊN TẮC BIÊN TẬP & BẢO TỒN DI SẢN
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-2xl">
                Nội dung được trình bày dưới lăng kính văn hóa nhân văn, tôn trọng sự phong phú của phong tục ba miền. Cùng tìm hiểu và gìn giữ những nếp xưa trong đời sống hôm nay.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-400/40 text-xs font-semibold text-amber-800 dark:text-amber-300 shrink-0 self-start sm:self-auto shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Tư liệu đã khảo chứng</span>
          </div>
        </Card>
      </main>
    </div>
  );
};


