import React from "react";
import { Bell, BookOpen, CalendarDays, Compass, Heart, Map, Settings, Sparkles, UserRound, UsersRound } from "lucide-react";
import type { NavScreen } from "./AppHeader";

type Props = {
  area: "account" | "discover";
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  user?: { name: string; email: string } | null;
};

const groups: Record<Props["area"], { title: string; links: { label: string; screen: NavScreen; icon: React.ElementType }[] }[]> = {
  account: [
    { title: "TÀI KHOẢN", links: [
      { label: "Tổng quan", screen: "account", icon: UserRound },
      { label: "Hành trình cảm xúc", screen: "mood-journey", icon: Heart },
    ] },
    { title: "CÁ NHÂN", links: [
      { label: "Hội viên", screen: "membership", icon: UsersRound },
      { label: "Nhắc lịch", screen: "notifications", icon: Bell },
      { label: "Cài đặt", screen: "settings", icon: Settings },
    ] },
  ],
  discover: [
    { title: "VĂN HÓA", links: [
      { label: "Bài viết văn hóa", screen: "culture", icon: BookOpen },
      { label: "Bản đồ văn hóa", screen: "culture-map", icon: Map },
      { label: "Theo vùng miền", screen: "region-culture", icon: Compass },
    ] },
    { title: "NGHI LỄ & LỊCH", links: [
      { label: "Cẩm nang nghi lễ", screen: "rituals", icon: Sparkles },
      { label: "Lịch văn hóa", screen: "calendar", icon: CalendarDays },
      { label: "Ngày tốt cá nhân", screen: "good-days", icon: CalendarDays },
    ] },
  ],
};

const settingsSections = [
  { label: "Hồ sơ cá nhân", id: "settings-profile" },
  { label: "Tùy biến trải nghiệm", id: "settings-experience" },
  { label: "Thông báo & nhắc lịch", id: "settings-notifications" },
  { label: "Dữ liệu & quyền riêng tư", id: "settings-data" },
];

export const AppSectionSidebar: React.FC<Props> = ({ area, currentScreen, onNavigate, user }) => (
  <aside className="app-section-sidebar" aria-label={area === "account" ? "Điều hướng Góc của tôi" : "Điều hướng Khám phá"}>
    <nav className="app-section-sidebar__nav" aria-label={area === "account" ? "Các mục tài khoản" : "Các mục khám phá"}>
      {groups[area].map((group) => (
        <div className="app-section-sidebar__group" key={group.title}>
          <h2>{group.title}</h2>
          {group.links.map(({ label, screen, icon: Icon }) => (
            <button
              key={screen}
              type="button"
              className="app-section-sidebar__link"
              aria-current={currentScreen === screen ? "page" : undefined}
              onClick={() => onNavigate(screen)}
            >
              <Icon aria-hidden="true" />
              <span>{label}</span>
              {currentScreen === screen && <i aria-hidden="true" />}
            </button>
          ))}
        </div>
      ))}
      {currentScreen === "settings" && (
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
        <button type="button" className="app-section-sidebar__profile" onClick={() => onNavigate("account")}>
          <span className="app-section-sidebar__avatar">{(user?.name || "A").slice(0, 1).toUpperCase()}</span>
          <span><strong>{user?.name || "Góc cá nhân"}</strong><small>Thông tin tài khoản</small></span>
        </button>
      ) : (
        <button type="button" className="app-section-sidebar__back" onClick={() => onNavigate("experience")}>
          <Compass aria-hidden="true" /><span>Về Trải nghiệm</span>
        </button>
      )}
    </div>
  </aside>
);
