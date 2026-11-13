import { apiBackendRequest, apiRequest } from "../lib/api";
import { isDemoMode } from "./demoMode";
import { readDemoValue, writeDemoValue } from "./demoStorage";
import { DEMO_PUBLIC_SOURCES } from "./demoContent";
import type { RegionType, TopicType } from "./xinXamData";
import { trackProductEvent } from "./productAnalytics";
import type { SavedWishItem, SavedXinXamItem } from "../screens/AccountScreen";
import type { ContentMetadata } from "./contentMetadata";

export interface SourcedProverb {
  id: string;
  content: string;
  meaning: string;
  category: string;
  source: { name: string; url: string; license: string };
  verified: boolean;
}

export function loadSavedXam(): Promise<SavedXinXamItem[]> {
  if (isDemoMode()) return Promise.resolve(readDemoValue<SavedXinXamItem[]>("saved-xam", []));
  return apiRequest<{ items: SavedXinXamItem[] }>("/reflections/xin-xam").then((result) => result.items);
}

export function saveXam(result: {
  drawId?: string;
  resultToken?: string;
  stickNumber: string;
  topic: string;
  region: string;
  category?: string;
  fortuneType?: string;
  sealText?: string;
  quote: string;
}): Promise<SavedXinXamItem> {
  if (isDemoMode()) {
    const item: SavedXinXamItem = { id: `demo-saved-xam-${crypto.randomUUID()}`, drawId: result.drawId, resultToken: result.resultToken, stickNumber: result.stickNumber, fortuneType: result.fortuneType || result.sealText || "Bình", category: result.category || result.topic, region: result.region, quote: result.quote, date: new Date().toISOString(), createdAt: Date.now(), starred: false, source: DEMO_PUBLIC_SOURCES.xinXamPractice, verified: false };
    writeDemoValue("saved-xam", [item, ...readDemoValue<SavedXinXamItem[]>("saved-xam", [])]);
    return Promise.resolve(item);
  }
  return apiRequest<SavedXinXamItem>("/reflections/xin-xam", {
    method: "POST",
    body: JSON.stringify({
      drawId: result.drawId?.startsWith("guest:") ? undefined : result.drawId,
      resultToken: result.resultToken,
      stickNumber: result.stickNumber,
      xamType: result.topic,
      region: result.region,
      category: result.category || result.topic,
      fortuneType: result.fortuneType || result.sealText,
      quote: result.quote,
    }),
  });
}

export interface XinXamDrawResponse extends SavedXinXamItem {
  active: boolean;
  xamType: string;
  classification: string;
  rank: "Thượng Xăm" | "Trung Xăm" | "Hạ Xăm";
  classificationGroup: "CAT" | "NEUTRAL" | "CAUTION";
  poem: string | null;
  originalContent: {
    poem: string | null;
    meaning: string;
    advice: string;
    metadata: ContentMetadata;
  };
  aiExplanation: {
    content: string;
    metadata: ContentMetadata;
  } | null;
  meaning: string;
  advice: string;
  disclaimer: string;
  interpretation: {
    summary: string;
    recommendation: string;
    warning: string;
  };
  proverb: SourcedProverb | null;
}

export interface XinXamAvailability {
  region: string;
  topic: string;
  count: number;
  available: boolean;
}

export function loadXinXamAvailability(
  region: string,
  topic: string,
  options: { signal?: AbortSignal } = {},
): Promise<XinXamAvailability> {
  const params = new URLSearchParams({
    region,
    topic,
  });

  const request = isDemoMode() ? apiBackendRequest : apiRequest;
  return request<XinXamAvailability>(
    `/xam/availability?${params.toString()}`,
    {
      signal: options.signal,
    },
  );
}

export function drawXinXam(
  region: string,
  topic: string,
  question?: string,
  options: { signal?: AbortSignal } = {},
): Promise<XinXamDrawResponse> {
  const request = isDemoMode() ? apiBackendRequest : apiRequest;
  return request<XinXamDrawResponse>("/xam/draw", {
    method: "POST",
    body: JSON.stringify({
      region,
      topic,
      question,
    }),
    signal: options.signal,
  }).then((result) => {
    trackProductEvent("xam_draw_completed");
    return result;
  });
}

export function updateSavedXam(id: string, starred: boolean) {
  if (isDemoMode()) {
    const items = readDemoValue<SavedXinXamItem[]>("saved-xam", []);
    const item = items.find((entry) => entry.id === id);
    if (item) item.starred = starred;
    writeDemoValue("saved-xam", items);
    return Promise.resolve(item || { id, starred } as SavedXinXamItem);
  }
  return apiRequest<SavedXinXamItem>(`/reflections/xin-xam/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ starred }),
  });
}

export function deleteSavedXam(id: string) {
  if (isDemoMode()) {
    writeDemoValue("saved-xam", readDemoValue<SavedXinXamItem[]>("saved-xam", []).filter((item) => item.id !== id));
    return Promise.resolve();
  }
  return apiRequest(`/reflections/xin-xam/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function loadSavedWishes(): Promise<SavedWishItem[]> {
  if (isDemoMode()) return Promise.resolve(readDemoValue<SavedWishItem[]>("saved-wishes", []));
  return apiRequest<{ items: SavedWishItem[] }>("/wishes").then((result) => result.items);
}

export function saveWish(
  content: string,
  category: string,
  requestId: string = crypto.randomUUID()
): Promise<SavedWishItem> {
  if (isDemoMode()) {
    const item: SavedWishItem = { id: `demo-wish-${requestId}`, category, content, date: new Date().toISOString(), createdAt: Date.now(), sealed: true, starred: false };
    writeDemoValue("saved-wishes", [item, ...readDemoValue<SavedWishItem[]>("saved-wishes", []).filter((entry) => entry.id !== item.id)]);
    return Promise.resolve(item);
  }
  return apiRequest<SavedWishItem>("/wishes", {
    method: "POST",
    body: JSON.stringify({
      content,
      category,
      requestId,
    }),
  });
}

export function updateSavedWish(id: string, starred: boolean) {
  if (isDemoMode()) {
    const items = readDemoValue<SavedWishItem[]>("saved-wishes", []);
    const item = items.find((entry) => entry.id === id);
    if (item) item.starred = starred;
    writeDemoValue("saved-wishes", items);
    return Promise.resolve(item || { id, starred } as SavedWishItem);
  }
  return apiRequest<SavedWishItem>(`/wishes/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ starred }),
  });
}

export function deleteSavedWish(id: string) {
  if (isDemoMode()) {
    writeDemoValue("saved-wishes", readDemoValue<SavedWishItem[]>("saved-wishes", []).filter((item) => item.id !== id));
    return Promise.resolve();
  }
  return apiRequest(`/wishes/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export interface XinKeoCast {
  id: string;
  throwNumber: number;
  type: "nhat-am-nhat-duong" | "nhi-duong" | "nhi-am";
  piece1: "am" | "duong";
  piece2: "am" | "duong";
  proverb: SourcedProverb | null;
  resultToken?: string;
}

export interface XinKeoSession {
  id: string;
  question: string;
  drawId: string | null;
  throws: XinKeoCast[];
}

export function loadXinKeoSession(
  sessionId: string,
): Promise<XinKeoSession> {
  if (isDemoMode()) {
    const sessions = readDemoValue<Record<string, XinKeoSession>>("xin-keo-sessions", {});
    const session = sessions[sessionId];
    return session ? Promise.resolve(session) : Promise.reject(new Error("Không tìm thấy lượt xin keo demo."));
  }
  return apiRequest<XinKeoSession>(
    `/reflections/xin-keo/sessions/${encodeURIComponent(sessionId)}`,
  );
}

export function createXinKeoSession(question: string, drawId?: string): Promise<{ id: string }> {
  if (isDemoMode()) {
    const id = `demo-keo-${crypto.randomUUID()}`;
    const sessions = readDemoValue<Record<string, XinKeoSession>>("xin-keo-sessions", {});
    sessions[id] = { id, question, drawId: drawId || null, throws: [] };
    writeDemoValue("xin-keo-sessions", sessions);
    return Promise.resolve({ id });
  }
  return apiRequest<{ id: string }>("/reflections/xin-keo/sessions", {
    method: "POST",
    body: JSON.stringify({ question, drawId }),
  });
}

export function castXinKeo(
  sessionId: string,
  requestId: string
): Promise<XinKeoCast> {
  if (isDemoMode()) {
    const sessions = readDemoValue<Record<string, XinKeoSession>>("xin-keo-sessions", {});
    const session = sessions[sessionId];
    if (!session) return Promise.reject(new Error("Không tìm thấy lượt xin keo demo."));
    return apiBackendRequest<XinKeoCast>("/demo/reflections/xin-keo/throws", {
      method: "POST",
      body: JSON.stringify({ sessionId, requestId, question: session.question }),
    }).then((result) => {
      const cast: XinKeoCast = { ...result, proverb: null };
      session.throws.push(cast);
      writeDemoValue("xin-keo-sessions", sessions);
      return cast;
    });
  }
  return apiRequest<XinKeoCast>(
    `/reflections/xin-keo/sessions/${encodeURIComponent(sessionId)}/throws`,
    {
      method: "POST",
      body: JSON.stringify({ requestId }),
    }
  );
}

export function interpretDemoXinKeo(resultToken: string) {
  if (!isDemoMode()) return Promise.reject(new Error("Demo interpretation is unavailable."));
  return apiBackendRequest<{
    status: "SUCCESS" | "INSUFFICIENT_EVIDENCE";
    summary: string;
    traditionalMeaning: string;
    symbolicAnalysis: string;
    contextualInterpretation: string;
    practicalAdvice: string[];
    cautions: string[];
    sourceRefs: string[];
    model: string;
  }>("/demo/reflections/xin-keo/interpretation", {
    method: "POST",
    body: JSON.stringify({ resultToken }),
  });
}

export function interpretDemoXinXam(resultToken: string, topic: string, question?: string) {
  if (!isDemoMode()) return Promise.reject(new Error("Demo interpretation is unavailable."));
  return apiBackendRequest<{
    status: "SUCCESS" | "INSUFFICIENT_EVIDENCE";
    summary: string;
    traditionalMeaning: string;
    symbolicAnalysis: string;
    contextualInterpretation: string;
    practicalAdvice: string[];
    cautions: string[];
    sourceRefs: string[];
    model: string;
  }>("/demo/reflections/xin-xam/interpretation", {
    method: "POST",
    body: JSON.stringify({ resultToken, topic, question }),
  });
}

export function loadReflectionProverb(context: "XAM" | "KEO"): Promise<SourcedProverb> {
  if (isDemoMode()) return Promise.resolve({
    id: "demo-proverb-tri-an",
    content: "Ăn quả nhớ kẻ trồng cây",
    meaning: context === "KEO" ? "Một câu tục ngữ nhắc về lòng biết ơn; kết quả gieo keo chỉ là mô phỏng." : "Lời nhắc về lòng biết ơn và những người góp phần tạo nên điều tốt đẹp.",
    category: "Lời nhắc văn hóa",
    source: { name: "Ca dao Mẹ", url: "https://cadao.me/an-qua-nho-ke-trong-cay/", license: "Trang sưu tầm; dị bản và xuất xứ cần đối chiếu" },
    verified: false,
  });
  return apiRequest<SourcedProverb>(`/content/reflection-proverb?context=${context}`);
}
