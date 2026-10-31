import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";
import { readPrivateJson, writePrivateJson } from "./lib/privateStorage";
import { DEMO_MODE_LABEL, exitDemoMode, isDemoMode } from "./data/demoMode";
import { ensureDemoSeeded } from "./data/demoSeed";
import { WISH_RELEASE_SESSION_KEY } from "./data/wishReleaseSession";
import { clearDemoValues, readDemoValue, writeDemoValue } from "./data/demoStorage";
import { apiRequest, ApiError } from "./lib/api";
import { clearPersonalStorage } from "./lib/clearPersonalStorage";
import { getMoodContentUnavailableMessage } from "./data/moodAvailability";
import { AppHeader, NavScreen } from "./components/AppHeader";
import { AppSectionSidebar } from "./components/AppSectionSidebar";
import { AppFooter } from "./components/AppFooter";
import { ScreenFocus } from "./components/ScreenFocus";
import { SavedSignalDialog } from "./components/SavedSignalDialog";
import { toast, ToastContainer } from "./components/ui/Toast";
import { LogoutConfirmDialog } from "./components/LogoutConfirmDialog";
import { DemoPremiumPurchaseDialogHost } from "./components/DemoPremiumPurchaseDialog";
import { useTheme } from "./hooks/useTheme";
import type { CultureRegionSlug } from "./screens/CulturalMapScreen";
import type { RegionalExperienceKind } from "./screens/RegionalExperienceScreen";
import { TodayScreen } from "./screens/TodayScreen";
import type { WishTopic } from "./screens/WishScreen";
import type { SavedSignalItem, SavedXinXamItem, SavedWishItem } from "./screens/AccountScreen";
import {
  MoodKey,
  getSignalById,
  getDefaultSignalForMood,
  type MoodContextKey,
  type SignalData,
} from "./data/demoSignals";
import { applyMoodTurnOutcome, isConfirmedActionUpdate, isSupportedMood, supportedMoodLabels } from "./data/moodCheckInState";

import { Trash2, Calendar, BookOpen, ArrowRight, Flower2, Sparkles } from "lucide-react";
import {
  loadStoredUser,
  logoutAccount,
  restoreSession,
  saveStoredProfile,
} from "./data/authService";
import {
  CALENDAR_NOTES_CHANGED_EVENT,
  getCalendarNotesStorageKey,
  getReliableLunarDate,
  loadCalendarPersonalNotes,
  saveCalendarPersonalNotes,
} from "./data/calendarData";
import { sanitizeCulturalTopics } from "./data/culturalTopics";
import {
  DEFAULT_USER_SETTINGS,
  loadUserPreferences,
  replaceTopics,
  updateProfile,
  updateSettings,
  type UserSettings,
} from "./data/userService";
import {
  createMoodCheckIn,
  analyzeMoodSignal,
  loadSignalById,
  loadSavedSignalById,
  deleteSavedSignal,
  loadSavedSignals,
  saveSignal,
  updateMoodAction,
  updateSavedSignal,
} from "./data/moodSignalService";
import {
  deleteSavedWish,
  deleteSavedXam,
  loadSavedWishes,
  loadSavedXam,
  saveWish,
  saveXam,
  updateSavedWish,
  updateSavedXam,
} from "./data/reflectionService";
import {
  deleteCalendarNote,
  loadCalendarNotes,
  saveCalendarNote,
} from "./data/memoryService";

const MoodCheckInScreen = lazy(() => import("./screens/MoodCheckInScreen").then((module) => ({ default: module.MoodCheckInScreen })));
const SignalLoadingScreen = lazy(() => import("./screens/SignalLoadingScreen").then((module) => ({ default: module.SignalLoadingScreen })));
const SignalResultScreen = lazy(() => import("./screens/SignalResultScreen").then((module) => ({ default: module.SignalResultScreen })));
const LoginScreen = lazy(() => import("./screens/LoginScreen").then((module) => ({ default: module.LoginScreen })));
const RegisterScreen = lazy(() => import("./screens/RegisterScreen").then((module) => ({ default: module.RegisterScreen })));
const CompletionScreen = lazy(() => import("./screens/CompletionScreen").then((module) => ({ default: module.CompletionScreen })));
const ForgotPasswordScreen = lazy(() => import("./screens/ForgotPasswordScreen").then((module) => ({ default: module.ForgotPasswordScreen })));
const ResetPasswordScreen = lazy(() => import("./screens/ResetPasswordScreen").then((module) => ({ default: module.ResetPasswordScreen })));
const ExperienceScreen = lazy(() => import("./screens/ExperienceScreen").then((module) => ({ default: module.ExperienceScreen })));
const CultureScreen = lazy(() => import("./screens/CultureScreen").then((module) => ({ default: module.CultureScreen })));
const CultureDetailScreen = lazy(() => import("./screens/CultureDetailScreen").then((module) => ({ default: module.CultureDetailScreen })));
const CulturalCalendarScreen = lazy(() => import("./screens/CulturalCalendarScreen").then((module) => ({ default: module.CulturalCalendarScreen })));
const EventDetailScreen = lazy(() => import("./screens/EventDetailScreen").then((module) => ({ default: module.EventDetailScreen })));
const GratitudeScreen = lazy(() => import("./screens/GratitudeScreen").then((module) => ({ default: module.GratitudeScreen })));
const XinXamScreen = lazy(() => import("./screens/XinXamScreen").then((module) => ({ default: module.XinXamScreen })));
const WishScreen = lazy(() => import("./screens/WishScreen").then((module) => ({ default: module.WishScreen })));
const RitualGuideScreen = lazy(() => import("./screens/RitualGuideScreen").then((module) => ({ default: module.RitualGuideScreen })));
const RitualDetailScreen = lazy(() => import("./screens/RitualDetailScreen").then((module) => ({ default: module.RitualDetailScreen })));
const ZenScreen = lazy(() => import("./screens/ZenScreen").then((module) => ({ default: module.ZenScreen })));
const XinKeoScreen = lazy(() => import("./screens/XinKeoScreen").then((module) => ({ default: module.XinKeoScreen })));
const GoodDayScreen = lazy(() => import("./screens/GoodDayScreen").then((module) => ({ default: module.GoodDayScreen })));
const HoroscopeScreen = lazy(() => import("./screens/HoroscopeScreen").then((module) => ({ default: module.HoroscopeScreen })));
const AstrologyHubScreen = lazy(() => import("./screens/AstrologyHubScreen").then((module) => ({ default: module.AstrologyHubScreen })));
const MembershipScreen = lazy(() => import("./screens/MembershipScreen").then((module) => ({ default: module.MembershipScreen })));
const SettingsScreen = lazy(() => import("./screens/SettingsScreen").then((module) => ({ default: module.SettingsScreen })));
const AccountScreen = lazy(() => import("./screens/AccountScreen").then((module) => ({ default: module.AccountScreen })));
const AncestorAltarScreen = lazy(() => import("./screens/AncestorAltarScreen").then((module) => ({ default: module.AncestorAltarScreen })));
const CulturalMapScreen = lazy(() => import("./screens/CulturalMapScreen").then((module) => ({ default: module.CulturalMapScreen })));
const RegionCultureScreen = lazy(() => import("./screens/RegionCultureScreen").then((module) => ({ default: module.RegionCultureScreen })));
const RegionalExperienceScreen = lazy(() => import("./screens/RegionalExperienceScreen").then((module) => ({ default: module.RegionalExperienceScreen })));
const MoodJourneyScreen = lazy(() => import("./screens/MoodJourneyScreen").then((module) => ({ default: module.MoodJourneyScreen })));
const NotificationScreen = lazy(() => import("./screens/NotificationScreen").then((module) => ({ default: module.NotificationScreen })));
const AboutScreen = lazy(() => import("./screens/AboutScreen").then((module) => ({ default: module.AboutScreen })));

export type SavedEntry = SavedSignalItem;

export interface UserProfile {
  name: string;
  email: string;
  role?: string;
}

interface MoodSubmissionOutcome {
  signal: SignalData | null;
  checkInId: string | null;
  notice: string | null;
  mood: MoodKey;
  contextKey: MoodContextKey;
}

const MOOD_REQUEST_DEADLINE_MS = 12_000;

export interface UserCornerData {
  signals: SavedSignalItem[];
  xam: SavedXinXamItem[];
  wishes: SavedWishItem[];
}

export const getUserCornerStorageKey = (email: string) => {
  return `tltl-user-corner-${email.trim().toLowerCase()}`;
};

const hasStringFields = (
  value: unknown,
  fields: string[]
): value is Record<string, unknown> => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return fields.every(
    (field) => typeof record[field] === "string"
  );
};

const validSavedMoods = supportedMoodLabels;

const hasValidOptionalFields = (
  record: Record<string, unknown>
): boolean => {
  return (
    (record.starred === undefined ||
      typeof record.starred === "boolean") &&
    (record.createdAt === undefined ||
      (typeof record.createdAt === "number" &&
        Number.isFinite(record.createdAt) &&
        record.createdAt > 0 &&
        Number.isFinite(new Date(record.createdAt).getTime())))
  );
};

const isSavedSignalItem = (
  value: unknown
): value is SavedSignalItem => {
  if (
    !hasStringFields(value, [
      "id",
      "signalId",
      "mood",
      "date",
      "poemLine1",
      "poemLine2",
    ])
  ) {
    return false;
  }

  return (
    Boolean((value.id as string).trim()) &&
    validSavedMoods.includes(value.mood as MoodKey) &&
    (value.journal === undefined ||
      typeof value.journal === "string") &&
    (value.actionTitle === undefined ||
      typeof value.actionTitle === "string") &&
    hasValidOptionalFields(value)
  );
};

const isSavedXinXamItem = (
  value: unknown
): value is SavedXinXamItem => {
  return (
    hasStringFields(value, [
      "id",
      "stickNumber",
      "fortuneType",
      "category",
      "region",
      "quote",
      "date",
    ]) &&
    Boolean((value.id as string).trim()) &&
    (
      value.drawId === undefined ||
      (
        typeof value.drawId === "string" &&
        value.drawId.trim().length > 0
      )
    ) &&
    hasValidOptionalFields(value)
  );
};

const isSavedWishItem = (
  value: unknown
): value is SavedWishItem => {
  return (
    hasStringFields(value, [
      "id",
      "category",
      "content",
      "date",
    ]) &&
    Boolean((value.id as string).trim()) &&
    typeof value.sealed === "boolean" &&
    hasValidOptionalFields(value)
  );
};

const parseUserCornerData = (
  value: unknown
): UserCornerData => {
  const empty: UserCornerData = {
    signals: [],
    xam: [],
    wishes: [],
  };

  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return empty;
  }

  const record = value as Record<string, unknown>;

  return {
    signals: Array.isArray(record.signals)
      ? record.signals.filter(isSavedSignalItem)
      : [],
    xam: Array.isArray(record.xam)
      ? record.xam.filter(isSavedXinXamItem)
      : [],
    wishes: Array.isArray(record.wishes)
      ? record.wishes.filter(isSavedWishItem)
      : [],
  };
};

const isCompleteUserCornerData = (
  value: unknown
): boolean => {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return (
    Array.isArray(record.signals) &&
    record.signals.every(isSavedSignalItem) &&
    Array.isArray(record.xam) &&
    record.xam.every(isSavedXinXamItem) &&
    Array.isArray(record.wishes) &&
    record.wishes.every(isSavedWishItem)
  );
};

export const loadUserCornerData = async (
  user: UserProfile | null
): Promise<UserCornerData> => {
  const empty: UserCornerData = {
    signals: [],
    xam: [],
    wishes: [],
  };

  void user;
  return empty;
};

export const saveUserCornerData = async (
  email: string,
  data: UserCornerData
): Promise<boolean> => {
  if (!isCompleteUserCornerData(data)) {
    return false;
  }

  const key = getUserCornerStorageKey(email);

  try {
    const previousRaw = localStorage.getItem(key);

    if (previousRaw !== null) {
      let previousIsValid = false;

      try {
        const previousParsed: unknown = await readPrivateJson(key);
        previousIsValid =
          isCompleteUserCornerData(previousParsed);
      } catch {
        previousIsValid = false;
      }

      if (!previousIsValid) {
        const backupKey =
          `${key}-recovery-${crypto.randomUUID()}`;

        // Giữ nguyên nội dung gốc, kể cả JSON không đọc được.
        await writePrivateJson(backupKey, previousRaw);
      }
    }

    await writePrivateJson(key, data);
    return true;
  } catch {
    // Nếu sao lưu hoặc ghi dữ liệu mới thất bại, không báo thành công.
    return false;
  }
};

export const getAccountScopedKey = (base: string, email?: string | null) => {
  const accountId = email ? email.trim().toLowerCase() : "guest";
  return `${base}_${accountId}`;
};

const readActionDone = (
  recordId: string,
  date: string,
  email?: string | null
): boolean => {
  try {
    const raw = localStorage.getItem(
      getAccountScopedKey(
        "tltl-action-done-date",
        email
      )
    );

    if (!raw) return false;

    const value: unknown = JSON.parse(raw);

    if (
      typeof value !== "object" ||
      value === null
    ) {
      return false;
    }

    const record = value as {
      date?: unknown;
      signalId?: unknown;
      checkInId?: unknown;
    };

    return (
      record.date === date &&
      (record.checkInId || record.signalId) === recordId
    );
  } catch {
    return false;
  }
};

export const loadUserSessionState = (user: UserProfile | null, todayStr: string) => {
  const email = user?.email;
  const checkInKey = getAccountScopedKey("tltl-last-checkin-date", email);
  const moodKey = getAccountScopedKey("tltl-today-mood", email);
  const topicsKey = getAccountScopedKey("tltl-selected-topics", email);
  const signalKey = getAccountScopedKey("tltl-current-signal-id", email);
  const currentResultKey = getAccountScopedKey("tltl-current-checkin-id", email);

  let checkedIn = false;
  try {
    checkedIn = localStorage.getItem(checkInKey) === todayStr;
  } catch {}

  let mood: MoodKey = "Chênh vênh";
  try {
    const savedMood = localStorage.getItem(moodKey);
    if (
      savedMood &&
      isSupportedMood(savedMood)
    ) {
      mood = savedMood as MoodKey;
    }
  } catch {}

  let topics: string[] = ["cadao", "xinxam", "bamien"];

  try {
    const stored = localStorage.getItem(topicsKey);

    if (stored !== null) {
      const parsed: unknown = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        topics = sanitizeCulturalTopics(parsed);
      }
    }
  } catch {
    // Giữ lựa chọn mặc định nếu dữ liệu không đọc được.
  }

  let signalId = getDefaultSignalForMood(mood).id;
  try {
    const storedSigId = localStorage.getItem(signalKey);
    if (storedSigId) signalId = storedSigId;
  } catch {}

  let checkInId = signalId;
  try {
    const storedCheckInId = localStorage.getItem(currentResultKey);
    if (storedCheckInId) checkInId = storedCheckInId;
  } catch {}

  const actionDone = readActionDone(
    checkInId,
    todayStr,
    email
  );

  return { checkedIn, mood, topics, actionDone, signalId, checkInId };
};

export type PendingSave =
  | { type: "signal"; item: SavedSignalItem & { idempotencyKey: string } }
  | { type: "xam"; item: SavedXinXamItem }
  | { type: "wish"; item: SavedWishItem };

const isSameSavedReflection = (
  entry: SavedSignalItem,
  candidate: {
    signalId: string;
    date: string;
    journal?: string;
  }
): boolean => {
  return (
    entry.signalId === candidate.signalId &&
    entry.date === candidate.date &&
    (entry.journal || "").trim() ===
      (candidate.journal || "").trim()
  );
};

const getCultureRegionFromLocation = (): CultureRegionSlug => {
  const path = window.location.pathname.replace(/^\/+/, "");

  // Các trải nghiệm riêng luôn thuộc vùng tương ứng.
  if (path === "chau-van") return "north";
  if (path === "sea-prayer") return "central";
  if (path === "southern-culture") return "south";

  const region = new URLSearchParams(
    window.location.search
  ).get("region");

  if (
    region === "north" ||
    region === "central" ||
    region === "south"
  ) {
    return region;
  }

  return "north";
};

export default function App() {
  const todayDateString = new Date().toDateString();

  const initialUser = loadStoredUser();
  const initialSession = loadUserSessionState(initialUser, todayDateString);

  // Helper to resolve initial screen from URL safely with prerequisite checks
  const getInitialScreen = (): NavScreen => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.get("login") === "true" || searchParams.get("screen") === "login") {
      return "login";
    }
    const path = window.location.pathname.replace(/^\//, "");
    if (
      ["account", "settings"].includes(path) &&
      !initialUser
    ) {
      return "login";
    }
    if (path === "loading") {
      return initialSession.checkedIn ? "today" : "mood";
    }

    if (path === "saved") {
      return "today";
    }
    if (path === "guest") {
      return "today";
    }
    if (
      [
        "today",
        "mood",
        "result",
        "account",
        "culture",
        "culture-detail",
        "culture-map",
        "region-culture",
        "chau-van",
        "sea-prayer",
        "southern-culture",
        "mood-journey",
        "notifications",
        "rituals",
        "ritual-detail",
        "calendar",
        "calendar-detail",
        "experience",
        "sanctuary",
        "ancestor-altar",
        "xinxam",
        "wish",
        "zen",
        "gratitude",
        "login",
        "register",
        "forgot",
        "reset-password",
        "xinkeo",
        "good-days",
        "horoscope",
        "astrology",
        "membership",
        "about",
        "settings",
      ].includes(path)
    ) {
      return path as NavScreen;
    }
    return "today";
  };

  // Check URL signalId first
  const initialUrlSignalId = new URLSearchParams(window.location.search).get("signalId");
  const initialUrlSavedId = new URLSearchParams(window.location.search).get("savedId");
  const initialUrlSignal = initialUrlSignalId ? getSignalById(initialUrlSignalId) : null;

  // Check URL articleId for CultureDetail
  const initialUrlArticleId = new URLSearchParams(window.location.search).get("articleId") || "dinh-lang-bac-bo";

  // Check URL ritualId for RitualDetail
  const initialUrlRitualId = new URLSearchParams(window.location.search).get("ritualId") || "chuan-bi-ngay-ram";

  // Check URL eventId for CalendarDetail
  const initialUrlCalendarEventId = new URLSearchParams(window.location.search).get("eventId") || "le-soc-vong-ngay-ram";

  const [screen, setScreen] = useState<NavScreen>(getInitialScreen);
  const returnScreenRef = useRef<NavScreen | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string>(initialUrlArticleId);
  const [selectedCultureRegion, setSelectedCultureRegion] =
    useState<CultureRegionSlug>(
      getCultureRegionFromLocation
    );
  const [selectedRitualId, setSelectedRitualId] = useState<string>(initialUrlRitualId);
  const [xinKeoDrawId, setXinKeoDrawId] =
    useState<string | null>(() => {
      if (window.location.pathname !== "/xinkeo") {
        return null;
      }

      return new URLSearchParams(
        window.location.search,
      ).get("drawId");
    });
  const [selectedCalendarEventId, setSelectedCalendarEventId] = useState<string>(initialUrlCalendarEventId);
  const [journalText, setJournalText] = useState("");
  const {
    dark,
    themePreference,
    setThemePreference,
  } = useTheme();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [demoProfileName, setDemoProfileName] = useState(() =>
    readDemoValue("profile-name", "An Nhiên")
  );
  const displayUser = currentUser ?? (isDemoMode()
    ? { name: demoProfileName, email: "demo@tinlamtamlinh.local" }
    : null);

  const cornerAccountScopeRef = useRef({
    email: currentUser?.email ?? null,
    version: 0,
  });

  const currentCornerEmail = currentUser?.email ?? null;

  if (cornerAccountScopeRef.current.email !== currentCornerEmail) {
    cornerAccountScopeRef.current = {
      email: currentCornerEmail,
      version: cornerAccountScopeRef.current.version + 1,
    };
  }

  const cornerDeleteLocksRef = useRef(new Set<string>());
  const [sessionResolved, setSessionResolved] = useState(false);
  const [userSettings, setUserSettings] = useState<UserSettings>(() =>
    readDemoValue("user-settings", DEFAULT_USER_SETTINGS)
  );
  const [pendingSave, setPendingSave] = useState<PendingSave | null>(null);
  const [isLoginImmersive, setIsLoginImmersive] = useState(false);

  useEffect(() => {
    let active = true;
    if (new URLSearchParams(window.location.search).get("logout") === "unconfirmed") {
      toast.warning("Đã xóa phiên trên thiết bị, nhưng máy chủ chưa xác nhận thu hồi phiên do kết nối gián đoạn.", "Đăng xuất chưa đồng bộ");
    }

    void restoreSession().then(async (user) => {
      if (!active) return;

      setCurrentUser(user.user);
      setUserCornerData(await loadUserCornerData(user.user));
      if (user.status === "unavailable") toast.warning("Chưa xác minh được phiên đăng nhập do mất kết nối. Vui lòng thử lại.");
      setSessionResolved(true);

      const session = loadUserSessionState(user.user, todayDateString);
      setSelectedTopics(session.topics);
      setIsCheckedIn(session.checkedIn);
      setSelectedMood(session.mood);
      setIsActionDone(session.actionDone);
      setCurrentSignalId(initialUrlSignalId || session.signalId);
      setPendingMoodCheckInId(session.checkInId || null);

      if (user.user) {
        try {
          const preferences = await loadUserPreferences();
          if (!active) return;
          setUserSettings(preferences.settings);
          setThemePreference((currentTheme) => currentTheme === "system" ? preferences.settings.theme : currentTheme);
          setSelectedTopics(sanitizeCulturalTopics(preferences.topics));
        } catch {
          // Giữ cache cục bộ nếu máy chủ tạm thời không phản hồi.
        }


        try {
          const remoteNotes = await loadCalendarNotes();
          if (active) {
            if (remoteNotes.length > 0) {
              for (const note of remoteNotes) {
                try {
                  const key = getCalendarNotesStorageKey(user.user.email);
                  const current = loadCalendarPersonalNotes(user.user.email);
                  if (!current.some((item) => item.id === note.id)) {
                    localStorage.setItem(key, JSON.stringify([note, ...current]));
                  }
                } catch {
                  // Backend remains the source of truth when local cache is unavailable.
                }
              }
            }
          }
        } catch {
          // Giữ cache local nếu calendar API chưa sẵn sàng.
        }
      }

      if (user) {
        const path = window.location.pathname.replace(/^\/+/, "");
        if (["account", "settings"].includes(path)) setScreen(path as NavScreen);
      }
    });

    return () => {
      active = false;
    };
  }, [todayDateString]);

  useEffect(() => {
    if (screen !== "login") {
      setIsLoginImmersive(false);
    }
  }, [screen]);

  // Lưu và đồng bộ chủ đề yêu thích theo từng tài khoản
  const [selectedTopics, setSelectedTopics] = useState<string[]>(initialSession.topics);

  // Check-in theo tài khoản
  const [isCheckedIn, setIsCheckedIn] = useState<boolean>(initialSession.checkedIn);

  // Mood theo tài khoản
  const [selectedMood, setSelectedMood] = useState<MoodKey>(() => {
    if (initialUrlSignal) {
      return initialUrlSignal.mood;
    }
    return initialSession.mood;
  });
  const [selectedContextKey, setSelectedContextKey] = useState<MoodContextKey>(() =>
    getSignalById(initialUrlSignal?.id || initialSession.signalId)?.contextKey || "general"
  );
  const [analyzedSignal, setAnalyzedSignal] = useState<SignalData | null>(null);
  const [moodRequestNotice, setMoodRequestNotice] = useState<string | null>(null);

  // Current signal theo tài khoản
  const [currentSignalId, setCurrentSignalId] = useState<string>(() => {
    if (initialUrlSignal) {
      return initialUrlSignal.id;
    }
    return initialUrlSignalId || initialSession.signalId;
  });
  const [pendingMoodCheckInId, setPendingMoodCheckInId] = useState<string | null>(initialSession.checkInId);
  const moodResolutionRef = useRef<Promise<MoodSubmissionOutcome> | null>(null);
  const moodRequestControllerRef = useRef<AbortController | null>(null);
  const moodRequestVersionRef = useRef(0);
  const moodSubmittingRef = useRef(false);
  const [isMoodSubmitting, setIsMoodSubmitting] = useState(false);
  const moodSubmissionKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const activeResultIdempotencyKeyRef = useRef<string | null>(null);
  const resultSaveKeyRef = useRef<{ fingerprint: string; key: string } | null>(null);
  const resultSaveLockRef = useRef(false);

  // Trạng thái hành động hoàn thành theo từng tài khoản
  const [isActionDone, setIsActionDone] =
    useState<boolean>(() =>
      readActionDone(
        initialUrlSignal?.id || initialSession.signalId,
        todayDateString,
        initialUser?.email
      )
    );

  useEffect(() => {
    setIsActionDone(
      readActionDone(
        pendingMoodCheckInId || activeResultIdempotencyKeyRef.current || currentSignalId,
        todayDateString,
        currentUser?.email
      )
    );
  }, [
    currentSignalId,
    pendingMoodCheckInId,
    currentUser?.email,
    todayDateString,
  ]);

  // Tách biệt dữ liệu Góc của tôi (tín hiệu, thẻ xăm, điều ước) theo từng tài khoản
  const [userCornerData, setUserCornerDataState] =
    useState<UserCornerData>({
      signals: [],
      xam: [],
      wishes: [],
    });

  const userCornerDataRef = useRef(userCornerData);
  const cornerDataVersionRef = useRef(0);

  const setUserCornerData = (
    action: SetStateAction<UserCornerData>
  ) => {
    const next =
      typeof action === "function"
        ? action(userCornerDataRef.current)
        : action;

    // Đồng bộ ngay để các thao tác khác trong cùng lượt
    // không đọc lại danh sách cũ.
    userCornerDataRef.current = next;
    cornerDataVersionRef.current += 1;
    setUserCornerDataState(next);
  };
  const favoriteLocksRef = useRef(new Set<string>());
  const favoriteCacheQueueRef = useRef(Promise.resolve());

  const [cornerReload, setCornerReload] = useState(0);

  const [cornerLoadState, setCornerLoadState] = useState<{
    email: string | null;
    status: "idle" | "loading" | "ready" | "error";
  }>({
    email: null,
    status: "idle",
  });

  useEffect(() => {
    if (isDemoMode()) ensureDemoSeeded();
  }, []);

  useEffect(() => {
    if (!sessionResolved) return;

    const scope = cornerAccountScopeRef.current;
    const email = currentUser?.email ?? null;

    if (!email) {
      const empty: UserCornerData = {
        signals: [],
        xam: [],
        wishes: [],
      };

      if (isDemoMode()) {
        let active = true;
        setCornerLoadState({ email: null, status: "loading" });
        void Promise.all([loadSavedSignals(), loadSavedXam(), loadSavedWishes()])
          .then(([signals, xam, wishes]) => {
            if (!active || cornerAccountScopeRef.current !== scope) return;
            setUserCornerData({ signals, xam, wishes });
            setCornerLoadState({ email: null, status: "ready" });
          })
          .catch(() => {
            if (!active || cornerAccountScopeRef.current !== scope) return;
            setUserCornerData(empty);
            setCornerLoadState({ email: null, status: "ready" });
          });
        return () => { active = false; };
      }

      setUserCornerData(empty);
      setCornerLoadState({
        email: null,
        status: "idle",
      });

      return;
    }

    let active = true;

    const isCurrentRequest = () =>
      active && cornerAccountScopeRef.current === scope;

    setCornerLoadState({
      email,
      status: "loading",
    });

    const dataVersionAtStart = cornerDataVersionRef.current;

    void Promise.all([
      loadSavedSignals(),
      loadSavedXam(),
      loadSavedWishes(),
    ])
      .then(([signals, xam, wishes]) => {
        if (!isCurrentRequest()) return;

        if (
          cornerDataVersionRef.current !== dataVersionAtStart
        ) {
          // Trong lúc tải, một thao tác khác đã đổi danh sách.
          // Không dùng phản hồi này để thay dữ liệu mới.
          setCornerReload((value) => value + 1);
          return;
        }

        const loaded: UserCornerData = {
          signals,
          xam,
          wishes,
        };

        setUserCornerData(loaded);

        setCornerLoadState({
          email,
          status: "ready",
        });
      })
      .catch(() => {
        if (!isCurrentRequest()) return;

        if (
          cornerDataVersionRef.current !== dataVersionAtStart
        ) {
          setCornerReload((value) => value + 1);
          return;
        }

        setCornerLoadState({
          email,
          status: "error",
        });
      });

    return () => {
      active = false;
    };
  }, [
    sessionResolved,
    currentUser?.email,
    cornerReload,
  ]);

  const [openedSavedSignal, setOpenedSavedSignal] =
    useState<SavedSignalItem | null>(null);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(initialUrlSavedId);
  const [savedRecordNotice, setSavedRecordNotice] = useState<string | null>(null);

  const handleOpenSavedSignal = (entryId: string) => {
    const entry = userCornerData.signals.find(
      (item) => item.id === entryId
    );

    if (!entry) {
      toast.warning("Nội dung này không còn trong danh sách đã lưu.");
      return;
    }

    if (!currentUser && !isDemoMode()) {
      returnScreenRef.current = "account";
      navigateTo("login");
      return;
    }
    setOpenedSavedSignal(entry);
    setSavedRecordId(entryId);
    setSavedRecordNotice(null);
    window.history.pushState({ screen: "result", savedId: entryId }, "", `/result?savedId=${encodeURIComponent(entryId)}`);
    setScreen("result");
  };

  useEffect(() => {
    setOpenedSavedSignal(null);
    setSavedRecordId(initialUrlSavedId);
  }, [currentUser?.email]);

  useEffect(() => {
    if (!sessionResolved || !currentUser || !savedRecordId || openedSavedSignal?.contentStatus) return;
    let active = true;
    setSavedRecordNotice("Đang tải bản ghi đã lưu từ máy chủ…");
    void loadSavedSignalById(savedRecordId)
      .then(({ item, signal, contentStatus }) => {
        if (!active) return;
        setOpenedSavedSignal({ ...item, signalSnapshot: signal, contentStatus });
        setSavedRecordNotice(null);
        if (contentStatus === "withdrawn") toast.warning("Nội dung của bản ghi này đã bị thu hồi; đang hiển thị trạng thái lưu trữ, không thay bằng nội dung khác.");
      })
      .catch((error) => {
        if (!active) return;
        setOpenedSavedSignal(null);
        const message = error instanceof ApiError && error.status === 404
          ? "Bản ghi không tồn tại hoặc không thuộc tài khoản này."
          : "Chưa tải được kết quả đã lưu. Vui lòng thử lại.";
        setSavedRecordNotice(message);
        toast.error(message);
      });
    return () => { active = false; };
  }, [sessionResolved, currentUser?.email, savedRecordId, openedSavedSignal?.contentStatus]);

  const handleCloseSavedSignal = () => {
    setOpenedSavedSignal(null);
    setSavedRecordId(null);
    setSavedRecordNotice(null);
    if ((window.history.state as { savedId?: string } | null)?.savedId) window.history.back();
    else navigateTo("account");
  };


  // Active signal computed from currentSignalId
  const activeSignal = analyzedSignal?.id === currentSignalId
    ? analyzedSignal
    : getSignalById(currentSignalId) || getDefaultSignalForMood(selectedMood);
  const publishedSignal = analyzedSignal?.id === currentSignalId ? analyzedSignal : activeSignal;

  useEffect(() => {
    if (screen !== "result" || savedRecordId) return;
    if (!currentSignalId.trim()) return;
    if (analyzedSignal?.id === currentSignalId) return;

    let active = true;

    void loadSignalById(currentSignalId)
      .then((signal) => {
        if (!active || signal.id !== currentSignalId) return;

        setAnalyzedSignal(signal);
        setSelectedMood(signal.mood);
        setSelectedContextKey(signal.contextKey || "general");
        setMoodRequestNotice(null);
      })
      .catch(() => {
        if (!active) return;

        setAnalyzedSignal(null);
        setMoodRequestNotice(
          "Chưa tải được kết quả. Nội dung có thể không còn khả dụng hoặc kết nối đang gặp vấn đề."
        );
      });

    return () => {
      active = false;
    };
  }, [screen, currentSignalId, analyzedSignal?.id]);

  useEffect(() => {
  }, [currentUser?.email]);

  // Tài khoản và cài đặt yêu cầu đăng nhập ngoài chế độ demo.
  useEffect(() => {
    if (!sessionResolved || isDemoMode()) return;
    if (currentUser) return;

    const path = window.location.pathname.replace(
      /^\/+/,
      ""
    );

    const protectedScreens = [
      "account",
      "settings",
      ...(savedRecordId ? ["result"] : []),
    ];

    const needsLogin =
      protectedScreens.includes(screen) ||
      protectedScreens.includes(path);

    if (!needsLogin) return;

    returnScreenRef.current = savedRecordId ? "result" : "account";

    setScreen("login");

    // Đồng bộ URL và tránh thêm một trang bị chặn
    // vào lịch sử điều hướng.
    window.history.replaceState(
      { screen: "login" },
      "",
      "/login"
    );

    window.scrollTo({
      top: 0,
      behavior: "auto",
    });
  }, [screen, currentUser, sessionResolved, savedRecordId]);

  useEffect(() => {
    try {
      localStorage.setItem(
        getAccountScopedKey("tltl-current-signal-id", currentUser?.email),
        currentSignalId
      );
    } catch {}
  }, [currentSignalId, currentUser]);

  // Handle URL history sync & direct link / popstate reload with full context restoration
  useEffect(() => {
    // If opened directly on /result without ?signalId=..., ensure URL query param is normalized
    if (screen === "result" && !initialUrlSignalId && publishedSignal) {
      window.history.replaceState(
        { screen: "result", signalId: publishedSignal.id, mood: selectedMood },
        "",
        `/result?signalId=${publishedSignal.id}`
      );
    }

    const handlePopState = (event: PopStateEvent) => {
      const path = window.location.pathname.replace(/^\//, "");
      const params = new URLSearchParams(window.location.search);

      if (path !== "wish") {
        try {
          sessionStorage.removeItem(WISH_RELEASE_SESSION_KEY);
        } catch {
          // No-op when session storage is unavailable.
        }
      }

      setXinKeoDrawId(
        path === "xinkeo"
          ? params.get("drawId")
          : null,
      );

      if (
        path === "region-culture" ||
        path === "chau-van" ||
        path === "sea-prayer" ||
        path === "southern-culture"
      ) {
        setSelectedCultureRegion(
          getCultureRegionFromLocation()
        );
      }

      const state = event.state as {
        screen?: NavScreen;
        signalId?: string;
        savedId?: string;
        articleId?: string;
        ritualId?: string;
        mood?: MoodKey;
      } | null;

      // Restore signal context
      const urlSignalId = params.get("signalId") || state?.signalId;
      const urlSavedId = params.get("savedId") || state?.savedId || null;
      setSavedRecordId(urlSavedId);
      if (urlSavedId) setOpenedSavedSignal(null);
      else setOpenedSavedSignal(null);
      if (urlSignalId) {
        const sig = getSignalById(urlSignalId);
        setCurrentSignalId(urlSignalId);
        if (sig) {
          setSelectedMood(sig.mood);
        }
      }

      // Restore article context
      const urlArticleId = params.get("articleId") || state?.articleId;
      if (urlArticleId) {
        setSelectedArticleId(urlArticleId);
      }

      // Restore ritual context
      const urlRitualId = params.get("ritualId") || state?.ritualId;
      if (urlRitualId) {
        setSelectedRitualId(urlRitualId);
      }

      // Restore calendar event context
      const urlEventId = params.get("eventId") || (state as { eventId?: string })?.eventId;
      if (urlEventId) {
        setSelectedCalendarEventId(urlEventId);
      }

      // Handle screen routing with guards for missing context
      if (
        ["account", "settings"].includes(path) &&
        !currentUser && !isDemoMode()
      ) {
        setScreen("login");
      } else if (path === "loading") {
        // Direct hit or back to loading: do not trap in loading spinner
        setScreen(isCheckedIn ? "today" : "mood");
      } else if (path === "saved") {
        // Direct hit or back to saved without completed flow: route to today
        setScreen("today");
      } else if (path === "guest") {
        setScreen("today");
      } else if (
        [
          "today",
          "mood",
          "result",
          "account",
          "culture",
          "culture-detail",
          "culture-map",
          "region-culture",
          "chau-van",
          "sea-prayer",
          "southern-culture",
          "mood-journey",
          "notifications",
          "rituals",
          "ritual-detail",
          "calendar",
          "calendar-detail",
          "experience",
          "sanctuary",
          "ancestor-altar",
          "xinxam",
          "wish",
          "zen",
          "gratitude",
          "login",
          "register",
          "forgot",
          "xinkeo",
          "good-days",
          "horoscope",
          "astrology",
          "membership",
          "about",
          "settings",
        ].includes(path)
      ) {
        setScreen(path as NavScreen);
      } else {
        setScreen("today");
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [
    currentUser,
    isCheckedIn,
    activeSignal.id,
    currentSignalId,
    selectedMood,
    selectedCultureRegion,
  ]);

  const navigateTo = (
    newScreen: NavScreen,
    signalIdParam?: string,
    authenticatedUser?: UserProfile | null,
    cultureRegionParam?: CultureRegionSlug
  ) => {
    if (screen === "wish" && newScreen !== "wish") {
      try {
        sessionStorage.removeItem(WISH_RELEASE_SESSION_KEY);
      } catch {
        // No-op when session storage is unavailable.
      }
    }

    let targetScreen = newScreen;
    const effectiveUser =
      authenticatedUser !== undefined
        ? authenticatedUser
        : currentUser ?? loadStoredUser();

    if (
      ["account", "settings"].includes(targetScreen) &&
      !effectiveUser && !isDemoMode()
    ) {
      targetScreen = "login";
    }

    if (["login", "register"].includes(targetScreen) && !["login", "register", "forgot"].includes(screen)) {
      returnScreenRef.current = screen;
    }
    let url = targetScreen === "today" ? "/" : `/${targetScreen}`;
    let resolvedSignalId = undefined;
    let resolvedArticleId = undefined;
    let resolvedRitualId = undefined;
    let resolvedEventId = undefined;

    if (targetScreen === "result") {
      if (!(savedRecordId && !signalIdParam)) {
        const resultId = signalIdParam?.trim() || publishedSignal?.id;
        if (!resultId) {
          targetScreen = "mood";
        } else {
          resolvedSignalId = resultId;
          setCurrentSignalId(resultId);
        }
      }
    }
    setScreen(targetScreen);
    url = targetScreen === "today" ? "/" : `/${targetScreen}`;
    if (targetScreen === "result") {
      url = savedRecordId && !resolvedSignalId
        ? `/result?savedId=${encodeURIComponent(savedRecordId)}`
        : `/result?signalId=${encodeURIComponent(resolvedSignalId!)}`;
    } else if (targetScreen === "culture-detail") {
      resolvedArticleId = signalIdParam || selectedArticleId || "dinh-lang-bac-bo";
      url = `/culture-detail?articleId=${resolvedArticleId}`;
    } else if (targetScreen === "ritual-detail") {
      resolvedRitualId = signalIdParam || selectedRitualId || "chuan-bi-ngay-ram";
      url = `/ritual-detail?ritualId=${resolvedRitualId}`;
    } else if (targetScreen === "xinkeo") {
      const linkedDrawId = signalIdParam?.trim() || null;

      setXinKeoDrawId(linkedDrawId);

      url = linkedDrawId
        ? `/xinkeo?drawId=${encodeURIComponent(linkedDrawId)}`
        : "/xinkeo";
    } else if (targetScreen === "calendar-detail") {
      resolvedEventId = signalIdParam || selectedCalendarEventId || "le-soc-vong-ngay-ram";
      url = `/calendar-detail?eventId=${resolvedEventId}`;
    }

    if (targetScreen === "region-culture") {
      const region =
        cultureRegionParam || selectedCultureRegion;

      setSelectedCultureRegion(region);
      url = `/region-culture?region=${region}`;
    }

    if (
      targetScreen === "chau-van" ||
      targetScreen === "sea-prayer" ||
      targetScreen === "southern-culture"
    ) {
      const region: CultureRegionSlug =
        targetScreen === "chau-van"
          ? "north"
          : targetScreen === "sea-prayer"
            ? "central"
            : "south";

      setSelectedCultureRegion(region);
      url = `/${targetScreen}?region=${region}`;
    }

    const historyPayload = {
      screen: targetScreen,
      signalId: resolvedSignalId,
      savedId: targetScreen === "result" ? savedRecordId || undefined : undefined,
      articleId: resolvedArticleId,
      ritualId: resolvedRitualId,
      eventId: resolvedEventId,
      mood: selectedMood,
    };

    window.history.pushState(historyPayload, "", url);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleToggleAction = async (
    completed: boolean
  ): Promise<boolean> => {
    if (completed && !publishedSignal) return false;
    const checkInId = pendingMoodCheckInId || activeResultIdempotencyKeyRef.current || activeSignal.id;
    if (currentUser) {
      if (!pendingMoodCheckInId) {
        toast.error("Chưa xác định được mã check-in để đồng bộ hành động. Trạng thái hiện tại được giữ.");
        return false;
      }
      try {
        const updated = await updateMoodAction(pendingMoodCheckInId, completed);
        if (!isConfirmedActionUpdate(pendingMoodCheckInId, completed, updated)) {
          toast.error("Máy chủ chưa xác nhận đúng trạng thái hành động. Trạng thái hiện tại được giữ.");
          return false;
        }
      } catch {
        toast.error("Chưa đồng bộ được trạng thái hành động. Trạng thái hiện tại được giữ.");
        return false;
      }
    }
    const key = getAccountScopedKey(
      "tltl-action-done-date",
      currentUser?.email
    );

    let localSaved = true;
    try {
      if (completed) {
        localStorage.setItem(
          key,
          JSON.stringify({
            date: todayDateString,
            checkInId,
          })
        );
      } else {
        localStorage.removeItem(key);
      }
    } catch {
      localSaved = false;
    }

    if (!localSaved && !currentUser) {
      toast.error("Chưa lưu được trạng thái hành động. Trạng thái hiện tại được giữ.");
      return false;
    }
    setIsActionDone(completed);
    if (!localSaved) {
      toast.warning(currentUser
        ? "Máy chủ đã xác nhận hành động, nhưng chưa lưu được bản sao trên thiết bị này."
        : "Chưa lưu được trạng thái hành động trên thiết bị này. Hãy thử lại.");
      return Boolean(currentUser);
    }

    return true;
  };

  const handleSubmitMood = async (contextKey: MoodContextKey) => {
    if (moodSubmittingRef.current) return;
    // Mỗi lần gửi cảm xúc là một lượt mới,
    // kể cả khi chọn lại cùng cảm xúc.
    setMoodRequestNotice(null);

    const fingerprint = JSON.stringify([
      currentUser?.email?.trim().toLowerCase() || "guest",
      selectedMood,
      contextKey,
      journalText.trim(),
    ]);
    if (moodSubmissionKeyRef.current?.fingerprint !== fingerprint) {
      moodSubmissionKeyRef.current = { fingerprint, key: crypto.randomUUID() };
    }
    const idempotencyKey = moodSubmissionKeyRef.current.key;
    moodSubmittingRef.current = true;
    setIsMoodSubmitting(true);

    const requestVersion = ++moodRequestVersionRef.current;
    const controller = new AbortController();
    moodRequestControllerRef.current?.abort();
    moodRequestControllerRef.current = controller;

    const request = currentUser
      ? createMoodCheckIn({
        mood: selectedMood,
        contextKey,
        note: journalText.trim() || undefined,
        idempotencyKey,
      }, { signal: controller.signal }).then((result): MoodSubmissionOutcome => ({
        signal: result.signal,
        checkInId: result.checkIn.id,
        notice: null,
        mood: selectedMood,
        contextKey,
      }))
      : analyzeMoodSignal({ mood: selectedMood, contextKey }, { signal: controller.signal }).then((result): MoodSubmissionOutcome => ({
        signal: result.signal,
        checkInId: null,
        notice: null,
        mood: selectedMood,
        contextKey,
      }));

    let deadlineTimer = 0;
    const deadline = new Promise<MoodSubmissionOutcome>((resolve) => {
      deadlineTimer = window.setTimeout(() => {
        controller.abort();
        resolve({
          signal: null,
          checkInId: null,
          notice: currentUser
            ? "Máy chủ chưa xác nhận check-in kịp thời. Chưa lưu tâm sự và chưa có gợi mở để hiển thị."
            : "Máy chủ phản hồi chậm. Chưa có gợi mở để hiển thị; hãy thử lại khi kết nối ổn định.",
          mood: selectedMood,
          contextKey,
        });
      }, MOOD_REQUEST_DEADLINE_MS);
    });

    moodResolutionRef.current = Promise.race([
      request.catch((error: unknown): MoodSubmissionOutcome => ({
        signal: null,
        checkInId: null,
        notice: currentUser
          ? getMoodContentUnavailableMessage(error) || "Chưa kết nối được máy chủ. Check-in chưa được xác nhận lưu và chưa có gợi mở để hiển thị."
          : getMoodContentUnavailableMessage(error) || "Chưa kết nối được máy chủ. Chưa có gợi mở để hiển thị; hãy thử lại sau.",
        mood: selectedMood,
        contextKey,
      })),
      deadline,
    ]).then((outcome) => {
      window.clearTimeout(deadlineTimer);
      if (requestVersion === moodRequestVersionRef.current) {
        setMoodRequestNotice(outcome.notice);
        moodSubmittingRef.current = false;
        setIsMoodSubmitting(false);
      }
      return outcome;
    });

    navigateTo("loading");
  };

  const handleChangeSignalContext = async (contextKey: MoodContextKey) => {
    const requestVersion = ++moodRequestVersionRef.current;
    const controller = new AbortController();
    moodRequestControllerRef.current?.abort();
    moodRequestControllerRef.current = controller;
    const idempotencyKey = crypto.randomUUID();
    try {
      if (currentUser) {
        const result = await createMoodCheckIn({
          mood: selectedMood,
          contextKey,
          note: journalText.trim() || undefined,
          idempotencyKey,
        }, { signal: controller.signal });
        if (requestVersion !== moodRequestVersionRef.current) return;
        setPendingMoodCheckInId(result.checkIn.id);
        try { localStorage.setItem(getAccountScopedKey("tltl-current-checkin-id", currentUser.email), result.checkIn.id); } catch {}
        setAnalyzedSignal(result.signal);
        setCurrentSignalId(result.signal.id);
      } else {
        const result = await analyzeMoodSignal({ mood: selectedMood, contextKey }, { signal: controller.signal });
        if (requestVersion !== moodRequestVersionRef.current) return;
        setPendingMoodCheckInId(null);
        activeResultIdempotencyKeyRef.current = idempotencyKey;
        try { localStorage.setItem(getAccountScopedKey("tltl-current-checkin-id", undefined), idempotencyKey); } catch {}
        setAnalyzedSignal(result.signal);
        setCurrentSignalId(result.signal.id);
      }
      setMoodRequestNotice(null);
      setSelectedContextKey(contextKey);
      setIsActionDone(false);
    } catch (error) {
      if (requestVersion === moodRequestVersionRef.current) toast.error(
        getMoodContentUnavailableMessage(error) || "Chưa tải được gợi mở cho bối cảnh này. Nội dung hiện tại vẫn được giữ."
      );
    }
  };

  const handleFinishLoading = () => {
    const requestVersion = moodRequestVersionRef.current;
    return (async () => {
      const outcome = await moodResolutionRef.current;
      if (requestVersion !== moodRequestVersionRef.current) return false;
      if (!outcome?.signal) {
        setMoodRequestNotice(outcome?.notice || "Chưa nhận được kết quả từ máy chủ. Hãy thử lại.");
        return false;
      }

      const resultSignal = outcome.signal;
      const nextTurn = applyMoodTurnOutcome({
        checkedIn: isCheckedIn,
        signalId: currentSignalId,
        checkInId: pendingMoodCheckInId,
        actionDone: isActionDone,
        mood: selectedMood,
        contextKey: selectedContextKey,
      }, outcome, Boolean(currentUser));
      activeResultIdempotencyKeyRef.current = moodSubmissionKeyRef.current?.key || null;
      moodSubmissionKeyRef.current = null;
      const checkInId = outcome?.checkInId || null;
      setAnalyzedSignal(resultSignal);
      setCurrentSignalId(nextTurn.signalId);
      setPendingMoodCheckInId(nextTurn.checkInId);
      setSelectedContextKey(nextTurn.contextKey);
      setSelectedMood(nextTurn.mood);
      setIsActionDone(nextTurn.actionDone);
      if (checkInId || !currentUser) {
        try {
          localStorage.removeItem(getAccountScopedKey("tltl-action-done-date", currentUser?.email));
          localStorage.setItem(getAccountScopedKey("tltl-current-checkin-id", currentUser?.email), checkInId || activeResultIdempotencyKeyRef.current || resultSignal.id);
        } catch {}
      }
      setMoodRequestNotice(outcome?.notice || null);
      setIsCheckedIn(nextTurn.checkedIn);
      try {
        const email = currentUser?.email;
        if (!currentUser || checkInId) {
          localStorage.setItem(getAccountScopedKey("tltl-last-checkin-date", email), todayDateString);
          localStorage.setItem(getAccountScopedKey("tltl-today-mood", email), selectedMood);
        }
        localStorage.setItem(getAccountScopedKey("tltl-current-signal-id", email), resultSignal.id);
      } catch {}
      navigateTo("result", resultSignal.id);
      return true;
    })();
  };

  const handleCancelMoodLoading = () => {
    moodRequestVersionRef.current += 1;
    moodSubmittingRef.current = false;
    setIsMoodSubmitting(false);
    moodRequestControllerRef.current?.abort();
    moodRequestControllerRef.current = null;
    moodResolutionRef.current = null;
    navigateTo("mood");
  };

  const handleRefreshSignal = async () => {
    if (moodSubmittingRef.current) return;
    moodSubmittingRef.current = true;
    const requestVersion = ++moodRequestVersionRef.current;
    const controller = new AbortController();
    moodRequestControllerRef.current?.abort();
    moodRequestControllerRef.current = controller;
    const idempotencyKey = crypto.randomUUID();
    if (currentUser) {
      try {
        const contextKey = activeSignal.contextKey || selectedContextKey;
        const checkIn = await createMoodCheckIn({
          mood: activeSignal.mood,
          contextKey,
          note: journalText.trim() || undefined,
          excludeSignalId: activeSignal.id,
          idempotencyKey,
        }, { signal: controller.signal });
        if (requestVersion !== moodRequestVersionRef.current) return;
        setPendingMoodCheckInId(checkIn.checkIn.id);
        try { localStorage.setItem(getAccountScopedKey("tltl-current-checkin-id", currentUser.email), checkIn.checkIn.id); } catch {}
        setIsActionDone(false);
        setSelectedMood(activeSignal.mood);
        setAnalyzedSignal(checkIn.signal);
        setCurrentSignalId(checkIn.signal.id);
        window.history.replaceState(
          { screen: "result", signalId: checkIn.signal.id, mood: activeSignal.mood },
          "",
          `/result?signalId=${encodeURIComponent(checkIn.signal.id)}`
        );
      } catch {
        if (requestVersion === moodRequestVersionRef.current) toast.error("Chưa đổi được lời chiêm nghiệm. Bạn hãy thử lại.");
      } finally {
        if (requestVersion === moodRequestVersionRef.current) moodSubmittingRef.current = false;
      }
      return;
    }

    try {
      const contextKey = activeSignal.contextKey || selectedContextKey;
      const analyzed = await analyzeMoodSignal({ mood: activeSignal.mood, contextKey, excludeSignalId: activeSignal.id }, { signal: controller.signal });
      if (requestVersion !== moodRequestVersionRef.current) return;
      activeResultIdempotencyKeyRef.current = idempotencyKey;
      try { localStorage.setItem(getAccountScopedKey("tltl-current-checkin-id", undefined), idempotencyKey); } catch {}
      setAnalyzedSignal(analyzed.signal);
      setSelectedContextKey(contextKey);
      setIsActionDone(false);
      setSelectedMood(activeSignal.mood);
      setCurrentSignalId(analyzed.signal.id);
      setPendingMoodCheckInId(null);
      try {
        localStorage.setItem(getAccountScopedKey("tltl-current-signal-id", undefined), analyzed.signal.id);
        localStorage.removeItem(getAccountScopedKey("tltl-action-done-date", undefined));
      } catch {}
      window.history.replaceState(
        { screen: "result", signalId: analyzed.signal.id, mood: activeSignal.mood },
        "",
        `/result?signalId=${encodeURIComponent(analyzed.signal.id)}`
      );
    } catch {
      if (requestVersion === moodRequestVersionRef.current) toast.error("Chưa đổi được lời chiêm nghiệm từ máy chủ. Bạn hãy thử lại.");
    } finally {
      if (requestVersion === moodRequestVersionRef.current) moodSubmittingRef.current = false;
    }
  };

  const handleSaveResult = async () => {
    if (resultSaveLockRef.current) return;
    if (!publishedSignal) {
      toast.error("Chưa có lời chiêm nghiệm được xuất bản để lưu.");
      return;
    }
    resultSaveLockRef.current = true;
    const fingerprint = JSON.stringify([
      currentUser?.email?.trim().toLowerCase() || "guest",
      activeSignal.id,
      journalText.trim(),
    ]);
    const pendingKey = pendingSave?.type === "signal" ? pendingSave.item.idempotencyKey : null;
    if (pendingKey) resultSaveKeyRef.current = { fingerprint, key: pendingKey };
    if (resultSaveKeyRef.current?.fingerprint !== fingerprint) {
      resultSaveKeyRef.current = {
        fingerprint,
        key: activeResultIdempotencyKeyRef.current || crypto.randomUUID(),
      };
    }
    const idempotencyKey = resultSaveKeyRef.current.key;
    const createdAt = Date.now();
    const newEntry: SavedSignalItem & { idempotencyKey: string } = {
      id: crypto.randomUUID(),
      signalId: activeSignal.id,
      mood: activeSignal.mood,
      contextKey: activeSignal.contextKey || selectedContextKey,
      signalSnapshot: activeSignal,
      actionDone: isActionDone,
      createdAt,
      date: new Date(createdAt).toLocaleDateString("vi-VN"),
      journal: journalText.trim() || undefined,
      poemLine1: activeSignal.poem.line1,
      poemLine2: activeSignal.poem.line2,
      actionTitle: activeSignal.action.title,
      idempotencyKey,
      starred: false,
    };

    try {
      setIsCheckedIn(true);
      const email = currentUser?.email;
      localStorage.setItem(getAccountScopedKey("tltl-last-checkin-date", email), todayDateString);
      localStorage.setItem(getAccountScopedKey("tltl-today-mood", email), selectedMood);
      localStorage.setItem(getAccountScopedKey("tltl-current-signal-id", email), activeSignal.id);
    } catch {}

    try {
      if (!currentUser && !isDemoMode()) {
        setPendingSave({ type: "signal", item: newEntry });
        navigateTo("login");
        return;
      }

      const remoteEntry = await saveSignal(activeSignal.id, {
        checkInId: pendingMoodCheckInId || undefined,
        note: journalText.trim() || undefined,
        actionDone: isActionDone,
        mood: activeSignal.mood,
        contextKey: activeSignal.contextKey || selectedContextKey,
        signalSnapshot: activeSignal,
        idempotencyKey,
      });
      setUserCornerData((previous) => ({ ...previous, signals: [remoteEntry, ...previous.signals.filter((entry) => entry.id !== remoteEntry.id)] }));
      setPendingMoodCheckInId(remoteEntry.id);
      try { localStorage.setItem(getAccountScopedKey("tltl-current-checkin-id", currentUser?.email), remoteEntry.id); } catch {}
      setPendingSave(null);
      resultSaveKeyRef.current = null;
      activeResultIdempotencyKeyRef.current = null;
      toast.success("Đã lưu lời chiêm nghiệm vào hồ sơ của bạn.", "Lưu thành công");
    } catch (error) {
      setPendingSave({ type: "signal", item: newEntry });
      if (error instanceof ApiError && error.status === 404) {
        toast.error("Nội dung này đã bị thu hồi hoặc không còn được phát hành. Kết quả đang mở vẫn được giữ.");
      } else {
        toast.error("Chưa lưu được lời chiêm nghiệm. Kết quả và ghi chú vẫn được giữ để thử lại.");
      }
    } finally {
      resultSaveLockRef.current = false;
    }
  };

  const handleAuthenticated = async (
    name?: string,
    email?: string,
    role?: string
  ) => {
    const themeBeforeAuthentication =
      themePreference === "system" ? (dark ? "dark" : "light") : themePreference;
    const authenticatedEmail = email?.trim().toLowerCase();
    if (!authenticatedEmail) {
      toast.error("Không nhận được tài khoản đã xác thực từ máy chủ. Vui lòng đăng nhập lại.");
      return;
    }
    const userRole = role || loadStoredUser()?.role;
    const user: UserProfile = {
      name: name?.trim() || authenticatedEmail.split("@")[0],
      email: authenticatedEmail,
      role: userRole,
    };

    saveStoredProfile(user);

    if (["ADMIN", "EDITOR"].includes(userRole?.toUpperCase() || "")) {
      const isAdmin = userRole?.toUpperCase() === "ADMIN";
      const destination = isAdmin ? "/admin" : "/editor";
      try {
        if (isAdmin) sessionStorage.setItem("tltl_admin_just_logged_in", user.name || "Quản trị viên");
      } catch {}
      toast.success(
        `Chào mừng ${isAdmin ? "Quản trị viên" : "biên tập viên"} ${user.name}! Đang chuyển vào không gian làm việc...`,
        "Đăng nhập thành công"
      );
      setTimeout(() => {
        window.location.href = destination;
      }, 750);
      return;
    }

    // Giữ nội dung đang chờ trước khi cập nhật state.
    const pending = pendingSave;

    const existingData = await loadUserCornerData(user);

    const nextData: UserCornerData = {
      signals: [...existingData.signals],
      xam: [...existingData.xam],
      wishes: [...existingData.wishes],
    };
    let savedGuestCheckInId: string | null = null;

    // Save on the server before hydration so cached items use canonical IDs.
    try {
      if (pending?.type === "signal") {
        const item = await saveSignal(pending.item.signalId, { note: pending.item.journal, actionDone: pending.item.actionDone, mood: pending.item.mood, contextKey: pending.item.contextKey || "general", signalSnapshot: pending.item.signalSnapshot, idempotencyKey: pending.item.idempotencyKey });
        nextData.signals = [item, ...nextData.signals.filter((entry) => entry.id !== item.id)];
        savedGuestCheckInId = item.id;
      } else if (pending?.type === "xam") {
        const item = await saveXam({
          drawId: pending.item.drawId,
          resultToken: pending.item.resultToken,
          stickNumber: pending.item.stickNumber,
          topic: pending.item.category,
          region: pending.item.region,
          category: pending.item.category,
          fortuneType: pending.item.fortuneType,
          quote: pending.item.quote,
        });

        nextData.xam = [
          item,
          ...nextData.xam.filter(
            (entry) => entry.id !== item.id,
          ),
        ];
      } else if (pending?.type === "wish") {
        const item = await saveWish(
          pending.item.content,
          pending.item.category,
          pending.item.id,
        );
        nextData.wishes = [item, ...nextData.wishes.filter((entry) => entry.id !== item.id)];
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chưa lưu được nội dung đang chờ. Vui lòng thử lại.");
      if (pending?.type === "signal") {
        setCurrentUser(user);
        setUserCornerData(existingData);
        setAnalyzedSignal(pending.item.signalSnapshot || null);
        setCurrentSignalId(pending.item.signalId);
        setSelectedMood(pending.item.mood);
        setSelectedContextKey(pending.item.contextKey || "general");
        setJournalText(pending.item.journal || "");
        setIsActionDone(Boolean(pending.item.actionDone));
        navigateTo("result", pending.item.signalId, user);
      } else if (pending?.type === "wish") {
        setCurrentUser(user);
        setUserCornerData(existingData);
        setPendingSave(pending);

        navigateTo("wish", undefined, user);
      }
      return;
    }
    await saveUserCornerData(user.email, nextData);
    saveStoredProfile(user);

    const userSession = loadUserSessionState(
      user,
      todayDateString
    );

    setCurrentUser(user);
    setUserCornerData(nextData);
    setSelectedTopics(userSession.topics);

    void loadUserPreferences()
      .then((preferences) => {
        setUserSettings(preferences.settings);
        setThemePreference((currentTheme) => currentTheme === "system" ? themeBeforeAuthentication : currentTheme);
        setSelectedTopics(sanitizeCulturalTopics(preferences.topics));
      })
      .catch(() => {
        // Phiên đăng nhập vẫn hợp lệ; giữ tùy chọn cache để người dùng tiếp tục.
      });



    void loadCalendarNotes()
      .then((remoteNotes) => {
        if (remoteNotes.length > 0) {
          try {
            localStorage.setItem(getCalendarNotesStorageKey(user.email), JSON.stringify(remoteNotes));
          } catch {
            // Backend remains the source of truth.
          }
        }
      })
      .catch(() => {});

    if (pending?.type === "signal") {
      const savedSignal = pending.item.signalSnapshot;
      if (!savedSignal) {
        setCurrentUser(user);
        setUserCornerData(nextData);
        toast.error("Không thể khôi phục chính xác kết quả đang chờ lưu. Không tạo kết quả thay thế.");
        return;
      }

      // Giữ đúng lượt chiêm nghiệm trước khi đăng nhập.
      setIsCheckedIn(true);
      setSelectedMood(savedSignal.mood);
      setCurrentSignalId(savedSignal.id);
      setJournalText(pending.item.journal || "");

      try {
        localStorage.setItem(
          getAccountScopedKey(
            "tltl-last-checkin-date",
            user.email
          ),
          todayDateString
        );

        localStorage.setItem(
          getAccountScopedKey(
            "tltl-today-mood",
            user.email
          ),
          savedSignal.mood
        );

        localStorage.setItem(
          getAccountScopedKey(
            "tltl-current-signal-id",
            user.email
          ),
          savedSignal.id
        );

        const actionKey = getAccountScopedKey(
          "tltl-action-done-date",
          user.email
        );

        if (isActionDone) {
          localStorage.setItem(
            actionKey,
            JSON.stringify({
              date: todayDateString,
              checkInId: savedGuestCheckInId,
            })
          );
        } else {
          localStorage.removeItem(actionKey);
        }
      } catch {
        // Nội dung đã lưu; trạng thái ngày có thể không
        // được khôi phục đầy đủ khi tải lại.
      }

      setPendingSave(null);
      setPendingMoodCheckInId(savedGuestCheckInId);
      if (savedGuestCheckInId) {
        try { localStorage.setItem(getAccountScopedKey("tltl-current-checkin-id", user.email), savedGuestCheckInId); } catch {}
      }

      toast.success(
        "Chào mừng " + user.name + " trở lại! Lời chiêm nghiệm đã được lưu vào Góc của tôi.",
        "Đăng nhập thành công"
      );
      navigateTo("result", savedSignal.id, user);
      return;
    }

    // Đăng nhập thông thường hoặc lưu xăm/lời nguyện:
    // khôi phục trạng thái riêng của tài khoản.

    setIsCheckedIn(userSession.checkedIn);
    setSelectedMood(userSession.mood);
    setIsActionDone(userSession.actionDone);
    setCurrentSignalId(userSession.signalId);
    setJournalText("");
    setPendingSave(null);

    if (pending?.type === "wish") {
      returnScreenRef.current = null;

      toast.success(
        "Lời gửi gắm đã được lưu vào Góc của tôi.",
        "Đăng nhập và lưu thành công",
      );

      navigateTo("account", undefined, user);
      return;
    }

    toast.success("Chào mừng " + user.name + " trở lại góc an yên!", "Đăng nhập thành công");
    const targetScreen = returnScreenRef.current && !["login", "register", "forgot", "guest"].includes(returnScreenRef.current)
      ? returnScreenRef.current
      : "today";
    returnScreenRef.current = null;
    navigateTo(targetScreen, undefined, user);
  };

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleRequestLogout = () => {
    setShowLogoutConfirm(true);
  };

  const handleCancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutConfirm(false);
    await handleLogout();
  };

  const handleLogout = async () => {
    const logoutResult = await logoutAccount();

    const guestSession = loadUserSessionState(
      null,
      todayDateString
    );

    setCurrentUser(null);
    setUserSettings(DEFAULT_USER_SETTINGS);

    setUserCornerData({
      signals: [],
      xam: [],
      wishes: [],
    });

    setOpenedSavedSignal(null);
    setSavedRecordId(null);
    setAnalyzedSignal(null);
    setPendingMoodCheckInId(null);
    moodRequestVersionRef.current += 1;
    moodRequestControllerRef.current?.abort();
    moodSubmittingRef.current = false;
    setIsMoodSubmitting(false);
    favoriteLocksRef.current.clear();

    setIsCheckedIn(guestSession.checkedIn);
    setSelectedMood(guestSession.mood);
    setSelectedTopics(guestSession.topics);
    setIsActionDone(guestSession.actionDone);
    setCurrentSignalId(guestSession.signalId);
    setPendingMoodCheckInId(guestSession.checkInId || null);
    activeResultIdempotencyKeyRef.current = null;
    moodSubmissionKeyRef.current = null;
    resultSaveKeyRef.current = null;
    moodResolutionRef.current = null;
    setSavedRecordNotice(null);

    setJournalText("");
    setPendingSave(null);

    // Truyền null rõ ràng để không dùng hồ sơ của lần render cũ.
    if (logoutResult.serverRevoked) toast.info("Phiên trên máy chủ đã được thu hồi và dữ liệu nhạy cảm trên thiết bị đã được xóa.", "Đã đăng xuất");
    else toast.warning("Đã xóa phiên và dữ liệu nhạy cảm khỏi giao diện thiết bị này. Máy chủ chưa xác nhận thu hồi phiên vì kết nối bị gián đoạn.", "Đăng xuất chưa đồng bộ");
    if (!logoutResult.pushDetached) {
      toast.warning(
        "Chưa xác nhận được việc ngừng thông báo trên trình duyệt này. Nếu dùng thiết bị chung, hãy chặn quyền thông báo của trang trong cài đặt trình duyệt."
      );
    }
    navigateTo("today", undefined, null);
  };

  const handleUpdateProfile = async (
    updated: { name: string; email?: string }
  ): Promise<boolean> => {
    if (!currentUser) {
      const cleanName = updated.name.trim();
      if (!isDemoMode() || !cleanName || cleanName.length > 120) return false;
      writeDemoValue("profile-name", cleanName);
      setDemoProfileName(cleanName);
      return true;
    }

    const cleanName = updated.name.trim();

    if (!cleanName || cleanName.length > 120) {
      return false;
    }

    try {
      const updatedUser = await updateProfile(cleanName);
      saveStoredProfile(updatedUser);
      setCurrentUser(updatedUser);
      return true;
    } catch {
      return false;
    }
  };

  const handleSaveTopics = async (topics: string[]): Promise<boolean> => {
    const nextTopics = sanitizeCulturalTopics(topics);
    if (!currentUser) {
      if (!isDemoMode()) return false;
      setSelectedTopics(nextTopics);
      writeDemoValue("selected-topics", nextTopics);
      return true;
    }

    try {
      const savedTopics = sanitizeCulturalTopics(await replaceTopics(nextTopics));
      setSelectedTopics(savedTopics);
      try {
        localStorage.setItem(
          getAccountScopedKey("tltl-selected-topics", currentUser.email),
          JSON.stringify(savedTopics)
        );
      } catch {
        // Backend là nguồn dữ liệu chính; cache local có thể không khả dụng.
      }
      return true;
    } catch {
      return false;
    }
  };

  const handleChangeTheme = async (theme: typeof themePreference): Promise<boolean> => {
    if (!currentUser) {
      if (!isDemoMode()) return false;
      setThemePreference(theme);
      setUserSettings((previous) => {
        const next = { ...previous, theme };
        writeDemoValue("user-settings", next);
        return next;
      });
      return true;
    }
    const previous = themePreference;
    setThemePreference(theme);

    try {
      const saved = await updateSettings({ theme });
      setUserSettings(saved);
      setThemePreference(saved.theme);
      return true;
    } catch {
      setThemePreference(previous);
      return false;
    }
  };

  const handleChangeNotifications = async (
    notifications: Pick<UserSettings, "emailNotifications" | "pushNotifications">
  ): Promise<boolean> => {
    if (!currentUser) {
      if (!isDemoMode()) return false;
      setUserSettings((previous) => {
        const next = { ...previous, ...notifications };
        writeDemoValue("user-settings", next);
        return next;
      });
      return true;
    }
    try {
      const saved = await updateSettings(notifications);
      setUserSettings(saved);
      return true;
    } catch {
      return false;
    }
  };

  const handleToggleTheme = () => {
    const nextTheme = dark ? "light" : "dark";
    if (currentUser) {
      void handleChangeTheme(nextTheme);
    } else {
      setThemePreference(nextTheme);
    }
  };

  const commitCornerData = async (
    updated: UserCornerData,
    showErrorAlert = true
  ): Promise<boolean> => {
    if (!currentUser) return false;

    const saved = await saveUserCornerData(
      currentUser.email,
      updated
    );

    if (!saved) {
      if (showErrorAlert) {
        toast.error("Chưa lưu được thay đổi. Nội dung trên màn hình vẫn được giữ nguyên. Bạn hãy thử lại.");
      }

      return false;
    }

    setUserCornerData(updated);
    return true;
  };

  const deleteCornerItem = async (
    kind: "signals" | "xam" | "wishes",
    id: string,
    remove: (id: string) => Promise<unknown>
  ): Promise<boolean> => {
    const scope = cornerAccountScopeRef.current;
    const email = scope.email;

    if (!email && !isDemoMode()) return false;

    const lockId = `${scope.version}:${kind}:${id}`;

    if (cornerDeleteLocksRef.current.has(lockId)) {
      return false;
    }

    if (favoriteLocksRef.current.has(lockId)) {
      toast.info(
        "Mục này đang cập nhật yêu thích. Bạn hãy chờ hoàn tất rồi xóa."
      );
      return false;
    }

    cornerDeleteLocksRef.current.add(lockId);

    const isCurrentAccount = () =>
      cornerAccountScopeRef.current === scope;

    try {
      try {
        await remove(id);
      } catch (error) {
        // Mục đã được xóa trước đó cũng được coi là hoàn tất.
        if (!(error instanceof ApiError && error.status === 404)) {
          throw error;
        }
      }

      if (!isCurrentAccount()) return false;

      if (isDemoMode()) {
        const current = userCornerDataRef.current;
        setUserCornerData({
          ...current,
          [kind]: current[kind].filter((item) => item.id !== id),
        });
        return true;
      }

      // Dùng cùng hàng đợi với cập nhật yêu thích để tránh
      // hai thao tác ghi đè bộ nhớ đệm của nhau.
      const cacheWrite = favoriteCacheQueueRef.current.then(
        async () => {
          if (!isCurrentAccount()) return;

          const current = userCornerDataRef.current;

          const updated: UserCornerData = {
            ...current,
            [kind]: current[kind].filter(
              (item) => item.id !== id
            ),
          };

          setUserCornerData(updated);

          let cached = false;

          try {
            cached = await saveUserCornerData(email!, updated);
          } catch {
            cached = false;
          }

          if (!cached) {
            try {
              localStorage.removeItem(
                getUserCornerStorageKey(email!)
              );
            } catch {
              if (isCurrentAccount()) {
                toast.warning(
                  "Đã xóa trên máy chủ, nhưng chưa dọn được bộ nhớ đệm trên thiết bị."
                );
              }
            }
          }
        }
      );

      favoriteCacheQueueRef.current = cacheWrite.then(
        () => undefined,
        () => undefined
      );

      await cacheWrite;

      if (!isCurrentAccount()) return false;

      if (kind === "signals") {
        if (openedSavedSignal?.id === id) {
          setOpenedSavedSignal(null);
        }

        if (pendingMoodCheckInId === id) {
          setPendingMoodCheckInId(null);

          activeResultIdempotencyKeyRef.current =
            crypto.randomUUID();

          try {
            localStorage.removeItem(
              getAccountScopedKey(
                "tltl-current-checkin-id",
                email
              )
            );
          } catch {
            // Bản ghi trên máy chủ đã được xóa.
          }
        }
      }

      return true;
    } catch (error) {
      if (isCurrentAccount()) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Chưa xác nhận được việc xóa. Bạn hãy tải lại danh sách để kiểm tra."
        );
      }

      return false;
    } finally {
      cornerDeleteLocksRef.current.delete(lockId);
    }
  };
  const handleDeleteSignal = (id: string) => deleteCornerItem("signals", id, deleteSavedSignal);
  const handleDeleteXam = (id: string) => deleteCornerItem("xam", id, deleteSavedXam);
  const handleDeleteWish = (id: string) => deleteCornerItem("wishes", id, deleteSavedWish);

  const handleToggleFavorite = async (
    kind: "signals" | "xam" | "wishes",
    id: string
  ) => {
    const scope = cornerAccountScopeRef.current;
    const email = scope.email;

    if (!email && !isDemoMode()) return;

    const lockId = `${scope.version}:${kind}:${id}`;

    if (favoriteLocksRef.current.has(lockId)) return;

    // Không cập nhật yêu thích khi chính mục này đang bị xóa.
    if (cornerDeleteLocksRef.current.has(lockId)) return;

    const entry = userCornerDataRef.current[kind].find(
      (item) => item.id === id
    );

    if (!entry) return;

    favoriteLocksRef.current.add(lockId);

    const isCurrentAccount = () =>
      cornerAccountScopeRef.current === scope;

    try {
      const nextStarred = !entry.starred;

      const remoteItem =
        kind === "signals"
          ? await updateSavedSignal(id, nextStarred)
          : kind === "xam"
            ? await updateSavedXam(id, nextStarred)
            : await updateSavedWish(id, nextStarred);

      if (!isCurrentAccount()) return;

      if (isDemoMode()) {
        setUserCornerData((current) => ({
          ...current,
          [kind]: current[kind].map((item) =>
            item.id === id ? { ...item, starred: remoteItem.starred } : item
          ),
        }));
        return;
      }

      const remoteStarred = remoteItem.starred;

      if (typeof remoteStarred !== "boolean") {
        throw new Error(
          "Máy chủ chưa trả về trạng thái yêu thích hợp lệ. Bạn hãy tải lại danh sách để kiểm tra."
        );
      }

      const cacheWrite = favoriteCacheQueueRef.current.then(
        async () => {
          if (!isCurrentAccount()) return;

          const current = userCornerDataRef.current;

          // Mục có thể đã bị xóa trong lúc chờ phản hồi.
          if (!current[kind].some((item) => item.id === id)) {
            return;
          }

          const updated: UserCornerData = {
            ...current,
            [kind]: current[kind].map((item) =>
              item.id === id
                ? { ...item, starred: remoteStarred }
                : item
            ),
          };

          setUserCornerData(updated);

          let cached = false;

          try {
            cached = await saveUserCornerData(email!, updated);
          } catch {
            cached = false;
          }

          if (!cached) {
            // Tránh giữ cache cũ trái với trạng thái máy chủ.
            try {
              localStorage.removeItem(
                getUserCornerStorageKey(email!)
              );
            } catch {
              // Không đổi kết quả đã được máy chủ xác nhận.
            }

            if (isCurrentAccount()) {
              toast.info(
                "Đã cập nhật yêu thích trên máy chủ, nhưng chưa lưu được bộ nhớ đệm trên thiết bị."
              );
            }
          }
        }
      );

      favoriteCacheQueueRef.current = cacheWrite.then(
        () => undefined,
        () => undefined
      );

      await cacheWrite;
    } catch (error) {
      if (isCurrentAccount()) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Chưa xác nhận được thay đổi yêu thích. Bạn hãy tải lại danh sách để kiểm tra."
        );
      }
    } finally {
      favoriteLocksRef.current.delete(lockId);
    }
  };

  const handleToggleStarSignal = (id: string) => {
    void handleToggleFavorite("signals", id);
  };

  const handleToggleStarXam = (id: string) => {
    void handleToggleFavorite("xam", id);
  };

  const handleToggleStarWish = (id: string) => {
    void handleToggleFavorite("wishes", id);
  };

  const handleSavePrivateWish = async (
    content: string,
    category: string,
    requestId: string = crypto.randomUUID()
  ): Promise<boolean> => {
    const cleanContent = content.trim();

    if (!cleanContent || cleanContent.length > 1000) {
      return false;
    }

    const scope = cornerAccountScopeRef.current;
    const email = scope.email;
    const createdAt = Date.now();

    if (!email && !isDemoMode()) {
      const newWish: SavedWishItem = {
        id: requestId,
        category,
        content: cleanContent,
        createdAt,
        date: new Date(createdAt).toLocaleDateString("vi-VN"),
        sealed: true,
        starred: false,
      };

      setPendingSave({
        type: "wish",
        item: newWish,
      });

      navigateTo("login");
      return false;
    }

    const isCurrentAccount = () =>
      cornerAccountScopeRef.current === scope;

    let remoteWish: SavedWishItem;

    try {
      remoteWish = await saveWish(
        cleanContent,
        category,
        requestId
      );
    } catch (error) {
      if (isCurrentAccount()) {
        toast.error(
          error instanceof Error
            ? error.message
            : "Chưa xác nhận được việc lưu lời gửi gắm."
        );
      }

      return false;
    }

    if (!isCurrentAccount()) return false;

    if (isDemoMode()) {
      setUserCornerData((previous) => ({
        ...previous,
        wishes: [remoteWish, ...previous.wishes.filter((item) => item.id !== remoteWish.id)],
      }));
      return true;
    }

    // Dùng cùng hàng đợi với xóa và yêu thích.
    const cacheWrite = favoriteCacheQueueRef.current.then(
      async () => {
        if (!isCurrentAccount()) return;

        const current = userCornerDataRef.current;

        const updated: UserCornerData = {
          ...current,
          wishes: [
            remoteWish,
            ...current.wishes.filter(
              (item) => item.id !== remoteWish.id
            ),
          ],
        };

        setUserCornerData(updated);

        let cached = false;

        try {
          cached = await saveUserCornerData(email!, updated);
        } catch {
          cached = false;
        }

        if (!cached) {
          try {
            localStorage.removeItem(
              getUserCornerStorageKey(email!)
            );
          } catch {
            // BE đã xác nhận lưu.
          }

          if (isCurrentAccount()) {
            toast.info(
              "Đã lưu trên máy chủ, nhưng chưa lưu được bộ nhớ đệm trên thiết bị."
            );
          }
        }
      }
    );

    favoriteCacheQueueRef.current = cacheWrite.then(
      () => undefined,
      () => undefined
    );

    await cacheWrite;

    return isCurrentAccount();
  };


  const handleSaveDayToCalendar = async (dayData: {
    title: string;
    day: number;
    month: number;
    year: number;
  }): Promise<boolean> => {
    try {
      const currentList = loadCalendarPersonalNotes(
        currentUser?.email
      );

      const exists = currentList.some((note) =>
        note.title === dayData.title && note.day === dayData.day &&
        note.month === dayData.month && note.year === dayData.year
      );
      if (exists && !currentUser) return true;

      const lunarInfo = getReliableLunarDate(
        dayData.day,
        dayData.month,
        dayData.year
      );

      const newNote = {
        id: crypto.randomUUID(),
        title: dayData.title,
        typeLabel: "Ghi chú cá nhân",
        region: "Cá nhân",
        shortDesc: "Ngày dự định do bạn chọn.",
        lunarDate: lunarInfo
          ? `Ngày ${lunarInfo.lunarDay}/${lunarInfo.lunarMonth} âm lịch (${lunarInfo.canChiYear})`
          : "Chưa có thông tin âm lịch",
        day: dayData.day,
        month: dayData.month,
        year: dayData.year,
        type: "personal" as const,
      };

      const savedNote = currentUser || isDemoMode() ? await saveCalendarNote(dayData) : newNote;
      const nextList = [savedNote, ...currentList.filter((note) =>
        !(note.title === dayData.title && note.day === dayData.day &&
          note.month === dayData.month && note.year === dayData.year)
      )];
      localStorage.setItem(getCalendarNotesStorageKey(currentUser?.email), JSON.stringify(nextList));
      window.dispatchEvent(new Event(CALENDAR_NOTES_CHANGED_EVENT));

      return true;
    } catch {
      return false;
    }
  };

  const currentDateLabel = new Date().toLocaleDateString("vi-VN");

  const isCurrentSignalSaved = Boolean(
    publishedSignal && currentUser &&
      userCornerData.signals.some((entry) =>
        isSameSavedReflection(entry, {
          signalId: publishedSignal.id,
          date: currentDateLabel,
          journal: journalText,
        })
      )
  );

  const cornerHasCurrentResult =
    cornerLoadState.email === (currentUser?.email ?? null);

  const cornerReady =
    sessionResolved &&
    cornerHasCurrentResult &&
    cornerLoadState.status === "ready";

  const cornerFailed =
    sessionResolved &&
    cornerHasCurrentResult &&
    cornerLoadState.status === "error";

  const sidebarArea = ["account", "mood-journey", "notifications", "settings", "membership"].includes(screen)
    ? "account"
    : [
        "culture",
        "culture-detail",
        "culture-map",
        "region-culture",
        "chau-van",
        "sea-prayer",
        "southern-culture",
        "rituals",
        "ritual-detail",
        "calendar",
        "calendar-detail",
        "good-days",
      ].includes(screen)
      ? "discover"
      : [
          "experience",
          "zen",
          "wish",
          "gratitude",
          "xinxam",
          "xinkeo",
          "sanctuary",
          "ancestor-altar",
          "astrology",
        ].includes(screen)
        ? "experience"
      : null;

  return (
    <div className={`app-shell ${dark ? "dark" : ""} ${["login", "register", "forgot", "reset-password"].includes(screen) ? "lg:h-screen lg:max-h-screen lg:overflow-hidden" : ""}`}>
      {isDemoMode() && (
        <aside
          role="status"
          aria-label="Thông báo chế độ demo"
          className="relative z-[80] flex flex-wrap items-center justify-between gap-2.5 border-b border-amber-600/30 bg-gradient-to-r from-amber-500/12 via-amber-500/18 to-amber-500/12 px-4 sm:px-6 py-2 text-xs text-ink backdrop-blur-md shadow-2xs"
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-amber-950 dark:text-amber-200">Chế độ trải nghiệm mẫu</span>
            <span className="hidden sm:inline text-line">•</span>
            <span className="hidden sm:inline text-muted font-normal">Dữ liệu lưu cục bộ trên trình duyệt, không lưu lên máy chủ</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="/admin?demo=1"
              className="inline-flex items-center gap-1 rounded-full border border-amber-600/35 bg-amber-500/15 hover:bg-amber-500/25 px-3 py-1 font-semibold text-amber-950 dark:text-amber-100 transition-all hover:scale-102 active:scale-98 shadow-2xs"
            >
              <span>Vào Cổng Admin Mẫu</span>
            </a>
            <button
              type="button"
              onClick={exitDemoMode}
              className="inline-flex items-center gap-1 rounded-full border border-line bg-surface/80 hover:bg-surface px-2.5 py-1 text-muted hover:text-ink font-medium transition-all active:scale-98"
              title="Thoát chế độ trải nghiệm mẫu"
            >
              <span>Thoát</span>
            </button>
          </div>
        </aside>
      )}
      {/* Universal Header - tự động ẩn khi ấn đăng nhập tại LoginScreen */}
      {!isLoginImmersive && (
        <AppHeader
          currentScreen={screen}
          onNavigate={navigateTo}
          demoMode={isDemoMode()}
          dark={dark}
          onToggleDark={handleToggleTheme}
          onLoginClick={() => navigateTo("login")}
          user={displayUser}
          onLogout={isDemoMode() ? undefined : handleRequestLogout}
        />
      )}

      {/* Screen Router */}
      <div className={`app-screen-outlet ${["login", "register", "forgot"].includes(screen) ? "flex-1 min-h-0 lg:overflow-hidden" : ""}`}>
        <div className={sidebarArea ? "app-area-layout" : undefined}>
          {sidebarArea && <AppSectionSidebar area={sidebarArea} currentScreen={screen} onNavigate={navigateTo} user={displayUser} />}
          <div className={sidebarArea ? "app-area-layout__content" : undefined}>
        <Suspense
          fallback={
            <div
              className="page-container max-w-7xl text-sm text-muted"
              role="status"
            >
              Đang mở nội dung…
            </div>
          }
        >
          <ScreenFocus key={screen}>
        {screen === "about" && <AboutScreen onNavigate={navigateTo} />}

        {screen === "today" && (
          <TodayScreen
            signal={publishedSignal}
            isCheckedIn={isCheckedIn}
            mood={selectedMood}
            isActionDone={isActionDone}
            onSelectMoodClick={() => navigateTo("mood")}
            onViewSignalDetails={() => publishedSignal
              ? navigateTo("result", publishedSignal.id)
              : navigateTo("mood")}
            selectedTopics={selectedTopics}
            onGoToCulture={() => navigateTo("culture")}
            onGoToExperience={() => navigateTo("experience")}
            onGoToZen={() => navigateTo("zen")}
            onGoToXinXam={() => navigateTo("xinxam")}
            onGoToRituals={() => navigateTo("rituals")}
            onGoToReminders={() => navigateTo("notifications")}
            onGoToGratitude={() => navigateTo("gratitude")}
            onGoToCultureMap={() => navigateTo("culture-map")}
            onGoToAbout={() => navigateTo("about")}
          />
        )}

        {screen === "mood" && (
          <MoodCheckInScreen
            selectedMood={selectedMood}
            onSelectMood={setSelectedMood}
            journalText={journalText}
            onChangeJournal={setJournalText}
            onBackToToday={() => navigateTo("today")}
            onSubmit={handleSubmitMood}
            isSubmitting={isMoodSubmitting}
            isLoggedIn={Boolean(currentUser) || isDemoMode()}
            contextKey={selectedContextKey}
            onChangeContext={setSelectedContextKey}
          />
        )}

        {screen === "loading" && (
          <SignalLoadingScreen
            requestNotice={moodRequestNotice}
            onFinishLoading={handleFinishLoading}
            onCancel={handleCancelMoodLoading}
          />
        )}

        {screen === "result" && !savedRecordId && publishedSignal && (
          <SignalResultScreen
            journalText={journalText}
            requestNotice={moodRequestNotice || undefined}
            isLoggedIn={Boolean(currentUser) || isDemoMode()}
            mood={selectedMood}
            signal={publishedSignal}
            isActionDone={isActionDone}
            onToggleAction={handleToggleAction}
            onGoToCompletion={() => navigateTo("saved")}
            onSaveToAccount={handleSaveResult}
            onRefreshSignal={handleRefreshSignal}
            onGoToDiary={() => navigateTo("account")}
            isSaved={isCurrentSignalSaved}
            onChangeContext={(contextKey) => void handleChangeSignalContext(contextKey)}
            onOpenCultureArticle={(articleId) => navigateTo("culture-detail", articleId)}
          />
        )}

        {screen === "result" && !savedRecordId && !publishedSignal && (
          <div className="page-container max-w-3xl py-12 text-center" role="status">
            <h1 className="font-display text-2xl font-bold text-ink">Chưa có gợi mở đã xuất bản</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Nội dung này không còn trong thư viện hiện hành hoặc chưa tải được từ máy chủ.
            </p>
            <button type="button" className="mt-5 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white" onClick={() => navigateTo("mood")}>
              Gửi check-in mới
            </button>
          </div>
        )}

        {screen === "result" && savedRecordId && savedRecordNotice && (
          <div className="page-container max-w-3xl py-12 text-center" role="status">
            <h1 className="font-display text-2xl font-bold text-ink">Bản kết quả đã lưu</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">{savedRecordNotice}</p>
            {savedRecordNotice !== "Đang tải bản ghi đã lưu từ máy chủ…" && (
              <button type="button" className="mt-5 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white" onClick={handleCloseSavedSignal}>
                Quay lại
              </button>
            )}
          </div>
        )}

        {screen === "experience" && (
          <ExperienceScreen
            onGoToXinXam={() => navigateTo("xinxam")}
            onGoToWish={() => navigateTo("wish")}
            onGoToZen={() => navigateTo("zen")}
            onGoToGratitude={() => navigateTo("gratitude")}
            onGoToXinKeo={() => navigateTo("xinkeo")}
            onGoToAstrology={() => navigateTo("astrology")}
            onGoToAncestorAltar={() => navigateTo("ancestor-altar")}
            onGoToCulture={() => navigateTo("culture")}
          />
        )}

        {(screen === "ancestor-altar" || screen === "sanctuary") && (
          <AncestorAltarScreen
            key={currentUser?.email ?? "guest"}
            currentUserEmail={currentUser?.email}
            onBack={() => navigateTo("experience")}
            isLoggedIn={Boolean(currentUser) || isDemoMode()}
            onSaveTribute={(text) =>
              handleSavePrivateWish(text, "Tri ân gia tiên")
            }
          />
        )}

        {screen === "culture" && (
          <CultureScreen
            onSelectArticle={(id) => {
              setSelectedArticleId(id);
              navigateTo("culture-detail", id);
            }}
            onGoToHome={() => navigateTo("today")}
          />
        )}

        {screen === "culture-map" && (
          <CulturalMapScreen
            onBackToCulture={() => navigateTo("culture")}
            onSelectRegion={(region) => {
              navigateTo(
                "region-culture",
                undefined,
                undefined,
                region
              );
            }}
          />
        )}

        {screen === "region-culture" && (
          <RegionCultureScreen
            region={selectedCultureRegion}
            onBack={() => navigateTo("culture-map")}
            onSelectArticle={(id) => {
              setSelectedArticleId(id);
              navigateTo("culture-detail", id);
            }}
            onGoToExperience={() => navigateTo("experience")}
            onGoToRegionalExperience={(kind) => navigateTo(kind)}
          />
        )}

        {(screen === "chau-van" || screen === "sea-prayer" || screen === "southern-culture") && (
          <RegionalExperienceScreen
            key={`${screen}-${currentUser?.email || "guest"}`}
            currentUserEmail={displayUser?.email}
            kind={screen as RegionalExperienceKind}
            onNavigateRegion={(targetKind) => navigateTo(targetKind)}
            onBack={() => {
              const region: CultureRegionSlug =
                screen === "chau-van"
                  ? "north"
                  : screen === "sea-prayer"
                    ? "central"
                    : "south";

              navigateTo(
                "region-culture",
                undefined,
                undefined,
                region
              );
            }}
            onGoToWish={() => navigateTo("wish")}
          />
        )}

        {screen === "culture-detail" && (
          <CultureDetailScreen
            articleId={selectedArticleId}
            currentUserEmail={currentUser?.email}
            onBackToCulture={() => navigateTo("culture")}
            onGoToCultureMap={() => navigateTo("culture-map")}
            onSelectRelatedArticle={(id) => {
              setSelectedArticleId(id);
              navigateTo("culture-detail", id);
            }}
            onGoToExperience={() => navigateTo("experience")}
            onGoToMood={() => navigateTo("mood")}
          />
        )}

        {screen === "xinxam" && (
          <XinXamScreen
            onGoToXinKeo={(drawId) => {
              navigateTo("xinkeo", drawId);
            }}
            onBackToExperienceHome={() => navigateTo("experience")}
            onGoToArticle={(articleId) => {
              setSelectedArticleId(articleId);
              navigateTo("culture-detail", articleId);
            }}
            onSaveToAccount={async (result) => {
              const createdAt = Date.now();

              const newXam: SavedXinXamItem = {
                id: crypto.randomUUID(),
                drawId: result.drawId,
                resultToken: result.resultToken,
                stickNumber: result.stickNumber,
                fortuneType:
                  result.fortuneType ||
                  result.sealText ||
                  "Thượng Cát",
                category: result.category || result.topic,
                region: result.region,
                quote: result.quote,
                createdAt,
                date: new Date(createdAt).toLocaleDateString("vi-VN"),
                starred: false,
              };

              if (!currentUser && !isDemoMode()) {
                setPendingSave({
                  type: "xam",
                  item: newXam,
                });

                navigateTo("login");
                return false;
              }

              let remoteItem: SavedXinXamItem;
              try { remoteItem = await saveXam(result); }
              catch { return false; }

              if (isDemoMode()) {
                setUserCornerData((previous) => ({
                  ...previous,
                  xam: [remoteItem, ...previous.xam.filter((item) => item.id !== remoteItem.id)],
                }));
                return true;
              }

              if (!currentUser) return false;

              const exists = userCornerData.xam.some(
                (item) =>
                  Boolean(newXam.drawId) &&
                  item.drawId === newXam.drawId
              );

              if (exists) return true;

              const updated: UserCornerData = {
                ...userCornerData,
                xam: [
                  remoteItem,
                  ...userCornerData.xam.filter((item) => item.id !== remoteItem.id),
                ],
              };

              const saved = await saveUserCornerData(
                currentUser.email,
                updated
              );

              setUserCornerData(updated);
              return true;
            }}
            onGoToLogin={() => navigateTo("login")}
            onGoToExplore={() => navigateTo("culture")}
            onGoToWish={() => navigateTo("wish")}
            isLoggedIn={Boolean(currentUser) || isDemoMode()}
            savedXamList={userCornerData.xam}
          />
        )}

        {screen === "wish" && (
          <WishScreen
            onBackToExperience={() => navigateTo("experience")}
            onGoToDiary={() => navigateTo("account")}
            onGoToHome={() => navigateTo("today")}
            onGoToExplore={() => navigateTo("culture")}
            initialContent={
              pendingSave?.type === "wish"
                ? pendingSave.item.content
                : ""
            }
            initialCategory={
              pendingSave?.type === "wish"
                ? pendingSave.item.category
                : "Bình an"
            }
            onSaveJournal={(text, topic, requestId) =>
              handleSavePrivateWish(text, topic, requestId)
            }
            isLoggedIn={Boolean(currentUser) || isDemoMode()}
            currentUserEmail={currentUser?.email}
          />
        )}

        {screen === "rituals" && (
          <RitualGuideScreen
            onSelectRitual={(id) => {
              setSelectedRitualId(id);
              navigateTo("ritual-detail", id);
            }}
            onGoToCulture={() => navigateTo("culture")}
          />
        )}

        {screen === "ritual-detail" && (
          <RitualDetailScreen
            currentUserEmail={currentUser?.email}
            ritualId={selectedRitualId}
            onBackToRitualList={() => navigateTo("rituals")}
            onSelectRelatedRitual={(id) => {
              setSelectedRitualId(id);
              navigateTo("ritual-detail", id);
            }}
            onGoToExperience={() => navigateTo("experience")}
            onGoToRegionalExperience={(kind) => navigateTo(kind)}
            onGoToAncestorAltar={() => navigateTo("ancestor-altar")}
            onGoToGoodDay={() => navigateTo("good-days")}
            onGoToZen={() => navigateTo("zen")}
          />
        )}

        {screen === "zen" && (
          <ZenScreen
            onBackToExperience={() => navigateTo("experience")}
            onGoToHome={() => navigateTo("today")}
          />
        )}

        {screen === "calendar" && (
          <CulturalCalendarScreen
            key={currentUser?.email || "guest"}
            currentUserEmail={currentUser?.email}
            onSelectEvent={(eventId) => {
              setSelectedCalendarEventId(eventId);
              navigateTo("calendar-detail", eventId);
            }}
            onGoToCulture={() => navigateTo("culture")}
            onGoToHome={() => navigateTo("today")}
            onGoToGoodDays={() => navigateTo("good-days")}
          />
        )}

        {screen === "calendar-detail" && (
          <EventDetailScreen
            eventId={selectedCalendarEventId}
            onBackToCalendar={() => navigateTo("calendar")}
            onGoToRituals={() => navigateTo("rituals")}
            onGoToExplore={() => navigateTo("culture")}
            onGoToHome={() => navigateTo("today")}
          />
        )}

        {screen === "gratitude" && (
          <GratitudeScreen
            onBackToExperience={() => navigateTo("experience")}
            onBackToHome={() => navigateTo("today")}
            onGoToCulture={() => navigateTo("culture")}
            user={currentUser}
            onSaveGratitude={(text) =>
              handleSavePrivateWish(text, "Tri ân & Tưởng niệm")
            }
          />
        )}

        {screen === "forgot" && (
          <ForgotPasswordScreen
            onBackToLogin={() => navigateTo("login")}
          />
        )}

        {screen === "reset-password" && (
          <ResetPasswordScreen onBackToLogin={() => navigateTo("login")} />
        )}

        {screen === "login" && (
          <LoginScreen
            onBack={() => {
              if (pendingSave?.type === "signal") {
                navigateTo("result", pendingSave.item.signalId);
              } else if (pendingSave?.type === "xam") {
                navigateTo("xinxam");
              } else if (pendingSave?.type === "wish") {
                navigateTo("wish");
              } else {
                const backTarget = returnScreenRef.current && !["login", "register", "forgot"].includes(returnScreenRef.current)
                  ? returnScreenRef.current
                  : "today";
                returnScreenRef.current = null;
                navigateTo(backTarget);
              }
            }}
            onSuccess={handleAuthenticated}
            onGoToRegister={() => navigateTo("register")}
            onGoToForgotPassword={() => navigateTo("forgot")}
            onImmersiveChange={setIsLoginImmersive}
            pendingSignalMood={
              pendingSave?.type === "signal"
                ? `Tín hiệu "${pendingSave.item.mood}"`
                : pendingSave?.type === "xam"
                ? `Thẻ xăm số ${pendingSave.item.stickNumber} (${pendingSave.item.fortuneType})`
                : pendingSave?.type === "wish"
                ? `Điều ước ${pendingSave.item.category}`
                : undefined
            }
          />
        )}

        {screen === "register" && (
          <RegisterScreen
            onBack={() => navigateTo("login")}
            onGoToLogin={() => navigateTo("login")}
            pendingSignalMood={
              pendingSave?.type === "signal"
                ? `Tín hiệu "${pendingSave.item.mood}"`
                : pendingSave?.type === "xam"
                ? `Thẻ xăm số ${pendingSave.item.stickNumber} (${pendingSave.item.fortuneType})`
                : pendingSave?.type === "wish"
                ? `Điều ước ${pendingSave.item.category}`
                : undefined
            }
          />
        )}

        {screen === "saved" && publishedSignal && (
          <CompletionScreen
            signal={publishedSignal}
            isActionDone={isActionDone}
            isLoggedIn={Boolean(currentUser) || isDemoMode()}
            isSaved={isCurrentSignalSaved}
            onGoToHome={() => navigateTo("today")}
            onGoToAccount={() => navigateTo("account")}
            onViewSignal={() =>
              navigateTo("result", publishedSignal.id)
            }
            onSaveToAccount={handleSaveResult}
          />
        )}

        {screen === "saved" && !publishedSignal && (
          <div className="page-container max-w-3xl py-12 text-center" role="status">
            <h1 className="font-display text-2xl font-bold text-ink">Chưa có kết quả để lưu</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted">Hãy gửi check-in và nhận lời gợi mở đã xuất bản trước.</p>
            <button type="button" className="mt-5 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white" onClick={() => navigateTo("mood")}>Gửi check-in</button>
          </div>
        )}

        {screen === "account" &&
          (!sessionResolved || (currentUser && !cornerReady)) && (
            <div className="page-container max-w-2xl py-12 text-center">
              {cornerFailed ? (
                <div role="alert">
                  <h1 className="text-xl font-semibold text-ink">
                    Chưa tải được Góc của tôi
                  </h1>

                  <p className="mt-3 text-sm leading-relaxed text-muted">
                    Chưa lấy được đầy đủ dữ liệu từ máy chủ.
                    Đây không phải xác nhận rằng danh sách của bạn trống.
                  </p>

                  <button
                    type="button"
                    className="mt-5 min-h-11 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-white"
                    onClick={() => {
                      setCornerLoadState({
                        email: currentUser?.email ?? null,
                        status: "loading",
                      });
                      setCornerReload((value) => value + 1);
                    }}
                  >
                    Thử tải lại
                  </button>
                </div>
              ) : (
                <p role="status" className="text-sm text-muted">
                  Đang tải Góc của tôi…
                </p>
              )}
            </div>
          )}

        {screen === "account" &&
          sessionResolved &&
          (!currentUser || cornerReady) && (
            <AccountScreen
            key={currentUser?.email ?? "guest"}
            currentUser={displayUser}
            savedSignals={userCornerData.signals}
            savedXamList={userCornerData.xam}
            savedWishList={userCornerData.wishes}
            onDeleteSignal={handleDeleteSignal}
            onDeleteXam={handleDeleteXam}
            onDeleteWish={handleDeleteWish}
            onToggleStarSignal={handleToggleStarSignal}
            onToggleStarXam={handleToggleStarXam}
            onToggleStarWish={handleToggleStarWish}
            onGoToSignalResult={handleOpenSavedSignal}
            onGoToXinXam={() => navigateTo("xinxam")}
            onGoToWish={() => navigateTo("wish")}
            onGoToMood={() => navigateTo("mood")}
            onGoToHome={() => navigateTo("today")}
          />
        )}

        {screen === "mood-journey" && (
          <MoodJourneyScreen
            savedSignals={userCornerData.signals}
            isLoggedIn={Boolean(currentUser) || isDemoMode()}
            onBack={() => navigateTo("account")}
            onGoToMood={() => navigateTo("mood")}
            onGoToSignalResult={handleOpenSavedSignal}
          />
        )}

        {screen === "notifications" && (
          <NotificationScreen
            currentUserEmail={currentUser?.email}
            onBack={() => navigateTo("account")}
            onGoToCalendar={() => navigateTo("calendar")}
          />
        )}

        {screen === "xinkeo" && (
          <XinKeoScreen
            key={`${currentUser?.email || "guest"}:${xinKeoDrawId || "standalone"}`}
            drawId={xinKeoDrawId}
            isLoggedIn={Boolean(currentUser) || isDemoMode()}
            onBackToExperience={() => navigateTo("experience")}
            onGoToCulture={() => navigateTo("culture")}
            onGoToHome={() => navigateTo("today")}
          />
        )}

        {screen === "good-days" && (
          <GoodDayScreen
            onBackToCulture={() => navigateTo("culture")}
            onGoToHome={() => navigateTo("today")}
            onGoToCalendar={() => navigateTo("calendar")}
            onGoToRituals={() => navigateTo("rituals")}
            onSaveDayToCalendar={handleSaveDayToCalendar}
          />
        )}

        {screen === "horoscope" && (
          <HoroscopeScreen
            key={currentUser?.email ?? "guest"}
            currentUserEmail={currentUser?.email}
            onGoToLogin={() => navigateTo("login")}
            onGoToMembership={() => navigateTo("membership")}
            onBackToExperience={() => navigateTo("experience")}
            onGoToCulture={() => navigateTo("culture")}
            onGoToHome={() => navigateTo("today")}
          />
        )}

        {screen === "astrology" && (
          <AstrologyHubScreen
            onBackToExperience={() => navigateTo("experience")}
            onGoToHoroscope={() => navigateTo("horoscope")}
          />
        )}

        {screen === "membership" && (
          <MembershipScreen
            currentUserEmail={currentUser?.email}
            onBackToHome={() => navigateTo("today")}
            onGoToExperience={() => navigateTo("experience")}
            onGoToLogin={() => navigateTo("login")}
          />
        )}

        {screen === "settings" && (
          <SettingsScreen
            onBackToAccount={() => navigateTo("account")}
            onGoToHome={() => navigateTo("today")}
            themePreference={themePreference}
            onChangeTheme={handleChangeTheme}
            selectedTopics={selectedTopics}
            onChangeTopics={handleSaveTopics}
            userSettings={userSettings}
            onChangeNotifications={handleChangeNotifications}
            user={displayUser}
            onUpdateProfile={handleUpdateProfile}
            onLogout={handleRequestLogout}
            onClearAllLocalData={async () => {
              if (isDemoMode()) {
                clearDemoValues();
                setUserCornerData({ signals: [], xam: [], wishes: [] });
                setDemoProfileName("An Nhiên");
                setUserSettings(DEFAULT_USER_SETTINGS);
                setSelectedTopics([]);
                setJournalText("");
                setPendingSave(null);
                return true;
              }
              if (!currentUser) return false;
              try { await apiRequest("/users/me/personal-content", { method: "DELETE" }); }
              catch { return false; }
              setUserCornerData({ signals: [], xam: [], wishes: [] });
              setOpenedSavedSignal(null);
              setJournalText("");
              setPendingSave(null);
              setIsCheckedIn(false);
              try { clearPersonalStorage(currentUser.email); }
              catch { return false; }
              return true;
            }}
          />
        )}
          </ScreenFocus>
        </Suspense>
          </div>
        </div>
      </div>

      {/* Universal Footer - Ẩn trên các màn Auth (login, register, forgot) */}
      {!["login", "register", "forgot"].includes(screen) && (
        <AppFooter onNavigate={navigateTo} compactDemo={false} />
      )}

      <SavedSignalDialog
        entry={openedSavedSignal}
        onClose={handleCloseSavedSignal}
      />
      <LogoutConfirmDialog
        open={showLogoutConfirm}
        userName={currentUser?.name}
        onConfirm={handleConfirmLogout}
        onCancel={handleCancelLogout}
      />
      <DemoPremiumPurchaseDialogHost />
      <ToastContainer />
    </div>
  );
}
