import React, { useEffect } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  Compass,
  Crown,
  Flower2,
  Heart,
  Home,
  Landmark,
  Map,
  Music2,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  ScrollText,
  Settings,
  Sparkles,
  Sun,
  UserRound,
  UsersRound,
  Waves,
  Wind,
} from "lucide-react";
import type { NavScreen } from "./AppHeader";

type Props = {
  area: "account" | "discover" | "experience";
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  user?: { name: string; email: string } | null;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
};

type SidebarLink = {
  label: string;
  screen: NavScreen;
  icon: React.ElementType;
  activeScreens?: NavScreen[];
};

const groups: Record<Props["area"], { title: string; links: SidebarLink[] }[]> = {
  account: [
    { title: "TÀI KHOẢN", links: [
      { label: "Tổng quan", screen: "account", icon: UserRound },
      { label: "Hành trình cảm xúc", screen: "mood-journey", icon: Heart },
    ] },
    { title: "CÁ NHÂN", links: [
      { label: "Gói hội viên", screen: "membership", icon: Crown },
      { label: "Nhắc lịch", screen: "notifications", icon: Bell },
      { label: "Cài đặt", screen: "settings", icon: Settings },
    ] },
  ],
  discover: [
    { title: "VĂN HÓA", links: [
      { label: "Bài viết văn hóa", screen: "culture", icon: BookOpen, activeScreens: ["culture-detail"] },
      { label: "Bản đồ di sản ba miền", screen: "culture-map", icon: Map, activeScreens: ["region-culture"] },
      { label: "Hát chầu văn", screen: "chau-van", icon: Music2 },
      { label: "Tín ngưỡng biển miền Trung", screen: "sea-prayer", icon: Waves },
      { label: "Văn hóa Nam Bộ", screen: "southern-culture", icon: Flower2 },
    ] },
    { title: "NGHI LỄ & LỊCH", links: [
      { label: "Cẩm nang nghi lễ", screen: "rituals", icon: Sparkles, activeScreens: ["ritual-detail"] },
      { label: "Lịch văn hóa", screen: "calendar", icon: CalendarDays, activeScreens: ["calendar", "calendar-detail"] },
      { label: "Kế hoạch ngày dự định", screen: "good-days", icon: Sun },
    ] },
  ],
  experience: [
    { title: "TĨNH TÂM & NGUYỆN ƯỚC", links: [
      { label: "Thiền ngắn an tịnh", screen: "zen", icon: Wind },
      { label: "Lời nguyện hoa đăng", screen: "wish", icon: PenLine },
      { label: "Một lời biết ơn", screen: "gratitude", icon: Heart },
    ] },
    { title: "CHIÊM NGHIỆM DÂN GIAN", links: [
      { label: "Xin keo âm dương", screen: "xinkeo", icon: Compass },
      { label: "Xin xăm", screen: "xinxam", icon: ScrollText },
      { label: "Xem tử vi", screen: "astrology", icon: Sparkles },
    ] },
    { title: "GIA TIÊN & TƯỞNG NHỚ", links: [
      { label: "Không gian gia tiên", screen: "ancestor-altar", icon: Landmark, activeScreens: ["ancestor-altar", "sanctuary"] },
    ] },
  ],
};

const settingsSections = [
  { label: "Hồ sơ cá nhân", id: "settings-profile" },
  { label: "Tùy biến trải nghiệm", id: "settings-experience" },
  { label: "Thông báo & nhắc lịch", id: "settings-notifications" },
  { label: "Dữ liệu & quyền riêng tư", id: "settings-data" },
];

const areaLabels: Record<Props["area"], { aside: string; nav: string }> = {
  account: { aside: "Điều hướng Góc của tôi", nav: "Các mục tài khoản" },
  discover: { aside: "Điều hướng Khám phá", nav: "Các mục khám phá" },
  experience: { aside: "Điều hướng Trải nghiệm", nav: "Các trải nghiệm" },
};

export const AppSectionSidebar: React.FC<Props> = ({
  area,
  currentScreen,
  onNavigate,
  user,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  useEffect(() => {
    if (!onToggleCollapse) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        onToggleCollapse();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onToggleCollapse]);

  return (
    <aside
      className={`app-section-sidebar ${isCollapsed ? "app-section-sidebar--collapsed" : ""}`}
      aria-label={areaLabels[area].aside}
    >
      <div className="app-section-sidebar__header">
        {!isCollapsed ? (
          <div className="app-section-sidebar__header-title">
            <span className="app-section-sidebar__header-indicator" aria-hidden="true" />
            <span className="app-section-sidebar__header-text">
              {area === "experience"
                ? "Trải nghiệm"
                : area === "discover"
                ? "Khám phá"
                : "Góc cá nhân"}
            </span>
          </div>
        ) : (
          <div className="app-section-sidebar__header-collapsed-dot" aria-hidden="true" />
        )}
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="app-section-sidebar__toggle"
            title={isCollapsed ? "Mở rộng thanh điều hướng (Ctrl+B)" : "Thu gọn thanh điều hướng (Ctrl+B)"}
            aria-label={isCollapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <nav className="app-section-sidebar__nav" aria-label={areaLabels[area].nav}>
        {groups[area].map((group) => (
          <div className="app-section-sidebar__group" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(({ label, screen, icon: Icon, activeScreens }) => {
              const active = screen === currentScreen || activeScreens?.includes(currentScreen);

              return (
                <button
                  key={screen}
                  type="button"
                  className="app-section-sidebar__link"
                  aria-current={active ? "page" : undefined}
                  title={label}
                  onClick={() => onNavigate(screen)}
                >
                  <Icon aria-hidden="true" />
                  <span className="app-section-sidebar__link-text">{label}</span>
                  {active && <i aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        ))}
        {currentScreen === "settings" && !isCollapsed && (
          <div className="app-section-sidebar__subnav" aria-label="Các mục cài đặt">
            <h2>TRONG CÀI ĐẶT</h2>
            {settingsSections.map(({ label, id }) => (
              <a key={id} href={`#${id}`} className="app-section-sidebar__section-link">{label}</a>
            ))}
          </div>
        )}
      </nav>
      <div className="app-section-sidebar__bottom">
        {area === "account" ? (
          <button
            type="button"
            className="app-section-sidebar__profile"
            onClick={() => onNavigate("account")}
            title={user?.name || "Góc cá nhân"}
          >
            <span className="app-section-sidebar__avatar">{(user?.name || "A").slice(0, 1).toUpperCase()}</span>
            <span className="app-section-sidebar__profile-text">
              <strong>{user?.name || "Góc cá nhân"}</strong>
              <small>Thông tin tài khoản</small>
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="app-section-sidebar__back group"
            onClick={() => onNavigate("today")}
            title="Quay về Trang chủ"
          >
            <Home className="transition-transform duration-200 group-hover:scale-125 group-active:scale-95" aria-hidden="true" />
            <span className="font-semibold transition-colors duration-200 app-section-sidebar__back-text">Về Trang chủ</span>
          </button>
        )}
      </div>
    </aside>
  );
};
