import { getReliableLunarDate } from "./calendarData";

export interface ReminderSettings {
  firstDay: boolean;
  fullMoon: boolean;
}

export interface UpcomingReminder {
  id: string;
  title: string;
  date: Date;
  daysAway: number;
}

export interface PersonalReminderNote {
  id: string;
  title: string;
  day: number;
  month: number;
  year: number;
}

export const EMPTY_SETTINGS: ReminderSettings = {
  firstDay: false,
  fullMoon: false,
};

export function getStorageKey(email?: string) {
  const account = email?.trim().toLowerCase() || "guest";
  return `tltl-reminders:${account}`;
}

export function loadSettings(email?: string): ReminderSettings {
  try {
    const raw = localStorage.getItem(getStorageKey(email));
    if (!raw) return { ...EMPTY_SETTINGS };

    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return { ...EMPTY_SETTINGS };
    }

    const value = parsed as Record<string, unknown>;
    return {
      firstDay: value.firstDay === true,
      fullMoon: value.fullMoon === true,
    };
  } catch {
    return { ...EMPTY_SETTINGS };
  }
}

export function getUpcomingReminders(
  settings: ReminderSettings,
  personalNotes: PersonalReminderNote[] = [],
): UpcomingReminder[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const result: UpcomingReminder[] = [];

  for (let offset = 0; offset < 60; offset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + offset);

    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    const dateId = `${year}-${month}-${day}`;

    if (settings.firstDay || settings.fullMoon) {
      const lunar = getReliableLunarDate(day, month, year);

      if (settings.firstDay && lunar.isFirstDay) {
        result.push({
          id: `first:${dateId}`,
          title: `Mùng một tháng ${lunar.lunarMonth}${lunar.isLeapMonth ? " nhuận" : ""}`,
          date,
          daysAway: offset,
        });
      }

      if (settings.fullMoon && lunar.isFullMoon) {
        result.push({
          id: `full:${dateId}`,
          title: `Rằm tháng ${lunar.lunarMonth}${lunar.isLeapMonth ? " nhuận" : ""}`,
          date,
          daysAway: offset,
        });
      }
    }

    for (const note of personalNotes) {
      if (note.day === day && note.month === month && note.year === year) {
        result.push({
          id: `note:${note.id}:${dateId}`,
          title: `Ghi chú — ${note.title}`,
          date,
          daysAway: offset,
        });
      }
    }
  }

  return result;
}
