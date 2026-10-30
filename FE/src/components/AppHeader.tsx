import React, { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Menu, Moon, ShieldCheck, Sun, X } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { ProfileAvatar } from "./ProfileAvatar";

export type NavScreen =
  | "guest"
  | "today"
  | "mood"
  | "loading"
  | "result"
  | "account"
  | "culture"
  | "culture-detail"
  | "rituals"
  | "ritual-detail"
  | "calendar"
  | "calendar-detail"
  | "experience"
  | "sanctuary"
  | "ancestor-altar"
  | "culture-map"
  | "region-culture"
  | "chau-van"
  | "sea-prayer"
  | "southern-culture"
  | "mood-journey"
  | "notifications"
  | "xinxam"
  | "wish"
  | "zen"
  | "gratitude"
  | "saved"
  | "login"
  | "register"
  | "forgot"
  | "reset-password"
  | "xinkeo"
  | "good-days"
  | "horoscope"
  | "astrology"
  | "membership"
  | "about"
  | "settings";

interface AppHeaderProps {
  currentScreen: NavScreen;
  onNavigate: (screen: NavScreen) => void;
  dark?: boolean;
  onToggleDark?: () => void;
  onLoginClick?: () => void;
  user?: { name: string; email: string; role?: string } | null;
  onLogout?: () => void;
  demoMode?: boolean;
}

const navItems: { label: string; target: NavScreen; screens: NavScreen[] }[] = [
  { label: "Trang chủ", target: "today", screens: ["today", "mood", "loading", "result", "saved"] },
  { label: "Trải nghiệm", target: "experience", screens: ["experience", "xinxam", "wish", "zen", "gratitude", "xinkeo", "horoscope", "astrology", "sanctuary", "ancestor-altar"] },
  { label: "Khám phá", target: "culture", screens: ["culture", "culture-detail", "culture-map", "region-culture", "chau-van", "sea-prayer", "southern-culture", "rituals", "ritual-detail", "calendar", "calendar-detail", "good-days"] },
  { label: "Về chúng tôi", target: "about", screens: ["about"] },
  { label: "Gói hội viên", target: "membership", screens: ["membership"] },
];

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentScreen,
  onNavigate,
  dark = false,
  onToggleDark,
  onLoginClick,
  user,
  onLogout,
  demoMode = false,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [currentScreen]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");

    const closeOnDesktop = () => {
      if (desktop.matches) {
        setMobileMenuOpen(false);
      }
    };

    closeOnDesktop();
    desktop.addEventListener("change", closeOnDesktop);

    return () => {
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, []);
  const closeMenu = () => setMobileMenuOpen(false);
  const goTo = (screen: NavScreen) => {
    onNavigate(screen);
    closeMenu();
  };
  const isAdmin = user?.role?.toUpperCase() === "ADMIN";
  const isEditor = user?.role?.toUpperCase() === "EDITOR";
  const workspaceHref = isAdmin ? "/admin" : "/editor";
  const workspaceLabel = isAdmin ? "Vào Cổng Quản Trị (ADMIN)" : "Không gian biên tập";

  const renderNavigation = (mobile = false) => (
    <nav className={mobile ? "mobile-menu" : "primary-nav"} aria-label="Điều hướng chính" data-open={mobile ? mobileMenuOpen : undefined}>
      {navItems.map((item) => {
        const active = item.screens.includes(currentScreen);
        return (
          <button
            key={item.target}
            type="button"
            className={`nav-link${item.target === "membership" ? " nav-link--offer" : ""}`}
            aria-current={
              currentScreen === item.target
                ? "page"
                : active
                  ? "location"
                  : undefined
            }
            onClick={() => goTo(item.target)}
          >
            {item.label}
          </button>
        );
      })}
      {mobile && !user && !demoMode && (
        <Button
          variant="default"
          className="mt-2 w-full"
          onClick={() => {
            (onLoginClick || (() => onNavigate("login")))();
            closeMenu();
          }}
        >
          Đăng nhập
        </Button>
      )}
      {mobile && (isAdmin || isEditor) && (
        <a
          href={workspaceHref}
          className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl font-serif text-xs font-semibold text-amber-900 dark:text-amber-200 bg-amber-400/20 border border-amber-500/50 shadow-sm"
          onClick={closeMenu}
        >
          <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <span>{workspaceLabel}</span>
        </a>
      )}
      {mobile && user && onLogout && (
        <Button variant="ghost" className="mt-2 w-full justify-start" onClick={() => { onLogout(); closeMenu(); }}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
          Đăng xuất
        </Button>
      )}
    </nav>
  );

  return (
    <header className="site-header" onKeyDown={(event) => {
      if (event.key === "Escape" && mobileMenuOpen) {
        closeMenu();
        menuButtonRef.current?.focus();
      }
    }}>
      <div className="site-header__inner">
        <button
          type="button"
          onClick={() => goTo("guest")}
          className="brand-link"
          aria-label="Tin Lắm Tâm Linh — về trang chủ"
        >
          <span className="brand-mark">
            <img src="/logo.png" alt="" />
          </span>
          <span className="min-w-0">
            <span className="brand-name">Tin Lắm Tâm Linh</span>
            <span className="brand-caption">Vạn Sự Tùy Duyên</span>
          </span>
        </button>

        {renderNavigation()}

        <div className="header-actions">
          <button
            type="button"
            className="icon-control"
            onClick={onToggleDark}
            aria-label={dark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
            title={dark ? "Chuyển sang Màu Be (Ban Ngày)" : "Chuyển sang Màu Đỏ (Ban Đêm)"}
          >
            {dark ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
          </button>

          {(isAdmin || isEditor) && (
            <a
              href={workspaceHref}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-serif text-xs font-semibold text-amber-950 dark:text-amber-200 bg-amber-400/20 hover:bg-amber-400/35 border border-amber-500/50 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              title={workspaceLabel}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
              <span>{isAdmin ? "Cổng Quản Trị" : "Không gian biên tập"}</span>
            </a>
          )}

          {user ? (
            <>
              <button
                type="button"
                className="header-account inline-flex min-h-9 max-w-48 items-center gap-2 rounded-full border border-line/60 bg-surface/70 px-2.5 py-1 text-xs font-semibold text-ink hover:border-accent/40 hover:bg-surface-soft transition-all"
                onClick={() => goTo("account")}
                title={`Tài khoản: ${user.name}`}
                aria-label={`Mở Góc của tôi — ${user.name}`}
              >
                <ProfileAvatar
                  email={user?.email}
                  name={user?.name}
                  className="h-6 w-6 border border-line text-[11px]"
                />
                <span className="hidden truncate sm:inline">{user.name}</span>
                <ChevronDown className="h-3 w-3 text-muted shrink-0" aria-hidden="true" />
              </button>
              {onLogout && (
                <button type="button" className="icon-control hidden sm:inline-grid" onClick={onLogout} aria-label="Đăng xuất" title="Đăng xuất">
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </>
          ) : demoMode ? (
            <button
              type="button"
              className="hidden sm:inline-flex min-h-10 items-center rounded-full border border-amber-400/40 px-3 text-xs font-semibold text-amber-200"
              onClick={() => goTo("account")}
            >
              Bản demo
            </button>
          ) : (
            <button
              type="button"
              className="hidden sm:inline-flex items-center gap-1.5 px-4.5 py-1.5 rounded-full font-serif text-xs font-semibold tracking-wide text-[#fffaf3] bg-gradient-to-r from-[#8f202b] via-[#a32734] to-[#781721] hover:from-[#a32734] hover:via-[#b82e3c] hover:to-[#8f202b] border border-amber-300/60 shadow-[0_2px_10px_rgba(143,32,43,0.28)] hover:shadow-[0_4px_16px_rgba(143,32,43,0.42)] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
              onClick={onLoginClick || (() => onNavigate("login"))}
            >
              <span>Đăng nhập</span>
            </button>
          )}

          <button
            ref={menuButtonRef}
            type="button"
            className="icon-control xl:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-primary-navigation"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div id="mobile-primary-navigation" className={mobileMenuOpen ? "xl:hidden" : "hidden xl:hidden"}>
        {renderNavigation(true)}
      </div>
    </header>
  );
};
