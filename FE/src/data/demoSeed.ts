import type {
  SavedSignalItem,
  SavedWishItem,
  SavedXinXamItem,
} from "../screens/AccountScreen";
import type { CalendarEventItem } from "./calendarData";
import { getSignalForMoodContext, type MoodKey } from "./demoSignals";
import { readDemoValue, writeDemoValue } from "./demoStorage";

const SEED_MARKER = "tltl-demo-seed-v1";

export function ensureDemoSeeded(): void {
  try {
    if (localStorage.getItem(SEED_MARKER)) return;

    const signal = getSignalForMoodContext("An yên" as MoodKey, "general");
    const now = Date.now();
    const date = (daysAgo: number) =>
      new Date(now - daysAgo * 86_400_000).toLocaleDateString("vi-VN");

    if (!localStorage.getItem("tltl-demo-saved-signals")) {
      const sample: SavedSignalItem = {
        id: "demo-signal-reflection-1",
        signalId: signal.id,
        mood: signal.mood,
        contextKey: signal.contextKey,
        signalSnapshot: signal,
        actionDone: false,
        date: date(1),
        createdAt: now - 86_400_000,
        journal: "Mình muốn chậm lại một chút và nhìn rõ điều đang cần ưu tiên.",
        poemLine1: signal.poem.line1,
        poemLine2: signal.poem.line2,
        actionTitle: signal.action.title,
        starred: true,
      };
      writeDemoValue("saved-signals", [sample]);
    }

    if (!localStorage.getItem("tltl-demo-saved-xam")) {
      const sample: SavedXinXamItem = {
        id: "demo-xam-reflection-1",
        drawId: "demo-draw-1",
        stickNumber: "08",
        fortuneType: "Bình an",
        category: "Bình an & Tâm trí",
        region: "Bắc Bộ",
        quote: "Giữ lòng bình tĩnh, từng việc rồi sẽ tìm được cách tháo gỡ.",
        date: date(3),
        createdAt: now - 3 * 86_400_000,
        starred: false,
        verified: false,
      };
      writeDemoValue("saved-xam", [sample]);
    }

    if (!localStorage.getItem("tltl-demo-saved-wishes")) {
      const sample: SavedWishItem = {
        id: "demo-wish-reflection-1",
        category: "Tri ân gia tiên",
        content: "Mong gia đình luôn bình an, biết lắng nghe và nâng đỡ nhau.",
        date: date(2),
        createdAt: now - 2 * 86_400_000,
        sealed: true,
        starred: true,
      };
      writeDemoValue("saved-wishes", [sample]);
    }

    if (!localStorage.getItem("tltl-demo-calendar-notes")) {
      const sample: CalendarEventItem = {
        id: "demo-calendar-family-day",
        day: 15,
        month: 11,
        year: new Date().getFullYear(),
        type: "personal",
        typeLabel: "Ngày cá nhân",
        region: "Cá nhân",
        title: "Bữa cơm sum họp gia đình",
        shortDesc: "Một dịp để cả nhà dành thời gian cho nhau.",
        lunarDate: "",
      };
      writeDemoValue("calendar-notes", [sample]);
    }

    localStorage.setItem(SEED_MARKER, "true");
  } catch {
    // Demo remains usable if browser storage is unavailable.
  }
}

