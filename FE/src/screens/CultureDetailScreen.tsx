import React, { useEffect, useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Clock,
  Sparkles,
  BookOpen,
  Flower2,
  Compass,
  CheckCircle2,
  Bookmark,
  Volume2,
  MapPin,
  Layers,
  Landmark,
  Waves,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import {
  CultureArticle,
} from "../data/cultureData";
import { DetailNotFound } from "../components/DetailNotFound";
import { ReadingBookmarkButton } from "../components/ReadingBookmarkButton";
import { SavedReadingList } from "../components/SavedReadingList";
import { ChauVanAudioLibrary } from "../components/ChauVanAudioLibrary";
import { ScrollReveal } from "../components/ScrollReveal";
import { ApiError, apiRequest } from "../lib/api";
import { loadCultureArticles, type RemoteContentItem } from "../data/contentService";
import { isDemoMode } from "../data/demoMode";
import { canShowArticleImage, toCultureArticle } from "../data/cultureAdapter";
import { UnverifiedImage } from "../components/UnverifiedImage";

interface CultureDetailScreenProps {
  articleId?: string;
  resolvedArticle?: CultureArticle;
  currentUserEmail?: string;
  onBackToCulture: () => void;
  onSelectRelatedArticle: (id: string) => void;
  onGoToExperience: () => void;
  onGoToRegionalExperience?: (
    kind: "chau-van" | "sea-prayer" | "southern-culture"
  ) => void;
  onGoToRituals?: () => void;
  onGoToMood: () => void;
  onGoToCultureMap?: () => void;
}
const CultureDetailContent: React.FC<CultureDetailScreenProps> = ({
  articleId = "dinh-lang-bac-bo",
  resolvedArticle,
  currentUserEmail,
  onBackToCulture,
  onSelectRelatedArticle,
  onGoToExperience,
  onGoToRegionalExperience,
  onGoToRituals,
  onGoToMood,
  onGoToCultureMap,
}) => {
  const article: CultureArticle = resolvedArticle!;
  const [relatedArticles, setRelatedArticles] = useState<CultureArticle[]>([]);

  const [readingProgress, setReadingProgress] = useState(0);
  const [activeSectionId, setActiveSectionId] = useState<string>("");

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [articleId]);

  useEffect(() => {
    let active = true;
    void loadCultureArticles().then((items) => {
      if (!active) return;
      setRelatedArticles(
        items
          .filter((item) => item.verified === true && item.id !== article.id)
          .slice(0, 3)
          .map(toCultureArticle),
      );
    }).catch(() => {
      if (active) setRelatedArticles([]);
    });
    return () => { active = false; };
  }, [article.id]);

  // Track Reading Scroll Progress
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setReadingProgress(progress);
      }

      // Check active section
      for (let i = article.sections.length - 1; i >= 0; i--) {
        const sectionEl = document.getElementById(article.sections[i].id);
        if (sectionEl) {
          const rect = sectionEl.getBoundingClientRect();
          if (rect.top <= 200) {
            setActiveSectionId(article.sections[i].id);
            return;
          }
        }
      }
      if (window.scrollY < 300 && article.sections[0]) {
        setActiveSectionId(article.sections[0].id);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [article.sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    element.focus({ preventScroll: true });

    element.scrollIntoView({
      behavior: reducedMotion ? "auto" : "smooth",
      block: "start",
    });
  };



  // Contextual Bridge: Liên kết nghiệp vụ chính xác theo từng thể loại bài viết
  const contextBridge = useMemo(() => {
    // 1. Nhóm bài CÓ Không gian 3D tương ứng 1-1
    if (article.id === "dinh-lang-bac-bo") {
      return {
        type: "3d" as const,
        tag: "KHÔNG GIAN THỰC TẾ ẢO 3D",
        badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        cardBg: "from-amber-500/10 via-surface to-surface border-amber-500/40",
        btnStyle: "bg-amber-600 hover:bg-amber-700 text-white",
        title: "Bước vào Không gian 3D Đình làng Bắc Bộ & Chầu Văn",
        desc: "Chiêm ngưỡng kiến trúc đình gỗ cổ truyền tòa Đại Bái, lắng nghe làn điệu đàn nguyệt và khói trầm linh thiêng.",
        actionLabel: "Khám phá không gian 3D",
        topButtonLabel: "Trải nghiệm không gian 3D Đình làng",
        icon: <Landmark className="w-5 h-5 text-amber-500" />,
        action: () => {
          if (onGoToRegionalExperience) onGoToRegionalExperience("chau-van");
          else onGoToExperience();
        },
      };
    }

    if (article.id === "le-hoi-cau-ngu") {
      return {
        type: "3d" as const,
        tag: "KHÔNG GIAN THỰC TẾ ẢO 3D",
        badgeStyle: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30",
        cardBg: "from-sky-500/10 via-surface to-surface border-sky-500/40",
        btnStyle: "bg-sky-600 hover:bg-sky-700 text-white",
        title: "Bước vào Không gian 3D Biển Miền Trung & Lời cầu bình an",
        desc: "Thả hoa đăng giữa tiếng sóng biển vỗ rì rào, tưởng niệm tiền nhân vạn chài và gởi lời nguyện sóng yên bể lặng.",
        actionLabel: "Khám phá không gian 3D",
        topButtonLabel: "Trải nghiệm không gian 3D Biển",
        icon: <Waves className="w-5 h-5 text-sky-500" />,
        action: () => {
          if (onGoToRegionalExperience) onGoToRegionalExperience("sea-prayer");
          else onGoToExperience();
        },
      };
    }

    if (article.id === "hoa-dang-ninh-kieu") {
      return {
        type: "3d" as const,
        tag: "KHÔNG GIAN THỰC TẾ ẢO 3D",
        badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        cardBg: "from-emerald-500/10 via-surface to-surface border-emerald-500/40",
        btnStyle: "bg-emerald-600 hover:bg-emerald-700 text-white",
        title: "Bước vào Không gian 3D Sông nước Nam Bộ & Thả hoa đăng",
        desc: "Lắng nghe điệu đờn ca tài tử bảng lảng trên bến sông, thả hoa đăng trôi theo dòng phù sa và nguyện ước bình an.",
        actionLabel: "Khám phá không gian 3D",
        topButtonLabel: "Trải nghiệm không gian 3D Sông nước",
        icon: <Compass className="w-5 h-5 text-emerald-500" />,
        action: () => {
          if (onGoToRegionalExperience) onGoToRegionalExperience("southern-culture");
          else onGoToExperience();
        },
      };
    }

    if (article.id === "tin-nguong-tho-mau-tam-phu") {
      return {
        type: "3d" as const,
        tag: "KHÔNG GIAN THỰC TẾ ẢO 3D BẮC BỘ",
        badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        cardBg: "from-amber-500/10 via-surface to-surface border-amber-500/40",
        btnStyle: "bg-amber-600 hover:bg-amber-700 text-white",
        title: "Bước vào Không gian 3D Điện Mẫu & Âm nhạc Chầu Văn",
        desc: "Chiêm ngưỡng điện thờ Tứ Phủ uy nghiêm, hòa mình vào không gian thực tế ảo và giai điệu thiêng liêng ngợi ca tiền nhân.",
        actionLabel: "Khám phá không gian 3D",
        topButtonLabel: "Trải nghiệm không gian 3D Bắc Bộ",
        icon: <Landmark className="w-5 h-5 text-amber-500" />,
        action: () => {
          if (onGoToRegionalExperience) onGoToRegionalExperience("chau-van");
          else onGoToExperience();
        },
      };
    }

    if (article.id === "hau-dong-chau-van") {
      return {
        type: "3d" as const,
        tag: "KHÔNG GIAN THỰC TẾ ẢO 3D & ÂM NHẠC CHẦU VĂN",
        badgeStyle: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
        cardBg: "from-purple-500/10 via-surface to-surface border-purple-500/40",
        btnStyle: "bg-purple-600 hover:bg-purple-700 text-white",
        title: "Bước vào Không gian 3D Đình làng & Diễn xướng Chầu Văn",
        desc: "Lắng nghe đàn nguyệt réo rắt, chiêm ngưỡng mỹ thuật trang phục cổ truyền của 36 giá hầu và cảm nhận năng lượng hào sảng.",
        actionLabel: "Khám phá không gian 3D",
        topButtonLabel: "Trải nghiệm không gian 3D Chầu Văn",
        icon: <Landmark className="w-5 h-5 text-purple-500" />,
        action: () => {
          if (onGoToRegionalExperience) onGoToRegionalExperience("chau-van");
          else onGoToExperience();
        },
      };
    }

    // 2. Nhóm bài về Đại lễ & Nghi thức cúng bái nếp nhà
    if (article.id === "den-hung") {
      return {
        type: "ritual" as const,
        tag: "CẨM NANG NGHI LỄ & NẾP CÚNG TẠI GIA",
        badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        cardBg: "from-amber-600/10 via-surface to-surface border-amber-600/40",
        btnStyle: "bg-amber-700 hover:bg-amber-800 text-white",
        title: "Cẩm nang Nghi thức & Lời khấn Giỗ Tổ mùng mười tháng Ba",
        desc: "Hướng dẫn chuẩn bị mâm lễ thanh tịnh dâng Quốc Tổ (bánh chưng, bánh giầy, hương hoa) và lời khấn triân cội nguồn tại gia.",
        actionLabel: "Xem cẩm nang nghi lễ",
        topButtonLabel: "Xem nghi thức cúng Giỗ Tổ tại gia",
        icon: <BookOpen className="w-5 h-5 text-amber-600" />,
        action: () => {
          if (onGoToRituals) onGoToRituals();
          else onGoToExperience();
        },
      };
    }

    if (article.id === "mieu-ba-chua-xu") {
      return {
        type: "ritual" as const,
        tag: "CẨM NANG NGHI LỄ & VĂN KHẤN CHIÊM BÁI",
        badgeStyle: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
        cardBg: "from-rose-500/10 via-surface to-surface border-rose-500/40",
        btnStyle: "bg-rose-600 hover:bg-rose-700 text-white",
        title: "Cẩm nang Lễ vật & Nghi thức khấn an Bà Chúa Xứ Núi Sam",
        desc: "Chuẩn bị lễ vật viếng Bà trang nghiêm, các phép tắc khi chiêm bái và bài khấn cầu mong gia đạo an khang, tai qua nạn khỏi.",
        actionLabel: "Xem hướng dẫn lễ bái",
        topButtonLabel: "Xem cẩm nang lễ vật & bài khấn",
        icon: <Flower2 className="w-5 h-5 text-rose-500" />,
        action: () => {
          if (onGoToRituals) onGoToRituals();
          else onGoToExperience();
        },
      };
    }

    if (article.id === "le-via-ba-linh-son-thanh-mau") {
      return {
        type: "ritual" as const,
        tag: "CẨM NANG NGHI LỄ & VĂN KHẤN VÍA BÀ",
        badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        cardBg: "from-amber-500/10 via-surface to-surface border-amber-500/40",
        btnStyle: "bg-amber-600 hover:bg-amber-700 text-white",
        title: "Cẩm nang Nghi lễ Mộc Dục & Văn khấn Linh Sơn Thánh Mẫu",
        desc: "Chuẩn bị lễ vật thanh khiết dâng Bà Đen Tây Ninh, phép tắc chiêm bái và bài khấn nguyện gia đạo bình an, hanh thông.",
        actionLabel: "Xem cẩm nang nghi lễ",
        topButtonLabel: "Xem nghi thức & văn khấn Vía Bà",
        icon: <BookOpen className="w-5 h-5 text-amber-600" />,
        action: () => {
          if (onGoToRituals) onGoToRituals();
          else onGoToExperience();
        },
      };
    }

    if (article.id === "phu-tay-ho") {
      return {
        type: "ritual" as const,
        tag: "CẨM NANG NGHI LỄ & DÂNG HƯƠNG PHỦ TÂY HỒ",
        badgeStyle: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30",
        cardBg: "from-rose-500/10 via-surface to-surface border-rose-500/40",
        btnStyle: "bg-rose-600 hover:bg-rose-700 text-white",
        title: "Nghi thức Chiêm bái & Văn khấn Mẫu Liễu Hạnh Phủ Tây Hồ",
        desc: "Hướng dẫn sắm lễ chay tịnh, thứ tự dâng hương các ban và bài văn khấn cầu an lành, hanh thông bên sóng nước hồ Tây.",
        actionLabel: "Xem hướng dẫn dâng hương",
        topButtonLabel: "Xem nghi thức & văn khấn Phủ Tây Hồ",
        icon: <Flower2 className="w-5 h-5 text-rose-500" />,
        action: () => {
          if (onGoToRituals) onGoToRituals();
          else onGoToExperience();
        },
      };
    }

    if (article.id === "den-tran-nam-dinh") {
      return {
        type: "ritual" as const,
        tag: "CẨM NANG NGHI THỨC & HÀO KHÍ ĐÔNG A",
        badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        cardBg: "from-amber-600/10 via-surface to-surface border-amber-600/40",
        btnStyle: "bg-amber-700 hover:bg-amber-800 text-white",
        title: "Nghi thức Chiêm bái Tiền nhân & Văn khấn Đức Thánh Trần",
        desc: "Tìm hiểu ý nghĩa 'Tích Phúc Vô Cương', phép tắc dâng hương và bài khấn tri ân công đức tiền nhân vương triều Trần.",
        actionLabel: "Xem cẩm nang nghi lễ",
        topButtonLabel: "Xem nghi thức & văn khấn Đền Trần",
        icon: <BookOpen className="w-5 h-5 text-amber-600" />,
        action: () => {
          if (onGoToRituals) onGoToRituals();
          else onGoToExperience();
        },
      };
    }

    if (article.id === "neak-ta-khmer-nam-bo") {
      return {
        type: "ritual" as const,
        tag: "NGHI LỄ CÚNG XÓM ẤP & TÌNH LÀNG NGHĨA XÓM",
        badgeStyle: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
        cardBg: "from-emerald-500/10 via-surface to-surface border-emerald-500/40",
        btnStyle: "bg-emerald-600 hover:bg-emerald-700 text-white",
        title: "Nghi thức Cúng Néak Tà & Tấm lòng Tri ân Đất mẹ",
        desc: "Tìm hiểu lễ vật mộc mạc dâng Ông Tà (cốm dẹp, trái cây, bánh tét) và ý nghĩa gắn kết ba dân tộc Kinh - Khmer - Hoa.",
        actionLabel: "Xem phong tục cúng xóm ấp",
        topButtonLabel: "Xem nghi thức cúng Néak Tà",
        icon: <BookOpen className="w-5 h-5 text-emerald-600" />,
        action: () => {
          if (onGoToRituals) onGoToRituals();
          else onGoToExperience();
        },
      };
    }

    if (article.id === "dien-hon-chen") {
      return {
        type: "ritual" as const,
        tag: "NGHI LỄ DI SẢN & ĐIỂN TÍCH THÁNH MẪU",
        badgeStyle: "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30",
        cardBg: "from-purple-500/10 via-surface to-surface border-purple-500/40",
        btnStyle: "bg-purple-600 hover:bg-purple-700 text-white",
        title: "Nghi thức dâng hương Thánh Mẫu & Lễ rước trên sông Hương",
        desc: "Tìm hiểu trình tự nghi thức dâng hương Mẫu Thiên Y A Na, lễ nghinh rước thuyền bằng và văn hóa tâm linh xứ Huế.",
        actionLabel: "Xem nghi lễ dâng hương",
        topButtonLabel: "Xem nghi thức dâng hương Thánh Mẫu",
        icon: <Sparkles className="w-5 h-5 text-purple-500" />,
        action: () => {
          if (onGoToRituals) onGoToRituals();
          else onGoToExperience();
        },
      };
    }

    // 3. Nhóm bài về Điển tích & Đạo lý nhân sinh
    if (article.id === "tien-dung-chu-dong-tu") {
      return {
        type: "reflection" as const,
        tag: "GÓC CHIÊM NGHIỆM TÂM HỒN & ĐẠO HIẾU",
        badgeStyle: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30",
        cardBg: "from-teal-500/10 via-surface to-surface border-teal-500/40",
        btnStyle: "bg-teal-600 hover:bg-teal-700 text-white",
        title: "Lắng đọng tâm trạng & Chiêm nghiệm Đạo hiếu hôm nay",
        desc: "Từ tấm lòng hiếu thuận chí thành của chàng Chử, hãy dành một phút tĩnh lặng để lắng nghe tâm trạng bản thân và nhận một thông điệp bình an.",
        actionLabel: "Lắng nghe tâm trạng",
        topButtonLabel: "Chiêm nghiệm tâm trạng & đạo hiếu",
        icon: <Sparkles className="w-5 h-5 text-teal-500" />,
        action: onGoToMood,
      };
    }

    if (article.id === "bai-choi-hoi-an") {
      return {
        type: "reflection" as const,
        tag: "CHIÊM NGHIỆM VĂN HÓA DÂN GIAN ĐẤT QUẢNG",
        badgeStyle: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30",
        cardBg: "from-teal-500/10 via-surface to-surface border-teal-500/40",
        btnStyle: "bg-teal-600 hover:bg-teal-700 text-white",
        title: "Lắng nghe Điệu hò Bài Chòi & Gửi gắm Tâm sự",
        desc: "Thả mình vào khúc ca dao dí dỏm của Anh Hiệu, giải tỏa muộn phiền thường nhật và đón nhận một thông điệp an vui từ văn hóa phố Hội.",
        actionLabel: "Lắng nghe tâm trạng",
        topButtonLabel: "Chiêm nghiệm nhịp thở dân gian",
        icon: <Sparkles className="w-5 h-5 text-teal-500" />,
        action: onGoToMood,
      };
    }

    // 4. Mặc định theo phân loại văn hóa
    if (article.category === "Phong tục & Nghi lễ") {
      return {
        type: "ritual" as const,
        tag: "CẨM NANG NGHI LỄ DI SẢN",
        badgeStyle: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30",
        cardBg: "from-amber-500/10 via-surface to-surface border-amber-500/40",
        btnStyle: "bg-amber-600 hover:bg-amber-700 text-white",
        title: "Khám phá Cẩm nang Nghi lễ & Lời nguyện",
        desc: "Tra cứu các nghi lễ truyền thống, lời khấn và bài hướng dẫn chuẩn bị mâm lễ thanh tịnh.",
        actionLabel: "Xem cẩm nang nghi lễ",
        topButtonLabel: "Xem cẩm nang nghi lễ",
        icon: <BookOpen className="w-5 h-5 text-amber-600" />,
        action: () => {
          if (onGoToRituals) onGoToRituals();
          else onGoToExperience();
        },
      };
    }

    return {
      type: "reflection" as const,
      tag: "KHOẢNG NGHỈ TĨNH TẠI",
      badgeStyle: "bg-accent/10 text-accent border-accent/20",
      cardBg: "from-accent/10 via-surface to-surface border-accent/30",
      btnStyle: "bg-accent hover:bg-accent/90 text-white",
      title: "Lắng đọng tâm trạng & Chiêm nghiệm bài học di sản",
      desc: "Dành một khoảng tĩnh tại để gạn lọc âu lo, tiếp nhận nguồn năng lượng thuần hậu từ trang sử cha ông.",
      actionLabel: "Lắng nghe tâm trạng",
      topButtonLabel: "Chiêm nghiệm tâm trạng",
      icon: <Sparkles className="w-5 h-5 text-accent" />,
      action: onGoToMood,
    };
  }, [article, onGoToRegionalExperience, onGoToRituals, onGoToExperience, onGoToMood]);

  return (
    <div className="screen-shell relative">
      {/* Top Reading Progress Bar */}
      <div
        className="fixed top-0 left-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 z-50 transition-all duration-150 shadow-[0_0_8px_rgba(234,179,8,0.6)]"
        style={{ width: `${readingProgress}%` }}
        aria-hidden="true"
      />

      <main className="page-container max-w-5xl pt-4 pb-20">
        {/* Breadcrumb & Navigation Bar */}
        <div className="flex items-center justify-between gap-3 text-xs text-muted mb-6 pb-3 border-b border-line/40">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onBackToCulture}
              className="hover:text-accent cursor-pointer transition-colors flex items-center gap-1 font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Khám phá văn hóa</span>
            </button>
            <span className="text-muted/60">›</span>
            <span className="text-muted font-medium">{article.region}</span>
            <span className="text-muted/60">›</span>
            <span className="text-accent font-semibold truncate max-w-[240px] sm:max-w-md">
              {article.title}
            </span>
          </div>
        </div>

        {/* Article Meta Badges Header */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge
            variant="terracotta"
            className="px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-accent/10 text-accent border border-accent/20 rounded-full"
          >
            {article.region}
          </Badge>

          <Badge
            variant="secondary"
            className="px-3 py-1 text-xs font-medium bg-surface text-ink border border-line rounded-full"
          >
            {article.category}
          </Badge>

          <div className="flex items-center gap-1.5 text-xs text-muted ml-1 bg-surface-soft px-2.5 py-1 rounded-full border border-line/40">
            <Clock className="w-3.5 h-3.5 text-accent" />
            <span>Thời lượng đọc: {article.readingTime}</span>
          </div>

        </div>

        {/* Magazine Main Title */}
        <h1
          tabIndex={-1}
          className="page-title mb-5 font-display text-3xl sm:text-4xl md:text-[42px] leading-[1.25] font-bold text-ink outline-none"
        >
          {article.title}
        </h1>

        {/* Subtitle / Excerpt Lead */}
        <p className="text-lg sm:text-xl text-muted font-normal leading-relaxed max-w-3xl mb-6">
          {article.subtitle}
        </p>

        {/* Bookmark Action */}
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-line/50">
          <ReadingBookmarkButton
            key={`${currentUserEmail || "guest"}:${article.id}`}
            kind="culture"
            id={article.id}
            email={currentUserEmail}
            title={article.title}
          />
        </div>

        {canShowArticleImage(article) && <ScrollReveal variant="scale" className="mb-12">
          <div className="rounded-3xl overflow-hidden bg-surface border-2 border-line/60 shadow-md relative group">
            <div className="relative h-60 sm:h-96 md:h-[440px] overflow-hidden bg-surface-soft">
              <UnverifiedImage
                src={article.image}
                approvedByContent={canShowArticleImage(article) && article.metadata?.editorialStatus === "approved" && Boolean(article.metadata?.imageSource?.trim() && article.metadata?.imageRightsBasis?.trim() && article.metadata?.usageRights)}
                alt={article.caption || article.title}
                title={article.title}
                description={article.caption}
                allowExpand={true}
                className="w-full h-full object-cover object-[center_30%]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />
            </div>
          </div>
        </ScrollReveal>}

        {/* Mobile Quick Table of Contents Drawer */}
        <details
          key={`mobile-toc-${article.id}`}
          className="group lg:hidden mb-8 rounded-2xl border border-line bg-surface/90 shadow-sm"
        >
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 p-4 rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
            <div className="flex items-center gap-2 text-sm font-semibold text-ink">
              <BookOpen className="w-4 h-4 text-accent" />
              <span>Mục lục bài viết ({article.sections.length} phần)</span>
            </div>
            <ChevronDown
              className="w-4 h-4 text-muted transition-transform group-open:rotate-180"
              aria-hidden="true"
            />
          </summary>

          <nav
            aria-label="Mục lục bài viết trên điện thoại"
            className="px-4 pb-4 space-y-1.5"
          >
            {article.sections.map((section, index) => (
              <button
                key={section.id}
                type="button"
                onClick={() => scrollToSection(section.id)}
                className={`flex min-h-11 w-full items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  activeSectionId === section.id
                    ? "bg-accent/15 text-accent font-semibold"
                    : "text-ink hover:bg-surface-soft hover:text-accent"
                }`}
              >
                <span className="text-accent shrink-0 font-bold">
                  0{index + 1}.
                </span>
                <span>
                  {section.title.replace(/^\d+\.\s*/, "")}
                </span>
              </button>
            ))}

          </nav>
        </details>

        {/* Two Column Layout: Main Body (8 cols) & Sticky Sidebar (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
          {/* Main Article Content (8 columns) */}
          <div className="lg:col-span-8 space-y-12">
            {article.sections.map((section, idx) => (
              <ScrollReveal
                key={section.id}
                id={section.id}
                tabIndex={-1}
                as="section"
                variant="up"
                className="scroll-mt-28 space-y-5"
              >
                {/* Section Header */}
                <div className="flex items-center gap-3 pb-3 border-b-2 border-line/60">
                  <span className="w-8 h-8 rounded-full bg-accent/15 text-accent font-bold text-sm flex items-center justify-center shrink-0">
                    0{idx + 1}
                  </span>
                  <h2 className="section-title text-2xl sm:text-[26px] font-bold text-ink leading-snug">
                    {section.title.replace(/^\d+\.\s*/, "")}
                  </h2>
                </div>

                {/* Section Paragraphs with Drop Cap for Section 1 first paragraph */}
                <div className="space-y-4 text-ink font-normal text-[17px] sm:text-[18px] leading-[1.9]">
                  {section.paragraphs.map((para, pIdx) => {
                    const isDropCap = idx === 0 && pIdx === 0;
                    return (
                      <p
                        key={pIdx}
                        className={
                          isDropCap
                            ? "first-letter:text-5xl first-letter:font-bold first-letter:font-display first-letter:text-accent first-letter:mr-3 first-letter:float-left first-letter:leading-none text-justify"
                            : "text-justify"
                        }
                      >
                        {para}
                      </p>
                    );
                  })}
                </div>

                {/* Highlight Pull-Quote Box */}
                {section.quote && (
                  <div className="my-8 p-6 sm:p-7 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border-l-4 border-amber-500 shadow-xs relative overflow-hidden">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-3">
                      <Flower2 className="w-4 h-4 text-amber-500" />
                      <span>Ý niệm cổ phong & Điểm nhấn văn hóa</span>
                    </div>
                    <blockquote className="font-display italic font-semibold text-lg sm:text-xl text-ink leading-relaxed">
                      “{section.quote}”
                    </blockquote>
                  </div>
                )}

                {/* Practical Interactive Cards (Section 03) */}
                {section.practicalCards && section.practicalCards.length > 0 && (
                  <div className="mt-8 pt-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="font-display font-bold text-lg text-ink">
                        Gợi ý chiêm nghiệm & Nếp thực hành thực tế
                      </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {section.practicalCards.map((card, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-5 rounded-2xl bg-surface border border-line/80 hover:border-accent/40 shadow-xs transition-all duration-300 flex flex-col justify-between group"
                        >
                          <div>
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-accent group-hover:scale-125 transition-transform" />
                              <h4 className="font-display font-bold text-base text-ink group-hover:text-accent transition-colors">
                                {card.title}
                              </h4>
                            </div>
                            <p className="text-sm text-muted leading-relaxed">
                              {card.desc}
                            </p>
                          </div>
                          <div className="mt-4 pt-3 border-t border-line/40 flex items-center justify-between text-[11px] text-muted">
                            <span className="uppercase font-semibold tracking-wider text-accent/80">
                              Thực hành nếp nhà
                            </span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-accent/60" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </ScrollReveal>
            ))}

            {/* Audio Recording Library if available */}
            {article.audioRecordingIds !== undefined && (
              <ScrollReveal variant="up" className="pt-4">
                <ChauVanAudioLibrary
                  key={article.id}
                  recordingIds={article.audioRecordingIds}
                />
              </ScrollReveal>
            )}

            {/* Contextual Bridge Card */}
            <ScrollReveal variant="scale">
              <div className={`p-6 sm:p-7 rounded-3xl bg-gradient-to-br ${contextBridge.cardBg} border-2 shadow-md`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      {contextBridge.icon}
                      <span className={`text-xs uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${contextBridge.badgeStyle}`}>
                        {contextBridge.tag}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-xl text-ink">
                      {contextBridge.title}
                    </h3>
                    <p className="text-sm text-muted max-w-xl">
                      {contextBridge.desc}
                    </p>
                  </div>

                  <Button
                    variant="default"
                    size="pill"
                    onClick={contextBridge.action}
                    className={`${contextBridge.btnStyle} shrink-0 gap-2 shadow-md cursor-pointer`}
                  >
                    <span>{contextBridge.actionLabel}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </ScrollReveal>


            {/* Navigation Action Buttons Row */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-line">
              <Button
                variant="outline"
                size="pill"
                onClick={onBackToCulture}
                className="w-full sm:w-auto gap-2 text-sm border-line text-muted hover:text-accent cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Quay lại Khám phá văn hóa</span>
              </Button>

              <Button
                variant="default"
                size="pill"
                onClick={onGoToExperience}
                className="w-full sm:w-auto gap-2 text-sm shadow-sm cursor-pointer"
              >
                <span>Về Trung tâm trải nghiệm</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Sticky Sidebar (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            <ScrollReveal variant="fade" delay={120} className="sticky top-24 space-y-6">
              {/* Sticky Table of Contents Card */}
              <Card className="hidden lg:block p-6 rounded-3xl bg-surface border border-line/80 shadow-xs">
                <div className="flex items-center justify-between gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-4 pb-2 border-b border-line/40">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>Mục lục</span>
                  </div>
                  <span className="text-[11px] text-muted font-normal">
                    Đã đọc {Math.round(readingProgress)}%
                  </span>
                </div>

                <nav aria-label="Mục lục bài viết" className="space-y-1.5">
                  {article.sections.map((section, idx) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full text-left text-sm min-h-10 py-2 px-3 rounded-xl transition-all flex items-start gap-2.5 cursor-pointer ${
                        activeSectionId === section.id
                          ? "bg-accent/15 text-accent font-semibold shadow-2xs translate-x-1"
                          : "text-muted hover:text-ink hover:bg-surface-soft"
                      }`}
                    >
                      <span className="text-accent font-sans tabular-nums text-xs font-bold mt-0.5">
                        0{idx + 1}.
                      </span>
                      <span className="line-clamp-2">
                        {section.title.replace(/^\d+\.\s*/, "")}
                      </span>
                    </button>
                  ))}

                </nav>
              </Card>

              {/* Cultural Map Shortcut Box */}
              <Card
                onClick={onGoToCultureMap}
                className="p-6 rounded-3xl bg-surface border border-line shadow-xs text-center hover:border-accent/50 hover:shadow-md transition-all duration-300 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3 group-hover:scale-110 group-hover:bg-accent/20 transition-all duration-300">
                  <Compass className="w-6 h-6 opacity-90" />
                </div>
                <h4 className="font-display font-bold text-base text-ink mb-1 group-hover:text-accent transition-colors">
                  Bản đồ di sản văn hóa
                </h4>
                <p className="text-xs text-muted mb-4 leading-relaxed">
                  Xem tọa độ và phân bổ tín ngưỡng khắp 63 tỉnh thành Việt Nam.
                </p>
                <Button
                  variant="outline"
                  size="pill"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onGoToCultureMap) {
                      onGoToCultureMap();
                    }
                  }}
                  className="w-full text-xs font-semibold border-line cursor-pointer group-hover:border-accent group-hover:bg-accent group-hover:text-white transition-all"
                >
                  Mở bản đồ văn hóa
                </Button>
              </Card>
            </ScrollReveal>
          </div>
        </div>

        {/* Bottom Related Articles Section */}
        {relatedArticles.length > 0 && (
        <ScrollReveal variant="up" className="pt-12 border-t-2 border-line/60">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 mb-8">
            <div>
              <div className="text-xs uppercase tracking-widest text-accent font-bold mb-1 flex items-center gap-1.5">
                <Flower2 className="w-3.5 h-3.5 text-amber-500" />
                <span>TẬP TUYỂN THƯ TỊCH DÂN GIAN</span>
              </div>
              <h3 className="font-display font-bold text-2xl sm:text-3xl text-ink">
                Các chuyên khảo liên quan
              </h3>
            </div>

            <button
              onClick={onBackToCulture}
              className="text-xs font-semibold text-accent hover:underline flex items-center gap-1 cursor-pointer self-start sm:self-auto"
            >
              <span>Xem tất cả bài viết</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((rel) => (
              <Card
                key={rel.id}
                aria-label={`Đọc bài: ${rel.title}`}
                onClick={() => onSelectRelatedArticle(rel.id)}
                className="rounded-3xl overflow-hidden bg-surface border border-line hover:border-accent/50 hover:shadow-lg transition-all duration-300 flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="relative h-48 overflow-hidden bg-surface-soft">
                    {canShowArticleImage(rel) ? (
                      <img
                        src={rel.image}
                        alt={rel.caption || rel.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="grid h-full place-items-center bg-surface-soft text-sm text-muted">Ảnh chưa có hồ sơ sử dụng.</div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-xs font-semibold text-white">
                        {rel.region}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-xs text-white/90">
                        {rel.category}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <h4 className="font-display font-bold text-base text-ink leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-2">
                      {rel.title}
                    </h4>
                    <p className="text-sm text-muted line-clamp-2 leading-relaxed">
                      {rel.excerpt}
                    </p>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-line/60 flex items-center justify-between text-xs text-muted">
                  <span className="text-xs italic text-muted">Thời lượng: {rel.readingTime}</span>
                  <span className="text-accent font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    <span>Đọc bài viết</span>
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </ScrollReveal>
        )}
      </main>
    </div>
  );
};

export const CultureDetailScreen: React.FC<
  CultureDetailScreenProps
> = (props) => {
  const articleId = props.articleId ?? "dinh-lang-bac-bo";

  const [article, setArticle] = useState<
    CultureArticle | undefined
  >();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;

    setLoading(true);
    setLoadError("");
    setNotFound(false);
    setArticle(undefined);

    if (isDemoMode()) {
      void loadCultureArticles()
        .then((items) => {
          if (!active) return;
          const item = items.find((candidate) => candidate.id === articleId);
          if (item) setArticle(toCultureArticle(item));
          else {
            setNotFound(true);
            setLoadError("Bài viết này chưa có trong dữ liệu minh họa.");
          }
        })
        .catch(() => {
          if (active) setLoadError("Chưa tải được bài viết minh họa.");
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => { active = false; };
    }

    void apiRequest<RemoteContentItem>(
      `/content/culture/${encodeURIComponent(articleId)}`,
    )
      .then((item) => {
        if (!active) return;

        setArticle(toCultureArticle(item));
      })
      .catch((cause: unknown) => {
        if (!active) return;

        const unavailable =
          cause instanceof ApiError &&
          cause.status === 404;

        setNotFound(unavailable);

        setLoadError(
          unavailable
            ? "Bài viết này không còn được phát hành hoặc đường dẫn không tồn tại."
            : "Chưa tải được bài viết. Bạn hãy kiểm tra kết nối rồi thử lại.",
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
  }, [articleId, loadAttempt]);

  if (loading) {
    return (
      <div className="screen-shell">
        <main className="page-container">
          <p role="status" className="p-8 text-center">
            Đang tải bài viết…
          </p>
        </main>
      </div>
    );
  }

  if (!article && notFound) {
    return (
      <DetailNotFound
        title={loadError}
        backLabel="Về Khám phá văn hóa"
        onBack={props.onBackToCulture}
      />
    );
  }

  if (!article) {
    return (
      <div className="screen-shell">
        <main className="page-container max-w-3xl">
          <section className="rounded-2xl border border-line bg-surface p-6 sm:p-8">
            <h1 className="page-title mb-3">
              Chưa tải được bài viết
            </h1>

            <p
              role="alert"
              className="text-sm leading-relaxed text-muted"
            >
              {loadError || "Đã xảy ra lỗi khi tải bài viết."}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={() => {
                  setLoadAttempt((value) => value + 1);
                }}
              >
                Tải lại
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={props.onBackToCulture}
              >
                Về danh sách bài viết
              </Button>
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <CultureDetailContent
      {...props}
      articleId={articleId}
      resolvedArticle={article}
      key={articleId}
    />
  );
};
