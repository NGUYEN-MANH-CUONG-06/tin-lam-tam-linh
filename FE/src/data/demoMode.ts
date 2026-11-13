const DEMO_QUERY = "demo";
const DEMO_SESSION_KEY = "tltl-demo-mode";

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  const requested = new URLSearchParams(window.location.search).get(DEMO_QUERY) === "1";
  if (requested) {
    try { window.sessionStorage.setItem(DEMO_SESSION_KEY, "true"); } catch { return true; }
  }
  try { return requested || window.sessionStorage.getItem(DEMO_SESSION_KEY) === "true"; }
  catch { return requested; }
}

export const DEMO_MODE_LABEL = "Demo giao dịch · lượt mua lưu cục bộ; Xin keo/Xin xăm dùng BE";

export function exitDemoMode(): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.removeItem(DEMO_SESSION_KEY); } catch { /* session storage may be disabled */ }
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.delete(DEMO_QUERY);
  window.location.assign(nextUrl.toString());
}

export function enterDemoMode(): void {
  if (typeof window === "undefined") return;
  try { window.sessionStorage.setItem(DEMO_SESSION_KEY, "true"); } catch { /* query flag still enables demo mode */ }
  const nextUrl = new URL(window.location.href);
  nextUrl.searchParams.set(DEMO_QUERY, "1");
  window.location.assign(nextUrl.toString());
}
