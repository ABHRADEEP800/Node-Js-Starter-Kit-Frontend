import { useEffect, useState, type ReactNode } from "react";
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useCaptchaConsent } from "../../util/recaptchaConsent";
import RecaptchaConsentGate from "./RecaptchaConsentGate";
import { Loading } from "../";

const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

/**
 * Wraps an auth form so that:
 *   1. Nothing renders until the cookie-consent state is known (no flash).
 *   2. If the `captcha` tracker is NOT allowed, the form is replaced by an
 *      explanation gate (what/why/vendor) — the user must allow it first.
 *   3. The reCAPTCHA script is loaded, and the form is only mounted once it is
 *      actually READY — so the "reCAPTCHA not ready" error can never happen.
 *   4. If the script fails to load (bad key, offline, blocked), it times out
 *      with a clear, actionable error + retry instead of an infinite spinner.
 *
 * This keeps sign-up / sign-in / reset fully gate-able while remaining legal:
 * the tracker is never loaded without an affirmative cookie-consent choice.
 */
interface Props {
  children: ReactNode;
}

/** Renders children only once the reCAPTCHA script has initialised. */
function WaitForRecaptcha({ children }: { children: ReactNode }) {
  const { executeRecaptcha } = useGoogleReCaptcha();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (executeRecaptcha) return;
    // The library never rejects on load failure — it just warns and leaves
    // executeRecaptcha undefined. Fail visibly after a short window.
    const t = window.setTimeout(() => setTimedOut(true), 8000);
    return () => window.clearTimeout(t);
  }, [executeRecaptcha]);

  if (executeRecaptcha) return <>{children}</>;

  if (timedOut) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-md rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
      >
        <p className="font-semibold">The security check could not load</p>
        <p className="mt-1">
          We could not reach Google reCAPTCHA. This usually means the site key is
          missing/invalid for this domain, or your network is blocking it. Please
          reload the page and try again.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        >
          Reload
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <Loading />
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Loading the security check…
      </p>
    </div>
  );
}

function RecaptchaProviderGate({ children }: Props) {
  const consent = useCaptchaConsent();

  // A missing site key is a deployment error: the script would be requested as
  // `api.js?render=` and Google returns HTTP 400. Say so plainly in dev.
  if (!SITE_KEY) {
    return (
      <div
        role="alert"
        className="mx-auto max-w-md rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
      >
        <p className="font-semibold">reCAPTCHA is not configured</p>
        <p className="mt-1">
          Set <code>VITE_RECAPTCHA_SITE_KEY</code> in <code>.env</code> to your
          reCAPTCHA v3 <strong>site key</strong> (create one at{" "}
          <a
            href="https://www.google.com/recaptcha/admin/create"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            google.com/recaptcha/admin/create
          </a>
          , adding your domain such as <code>localhost</code>). Restart the dev
          server after changing <code>.env</code>.
        </p>
      </div>
    );
  }

  // 1. Unknown consent yet → don't render the form (avoids loading the tracker
  //    before we know).
  if (consent.status === "loading") {
    return (
      <div className="flex justify-center py-16">
        <Loading />
      </div>
    );
  }

  // 2. Not allowed → show the explanation gate. The form (and the script) do
  //    not exist until the user allows it.
  if (consent.status === "blocked") {
    return <RecaptchaConsentGate consent={consent} />;
  }

  // 3. Allowed → load the script and mount the form only once it is ready.
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={SITE_KEY}
      scriptProps={{ async: true, defer: true }}
    >
      <WaitForRecaptcha>{children}</WaitForRecaptcha>
    </GoogleReCaptchaProvider>
  );
}

export default RecaptchaProviderGate;
