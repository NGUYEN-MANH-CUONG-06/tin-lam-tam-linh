import { apiRequest } from "../lib/api";
import { isDemoMode } from "./demoMode";
import { readDemoValue, writeDemoValue } from "./demoStorage";
import type { CalendarEventItem } from "./calendarData";

export function loadCalendarNotes(): Promise<CalendarEventItem[]> {
  if (isDemoMode()) return Promise.resolve(readDemoValue<CalendarEventItem[]>("calendar-notes", []));
  return apiRequest<{ items: CalendarEventItem[] }>("/memory/calendar/notes").then((result) => result.items);
}

export function saveCalendarNote(input: Pick<CalendarEventItem, "title" | "day" | "month" | "year">) {
  if (isDemoMode()) {
    const note: CalendarEventItem = { ...input, id: `demo-note-${crypto.randomUUID()}`, type: "personal", typeLabel: "Ngày cá nhân", region: "Cá nhân", shortDesc: "Ghi chú lưu trên thiết bị trong phiên demo.", lunarDate: "" };
    writeDemoValue("calendar-notes", [note, ...readDemoValue<CalendarEventItem[]>("calendar-notes", [])]);
    return Promise.resolve(note);
  }
  return apiRequest<CalendarEventItem>("/memory/calendar/notes", { method: "POST", body: JSON.stringify(input) });
}

export function deleteCalendarNote(id: string) {
  if (isDemoMode()) {
    writeDemoValue("calendar-notes", readDemoValue<CalendarEventItem[]>("calendar-notes", []).filter((item) => item.id !== id));
    return Promise.resolve();
  }
  return apiRequest(`/memory/calendar/notes/${encodeURIComponent(id)}`, { method: "DELETE" });
}
