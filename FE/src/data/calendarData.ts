export type CalendarEventType = "custom" | "festival" | "personal";

export interface CalendarEventItem {
  id: string;
  day: number;
  month: number; // 1-12
  year: number;
  type: CalendarEventType;
  typeLabel: string;
  region: string;
  title: string;
  shortDesc: string;
  lunarDate: string;
  badge?: string;
  verifiedSource?: string;
  // Full detail fields for Screen 20
  heroImage?: string;
  heroCaption?: string;
  timing?: string;
  scope?: string;
  coreMeaning?: string;
  culturalMeaning?: {
    paragraphs: string[];
    quote: string;
  };
  customs?: Array<{
    title: string;
    desc: string;
  }>;
  youthActions?: Array<{
    step: number;
    title: string;
    desc: string;
  }>;
  regionalNuances?: {
    bac: string;
    trung: string;
    nam: string;
    note: string;
  };
}

/**
 * Chuyển đổi âm lịch Việt Nam dựa trên thuật toán thiên văn UTC+7.
 */
// -------------------------------------------------------------
// THUẬT TOÁN THIÊN VĂN HỌC TÍNH ÂM LỊCH VIỆT NAM (UTC+7)
// Tác giả: Hồ Ngọc Đức — Chuẩn mực thiên văn học Việt Nam
// -------------------------------------------------------------

import { convertSolar2Lunar } from "../../../shared/lunar-calendar.mjs";
export { convertSolar2Lunar };

const CAN_NAMES = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI_NAMES = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const mod = (value: number, divisor: number) => ((value % divisor) + divisor) % divisor;

export function getCanChiDay(date: Date): { name: string; can: string; chi: string } {
  const dayNumber = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000) + 2440588;
  const can = CAN_NAMES[mod(dayNumber + 9, 10)];
  const chi = CHI_NAMES[mod(dayNumber + 1, 12)];
  return { name: `${can} ${chi}`, can, chi };
}

export function getCanChiMonth(lunarMonth: number, lunarYear: number): string {
  const yearStem = mod(lunarYear - 4, 10);
  const firstMonthStem = mod((yearStem % 5) * 2 + 2, 10);
  const monthStem = mod(firstMonthStem + lunarMonth - 1, 10);
  const monthBranch = mod(lunarMonth + 1, 12);
  return `${CAN_NAMES[monthStem]} ${CHI_NAMES[monthBranch]}`;
}

const AUSPICIOUS_HOURS_BY_DAY_BRANCH: string[][] = [
  ["Tý (23–01)", "Sửu (01–03)", "Mão (05–07)", "Ngọ (11–13)", "Thân (15–17)", "Dậu (17–19)"],
  ["Dần (03–05)", "Mão (05–07)", "Tỵ (09–11)", "Thân (15–17)", "Tuất (19–21)", "Hợi (21–23)"],
  ["Tý (23–01)", "Sửu (01–03)", "Thìn (07–09)", "Tỵ (09–11)", "Mùi (13–15)", "Tuất (19–21)"],
  ["Tý (23–01)", "Dần (03–05)", "Mão (05–07)", "Ngọ (11–13)", "Mùi (13–15)", "Dậu (17–19)"],
  ["Dần (03–05)", "Thìn (07–09)", "Tỵ (09–11)", "Thân (15–17)", "Dậu (17–19)", "Hợi (21–23)"],
  ["Sửu (01–03)", "Thìn (07–09)", "Ngọ (11–13)", "Mùi (13–15)", "Tuất (19–21)", "Hợi (21–23)"],
];

export function getAuspiciousHoursForDay(dayBranch: string): string[] {
  const branchIndex = CHI_NAMES.indexOf(dayBranch);
  if (branchIndex < 0) return [];
  return AUSPICIOUS_HOURS_BY_DAY_BRANCH[branchIndex % 6];
}

const DAY_DEITIES = [
  "Thanh Long",
  "Minh Đường",
  "Thiên Hình",
  "Chu Tước",
  "Kim Quỹ",
  "Bảo Quang",
  "Bạch Hổ",
  "Ngọc Đường",
  "Thiên Lao",
  "Huyền Vũ",
  "Tư Mệnh",
  "Câu Trần",
] as const;

const SOLAR_TERM_MONTH_BRANCHES = [3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 0, 0, 1, 1, 2, 2, 3];
const FIRST_DAY_DEITY_BRANCH_BY_MONTH_BRANCH: Record<number, number> = {
  0: 8, // Tý, Ngọ: Thanh Long bắt đầu ở Thân
  1: 10, // Sửu, Mùi: bắt đầu ở Tuất
  2: 0, // Dần, Thân: bắt đầu ở Tý
  3: 2, // Mão, Dậu: bắt đầu ở Dần
  4: 4, // Thìn, Tuất: bắt đầu ở Thìn
  5: 6, // Tỵ, Hợi: bắt đầu ở Ngọ
  6: 8,
  7: 10,
  8: 0,
  9: 2,
  10: 4,
  11: 6,
};

/**
 * Vị thần trực ngày theo cách an 12 sao Hoàng/Hắc đạo dựa trên tháng tiết khí.
 * Đây là quy ước lịch dân gian để tham khảo, không phải đánh giá khoa học.
 */
export function getTraditionalDayDeity(date: Date, dayBranch: string): string | null {
  const dayBranchIndex = CHI_NAMES.indexOf(dayBranch);
  const solarTermIndex = SOLAR_TERM_NAMES.indexOf(
    getSolarTermForDate(date.getDate(), date.getMonth() + 1, date.getFullYear()),
  );
  if (dayBranchIndex < 0 || solarTermIndex < 0) return null;

  const monthBranch = SOLAR_TERM_MONTH_BRANCHES[solarTermIndex];
  const firstDayBranch = FIRST_DAY_DEITY_BRANCH_BY_MONTH_BRANCH[monthBranch];
  const deityIndex = (dayBranchIndex - firstDayBranch + 12) % 12;
  return DAY_DEITIES[deityIndex] ?? null;
}

export function getCanChiYear(lunarYear: number): string {
  const can = ["Canh", "Tân", "Nhâm", "Quý", "Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ"];
  const chi = ["Thân", "Dậu", "Tuất", "Hợi", "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi"];
  const c = can[lunarYear % 10];
  const ch = chi[lunarYear % 12];
  return `${c} ${ch}`;
}

export interface ReliableLunarDate {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  canChiYear: string;
  isFullMoon: boolean;
  isFirstDay: boolean;
  isLeapMonth?: boolean;
  solarTerm?: string;
  specialBadge?: string;
}

/**
 * Tính ngày âm lịch Việt Nam theo thuật toán thiên văn học UTC+7.
 */
export function getReliableLunarDate(
  day: number,
  month: number,
  year: number
): ReliableLunarDate {
  const [lunarDay, lunarMonth, lYear, isLeap] = convertSolar2Lunar(day, month, year);
  const canChi = getCanChiYear(lYear);
  const isFullMoon = lunarDay === 15;
  const isFirstDay = lunarDay === 1;

  let specialBadge: string | undefined;
  if (isFullMoon) {
    specialBadge = `Rằm tháng ${lunarMonth}`;
  } else if (isFirstDay) {
    specialBadge = `Mùng 1/${lunarMonth} AL`;
  }

  return {
    lunarDay,
    lunarMonth,
    lunarYear: lYear,
    canChiYear: canChi,
    isFullMoon,
    isFirstDay,
    isLeapMonth: isLeap,
    solarTerm: getSolarTermForDate(day, month, year),
    specialBadge,
  };
}

const SOLAR_TERM_NAMES = [
  "Xuân phân", "Thanh minh", "Cốc vũ", "Lập hạ", "Tiểu mãn", "Mang chủng",
  "Hạ chí", "Tiểu thử", "Đại thử", "Lập thu", "Xử thử", "Bạch lộ",
  "Thu phân", "Hàn lộ", "Sương giáng", "Lập đông", "Tiểu tuyết", "Đại tuyết",
  "Đông chí", "Tiểu hàn", "Đại hàn", "Lập xuân", "Vũ thủy", "Kinh trập",
];

/**
 * Tiết khí gắn với ngày dân sự Việt Nam (UTC+7), từ kinh độ biểu kiến gần đúng của Mặt Trời.
 * Công thức kinh độ xấp xỉ dùng trong engine âm lịch shared/lunar-calendar.mjs.
 * Quy ước 24 mốc cách nhau 15°; ngày có thời điểm giao tiết nhận tên tiết mới.
 * Cách chia mốc theo kinh độ Mặt Trời được mô tả tại https://www.hko.gov.hk/en/gts/time/24solarterms.htm.
 */
export function getSolarTermForDate(day: number, month: number, year: number): string {
  const longitudeAt = (timestamp: number) => {
    const julianDay = timestamp / 86400000 + 2440587.5;
    const t = (julianDay - 2451545) / 36525;
    const t2 = t * t;
    const radians = Math.PI / 180;
    const meanAnomaly = 357.5291 + 35999.0503 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
    const meanLongitude = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
    const correction = (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(radians * meanAnomaly)
      + (0.019993 - 0.000101 * t) * Math.sin(radians * 2 * meanAnomaly)
      + 0.00029 * Math.sin(radians * 3 * meanAnomaly);
    return ((meanLongitude + correction) % 360 + 360) % 360;
  };

  const nextLocalMidnightUtc = Date.UTC(year, month - 1, day + 1, -7) - 1;
  const endTerm = Math.floor(longitudeAt(nextLocalMidnightUtc) / 15);
  return SOLAR_TERM_NAMES[endTerm % 24];
}

/**
 * Khóa lưu trữ ghi chú lịch cá nhân theo tài khoản độc lập
 */
export const CALENDAR_NOTES_CHANGED_EVENT =
  "tltl-reminders-change";

export const getCalendarNotesStorageKey = (
  email?: string | null
): string => {
  const account = email?.trim().toLowerCase() || "guest";
  return `tltl-calendar-personal-notes_${account}`;
};

// Dùng khi chuẩn bị ghi dữ liệu: lỗi đọc phải được truyền ra.
const readCalendarNotesRawStrict = (
  email?: string | null
): string => {
  const scoped = localStorage.getItem(
    getCalendarNotesStorageKey(email)
  );

  if (scoped !== null) return scoped;

  const account = email?.trim().toLowerCase() || "guest";

  if (
    account === "guest"
  ) {
    return (
      localStorage.getItem("tltl-calendar-personal-notes") ??
      "[]"
    );
  }

  return "[]";
};

// Giữ cách đọc an toàn cho phần hiển thị hiện tại.
export const readCalendarNotesRaw = (
  email?: string | null
): string => {
  try {
    return readCalendarNotesRawStrict(email);
  } catch {
    return "[]";
  }
};

export const parseCalendarPersonalNotes = (
  raw: string
): CalendarEventItem[] => {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    const result: CalendarEventItem[] = [];
    const ids = new Set<string>();

    for (const entry of parsed) {
      if (
        typeof entry !== "object" ||
        entry === null ||
        Array.isArray(entry)
      ) {
        continue;
      }

      const item = entry as Record<string, unknown>;

      if (
        typeof item.id !== "string" ||
        !item.id.trim() ||
        typeof item.title !== "string" ||
        !item.title.trim() ||
        typeof item.day !== "number" ||
        typeof item.month !== "number" ||
        typeof item.year !== "number" ||
        !Number.isInteger(item.day) ||
        !Number.isInteger(item.month) ||
        !Number.isInteger(item.year) ||
        item.year < 1900 ||
        item.year > 9999 ||
        item.month < 1 ||
        item.month > 12 ||
        item.day < 1 ||
        item.day > 31
      ) {
        continue;
      }

      const id = item.id.trim();

      if (ids.has(id)) continue;

      const date = new Date(
        item.year,
        item.month - 1,
        item.day,
        12
      );

      if (
        date.getFullYear() !== item.year ||
        date.getMonth() + 1 !== item.month ||
        date.getDate() !== item.day
      ) {
        continue;
      }

      ids.add(id);

      result.push({
        id,
        title: item.title.trim(),
        day: item.day,
        month: item.month,
        year: item.year,

        // Key này chứa ghi chú cá nhân, không phải kho lễ hội.
        type: "personal",

        typeLabel:
          typeof item.typeLabel === "string"
            ? item.typeLabel
            : "Ghi chú cá nhân",

        region:
          typeof item.region === "string"
            ? item.region
            : "Cá nhân",

        shortDesc:
          typeof item.shortDesc === "string"
            ? item.shortDesc
            : "",

        lunarDate:
          typeof item.lunarDate === "string"
            ? item.lunarDate
            : "",
      });
    }

    return result;
  } catch {
    return [];
  }
};

const parseCalendarPersonalNotesStrict = (
  raw: string
): CalendarEventItem[] => {
  const parsed: unknown = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("Kho ghi chú Lịch không phải danh sách.");
  }

  const notes = parseCalendarPersonalNotes(raw);

  // Parser hiện tại loại bỏ mục lỗi và ID trùng.
  // Khi ghi, không được âm thầm bỏ những mục đó.
  if (notes.length !== parsed.length) {
    throw new Error(
      "Kho ghi chú Lịch có mục không hợp lệ hoặc ID trùng."
    );
  }

  return notes;
};

export const loadCalendarPersonalNotes = (
  email?: string | null
): CalendarEventItem[] => {
  return parseCalendarPersonalNotes(
    readCalendarNotesRaw(email)
  );
};

export const saveCalendarPersonalNotes = (
  email: string | null | undefined,
  notes: CalendarEventItem[]
): boolean => {
  try {
    // Kiểm tra kho đang lưu trước.
    // Nếu đọc lỗi hoặc dữ liệu hỏng, dừng trước khi ghi.
    parseCalendarPersonalNotesStrict(
      readCalendarNotesRawStrict(email)
    );

    // Kiểm tra toàn bộ danh sách sắp ghi.
    const cleanNotes = parseCalendarPersonalNotesStrict(
      JSON.stringify(notes)
    );

    localStorage.setItem(
      getCalendarNotesStorageKey(email),
      JSON.stringify(cleanNotes)
    );

    window.dispatchEvent(
      new Event(CALENDAR_NOTES_CHANGED_EVENT)
    );

    return true;
  } catch {
    return false;
  }
};

