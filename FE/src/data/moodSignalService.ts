import { apiRequest } from "../lib/api";
import { isDemoMode } from "./demoMode";
import { readDemoValue, writeDemoValue } from "./demoStorage";
import { DEMO_PUBLIC_SOURCES } from "./demoContent";
import { getSignalForMoodContext } from "./demoSignals";
import { trackProductEvent } from "./productAnalytics";
import type { MoodContextKey, MoodKey, SignalData } from "./demoSignals";
import type { SavedSignalItem } from "../screens/AccountScreen";

interface ServerSignalSummary {
  id: string;
  mood: MoodKey;
  contextKey?: MoodContextKey;
}

interface CheckInResult {
  checkIn: {
    id: string;
    mood: MoodKey;
    contextKey: MoodContextKey;
    actionDone: boolean;
    signalId: string | null;
  };
  signal: SignalData;
}

function makeDemoSignal(mood: MoodKey, contextKey: MoodContextKey, suffix = "preview"): SignalData {
  const signal = structuredClone(getSignalForMoodContext(mood, contextKey));
  signal.id = `demo-${mood}-${contextKey}-${suffix}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
  signal.contextKey = contextKey;
  signal.metadata = {
    contentKind: "editorial",
    editorialStatus: "published",
    sources: [{
      id: "who-stress-guide",
      title: "Doing What Matters in Times of Stress: An Illustrated Guide",
      authorOrOrganization: "World Health Organization",
      url: DEMO_PUBLIC_SOURCES.stressGuide,
      locator: "Các bài tập grounding, nhận biết và tự tử tế với bản thân",
    }],
    quotationVerified: false,
    editorialNote: "Phần chiêm nghiệm và thơ do sản phẩm biên soạn; tài liệu WHO chỉ là nguồn tham khảo cho gợi ý thực hành chú tâm, không phải nguồn của câu thơ.",
  };
  signal.research = {
    title: "Gợi ý thực hành chăm sóc tinh thần",
    source: "WHO · Doing What Matters in Times of Stress",
    region: "Chiêm nghiệm chung",
    note: "Thực hành ngắn để chú ý đến hiện tại; không phải chẩn đoán hay thay thế hỗ trợ chuyên môn.",
  };
  return signal;
}

export function analyzeMoodSignal(input: {
  mood: MoodKey;
  contextKey: MoodContextKey;
  excludeSignalId?: string;
}, options: { signal?: AbortSignal } = {}): Promise<{ signal: SignalData; aiUsed: boolean }> {
  if (isDemoMode()) return Promise.resolve({ signal: makeDemoSignal(input.mood, input.contextKey), aiUsed: false });
  return apiRequest("/mood/analyze-signal", {
    method: "POST",
    body: JSON.stringify(input),
    signal: options.signal,
  });
}

export function loadSignals(mood?: MoodKey, contextKey: MoodContextKey = "general"): Promise<{ items: ServerSignalSummary[] }> {
  if (isDemoMode()) {
    const moods = mood ? [mood] : ["An yên", "Chênh vênh", "Biết ơn"] as MoodKey[];
    return Promise.resolve({ items: moods.map((item) => ({ id: makeDemoSignal(item, contextKey).id, mood: item, contextKey })) });
  }
  const params = new URLSearchParams();
  if (mood) params.set("mood", mood);
  params.set("contextKey", contextKey);
  const query = `?${params.toString()}`;
  return apiRequest<{ items: ServerSignalSummary[] }>(`/signals${query}`);
}

export function loadSignalById(signalId: string): Promise<SignalData> {
  if (isDemoMode()) {
    const stored = readDemoValue<Record<string, SignalData>>("signals", {});
    const signal = stored[signalId];
    if (signal) return Promise.resolve(signal);
    const moods = ["An yên", "Chênh vênh", "Biết ơn", "Băn khoăn", "Nôn nóng", "Cần điểm tựa", "Áp lực", "Cô đơn", "Vui vẻ", "Mông lung"] as MoodKey[];
    const mood = moods.find((item) => makeDemoSignal(item, "general").id === signalId) || "An yên";
    return Promise.resolve(makeDemoSignal(mood, "general"));
  }
  return apiRequest<SignalData>(`/signals/${encodeURIComponent(signalId)}`);
}

export function loadSavedSignalById(checkInId: string): Promise<{
  item: SavedSignalItem;
  signal: SignalData;
  contentStatus: "available" | "withdrawn";
}> {
  if (isDemoMode()) {
    const saved = readDemoValue<SavedSignalItem[]>("saved-signals", []).find((item) => item.id === checkInId);
    const signal = saved?.signalSnapshot;
    return saved && signal
      ? Promise.resolve({ item: saved, signal, contentStatus: "available" })
      : Promise.reject(new Error("Không tìm thấy kết quả demo đã lưu."));
  }
  return apiRequest<{
    item: SavedSignalItem;
    signal: SignalData;
    contentStatus: "available" | "withdrawn";
  }>(`/signals/saved/${encodeURIComponent(checkInId)}`);
}

export function createMoodCheckIn(input: {
  mood: MoodKey;
  contextKey: MoodContextKey;
  note?: string;
  signalId?: string;
  excludeSignalId?: string;
  actionDone?: boolean;
  idempotencyKey?: string;
}, options: { signal?: AbortSignal } = {}): Promise<CheckInResult> {
  if (isDemoMode()) {
    const checkInId = `demo-checkin-${crypto.randomUUID()}`;
    const signal = makeDemoSignal(input.mood, input.contextKey, checkInId);
    const checkins = readDemoValue<Record<string, CheckInResult>>("checkins", {});
    const result = { checkIn: { id: checkInId, mood: input.mood, contextKey: input.contextKey, actionDone: input.actionDone === true, signalId: signal.id }, signal };
    checkins[checkInId] = result;
    const signals = readDemoValue<Record<string, SignalData>>("signals", {});
    signals[signal.id] = signal;
    writeDemoValue("checkins", checkins);
    writeDemoValue("signals", signals);
    return Promise.resolve(result);
  }
  return apiRequest<CheckInResult>("/mood/check-ins", {
    method: "POST",
    body: JSON.stringify(input),
    signal: options.signal,
  }).then((result) => {
    trackProductEvent("mood_checkin_completed");
    return result;
  });
}

export function updateMoodAction(checkInId: string, actionDone: boolean) {
  if (isDemoMode()) {
    const checkins = readDemoValue<Record<string, CheckInResult>>("checkins", {});
    const item = checkins[checkInId];
    if (item) { item.checkIn.actionDone = actionDone; writeDemoValue("checkins", checkins); }
    return Promise.resolve({ id: checkInId, actionDone });
  }
  return apiRequest<{ id: string; actionDone: boolean }>(`/mood/check-ins/${encodeURIComponent(checkInId)}/action`, {
    method: "PATCH",
    body: JSON.stringify({ actionDone }),
  });
}

export function saveSignal(
  signalId: string,
  input: {
    checkInId?: string;
    note?: string;
    actionDone?: boolean;
    mood?: MoodKey;
    contextKey?: MoodContextKey;
    signalSnapshot?: SignalData;
    idempotencyKey?: string;
  },
): Promise<SavedSignalItem> {
  const { signalSnapshot, ...fields } = input;

  if (isDemoMode()) {
    const id = fields.checkInId || signalId;
    const signal = signalSnapshot || readDemoValue<Record<string, SignalData>>("signals", {})[signalId];
    const saved: SavedSignalItem = {
      id,
      signalId,
      mood: fields.mood || signal?.mood || "An yên",
      contextKey: fields.contextKey || signal?.contextKey || "general",
      signalSnapshot: signal,
      actionDone: fields.actionDone === true,
      date: new Date().toISOString(),
      createdAt: Date.now(),
      journal: fields.note,
      poemLine1: signal?.poem.line1 || "",
      poemLine2: signal?.poem.line2 || "",
      actionTitle: signal?.action.title,
      starred: false,
    };
    const savedItems = readDemoValue<SavedSignalItem[]>("saved-signals", []);
    writeDemoValue("saved-signals", [saved, ...savedItems.filter((item) => item.id !== saved.id)]);
    return Promise.resolve(saved);
  }

  return apiRequest<SavedSignalItem>(
    "/mood/save-signal",
    {
      method: "POST",
      body: JSON.stringify({
        ...fields,
        signalId,

        ...(!fields.checkInId
          ? {
              resultToken: signalSnapshot?.resultToken,
            }
          : {}),
      }),
    },
  );
}

export async function loadSavedSignals(): Promise<SavedSignalItem[]> {
  if (isDemoMode()) return readDemoValue<SavedSignalItem[]>("saved-signals", []);
  const result = await apiRequest<{ items: SavedSignalItem[] }>("/signals/saved");
  return result.items;
}

export function updateSavedSignal(checkInId: string, starred: boolean) {
  if (isDemoMode()) {
    const items = readDemoValue<SavedSignalItem[]>("saved-signals", []);
    const item = items.find((entry) => entry.id === checkInId);
    if (item) item.starred = starred;
    writeDemoValue("saved-signals", items);
    return Promise.resolve(item || { id: checkInId, starred } as SavedSignalItem);
  }
  return apiRequest<SavedSignalItem>(`/signals/saved/${encodeURIComponent(checkInId)}`, {
    method: "PATCH",
    body: JSON.stringify({ starred }),
  });
}

export function deleteSavedSignal(checkInId: string) {
  if (isDemoMode()) {
    writeDemoValue("saved-signals", readDemoValue<SavedSignalItem[]>("saved-signals", []).filter((item) => item.id !== checkInId));
    return Promise.resolve();
  }
  return apiRequest(`/signals/saved/${encodeURIComponent(checkInId)}`, {
    method: "DELETE",
  });
}
