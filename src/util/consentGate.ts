// ===========================================================
// 🚦 CONSENT GATE — Domain 8 (s. 6, s. 9(3))
// ===========================================================
// The ONLY place non-essential scripts/tags may be loaded. Dispatch is driven
// by the server-resolved list, so a non-consented tag can never fire — not
// even a network call. Re-evaluated on every page/session; a withdrawal takes
// effect immediately.
//
// Usage:
//   initConsentGate();                  // once, on app boot
//   if (consentAllowed("analytics")) loadAnalytics();
//   if (consentAllowed("advertising")) loadAds();
//   onConsentChange((dispatch) => { ... });
//
// There is NO "strictly necessary" exemption under DPDP; strictly-functional
// trackers are always allowed (registered under s. 7(a) and noticed), and
// every other category requires consent.

export type CookieCategory =
  | "strictly_functional"
  | "captcha"
  | "analytics"
  | "advertising"
  | "personalisation"
  | "social_media"
  | "consent_audit";

const ALWAYS_ALLOWED: CookieCategory[] = ["strictly_functional"];

let dispatch: Set<string> = new Set(ALWAYS_ALLOWED);
const listeners = new Set<(d: string[]) => void>();

/** True when a category may load under the current dispatch. */
export const consentAllowed = (category: CookieCategory | string): boolean => {
  if (category === "strictly_functional") return true;
  return dispatch.has(category);
};

/** Current dispatch (categories allowed to fire). */
export const currentDispatch = (): string[] => Array.from(dispatch);

/** Subscribe to dispatch changes. Returns an unsubscribe fn. */
export const onConsentChange = (fn: (d: string[]) => void): (() => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

/** Replace the dispatch (called after fetching / saving a decision). */
export const setDispatch = (categories: string[]): void => {
  dispatch = new Set(["strictly_functional", ...categories]);
  for (const fn of listeners) fn(currentDispatch());
};

/**
 * Load a tag only if consented; otherwise resolve false without any network
 * call. `loader` is invoked at most once per call.
 */
export const loadIfConsented = async (
  category: CookieCategory,
  loader: () => void | Promise<void>
): Promise<boolean> => {
  if (!consentAllowed(category)) return false;
  await loader();
  return true;
};

/** Read the persisted dispatch synchronously (avoids a flash on first paint). */
export const hydrateDispatchFromStorage = (): void => {
  try {
    const raw = localStorage.getItem("dpdp_cookie_dispatch");
    if (raw) setDispatch(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
};

/** Persist the dispatch so the next page load gates before the first request. */
export const persistDispatch = (categories: string[]): void => {
  try {
    localStorage.setItem("dpdp_cookie_dispatch", JSON.stringify(categories));
  } catch {
    /* ignore */
  }
};
