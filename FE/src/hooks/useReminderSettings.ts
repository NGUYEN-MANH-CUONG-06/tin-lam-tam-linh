import { useMemo, useSyncExternalStore } from "react";
import {
  loadSettings,
  type ReminderSettings,
} from "../data/reminderData";
import { CALENDAR_NOTES_CHANGED_EVENT } from "../data/calendarData";

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(
    CALENDAR_NOTES_CHANGED_EVENT,
    listener
  );

  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(
      CALENDAR_NOTES_CHANGED_EVENT,
      listener
    );
  };
}

function readSnapshot(email?: string): string {
  // loadSettings đã kiểm tra và chuẩn hóa dữ liệu.
  // Trả chuỗi ổn định cho useSyncExternalStore.
  return JSON.stringify(loadSettings(email));
}

export function useReminderSettings(
  email?: string
): ReminderSettings {
  const snapshot = useSyncExternalStore(
    subscribe,
    () => readSnapshot(email),
    () => '{"firstDay":false,"fullMoon":false}'
  );

  return useMemo(
    () => JSON.parse(snapshot) as ReminderSettings,
    [snapshot]
  );
}
