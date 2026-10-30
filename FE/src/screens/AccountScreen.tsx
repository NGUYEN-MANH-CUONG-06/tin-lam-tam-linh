import React, { useState, useMemo } from "react";
import {
  Flower2,
  Scroll,
  BookOpen,
  Search,
  Star,
  Trash2,
  Eye,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Calendar,
  Lock,
  X,
  AlertTriangle,
  RotateCcw,
  Compass,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card } from "../components/ui/card";
import { MoodKey, type MoodContextKey, type SignalData } from "../data/demoSignals";
import { SavedItemActions } from "../components/SavedItemActions";
import { AppDialog } from "../components/AppDialog";

export interface SavedSignalItem {
  id: string;
  signalId: string;
  mood: MoodKey;
  contextKey?: MoodContextKey;
  signalSnapshot?: SignalData;
  actionDone?: boolean;
  idempotencyKey?: string;
  contentStatus?: "available" | "withdrawn";
  date: string;
  createdAt?: number;
  journal?: string;
  poemLine1: string;
  poemLine2: string;
  actionTitle?: string;
  starred?: boolean;
}

export interface SavedXinXamItem {
  id: string;
  drawId?: string;
  resultToken?: string;
  stickNumber: string;
  fortuneType: string;
  category: string;
  region: string;
  quote: string;
  date: string;
  createdAt?: number;
  starred?: boolean;
  source?: string;
  verified?: boolean;
}

export interface SavedWishItem {
  id: string;
  category: string;
  content: string;
  date: string;
  createdAt?: number;
  sealed: boolean;
  starred?: boolean;
}

interface AccountScreenProps {
  currentUser?: { name: string; email: string } | null;
  savedSignals: SavedSignalItem[];
  savedXamList: SavedXinXamItem[];
  savedWishList: SavedWishItem[];
  onDeleteSignal: (id: string) => boolean | Promise<boolean>;
  onDeleteXam: (id: string) => boolean | Promise<boolean>;
  onDeleteWish: (id: string) => boolean | Promise<boolean>;
  onToggleStarSignal?: (id: string) => void;
  onToggleStarXam: (id: string) => void;
  onToggleStarWish: (id: string) => void;
  onGoToSignalResult: (entryId: string) => void;
  onGoToXinXam: () => void;
  onGoToWish: () => void;
  onGoToMood: () => void;
  onGoToHome: () => void;
}

const normalizeSearchText = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const matchesSearch = (
  query: string,
  values: string[]
): boolean => {
  const normalizedQuery = normalizeSearchText(query);

  return (
    !normalizedQuery ||
    values.some((value) =>
      normalizeSearchText(value).includes(normalizedQuery)
    )
  );
};

export const AccountScreen: React.FC<AccountScreenProps> = ({
  currentUser,
  savedSignals,
  savedXamList,
  savedWishList,
  onDeleteSignal,
  onDeleteXam,
  onDeleteWish,
  onToggleStarSignal,
  onToggleStarXam,
  onToggleStarWish,
  onGoToSignalResult,
  onGoToXinXam,
  onGoToWish,
  onGoToMood,
  onGoToHome,
}) => {
  // 3 Primary Tabs
  const [activeTab, setActiveTab] = useState<
    "signals" | "xinxam" | "wishes"
  >(() => {
    if (savedSignals.length > 0) return "signals";
    if (savedXamList.length > 0) return "xinxam";
    if (savedWishList.length > 0) return "wishes";

    return "signals";
  });

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "thisWeek" | "thisMonth" | "starred"
  >("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Modals state
  const [itemToDelete, setItemToDelete] = useState<{
    type: "signal" | "xinxam" | "wish";
    id: string;
    title?: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const [openedWish, setOpenedWish] = useState<SavedWishItem | null>(null);
  const [openedXam, setOpenedXam] = useState<SavedXinXamItem | null>(null);
  // Helper date parsing (DD/MM/YYYY)
  const parseVnDate = (value: string): number => {
    const match = value.trim().match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
    );

    if (!match) return Number.NaN;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (
      year < 1 ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      return Number.NaN;
    }

    const date = new Date(0);
    date.setHours(0, 0, 0, 0);
    date.setFullYear(year, month - 1, day);

    if (
      date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day
    ) {
      return Number.NaN;
    }

    return date.getTime();
  };

  const isWithinDays = (
    dateStr: string,
    days: number
  ): boolean => {
    const timestamp = parseVnDate(dateStr);

    if (!Number.isFinite(timestamp)) {
      return false;
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const start = new Date(startOfToday);
    start.setDate(start.getDate() - (days - 1));

    const end = new Date(startOfToday);
    end.setDate(end.getDate() + 1);

    return (
      timestamp >= start.getTime() &&
      timestamp < end.getTime()
    );
  };

  const isCurrentMonth = (dateStr: string): boolean => {
    const timestamp = parseVnDate(dateStr);

    if (!Number.isFinite(timestamp)) return false;

    const itemDate = new Date(timestamp);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
      timestamp <= today.getTime() &&
      itemDate.getMonth() === today.getMonth() &&
      itemDate.getFullYear() === today.getFullYear()
    );
  };

  const getSavedTimestamp = (item: {
    date: string;
    createdAt?: number;
  }): number => {
    if (
      typeof item.createdAt === "number" &&
      Number.isFinite(item.createdAt) &&
      item.createdAt > 0 &&
      Number.isFinite(new Date(item.createdAt).getTime())
    ) {
      return item.createdAt;
    }

    return parseVnDate(item.date);
  };

  const compareSavedDates = (
    firstItem: { date: string; createdAt?: number },
    secondItem: { date: string; createdAt?: number }
  ): number => {
    const first = getSavedTimestamp(firstItem);
    const second = getSavedTimestamp(secondItem);

    const firstValid = Number.isFinite(first);
    const secondValid = Number.isFinite(second);

    if (!firstValid && !secondValid) return 0;
    if (!firstValid) return 1;
    if (!secondValid) return -1;

    return sortOrder === "newest"
      ? second - first
      : first - second;
  };

  // Perform deletion
  const handleConfirmDelete = async () => {
    if (!itemToDelete || isDeleting) return;

    setIsDeleting(true);
    setDeleteError("");

    let deleted = false;

    try {
      if (itemToDelete.type === "signal") {
        deleted = await onDeleteSignal(itemToDelete.id);
      } else if (itemToDelete.type === "xinxam") {
        deleted = await onDeleteXam(itemToDelete.id);
      } else {
        deleted = await onDeleteWish(itemToDelete.id);
      }
    } catch {
      deleted = false;
    }

    if (!deleted) {
      setDeleteError(
        "Chưa xác nhận được việc xóa. Bạn hãy tải lại danh sách để kiểm tra trước khi thử lại."
      );
      setIsDeleting(false);
      return;
    }

    // Đóng phần xem chi tiết nếu đang mở đúng mục vừa xóa.
    if (openedWish?.id === itemToDelete.id) {
      setOpenedWish(null);
    }

    if (openedXam?.id === itemToDelete.id) {
      setOpenedXam(null);
    }

    setItemToDelete(null);
    setIsDeleting(false);
  };

  // Filtered Xam
  const filteredXam = useMemo(() => {
    const list = savedXamList.filter((item) => {
      if (
        !matchesSearch(searchQuery, [
          item.category,
          item.quote,
          item.stickNumber,
          item.fortuneType,
        ])
      ) {
        return false;
      }
      if (activeFilter === "starred" && !item.starred) return false;
      if (activeFilter === "thisWeek" && !isWithinDays(item.date, 7)) return false;
      if (activeFilter === "thisMonth" && !isCurrentMonth(item.date)) return false;
      return true;
    });

    return list.sort(compareSavedDates);
  }, [savedXamList, searchQuery, activeFilter, sortOrder]);

  // Filtered Wishes
  const filteredWishes = useMemo(() => {
    const list = savedWishList.filter((item) => {
      if (
        !matchesSearch(searchQuery, [
          item.category,
          item.content,
        ])
      ) {
        return false;
      }
      if (activeFilter === "starred" && !item.starred) return false;
      if (activeFilter === "thisWeek" && !isWithinDays(item.date, 7)) return false;
      if (activeFilter === "thisMonth" && !isCurrentMonth(item.date)) return false;
      return true;
    });

    return list.sort(compareSavedDates);
  }, [savedWishList, searchQuery, activeFilter, sortOrder]);

  // Filtered Signals
  const filteredSignals = useMemo(() => {
    const list = savedSignals.filter((item) => {
      if (
        !matchesSearch(searchQuery, [
          item.mood,
          `${item.poemLine1} ${item.poemLine2}`,
          item.journal || "",
          item.actionTitle || "",
        ])
      ) {
        return false;
      }
      if (activeFilter === "starred" && !item.starred) return false;
      if (activeFilter === "thisWeek" && !isWithinDays(item.date, 7)) return false;
      if (activeFilter === "thisMonth" && !isCurrentMonth(item.date)) return false;
      return true;
    });

    return list.sort(compareSavedDates);
  }, [savedSignals, searchQuery, activeFilter, sortOrder]);

  const searchEmptyState = (
    <div className="mb-10 rounded-card border border-line bg-surface p-6 sm:p-10 text-center">
      <Search
        aria-hidden="true"
        className="mx-auto mb-4 h-8 w-8 text-muted"
      />

      <h3 className="font-display text-xl font-semibold text-ink">
        Không tìm thấy nội dung phù hợp
      </h3>

      <p className="mx-auto mt-3 max-w-md text-sm text-muted leading-relaxed">
        Nội dung đã lưu vẫn còn. Bạn hãy thử từ khóa khác
        hoặc bỏ bộ lọc đang chọn.
      </p>

      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setSearchQuery("");
          setActiveFilter("all");
        }}
        className="mt-5 min-h-11"
      >
        Xóa tìm kiếm và bộ lọc
      </Button>
    </div>
  );

  // Total count
  const totalCount = savedSignals.length + savedXamList.length + savedWishList.length;

  return (
    <div className="screen-shell">
      <main className="page-container max-w-6xl">
        {/* Top Breadcrumb & Tag */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6 text-xs text-muted">
          <div className="flex items-center gap-2">
            <span
              onClick={onGoToHome}
              className="hover:text-accent cursor-pointer transition-colors"
            >
              Trang chủ
            </span>
            <span>&gt;</span>
            <span className="text-accent font-semibold">Góc của tôi</span>
          </div>

          <div className="flex items-center gap-1.5 uppercase font-semibold text-xs text-muted">
            <Lock className="w-3.5 h-3.5 text-accent" />
            <span>NỘI DUNG ĐÃ LƯU</span>
          </div>
        </div>

        {/* Hero Card Banner with Profile on the Right */}
        <div className="relative py-8 mb-8 border-y border-line flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl">
            <div className="text-xs uppercase font-bold tracking-wider text-accent mb-2 flex items-center gap-1.5">
              <span>— TÀI KHOẢN CỦA BẠN</span>
            </div>

            <h1 className="page-title mb-2">
              Góc của tôi
            </h1>

            <p className="font-display italic text-sm sm:text-base text-accent font-medium mb-3">
              “Hôm nay bạn muốn xem lại điều gì?”
            </p>

            <p className="text-sm text-ink leading-relaxed">
              Nơi xem lại lời chiêm nghiệm, thẻ xin xăm và điều ước bạn đã lưu trong tài khoản.
            </p>
          </div>

          {/* User Profile Card */}
          <div className="p-4 sm:p-5 rounded-panel bg-surface/95 backdrop-blur-md border border-line shadow-sm flex items-center justify-between gap-4 min-w-0 w-full lg:w-auto">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-line shrink-0 bg-surface">
                <span className="grid h-full w-full place-items-center bg-accent-soft font-display text-2xl font-semibold text-accent" aria-hidden="true">
                  {(currentUser?.name || "An Nhiên").trim().charAt(0).toUpperCase()}
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-base text-ink">
                    {currentUser?.name || "Tài khoản"}
                  </span>
                </div>
                <div className="text-xs text-muted mb-1.5 flex flex-col gap-0.5">
                  <span className="break-all text-xs text-muted">
                    {currentUser?.email || "Chưa có thông tin"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-accent font-semibold">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>{totalCount} mục đã lưu</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* 3 Primary Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-6">
            {/* Tab 1: Lời chiêm nghiệm đã lưu */}
          <button
            onClick={() => setActiveTab("signals")}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "signals"
                ? "bg-action text-white shadow-2xs"
                : "bg-surface border border-line text-ink hover:border-line"
            }`}
          >
            <Flower2 className="w-3.5 h-3.5" />
            <span>Lời chiêm nghiệm đã lưu</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-sans tabular-nums ${
                activeTab === "signals" ? "bg-white/20 text-white" : "bg-surface text-muted"
              }`}
            >
              {savedSignals.length.toString().padStart(2, "0")}
            </span>
          </button>

            {/* Tab 2: Thẻ xin xăm đã lưu */}
          <button
            onClick={() => setActiveTab("xinxam")}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "xinxam"
                ? "bg-action text-white shadow-2xs"
                : "bg-surface border border-line text-ink hover:border-line"
            }`}
          >
            <Scroll className="w-3.5 h-3.5" />
            <span>Thẻ xin xăm đã lưu</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-sans tabular-nums ${
                activeTab === "xinxam" ? "bg-white/20 text-white" : "bg-surface text-muted"
              }`}
            >
              {savedXamList.length.toString().padStart(2, "0")}
            </span>
          </button>

          {/* Tab 3: Điều ước & Lời tri ân */}
          <button
            onClick={() => setActiveTab("wishes")}
            className={`px-4 py-2.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === "wishes"
                ? "bg-action text-white shadow-2xs"
                : "bg-surface border border-line text-ink hover:border-line"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Điều ước & Lời tri ân</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-xs font-sans tabular-nums ${
                activeTab === "wishes" ? "bg-white/20 text-white" : "bg-surface text-muted"
              }`}
            >
              {savedWishList.length.toString().padStart(2, "0")}
            </span>
          </button>
        </div>

        {/* Search & Filters Toolbar */}
        <div className="p-3 sm:p-4 rounded-panel bg-surface border border-line mb-8 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs shadow-2xs">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="search"
              aria-label="Tìm trong nội dung đang xem"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm trong nội dung đang xem…"
              className="w-full min-h-11 pl-9 pr-3 py-2 rounded-control bg-surface border border-line text-base text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              aria-pressed={activeFilter === "all"}
              onClick={() => setActiveFilter("all")}
              className={`min-h-11 px-3 py-1 rounded-full font-medium transition-all cursor-pointer inline-flex items-center ${
                activeFilter === "all"
                  ? "bg-action text-on-action shadow-2xs font-semibold"
                  : "bg-surface border border-line text-ink"
              }`}
            >
              Tất cả
            </button>
            <button
              type="button"
              aria-pressed={activeFilter === "thisWeek"}
              onClick={() => setActiveFilter("thisWeek")}
              className={`min-h-11 px-3 py-1 rounded-full font-medium transition-all cursor-pointer inline-flex items-center ${
                activeFilter === "thisWeek"
                  ? "bg-action text-on-action shadow-2xs font-semibold"
                  : "bg-surface border border-line text-ink"
              }`}
            >
              7 ngày gần đây
            </button>
            <button
              type="button"
              aria-pressed={activeFilter === "thisMonth"}
              onClick={() => setActiveFilter("thisMonth")}
              className={`min-h-11 px-3 py-1 rounded-full font-medium transition-all cursor-pointer inline-flex items-center ${
                activeFilter === "thisMonth"
                  ? "bg-action text-on-action shadow-2xs font-semibold"
                  : "bg-surface border border-line text-ink"
              }`}
            >
              Tháng này
            </button>
            <button
              type="button"
              aria-pressed={activeFilter === "starred"}
              onClick={() => setActiveFilter("starred")}
              className={`min-h-11 px-3 py-1 rounded-full font-medium transition-all cursor-pointer inline-flex items-center ${
                activeFilter === "starred"
                  ? "bg-action text-on-action shadow-2xs font-semibold"
                  : "bg-surface border border-line text-ink"
              }`}
            >
              ☆ Gắn sao
            </button>
          </div>

          {/* Sort selector */}
          <button
            onClick={() => setSortOrder((prev) => (prev === "newest" ? "oldest" : "newest"))}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-accent shrink-0 border-l border-line pl-3 cursor-pointer transition-colors font-medium"
            title="Nhấp để chuyển đổi thứ tự sắp xếp"
          >
            <span>{sortOrder === "newest" ? "Mới nhất trước ↓" : "Cũ nhất trước ↑"}</span>
          </button>
        </div>

        {/* =========================================================================
            TAB CONTENT 1: THẺ XIN XĂM ĐÃ LƯU (MATCHING IMAGE 1)
           ========================================================================= */}
        {activeTab === "xinxam" && (
          <div>
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scroll className="w-5 h-5 text-accent" />
                <h2 className="section-title text-xl">
                  Thẻ xin xăm đã lưu
                </h2>
              </div>
              <span className="text-xs text-muted">
                Hiển thị {filteredXam.length}/{savedXamList.length} thẻ xăm
              </span>
            </div>

            {filteredXam.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {filteredXam.map((item) => (
                  <Card
                    key={item.id}
                    className="p-5 rounded-card bg-surface border-line shadow-2xs hover:shadow-card transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top status line */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-accent">
                          Thẻ số {item.stickNumber} • {item.fortuneType}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-xs font-medium bg-surface text-accent border-line"
                        >
                          {item.category}
                        </Badge>
                      </div>

                      {/* Title */}
                      <h3 className="font-display font-bold text-lg text-ink mb-3">
                        {item.category}
                      </h3>

                      {/* Quote Container */}
                      <div className="p-3.5 rounded-panel bg-surface border border-line text-xs sm:text-sm font-display italic text-ink leading-relaxed mb-4">
                        {item.quote}
                      </div>

                      {/* Date */}
                      <div className="text-xs text-muted mb-4 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{item.date}</span>
                      </div>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2">
                      <button
                        onClick={() => setOpenedXam(item)}
                        className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>Xem lại kết quả</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      <SavedItemActions
                        label={`Thẻ số ${item.stickNumber}, ${item.category}`}
                        starred={Boolean(item.starred)}
                        onToggleStar={() => onToggleStarXam(item.id)}
                        onDelete={() =>
                          setItemToDelete({
                            type: "xinxam",
                            id: item.id,
                            title: `Thẻ số ${item.stickNumber} - ${item.category}`,
                          })
                        }
                      />
                    </div>
                  </Card>
                ))}
              </div>
            ) : savedXamList.length > 0 ? (
              searchEmptyState
            ) : (
              /* EMPTY STATE MATCHING IMAGE 3 */
              <div className="p-10 sm:p-14 text-center rounded-card bg-surface border border-line mb-16 shadow-2xs">
                <div className="w-16 h-16 rounded-full bg-surface border border-line mx-auto mb-4 flex items-center justify-center text-accent">
                  <Scroll className="w-8 h-8" />
                </div>

                <div className="text-xs uppercase font-bold tracking-wider text-accent mb-1.5">
                  ỐNG XĂM ĐANG TĨNH LẶNG
                </div>

                <h3 className="font-display font-bold text-2xl text-ink mb-3">
                  Bạn chưa lưu thẻ xin xăm nào
                </h3>

                <p className="text-sm text-muted leading-relaxed max-w-xl mx-auto mb-6">
                  Bạn có thể xem nội dung xin xăm để tham khảo, rồi chọn lưu lại thẻ muốn xem sau.
                </p>

                <Button
                  variant="default"
                  size="lg"
                  onClick={onGoToXinXam}
                  className="px-6 py-3 rounded-panel text-xs sm:text-sm font-semibold gap-2 shadow-sm mb-4"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Bắt đầu trải nghiệm xin xăm</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <div className="text-xs text-muted italic">
                  Các mục khác đã lưu vẫn có thể xem trong những danh sách bên dưới.
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT 2: ĐIỀU ƯỚC LƯU RIÊNG (MATCHING IMAGE 4)
           ========================================================================= */}
        {activeTab === "wishes" && (
          <div>
            {/* Privacy Pledge Banner Matching Image 4 */}
            <Card className="p-4 sm:p-5 rounded-panel bg-surface/70 border border-line mb-6 flex items-start gap-3.5 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-accent mb-1">
                  Điều ước lưu riêng trong tài khoản
                </div>
                <p className="text-sm text-ink leading-relaxed">
                  Chỉ những điều ước bạn chọn <strong>“Lưu riêng vào nhật ký”</strong> mới xuất hiện tại đây.
                  Điều ước gửi theo hình thức thả trôi không được lưu vào tài khoản.
                </p>
              </div>
            </Card>

            {filteredWishes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                {filteredWishes.map((wish) => (
                  <Card
                    key={wish.id}
                    className="p-6 rounded-card bg-surface border-line shadow-2xs hover:shadow-card transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Meta header */}
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-3 text-xs">
                        <div className="text-muted font-medium flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          <span>{wish.date}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="text-xs bg-surface text-accent border-line"
                          >
                            {wish.category}
                          </Badge>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-surface text-muted font-medium flex items-center gap-1">
                            <Lock className="w-3 h-3 text-accent" />
                            <span>Đã lưu trong tài khoản</span>
                          </span>
                        </div>
                      </div>

                      {/* Content excerpt */}
                      <div className="p-4 rounded-panel bg-surface border border-line text-sm text-ink font-display leading-relaxed mb-3">
                        “{wish.content}”
                      </div>

                      <div className="text-xs text-muted italic flex items-center gap-1 mb-4">
                        <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                        <span>Đã lưu riêng</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setOpenedWish(wish)}
                        className="text-xs font-semibold gap-1.5 rounded-xl px-4 py-2"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Mở điều ước</span>
                      </Button>

                      <SavedItemActions
                        label={`Lời gửi gắm ${wish.category}, ngày ${wish.date}`}
                        starred={Boolean(wish.starred)}
                        onToggleStar={() => onToggleStarWish(wish.id)}
                        onDelete={() =>
                          setItemToDelete({
                            type: "wish",
                            id: wish.id,
                            title: `Lời gửi gắm [${wish.category}]`,
                          })
                        }
                      />
                    </div>
                  </Card>
                ))}
              </div>
            ) : savedWishList.length > 0 ? (
              searchEmptyState
            ) : (
              <div className="p-10 sm:p-14 text-center rounded-card bg-surface border border-line mb-16 shadow-2xs">
                <div className="w-16 h-16 rounded-full bg-surface border border-line mx-auto mb-4 flex items-center justify-center text-accent">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-2xl text-ink mb-3">
                  Bạn chưa lưu điều ước nào
                </h3>
                <p className="text-sm text-muted leading-relaxed max-w-xl mx-auto mb-6">
                  Bạn có thể viết điều ước hoặc lời tri ân rồi lưu trong tài khoản để xem lại sau.
                </p>
                <Button
                  variant="default"
                  size="lg"
                  onClick={onGoToWish}
                  className="px-6 py-3 rounded-panel text-xs sm:text-sm font-semibold gap-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Viết điều ước ngay</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB CONTENT 3: TÍN HIỆU ĐÃ LƯU (DAILY CHECK-IN SIGNALS)
           ========================================================================= */}
        {activeTab === "signals" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flower2 className="w-5 h-5 text-accent" />
                <h2 className="section-title text-xl">
                  Lời chiêm nghiệm đã lưu
                </h2>
              </div>
              <span className="text-xs text-muted">
                {filteredSignals.length} nội dung
              </span>
            </div>

            {filteredSignals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
                {filteredSignals.map((item) => (
                  <Card
                    key={item.id}
                    className="p-6 rounded-card bg-surface border-line shadow-2xs hover:shadow-card transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3 text-xs">
                        <Badge variant="terracotta" className="text-xs">
                          {item.mood}
                        </Badge>
                        <span className="text-muted">{item.date}</span>
                      </div>

                      <div className="p-4 rounded-panel bg-surface border border-line text-sm font-display italic text-ink leading-relaxed mb-3">
                        <p>{item.poemLine1}</p>
                        <p>{item.poemLine2}</p>
                      </div>

                      {item.journal && (
                        <p className="text-sm text-ink mb-3 line-clamp-2">
                          <strong>Ghi chú:</strong> {item.journal}
                        </p>
                      )}

                      {item.actionTitle && (
                        <p className="mb-4 text-sm leading-relaxed text-muted">
                          <span className="font-medium text-ink">
                            Hành động gợi ý:{" "}
                          </span>
                          {item.actionTitle}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-line flex flex-wrap items-center justify-between gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onGoToSignalResult(item.id)}
                        className="text-xs font-semibold gap-1 rounded-xl"
                      >
                        <span>Xem chi tiết</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>

                      <SavedItemActions
                        label={`Lời chiêm nghiệm ${item.mood}, ngày ${item.date}`}
                        starred={Boolean(item.starred)}
                        onToggleStar={
                          onToggleStarSignal
                            ? () => onToggleStarSignal(item.id)
                            : undefined
                        }
                        onDelete={() =>
                          setItemToDelete({
                            type: "signal",
                            id: item.id,
                            title: `Lời chiêm nghiệm [${item.mood}]`,
                          })
                        }
                      />
                    </div>
                  </Card>
                ))}
              </div>
            ) : savedSignals.length > 0 ? (
              searchEmptyState
            ) : (
              <div className="p-10 sm:p-14 text-center rounded-card bg-surface border border-line mb-16 shadow-2xs">
                <div className="w-16 h-16 rounded-full bg-surface border border-line mx-auto mb-4 flex items-center justify-center text-accent">
                  <Flower2 className="w-8 h-8" />
                </div>
                <h3 className="font-display font-bold text-2xl text-ink mb-3">
                  Bạn chưa lưu tín hiệu nào
                </h3>
                <p className="text-sm text-muted leading-relaxed max-w-xl mx-auto mb-6">
                  Ghi lại cảm xúc hôm nay để nhận lời gợi mở và lưu lại nếu bạn muốn xem sau.
                </p>
                <Button
                  variant="default"
                  size="lg"
                  onClick={onGoToMood}
                  className="px-6 py-3 rounded-panel text-xs sm:text-sm font-semibold gap-2 shadow-sm"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Check-in cảm xúc hôm nay</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        )}

      </main>

      {/* =========================================================================
          MODAL 1: XÁC NHẬN XÓA (MATCHING IMAGE 2)
         ========================================================================= */}
      {itemToDelete && (
        <AppDialog
          labelledBy="delete-saved-item-title"
          onClose={() => {
            if (isDeleting) return;

            setDeleteError("");
            setItemToDelete(null);
          }}
          className="max-w-md text-center"
        >
          {/* Red alert square icon */}
          <div className="w-12 h-12 rounded-panel bg-danger-soft border border-danger/25 mx-auto mb-4 flex items-center justify-center text-danger">
            <Trash2 className="w-6 h-6" />
          </div>

          <h3
            id="delete-saved-item-title"
            className="font-display font-bold text-xl text-ink mb-2.5"
          >
            Xác nhận xóa {itemToDelete.type === "wish" ? "điều ước lưu riêng" : "bản ghi này"}?
          </h3>

          <p className="text-sm text-muted leading-relaxed mb-6">
            Mục này sẽ được gỡ bỏ vĩnh viễn khỏi <strong>Góc của tôi</strong>. Hành động này
            không thể hoàn tác sau khi xác nhận.
          </p>

          {deleteError && (
            <p
              role="alert"
              className="mb-4 text-sm text-danger leading-relaxed"
            >
              {deleteError}
            </p>
          )}

          <div className="flex items-center justify-center gap-3">
            <Button
              type="button"
              autoFocus
              variant="outline"
              size="lg"
              disabled={isDeleting}
              onClick={() => {
                setDeleteError("");
                setItemToDelete(null);
              }}
              className="w-1/2 rounded-panel text-xs font-semibold"
            >
              Hủy bỏ
            </Button>

            <Button
              type="button"
              variant="default"
              size="lg"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              className="w-1/2 rounded-panel text-xs font-semibold bg-action hover:bg-action text-on-action"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              <span>{isDeleting ? "Đang xóa…" : "Xóa vĩnh viễn"}</span>
            </Button>
          </div>
        </AppDialog>
      )}

      {/* =========================================================================
          MODAL 2: MỞ ĐIỀU ƯỚC CHI TIẾT
         ========================================================================= */}
      {openedWish && (
        <AppDialog
          labelledBy="saved-wish-title"
          onClose={() => setOpenedWish(null)}
          className="relative"
        >
          <button
            type="button"
            autoFocus
            aria-label="Đóng lời gửi gắm"
            onClick={() => setOpenedWish(null)}
            className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>

          <div className="flex items-center gap-2 mb-3 pr-12">
            <Badge variant="terracotta" className="text-xs">
              {openedWish.category}
            </Badge>
            <span className="text-xs text-muted">{openedWish.date}</span>
          </div>

          <h3
            id="saved-wish-title"
            className="font-display font-bold text-xl text-ink mb-4"
          >
            {openedWish.category.includes("tri ân") ||
            openedWish.category.includes("Tri ân") ||
            openedWish.category === "Lòng biết ơn"
              ? "Lời tri ân đã lưu riêng"
              : "Lời gửi gắm đã lưu"}
          </h3>

          <div className="p-5 rounded-panel bg-surface border border-line text-sm sm:text-base font-display leading-relaxed text-ink mb-6 whitespace-pre-wrap break-words">
            “{openedWish.content}”
          </div>

          <div className="text-xs text-muted italic mb-6">
            Lời gửi gắm này được lưu trong tài khoản của bạn để xem lại sau.
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={() => setOpenedWish(null)}
            className="w-full rounded-panel text-xs font-semibold"
          >
            Đóng lại
          </Button>
        </AppDialog>
      )}

      {/* =========================================================================
          MODAL 3: MỞ THẺ XĂM CHI TIẾT
         ========================================================================= */}
      {openedXam && (
        <AppDialog
          labelledBy="saved-xam-title"
          onClose={() => setOpenedXam(null)}
          className="relative"
        >
          <button
            type="button"
            autoFocus
            aria-label="Đóng thẻ xăm"
            onClick={() => setOpenedXam(null)}
            className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-xl text-muted hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X
              className="h-5 w-5"
              aria-hidden="true"
            />
          </button>

          <div className="flex items-center gap-2 mb-2 pr-12 flex-wrap">
            <Badge variant="outline" className="text-xs bg-surface text-accent border-line">
              {openedXam.category}
            </Badge>
            <span className="text-xs text-muted">{openedXam.date}</span>
          </div>

          <div className="text-xs uppercase font-bold tracking-wider text-accent mb-1">
            THẺ SỐ {openedXam.stickNumber} • QUẺ {openedXam.fortuneType.toUpperCase()}
          </div>

          <h3
            id="saved-xam-title"
            className="font-display font-bold text-2xl text-ink mb-4"
          >
            Lời quẻ chiêm nghiệm
          </h3>

          <div className="p-5 rounded-panel bg-surface border border-line mb-5">
            <p className="font-display italic text-base sm:text-lg text-accent font-semibold text-center leading-relaxed">
              “{openedXam.quote}”
            </p>
          </div>

          <p className="mb-6 text-sm leading-relaxed text-muted">
            Đây là nội dung để suy ngẫm, không phải dự đoán kết quả
            hoặc lời khuyên quyết định thay bạn.
          </p>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setOpenedXam(null)}
              className="w-1/2 rounded-panel text-xs font-semibold"
            >
              Đóng lại
            </Button>

            <Button
              variant="default"
              size="lg"
              onClick={() => {
                setOpenedXam(null);
                onGoToXinXam();
              }}
              className="w-1/2 rounded-panel text-xs font-semibold gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Rút quẻ mới</span>
            </Button>
          </div>
        </AppDialog>
      )}
    </div>
  );
};
