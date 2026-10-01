import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Cog6ToothIcon,
  ShieldCheckIcon,
  MinusSmallIcon,
} from "@heroicons/react/24/outline";
import PrivacyService from "../../services/privacyService";
import type { CookieCategory, CookieStateResponse } from "../../types/dpdp";
import {
  hydrateDispatchFromStorage,
  persistDispatch,
  setDispatch,
} from "../../util/consentGate";

// Persist "the user has made a choice" so the initial banner doesn't nag.
const DECIDED_KEY = "dpdp_cookie_decided";

/**
 * Domain 8 consent banner + preference centre.
 * Mobile-first bottom sheet, keyboard-accessible, equal-weight accept/reject,
 * per-category toggles defaulting OFF, and a persistent one-tap entry point.
 *
 * The panel can be MINIMISED (never a false "close" that implies consent) so
 * the Privacy Notice / Privacy Center can be read underneath without the modal
 * covering them. Opening the notice from the panel minimises it automatically.
 */
function CookieConsent() {
  const [state, setState] = useState<CookieStateResponse | null>(null);
  const [open, setOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  // Fourth Schedule: affirmatively confirming the visitor is 18+. Until this is
  // ticked (or a signed-in adult is known), non-essential trackers stay off.
  const [ageAssured, setAgeAssured] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Allow the Privacy Center (or any surface) to open the same panel — the
  // one-tap withdrawal path (s. 6(4) equal ease).
  useEffect(() => {
    const openHandler = () => {
      setOpen(true);
      setShowDetails(true);
    };
    window.addEventListener("dpdp:open-cookie-settings", openHandler);
    return () => window.removeEventListener("dpdp:open-cookie-settings", openHandler);
  }, []);

  // Boot: hydrate the persisted dispatch (gates before the first tag fires),
  // then load the authoritative state.
  useEffect(() => {
    hydrateDispatchFromStorage();
    let active = true;
    (async () => {
      try {
        const res = await PrivacyService.getCookieState();
        if (!active) return;
        setState(res.data);
        setPrefs(res.data.preferences);
        setAgeAssured(res.data.age_assured === true);
        setDispatch(res.data.dispatch);
        persistDispatch(res.data.dispatch);
        const decided = localStorage.getItem(DECIDED_KEY) === "1";
        if (!decided) setOpen(true);
      } catch {
        /* fail safe: functional-only dispatch already in place */
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  // While the panel is open: lock background scroll, focus it, and let Escape
  // MINIMISE (never silently "accept").
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Move focus into the dialog for screen readers / keyboard users.
    const t = window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [open]);

  const apply = useCallback(
    async (action: "accept_all" | "reject_all" | "custom", categories: Record<string, boolean>) => {
      try {
        setBusy(true);
        setHint(null);
        const res = await PrivacyService.saveCookieConsent({
          action,
          categories,
          ageAssurance: ageAssured,
        });
        setDispatch(res.data.dispatch);
        persistDispatch(res.data.dispatch);
        localStorage.setItem(DECIDED_KEY, "1");
        // If the server could not grant non-essential categories (unknown-age
        // guest who did not confirm 18+), say so plainly instead of silently
        // appearing to accept.
        if (res.data.functional_only && action !== "reject_all") {
          setHint(
            "Saved. Because your age is not confirmed (and you are not signed in), only strictly functional cookies are active. Confirm you are 18+ or sign in to enable the others."
          );
          setState((s) => (s ? { ...s, preferences: res.data.categories, dispatch: res.data.dispatch } : s));
          setPrefs(res.data.categories);
          setShowDetails(true);
          return;
        }
        setOpen(false);
        setShowDetails(false);
      } catch {
        setHint("Could not save your choice. Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [ageAssured]
  );

  // Persistent one-tap "Cookie settings" entry point (equal-ease withdrawal).
  if (state && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open cookie settings"
        className="fixed bottom-4 left-4 z-40 inline-flex min-h-[44px] min-w-[44px] items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-lg transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-brand-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
      >
        <Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />
        Cookie settings
      </button>
    );
  }

  if (!open || !state) return null;

  // A category is locked-on only when the server says so (functional + the
  // consent-evidence record). `captcha` is deliberately NOT locked — the user
  // may refuse it, and the auth pages will then re-ask.
  const locked = (c: CookieCategory) => c.locked === true;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm motion-reduce:transition-none sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cookie-title"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-gray-200 bg-white p-5 shadow-xl outline-none motion-safe:transition-all dark:border-gray-700 dark:bg-gray-900 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheckIcon className="h-6 w-6 text-brand-600 dark:text-brand-400" aria-hidden="true" />
            <h2 id="cookie-title" className="text-lg font-bold text-gray-900 dark:text-white">
              Your cookie choices
            </h2>
          </div>
          {/* Minimise — NOT a consent-implying close. Reopens via the
              persistent "Cookie settings" button. */}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Minimise cookie settings"
            className="-mr-1 -mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-brand-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          >
            <MinusSmallIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          We use cookies and similar technologies. Under the DPDP Act 2023 there is
          no "strictly necessary" exemption, so every non-essential tracker needs
          your consent. Analytics, advertising, personalisation and social embeds
          are all separate choices — all off by default.
        </p>

        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Read the full{" "}
          <Link
            to="/privacy-notice"
            onClick={() => setOpen(false)}
            className="font-medium text-brand-600 underline dark:text-brand-400"
          >
            Privacy Notice
          </Link>{" "}
          — this panel will minimise so you can read it.
        </p>

        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          DPO: {state.dpo.email || state.dpo.name}. You can change your mind any
          time via "Cookie settings".
        </p>

        {hint && (
          <p
            role="status"
            className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
          >
            {hint}
          </p>
        )}

        {showDetails && (
          <div className="mt-4 space-y-3">
            {state.categories.map((c: CookieCategory) => {
              const isLocked = locked(c);
              return (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-800"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {c.label}
                      {isLocked && (
                        <span className="ml-1 text-xs font-normal text-gray-500">(always on)</span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                      {c.description}
                    </p>
                  </div>
                  <label className="flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-end">
                    <input
                      type="checkbox"
                      className="h-5 w-5"
                      disabled={isLocked || busy}
                      checked={isLocked ? true : !!prefs[c.id]}
                      onChange={(e) => setPrefs({ ...prefs, [c.id]: e.target.checked })}
                      aria-label={`${c.label} cookies`}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        )}

        {/* Fourth Schedule: age confirmation (permitted purpose). Required
            before non-essential categories can be granted. */}
        <label className="mt-4 flex items-start gap-2 rounded-lg bg-gray-50 p-3 text-xs text-gray-700 dark:bg-gray-800/60 dark:text-gray-200">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4"
            checked={ageAssured}
            onChange={(e) => setAgeAssured(e.target.checked)}
          />
          <span>
            I confirm I am 18 years or older. (We ask this only to confirm you are
            not a child — tracking and targeted advertising are disabled for anyone
            under 18 or not yet confirmed as an adult, s. 9(3).)
          </span>
        </label>

        {/* Equal visual weight for accept and reject — no dark patterns. */}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => apply("reject_all", {})}
            className="min-h-[44px] flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            Reject all
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => apply("accept_all", {})}
            className="min-h-[44px] flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
          >
            Accept all
          </button>
        </div>

        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowDetails((v) => !v)}
            className="min-h-[44px] flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {showDetails ? "Hide details" : "Manage preferences"}
          </button>
          {showDetails && (
            <button
              type="button"
              disabled={busy}
              onClick={() => apply("custom", prefs)}
              className="min-h-[44px] flex-1 rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50 disabled:opacity-50 dark:text-brand-400 dark:hover:bg-gray-800"
            >
              Save my choices
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CookieConsent;
