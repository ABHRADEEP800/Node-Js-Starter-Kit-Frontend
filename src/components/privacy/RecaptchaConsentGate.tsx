import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShieldExclamationIcon,
  FingerPrintIcon,
  LockClosedIcon,
  BuildingOffice2Icon,
  ScaleIcon,
  XMarkIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import type { CaptchaConsent } from "../../util/recaptchaConsent";

/**
 * Shown on sign-up / sign-in / reset when the Google reCAPTCHA (anti-bot)
 * tracker is NOT allowed by the current cookie consent. Explains WHAT is
 * collected, WHY, and WHO (vendor), then lets the user allow it — after which
 * the form mounts. The script is never loaded silently (DPDP Domain 8).
 *
 * Rendered as a mobile-first bottom sheet / desktop dialog. Dismissing it does
 * NOT imply consent (there is no silent accept) — it reveals an inline card
 * with a button to reopen the dialog.
 */
interface Props {
  consent: CaptchaConsent;
}

function RecaptchaConsentGate({ consent }: Props) {
  const { status, saving, allow, refuse } = consent;
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusRef = useRef<HTMLButtonElement>(null);

  const isBlocked = status === "blocked";

  // Explicit refusal: record it (provable, append-only) then leave the page.
  // This is NOT consent — the tracker stays off, and the user can return later.
  const reject = async () => {
    try {
      await refuse();
    } finally {
      navigate("/");
    }
  };

  // While the dialog is open: lock background scroll, move focus in, close on
  // Escape (which does NOT consent).
  useEffect(() => {
    if (!isBlocked || !open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // Basic focus trap.
      if (e.key === "Tab" && dialogRef.current) {
        const nodes = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'
        );
        if (nodes.length === 0) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => firstFocusRef.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(t);
    };
  }, [isBlocked, open]);

  // When the user allows it, the parent unmounts us. Do nothing here.

  if (!isBlocked) return null;

  // Inline fallback after the user dismisses the dialog (still blocked).
  if (!open) {
    return (
      <div
        role="region"
        aria-label="Anti-bot check required"
        className="mx-auto w-full max-w-md rounded-2xl border border-amber-300 bg-amber-50 p-5 text-center shadow-sm dark:border-amber-700/60 dark:bg-amber-950/40"
      >
        <ShieldExclamationIcon className="mx-auto h-8 w-8 text-amber-600 dark:text-amber-400" />
        <h2 className="mt-2 text-base font-semibold text-amber-900 dark:text-amber-200">
          Anti-bot check required
        </h2>
        <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
          To create an account, sign in or reset your password, the Google
          reCAPTCHA anti-bot check must be enabled.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 min-h-[44px] w-full rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
        >
          Review and enable
        </button>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-900/50 p-0 backdrop-blur-sm motion-reduce:transition-none sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="captcha-gate-title"
      aria-describedby="captcha-gate-desc"
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="animate-fade-in-up max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-gray-200 bg-white shadow-2xl outline-none motion-reduce:animate-none dark:border-gray-700 dark:bg-gray-900 sm:rounded-3xl"
      >
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-brand-800 px-5 pb-6 pt-7 text-center">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-44 w-44 rounded-full bg-brand-400/20 blur-3xl" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close (will not enable the check)"
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full text-white/90 transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white"
          >
            <XMarkIcon className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30">
            <ShieldExclamationIcon className="h-9 w-9 text-white" aria-hidden="true" />
          </div>
          <h2
            id="captcha-gate-title"
            className="relative mt-3 text-lg font-bold text-white sm:text-xl"
          >
            One quick check to continue
          </h2>
          <p className="relative mx-auto mt-1 max-w-sm text-sm text-white/90">
            Google reCAPTCHA keeps our sign-up and sign-in safe from bots.
          </p>
        </div>

        {/* Body */}
        <div className="px-5 py-5 sm:px-6">
          <p
            id="captcha-gate-desc"
            className="text-sm text-gray-600 dark:text-gray-300"
          >
            The anti-bot check is currently off. To create an account, sign in or
            reset your password, please enable it. Here is exactly what it does:
          </p>

          <ul className="mt-4 space-y-3">
            <InfoRow
              icon={<FingerPrintIcon className="h-5 w-5" />}
              title="What is collected"
              tone="blue"
            >
              Your IP address, browser signals and a risk score, stored in Google
              cookies (for example <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px] dark:bg-gray-800">_GRECAPTCHA</code>).
            </InfoRow>
            <InfoRow
              icon={<LockClosedIcon className="h-5 w-5" />}
              title="Why we need it"
              tone="emerald"
            >
              To confirm you are a real person, not a bot — protecting the login
              and sign-up forms from abuse and spam.
            </InfoRow>
            <InfoRow
              icon={<BuildingOffice2Icon className="h-5 w-5" />}
              title="Who processes it"
              tone="violet"
            >
              Google LLC (reCAPTCHA v3).{" "}
              <a
                href="https://policies.google.com/privacy"
                target="_blank"
                rel="noreferrer"
                className="font-medium underline decoration-dotted underline-offset-2"
              >
                Google&apos;s privacy policy
              </a>
              .
            </InfoRow>
            <InfoRow
              icon={<ScaleIcon className="h-5 w-5" />}
              title="Your choice &amp; basis"
              tone="amber"
            >
              Lawful basis <strong>s.&nbsp;7(a)</strong> — you voluntarily provide
              this for the security purpose. You may refuse, but then we cannot
              process the form.
            </InfoRow>
          </ul>

          {/* Actions — equal weight, mobile-first */}
          <div className="mt-6 flex flex-col gap-2.5 sm:flex-row-reverse">
            <button
              ref={firstFocusRef}
              type="button"
              disabled={saving}
              onClick={allow}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-[0.99] disabled:opacity-60 dark:hover:bg-brand-500"
            >
              {saving ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Enabling…
                </>
              ) : (
                <>
                  <CheckCircleIcon className="h-5 w-5" aria-hidden="true" />
                  Allow and continue
                </>
              )}
            </button>
            <button
              type="button"
              onClick={reject}
              className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              No thanks, take me home
            </button>
          </div>

          <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
            <a
              href="/privacy-notice"
              className="underline decoration-dotted underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Read privacy notice
            </a>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="underline decoration-dotted underline-offset-2 hover:text-gray-600 dark:hover:text-gray-300"
            >
              Decide later
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-400 dark:text-gray-500">
            Refusing or closing does not enable the check — you can reopen it any
            time to continue.
          </p>
        </div>
      </div>
    </div>
  );
}

type Tone = "blue" | "emerald" | "violet" | "amber";

const TONE: Record<Tone, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  violet: "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
};

function InfoRow({
  icon,
  title,
  tone,
  children,
}: {
  icon: ReactNode;
  title: string;
  tone: Tone;
  children: ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${TONE[tone]}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
          {children}
        </p>
      </div>
    </li>
  );
}

export default RecaptchaConsentGate;
