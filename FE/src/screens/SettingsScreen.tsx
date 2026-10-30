import { toast } from "../components/ui/Toast";
import React, { useState, useEffect } from "react";
import {
  User,
  Sun,
  Moon,
  Monitor,
  Bell,
  Trash2,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Camera,
  Edit2,
  Check,
  AlertTriangle,
  Lock,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import { Card } from "@/src/components/ui/card";
import type { ThemePreference } from "../hooks/useTheme";
import { CULTURAL_TOPICS } from "../data/culturalTopics";
import { AppDialog } from "../components/AppDialog";
import type { UserSettings } from "../data/userService";
import { hasProductAnalyticsConsent, setProductAnalyticsConsent, trackProductEvent } from "../data/productAnalytics";

import { PushNotificationSettings } from "../components/PushNotificationSettings";

interface SettingsScreenProps {
  onBackToAccount: () => void;
  onGoToHome: () => void;
  themePreference: ThemePreference;
  onChangeTheme: (theme: ThemePreference) => Promise<boolean>;
  selectedTopics: string[];
  onChangeTopics: (topics: string[]) => Promise<boolean>;
  userSettings: UserSettings;
  onChangeNotifications: (
    notifications: Pick<UserSettings, "emailNotifications" | "pushNotifications">
  ) => Promise<boolean>;
  user?: { name: string; email: string } | null;
  onUpdateProfile?: (
    updated: { name: string; email?: string }
  ) => Promise<boolean>;
  onLogout?: () => void;
  onClearAllLocalData?: () => boolean | Promise<boolean>;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onBackToAccount,
  onGoToHome,
  themePreference,
  onChangeTheme,
  selectedTopics,
  onChangeTopics,
  userSettings,
  onChangeNotifications,
  user,
  onUpdateProfile,
  onLogout,
  onClearAllLocalData,
}) => {
  const [analyticsConsent, setAnalyticsConsent] = useState(hasProductAnalyticsConsent);

  // Profile Edit State
  const [displayName, setDisplayName] = useState(user?.name || "An Nhiên");
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState(displayName);
  const [nameSaveError, setNameSaveError] = useState("");
  const [isSavingName, setIsSavingName] = useState(false);

  // Đồng bộ displayName khi user prop từ App thay đổi
  useEffect(() => {
    if (user?.name) {
      setDisplayName(user.name);
      setTempName(user.name);
    }
  }, [user?.name]);


  const [topicsSaveStatus, setTopicsSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const [settingsSaveStatus, setSettingsSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  useEffect(() => {
    setTopicsSaveStatus("idle");
  }, [user?.email]);

  // Modal confirm clear data
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dataClearedNotice, setDataClearedNotice] = useState(false);
  const [clearDataError, setClearDataError] = useState("");



  const handleSaveName = async () => {
    setNameSaveError("");

    const cleanName = tempName.trim();

    if (!cleanName) {
      setNameSaveError("Vui lòng nhập tên hiển thị.");
      return;
    }

    if (cleanName.length > 120) {
      setNameSaveError("Tên hiển thị tối đa 120 ký tự.");
      return;
    }

    setIsSavingName(true);
    let saved = false;

    try {
      saved = (await onUpdateProfile?.({ name: cleanName })) === true;
    } catch {
      saved = false;
    } finally {
      setIsSavingName(false);
    }

    if (!saved) {
      setNameSaveError(
        "Chưa hoàn tất lưu tên. Nội dung bạn nhập vẫn được giữ; hãy thử lại. Nếu lỗi tiếp tục, hãy tải lại trang để kiểm tra hồ sơ."
      );
      return;
    }

    setDisplayName(cleanName);
    setTempName(cleanName);
    setIsEditingName(false);
  };



  const handleConfirmClearData = async () => {
    setClearDataError("");
    setDataClearedNotice(false);

    let success = false;

    try {
      success = await onClearAllLocalData?.() === true;
    } catch {
      success = false;
    }

    if (!success) {
      setClearDataError(
        "Chưa hoàn tất việc xóa dữ liệu. Bạn có thể thử lại hoặc đóng hộp này và tải lại trang để kiểm tra các mục còn lưu."
      );

      // Giữ hộp xác nhận mở để người dùng thấy lỗi.
      return;
    }

    setShowClearConfirm(false);
    setDataClearedNotice(true);
  };

  const handleToggleTopic = async (topicId: string) => {
    if (topicsSaveStatus === "saving") return;
    const nextTopics = selectedTopics.includes(topicId)
      ? selectedTopics.filter((id) => id !== topicId)
      : [...selectedTopics, topicId];

    setTopicsSaveStatus("saving");
    const saved = await onChangeTopics(nextTopics);

    setTopicsSaveStatus(saved ? "success" : "error");
  };

  const handleThemeChange = async (theme: ThemePreference) => {
    if (settingsSaveStatus === "saving") return;
    setSettingsSaveStatus("saving");
    const saved = await onChangeTheme(theme);
    setSettingsSaveStatus(saved ? "success" : "error");
  };

  const handleNotificationChange = async (
    key: "emailNotifications" | "pushNotifications"
  ) => {
    if (settingsSaveStatus === "saving") return;
    setSettingsSaveStatus("saving");
    const saved = await onChangeNotifications({
      emailNotifications: key === "emailNotifications"
        ? !userSettings.emailNotifications
        : userSettings.emailNotifications,
      pushNotifications: key === "pushNotifications"
        ? !userSettings.pushNotifications
        : userSettings.pushNotifications,
    });
    setSettingsSaveStatus(saved ? "success" : "error");
  };

  return (
    <div className="screen-shell">
      <main className="page-container max-w-6xl">
        {/* Top Breadcrumb */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 text-xs text-muted">
          <div className="flex items-center gap-2">
            <button
              onClick={onGoToHome}
              className="hover:text-accent cursor-pointer transition-colors"
            >
              Hôm nay
            </button>
            <span>/</span>
            <button
              onClick={onBackToAccount}
              className="hover:text-accent cursor-pointer transition-colors"
            >
              Góc của tôi
            </button>
            <span>/</span>
            <span className="text-accent font-semibold">Cài đặt & Tùy chọn</span>
          </div>

        </div>

        {/* Header Title Section */}
        <div className="mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-accent mb-1 block">
            TÙY BIẾN KHÔNG GIAN
          </span>
          <h1 className="page-title mb-2">
            Cài đặt & Tùy chọn cá nhân
          </h1>
          <p className="text-sm sm:text-base text-ink leading-relaxed max-w-3xl">
            Điều chỉnh không gian tĩnh tại, nhịp trải nghiệm văn hóa và quản lý dữ liệu lưu trữ trên
            thiết bị của bạn.
          </p>
        </div>

        <div className={'space-y-6'}>
            {/* Block 1: Hồ sơ cá nhân */}
            <Card id="settings-profile" className="p-6 sm:p-8 rounded-card bg-surface border border-line shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
                <User className="w-3.5 h-3.5" />
                <span>HỒ SƠ CÁ NHÂN</span>
              </div>
              <h3 className="font-display font-bold text-xl text-ink mb-2">
                Thông tin người dùng
              </h3>
              <p className="text-sm text-muted mb-6">
                Thông tin hiển thị khi check-in tâm trạng và lưu giữ các mục chiêm nghiệm.
              </p>

              {/* Avatar Row */}
              <div className="flex items-center justify-between p-4 rounded-panel bg-surface border border-line mb-5">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-surface border border-line">
                    <span className="grid h-full w-full place-items-center bg-accent-soft font-display text-2xl font-semibold text-accent" aria-hidden="true">
                      {displayName.trim().charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-sm text-ink">Ảnh đại diện người dùng</div>
                    <div className="text-xs text-muted">Định dạng JPG, PNG • Chỉ lưu tại bộ nhớ máy</div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs border-line gap-1.5"
                  onClick={() => toast.info("Tính năng đổi ảnh đại diện cá nhân hóa từ tệp tin sẽ có khi mở rộng bộ nhớ.", "Ảnh đại diện")}
                >
                  <Camera className="w-3.5 h-3.5 text-accent" />
                  <span>Đổi ảnh</span>
                </Button>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="settings-display-name" className="block text-xs font-semibold text-ink mb-1.5">
                    Tên hiển thị:
                  </label>
                  {isEditingName ? (
                    <div className="flex gap-2">
                      <input
                        id="settings-display-name"
                        type="text"
                        maxLength={80}
                        autoFocus
                        aria-invalid={Boolean(nameSaveError)}
                        aria-describedby={
                          nameSaveError ? "settings-name-error" : undefined
                        }
                        value={tempName}
                        onChange={(e) => {
                          setTempName(e.target.value);
                          setNameSaveError("");
                        }}
                        className="min-w-0 flex-1 px-3 py-2 rounded-control border border-accent bg-surface text-base text-ink font-medium outline-none"
                      />
                      <Button size="sm" onClick={() => void handleSaveName()} disabled={isSavingName} className="text-xs bg-action text-white">
                        {isSavingName ? "Đang lưu..." : "Lưu"}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-line bg-surface text-xs font-medium">
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                        {displayName}
                      </span>
                      <button
                        onClick={() => {
                          setTempName(displayName);
                          setNameSaveError("");
                          setIsEditingName(true);
                        }}
                        className="text-accent hover:underline flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Sửa</span>
                      </button>
                    </div>
                  )}
                  {nameSaveError && (
                    <p
                      id="settings-name-error"
                      role="alert"
                      className="mt-2 text-sm text-danger leading-relaxed"
                    >
                      {nameSaveError}
                    </p>
                  )}
                </div>

                <div>
                  <div className="block text-xs font-semibold text-ink mb-1.5">Địa chỉ hòm thư (Email):</div>
                  <div className="px-3.5 py-2.5 rounded-xl border border-line bg-surface-soft text-xs font-medium text-muted flex items-center justify-between">
                    <span className="font-sans tabular-nums text-xs">{user?.email || "Chưa có thông tin"}</span>
                    <span className="text-xs text-muted">
                      Tài khoản đã xác thực
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted italic">
                Tên hiển thị dùng để gọi bạn trong các lời chào buổi sớm và lưu trữ các dòng chiêm
                nghiệm tại góc lưu bút riêng tư.
              </p>
            </Card>

            {/* Block 2: Tùy biến trải nghiệm */}
            <Card id="settings-experience" className="p-6 sm:p-8 rounded-card bg-surface border border-line shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>TÙY BIẾN TRẢI NGHIỆM</span>
              </div>
              <h3 className="font-display font-bold text-xl text-ink mb-2">
                Giao diện
              </h3>
              <p className="text-sm text-muted mb-6">
                Chọn giao diện sáng, tối hoặc tự động theo thiết bị.
              </p>

              {/* Theme selector */}
              <fieldset className="mb-6">
                <legend className="text-sm font-semibold text-ink mb-3">
                  Giao diện
                </legend>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    {
                      value: "light" as const,
                      title: "Sáng",
                      description: "Nền be ấm, chữ tối.",
                      icon: Sun,
                    },
                    {
                      value: "dark" as const,
                      title: "Tối",
                      description: "Nền tối, chữ sáng.",
                      icon: Moon,
                    },
                    {
                      value: "system" as const,
                      title: "Theo thiết bị",
                      description: "Theo giao diện của hệ điều hành.",
                      icon: Monitor,
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    const isSelected =
                      themePreference === option.value;

                    return (
                      <label
                        key={option.value}
                        className={[
                          "flex cursor-pointer items-start gap-3",
                          "rounded-xl border p-4",
                          isSelected
                            ? "border-accent bg-accent-soft"
                            : "border-line bg-surface",
                        ].join(" ")}
                      >
                        <input
                          type="radio"
                          name="theme-preference"
                          value={option.value}
                          checked={isSelected}
                          onChange={() => void handleThemeChange(option.value)}
                          disabled={settingsSaveStatus === "saving"}
                          className="mt-1 h-4 w-4 shrink-0"
                        />

                        <span>
                          <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <Icon
                              className="w-4 h-4 text-accent"
                              aria-hidden="true"
                            />
                            {option.title}
                          </span>

                          <span className="block mt-2 text-sm text-muted leading-relaxed">
                            {option.description}
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <p className="mb-5 text-sm text-muted leading-relaxed">
                Âm thanh được điều khiển trong từng trải nghiệm.
                Một số hiệu ứng hỗ trợ tùy chọn giảm chuyển động của thiết bị.
              </p>

              {/* Topics chips */}
              <fieldset className="mt-6">
                <legend className="text-base font-semibold text-ink mb-2">
                  Chủ đề bạn quan tâm
                </legend>

                <p className="text-sm text-muted leading-relaxed mb-4">
                  Bạn có thể chọn nhiều chủ đề hoặc bỏ chọn tất cả.
                  Lựa chọn được đồng bộ với tài khoản của bạn.
                </p>

                <div className="flex flex-wrap gap-2">
                  {CULTURAL_TOPICS.map((topic) => {
                    const isSelected = selectedTopics.includes(topic.id);

                    return (
                      <button
                        key={topic.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => void handleToggleTopic(topic.id)}
                        disabled={topicsSaveStatus === "saving"}
                        className={[
                          "inline-flex min-h-11 items-center gap-2",
                          "rounded-full border px-4 py-2 text-sm",
                          "font-medium transition-colors",
                          "focus-visible:outline-none",
                          "focus-visible:ring-2 focus-visible:ring-accent",
                          isSelected
                            ? "bg-action border-action text-on-action"
                            : "bg-surface border-line text-ink hover:border-accent",
                        ].join(" ")}
                      >
                        {isSelected && (
                          <Check
                            className="w-4 h-4"
                            aria-hidden="true"
                          />
                        )}
                        {topic.label}
                      </button>
                    );
                  })}
                </div>

                <div
                  aria-live="polite"
                  aria-atomic="true"
                  className="mt-3 text-sm"
                >
                  {topicsSaveStatus === "success" && (
                    <p className="text-success">
                      Đã ghi nhớ {selectedTopics.length} chủ đề.
                    </p>
                  )}

                  {topicsSaveStatus === "saving" && (
                    <p className="text-muted">Đang đồng bộ lựa chọn...</p>
                  )}

                  {topicsSaveStatus === "error" && (
                    <p className="text-danger">
                      Chưa đồng bộ được lựa chọn với máy chủ; bạn hãy thử lại.
                    </p>
                  )}
                </div>

                <p className="mt-3 text-sm text-muted leading-relaxed">
                  Sở thích được lưu theo tài khoản. Việc cá nhân hóa
                  nội dung sẽ được bổ sung ở phase nội dung.
                </p>
              </fieldset>
            </Card>

            {/* Block 3: Nhắc lịch & Thông báo */}
            <Card id="settings-notifications" className="p-6 sm:p-8 rounded-card bg-surface border-line">
              <div className="flex items-center gap-2 mb-3">
                <Bell
                  className="w-5 h-5 text-accent"
                  aria-hidden="true"
                />
                <h2 className="font-display text-xl font-semibold text-ink">
                  Thông báo và nhắc lịch
                </h2>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: "emailNotifications" as const,
                    title: "Thông báo qua email",
                    description: "Nhận lời nhắc và cập nhật quan trọng qua email.",
                  },
                  {
                    key: "pushNotifications" as const,
                    title: "Thông báo trên thiết bị",
                    description: "Cho phép gửi thông báo đẩy tới trình duyệt đã đăng ký.",
                  },
                ].map((option) => (
                  <label
                    key={option.key}
                    className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface-soft p-4"
                  >
                    <span>
                      <span className="block text-sm font-semibold text-ink">{option.title}</span>
                      <span className="mt-1 block text-sm text-muted">{option.description}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={userSettings[option.key]}
                      disabled={settingsSaveStatus === "saving"}
                      onChange={() => void handleNotificationChange(option.key)}
                      className="mt-1 h-5 w-5 shrink-0"
                    />
                  </label>
                ))}
              </div>

              <div aria-live="polite" className="mt-3 text-sm">
                {settingsSaveStatus === "saving" && <p className="text-muted">Đang lưu cài đặt...</p>}
                {settingsSaveStatus === "success" && <p className="text-success">Đã đồng bộ cài đặt.</p>}
                {settingsSaveStatus === "error" && <p className="text-danger">Chưa lưu được cài đặt; bạn hãy thử lại.</p>}
              </div>
              <PushNotificationSettings />
            </Card>

            {/* Block 4: Dữ liệu trên thiết bị & Lưu trữ */}
            <Card id="settings-data" className="p-6 sm:p-8 rounded-card bg-surface border border-line shadow-xs">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>DỮ LIỆU CÁ NHÂN & QUYỀN RIÊNG TƯ</span>
              </div>
              <h3 className="font-display font-bold text-xl text-ink mb-2">
                Minh bạch về dữ liệu tài khoản
              </h3>
              <p className="text-sm text-muted mb-5 leading-relaxed">
                Lời gửi gắm, lịch sử xin xăm và nhật ký tâm trạng được lưu theo tài khoản để bạn xem lại; nội dung này không được gửi vào analytics. Nếu đồng ý bên dưới,
                ứng dụng chỉ ghi nhận sự kiện sử dụng và mã chiến dịch đã chuẩn hóa để đo lường sản phẩm.
              </p>

              <label className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-line bg-surface-soft p-4">
                <span>
                  <span className="block text-sm font-semibold text-ink">Cho phép đo lường hoạt động sản phẩm</span>
                  <span className="mt-1 block text-sm text-muted">
                    Khi đăng nhập, sự kiện được gắn với tài khoản để tính retention. Có thể tắt bất cứ lúc nào;
                    không gửi ghi chú, nội dung tâm trạng, câu hỏi xin xăm, email hay tên.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={analyticsConsent}
                  aria-label="Cho phép đo lường hoạt động sản phẩm"
                  onChange={(event) => {
                    const consented = event.target.checked;
                    setProductAnalyticsConsent(consented);
                    setAnalyticsConsent(consented);
                    if (consented) trackProductEvent("app_open");
                  }}
                  className="mt-1 h-5 w-5 shrink-0"
                />
              </label>

              {clearDataError && !showClearConfirm && (
                <p
                  role="alert"
                  className="mb-4 rounded-panel border border-danger/25 bg-danger-soft p-3.5 text-sm text-danger"
                >
                  {clearDataError}
                </p>
              )}

              {/* Data Cleared Toast */}
              {dataClearedNotice && (
                <div className="p-3.5 rounded-panel bg-success-soft border border-success/25 text-success text-xs mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span>
                    Đã xóa dữ liệu cá nhân trên máy chủ và bộ nhớ của tài khoản trên thiết bị này.
                  </span>
                </div>
              )}

              {/* Data Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-line">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setClearDataError("");
                    setDataClearedNotice(false);
                    setShowClearConfirm(true);
                  }}
                  className="w-full sm:w-auto text-xs rounded-xl border-danger/25 text-danger hover:bg-danger-soft gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa nội dung đã lưu và ghi chú lịch</span>
                </Button>
              </div>
            </Card>

            {/* Block 5: Đang đăng nhập dưới phiên */}
            <div className="p-5 rounded-panel bg-surface border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <div className="font-bold text-ink">
                  Đang đăng nhập dưới phiên: {displayName}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  Khi đăng xuất, dữ liệu cục bộ trên trình duyệt này vẫn được giữ trên thiết bị.
                </div>
              </div>

              {onLogout && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onLogout}
                  className="rounded-xl text-xs border-line text-accent hover:bg-danger-soft shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1" />
                  <span>Đăng xuất khỏi thiết bị này</span>
                </Button>
              )}
            </div>
        </div>

        {/* Modal: Xác nhận xóa dữ liệu */}
        {showClearConfirm && (
          <AppDialog
            labelledBy="clear-account-data-title"
            onClose={() => setShowClearConfirm(false)}
            className="max-w-md text-center"
          >
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-panel border border-danger/25 bg-danger-soft text-danger">
              <AlertTriangle
                className="h-6 w-6"
                aria-hidden="true"
              />
            </div>

            <h3
              id="clear-account-data-title"
              className="mb-2 font-display text-xl font-bold text-ink"
            >
              Xóa nội dung đã lưu của tài khoản này?
            </h3>

            <p className="mb-6 text-sm leading-relaxed text-muted">
              Xóa nhật ký, lời ước, lịch sử xăm, hồ sơ tưởng niệm, ghi chú lịch và luận giải của tài khoản trên máy chủ và thiết bị này.
              Thao tác không thể hoàn tác.
              Tài khoản đăng nhập, chứng từ thanh toán và dữ liệu của tài khoản khác được giữ lại.
            </p>

            {clearDataError && (
              <p
                role="alert"
                className="mb-5 rounded-panel border border-danger/25 bg-danger-soft p-3.5 text-left text-sm leading-relaxed text-danger"
              >
                {clearDataError}
              </p>
            )}

            <div className="flex items-center gap-3">
              <Button
                type="button"
                autoFocus
                variant="outline"
                size="lg"
                onClick={() => setShowClearConfirm(false)}
                className="min-h-11 flex-1"
              >
                Hủy bỏ
              </Button>

              <Button
                type="button"
                variant="default"
                size="lg"
                onClick={handleConfirmClearData}
                className="min-h-11 flex-1 bg-danger-action text-white hover:bg-danger-action-hover"
              >
                Xác nhận xóa
              </Button>
            </div>
          </AppDialog>
        )}

      </main>
    </div>
  );
};
