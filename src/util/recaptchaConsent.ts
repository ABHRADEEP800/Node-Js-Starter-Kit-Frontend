// ===========================================================
// 🤖 reCAPTCHA CONSENT — Domain 8 (functional/security tracker)
// ===========================================================
// Google reCAPTCHA is required on sign-up / sign-in / password-reset, but it
// is still personal-data processing (sets Google cookies, sends an IP + a
// risk score). DPDP has no "strictly necessary" exemption, so the script may
// only load when the user's COOKIE CONSENT allows the `captcha` category.
//
// The server-side cookie-consent dispatch is the single source of truth — not
// a separate local flag — so refusing `captcha` anywhere (banner or gate)
// blocks the auth forms consistently. `useCaptchaConsent()` exposes that state
// to the auth pages.

import { useCallback, useEffect, useState } from "react";
import PrivacyService from "../services/privacyService";
import {
  setDispatch,
  persistDispatch,
  hydrateDispatchFromStorage,
} from "./consentGate";

export type CaptchaGateStatus = "loading" | "allowed" | "blocked";

const CAPTCHA = "captcha";

/** Is the anti-bot tracker currently allowed, given a cookie dispatch list? */
export const captchaAllowedByDispatch = (dispatch: string[]): boolean =>
  dispatch.includes(CAPTCHA);

export interface CaptchaConsent {
  status: CaptchaGateStatus;
  saving: boolean;
  /** Record the affirmative choice server-side, then unblock the form. */
  allow: () => Promise<void>;
  /** Record an explicit REFUSAL server-side (provable, append-only). */
  refuse: () => Promise<void>;
  /** Re-fetch the authoritative state (e.g. after the banner changes it). */
  refresh: () => Promise<void>;
}

/**
 * Hook the auth pages use to gate on the captcha consent.
 * - loading  → still checking; render a placeholder (never the form yet)
 * - allowed  → mount the reCAPTCHA provider + the form
 * - blocked  → show the explanation gate (what/why/vendor) and do NOT mount
 */
export function useCaptchaConsent(): CaptchaConsent {
  const [status, setStatus] = useState<CaptchaGateStatus>("loading");
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(async () => {
    hydrateDispatchFromStorage();
    try {
      const res = await PrivacyService.getCookieState();
      setDispatch(res.data.dispatch);
      persistDispatch(res.data.dispatch);
      // Refused (or never granted) ⇒ blocked; otherwise allowed.
      const allowed =
        captchaAllowedByDispatch(res.data.dispatch) &&
        res.data.preferences?.[CAPTCHA] !== false;
      setStatus(allowed ? "allowed" : "blocked");
    } catch {
      // Fail SAFE: if we cannot confirm consent, do not load the tracker.
      setStatus("blocked");
    }
  }, []);

  useEffect(() => {
    // Defer to a microtask so the effect body itself never setStates
    // synchronously (hydrateDispatchFromStorage notifies listeners).
    let active = true;
    Promise.resolve().then(() => {
      if (active) refresh();
    });
    return () => {
      active = false;
    };
  }, [refresh]);

  const allow = useCallback(async () => {
    setSaving(true);
    try {
      const res = await PrivacyService.saveCookieConsent({
        action: "custom",
        categories: { [CAPTCHA]: true },
      });
      setDispatch(res.data.dispatch);
      persistDispatch(res.data.dispatch);
      setStatus(captchaAllowedByDispatch(res.data.dispatch) ? "allowed" : "blocked");
    } catch {
      setStatus("blocked");
    } finally {
      setSaving(false);
    }
  }, []);

  // Explicit refusal: record it as a provable, append-only event (so we can
  // show we did NOT load the tracker without consent). Status stays blocked.
  const refuse = useCallback(async () => {
    setSaving(true);
    try {
      const res = await PrivacyService.saveCookieConsent({
        action: "custom",
        categories: { [CAPTCHA]: false },
      });
      setDispatch(res.data.dispatch);
      persistDispatch(res.data.dispatch);
      setStatus("blocked");
    } catch {
      // Even if the write fails, the choice remains blocked locally.
      setStatus("blocked");
    } finally {
      setSaving(false);
    }
  }, []);

  return { status, saving, allow, refuse, refresh };
}
