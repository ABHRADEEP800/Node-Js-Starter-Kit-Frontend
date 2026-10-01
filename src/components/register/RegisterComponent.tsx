import { Button, Input } from "../";
import { useForm } from "react-hook-form";
import UserService from "../../services/userService";
import PrivacyService from "../../services/privacyService";
import { Link, useNavigate } from "react-router-dom";
import type { UserSignup } from "../../types";
import type { ConsentPurpose } from "../../types/dpdp";
import { toast } from "react-toastify";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useDebouncedAsyncCheck, type AsyncCheckResult } from "../../hooks";
import { useEffect, useMemo, useState } from "react";
import {
  ShieldCheckIcon,
  LockClosedIcon,
  FingerPrintIcon,
} from "@heroicons/react/24/outline";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const EMAIL_PATTERN = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

const HIGHLIGHTS = [
  {
    icon: LockClosedIcon,
    title: "Secure by default",
    text: "Encrypted fields, peppered hashes and hardened sessions.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Privacy built in",
    text: "DPDP-aligned consent, age gate and data-minimising forms.",
  },
  {
    icon: FingerPrintIcon,
    title: "2FA & passkeys",
    text: "Add a second factor or a passkey once you're in.",
  },
];

/** Whole-year age from an ISO yyyy-mm-dd value (null when empty/invalid). */
function ageFromDob(dob: string | undefined): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

function usernameFormatError(value: string): string | null {
  if (!value) return null;
  if (value.length < 3) return "Username must be at least 3 characters";
  if (!USERNAME_PATTERN.test(value)) {
    return "Invalid characters (use alphanumeric & _)";
  }
  return null;
}

function emailFormatError(value: string): string | null {
  if (!value) return null;
  return EMAIL_PATTERN.test(value) ? null : "Enter a valid email address";
}

type AvailabilityData = { available: boolean; message: string };
type InputStatus = "error" | "success" | "loading";

interface FieldFeedback {
  error?: string;
  message?: string;
  status?: InputStatus;
}

function availabilityFeedback(
  check: AsyncCheckResult<AvailabilityData>,
  rhfError: string | undefined,
  formatError: string | null
): FieldFeedback {
  if (rhfError) return { error: rhfError, status: "error" };
  if (formatError) return { error: formatError, status: "error" };
  if (check.pending) return { status: "loading", message: "Checking..." };
  if (check.status === "success") {
    if (check.data?.available) {
      return { status: "success", message: "Available" };
    }
    return { error: check.data?.message, status: "error" };
  }
  if (check.status === "error") {
    return { error: check.error ?? undefined, status: "error" };
  }
  return {};
}

function RegisterComponent() {
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserSignup>();

  const password = watch("password");
  const usernameVal = watch("username");
  const emailVal = watch("email");
  const dobVal = watch("dateOfBirth");

  // ---- DPDP: notice + purpose registry (s. 5, Rule 3) ----
  const [purposes, setPurposes] = useState<ConsentPurpose[]>([]);
  const [noticeVersion, setNoticeVersion] = useState<string>("");
  const [requiredConsent, setRequiredConsent] = useState(false); // unticked by default
  const [optionalConsent, setOptionalConsent] = useState<Record<string, boolean>>({});
  // One-click optional handling: "all" | "none" | "custom". Default "none"
  // (nothing optional pre-selected — consent must be a clear affirmative act).
  const [optionalChoice, setOptionalChoice] = useState<"all" | "none" | "custom">("none");
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [guardian, setGuardian] = useState({
    name: "",
    email: "",
    phone: "",
    relationship: "parent" as "parent" | "guardian" | "lawful_guardian",
  });

  useEffect(() => {
    PrivacyService.getPurposes()
      .then((res) => {
        setPurposes(res.data.purposes);
        setNoticeVersion(res.data.notice_version);
      })
      .catch(() => toast.error("Failed to load the privacy notice"));
  }, []);

  const isChild = useMemo(() => {
    const age = ageFromDob(dobVal);
    return age === null ? false : age < 18;
  }, [dobVal]);

  const optionalPurposes = purposes.filter((p) => !p.required);

  const usernameCheck = useDebouncedAsyncCheck({
    value: usernameVal ?? "",
    delay: 400,
    shouldRun: (v) => v.length >= 3 && USERNAME_PATTERN.test(v),
    fetcher: (v, signal) => UserService.checkUsernameAvailability(v, signal),
  });

  const emailCheck = useDebouncedAsyncCheck({
    value: emailVal ?? "",
    delay: 400,
    shouldRun: (v) => v.length > 0 && EMAIL_PATTERN.test(v),
    fetcher: (v, signal) => UserService.checkEmailAvailability(v, signal),
  });

  const usernameIsUnavailable =
    usernameCheck.result.status === "success" &&
    usernameCheck.result.data?.available === false;

  const emailIsUnavailable =
    emailCheck.result.status === "success" &&
    emailCheck.result.data?.available === false;

  const usernameFb = availabilityFeedback(
    usernameCheck.result,
    errors.username?.message,
    usernameFormatError(usernameVal ?? "")
  );
  const emailFb = availabilityFeedback(
    emailCheck.result,
    errors.email?.message,
    emailFormatError(emailVal ?? "")
  );

  const userSignup = async (data: UserSignup): Promise<void> => {
    if (usernameFormatError(usernameVal ?? "")) {
      toast.error("Please enter a valid username");
      return;
    }
    if (emailFormatError(emailVal ?? "")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (usernameIsUnavailable) {
      toast.error("Please select an available username");
      return;
    }
    if (emailIsUnavailable) {
      toast.error("Please enter an unregistered email address");
      return;
    }
    if (usernameCheck.result.pending || emailCheck.result.pending) {
      toast.info("Please wait for username/email availability checks to complete");
      return;
    }

    // DPDP s. 6: consent is mandatory and must be an explicit act.
    if (!requiredConsent) {
      toast.error("Please read and consent to the privacy notice to continue.");
      return;
    }

    // DPDP s. 9: a child cannot be onboarded without guardian consent.
    if (isChild && !guardian.name.trim()) {
      toast.error("A parent/guardian name is required for accounts under 18.");
      return;
    }

    if (!executeRecaptcha) {
      toast.error("reCAPTCHA not yet available");
      return;
    }

    const token = await executeRecaptcha("register");
    // Optional purposes: derived from the one-click choice. "none" ⇒ [] (no
    // optional consent, the strict default). Never pre-set.
    const optionalGranted =
      optionalChoice === "all"
        ? optionalPurposes.map((p) => p.id)
        : optionalChoice === "custom"
          ? Object.entries(optionalConsent)
              .filter(([, v]) => v)
              .map(([k]) => k)
          : [];

    UserService.userSignup({
      ...data,
      consentAccepted: requiredConsent,
      noticeVersion,
      optionalConsent: optionalGranted,
      language: "en",
      guardian: isChild
        ? {
            relationship: guardian.relationship,
            name: guardian.name.trim(),
            email: guardian.email.trim() || undefined,
            phone: guardian.phone.trim() || undefined,
            verificationMethod: "voluntarily_provided_identity",
          }
        : undefined,
      recaptchaToken: token,
    })
      .then((res) => {
        navigate("/signin");
        toast.success(res.message, { autoClose: 10000 });
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Brand panel — desktop only, keeps the form column compact. */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-8 text-white lg:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-12 h-56 w-56 rounded-full bg-brand-400/20 blur-3xl" />

          <div className="relative">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                <ShieldCheckIcon className="h-6 w-6" />
              </span>
              <span className="text-lg font-bold tracking-tight">Starter&nbsp;Kit</span>
            </div>

            <h2 className="mt-10 text-2xl font-bold leading-tight xl:text-3xl">
              Create your account in minutes
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-100">
              A secure, privacy-first foundation for your next product.
            </p>

            <ul className="mt-8 space-y-4">
              {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">{title}</p>
                    <p className="text-xs leading-relaxed text-brand-100/90">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <p className="relative mt-8 text-xs text-brand-100/80">
            Session hardening, CSRF protection and consent-first tracking.
          </p>
        </aside>

        {/* Form panel */}
        <div className="p-6 sm:p-8">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Just a few details to get started
            </p>
          </div>

          <form onSubmit={handleSubmit(userSignup)} className="mt-6 space-y-4">
            {/* Name */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Input
                label="First Name"
                error={errors.firstName?.message}
                placeholder="e.g. John"
                {...register("firstName", { required: "First name is required" })}
              />
              <Input
                label="Last Name"
                error={errors.lastName?.message}
                placeholder="e.g. Doe"
                {...register("lastName", { required: "Last name is required" })}
              />
            </div>

            {/* Username */}
            <Input
              label="Username"
              error={usernameFb.error}
              message={usernameFb.message}
              status={usernameFb.status}
              placeholder="e.g. johndoe"
              {...register("username", {
                required: "Username is required",
                minLength: { value: 3, message: "Username must be at least 3 characters" },
                pattern: {
                  value: USERNAME_PATTERN,
                  message: "Invalid characters (use alphanumeric & _)",
                },
              })}
            />

            {/* Email */}
            <Input
              label="Email"
              placeholder="e.g. example@domain.com"
              error={emailFb.error}
              message={emailFb.message}
              status={emailFb.status}
              {...register("email", {
                required: "Email is required",
                validate: (value) =>
                  EMAIL_PATTERN.test(value) || "Enter a valid email address",
              })}
            />

            {/* DPDP s. 9: age gate */}
            <Input
              label="Date of Birth"
              type="date"
              error={errors.dateOfBirth?.message}
              {...register("dateOfBirth", {
                required: "Date of birth is required (age verification)",
              })}
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="e.g. Abc@123456"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
                validate: (value) =>
                  /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(value) ||
                  "Password must contain at least 8 characters, a number, uppercase & lowercase letter",
              })}
            />

            {/* Confirm Password */}
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Retype password"
              error={errors.cnfPassword?.message}
              {...register("cnfPassword", {
                required: "Confirm your password",
                validate: (value) => value === password || "Passwords do not match",
              })}
            />

            {/* DPDP s. 9: guardian details for under-18 accounts */}
            {isChild && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  You are under 18 — parental/guardian consent required
                </p>
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                  Under the DPDP Act 2023 (s. 9), we need consent from an identifiable
                  parent or lawful guardian before creating the account. Tracking and
                  targeted advertising are disabled for children.
                </p>
                <div className="mt-3 space-y-3">
                  <Input
                    label="Parent / Guardian Name"
                    placeholder="Full name"
                    value={guardian.name}
                    onChange={(e) => setGuardian({ ...guardian, name: e.target.value })}
                  />
                  <Input
                    label="Guardian Email (optional)"
                    type="email"
                    placeholder="guardian@example.com"
                    value={guardian.email}
                    onChange={(e) => setGuardian({ ...guardian, email: e.target.value })}
                  />
                  <Input
                    label="Guardian Phone (optional)"
                    placeholder="+91 ..."
                    value={guardian.phone}
                    onChange={(e) => setGuardian({ ...guardian, phone: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* DPDP s. 5/s. 6: notice + opt-in consent — one-click friendly */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Privacy &amp; Consent
                </h2>
              </div>

              {/* Mandatory consent — the single gate that unlocks the button. */}
              <label
                className={`mt-3 flex items-start gap-2 rounded-lg border p-3 text-xs transition-colors ${
                  requiredConsent
                    ? "border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/30"
                    : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                }`}
              >
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4"
                  checked={requiredConsent}
                  onChange={(e) => setRequiredConsent(e.target.checked)}
                />
                <span className="text-gray-700 dark:text-gray-200">
                  I have read and agree to the{" "}
                  <Link
                    to="/privacy-notice"
                    target="_blank"
                    className="font-medium text-brand-600 underline dark:text-brand-400"
                  >
                    Privacy Notice
                  </Link>{" "}
                  and consent to the essential data needed to create and secure my
                  account. I can withdraw consent any time.
                </span>
              </label>

              {/* Optional processing — one click, no per-item checkboxes. */}
              {optionalPurposes.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    Optional extras{" "}
                    <span className="font-normal text-gray-500">
                      (off by default — choose all, none, or pick)
                    </span>
                  </p>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      aria-pressed={optionalChoice === "all"}
                      onClick={() => {
                        setOptionalChoice("all");
                        setShowOptionalDetails(false);
                      }}
                      className={`min-h-[40px] flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        optionalChoice === "all"
                          ? "border-brand-600 bg-brand-600 text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      Yes, enable all
                    </button>
                    <button
                      type="button"
                      aria-pressed={optionalChoice === "none"}
                      onClick={() => {
                        setOptionalChoice("none");
                        setShowOptionalDetails(false);
                      }}
                      className={`min-h-[40px] flex-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        optionalChoice === "none"
                          ? "border-gray-800 bg-gray-800 text-white dark:border-gray-200 dark:bg-gray-200 dark:text-gray-900"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      }`}
                    >
                      No, keep off
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setOptionalChoice("custom");
                      setShowOptionalDetails((v) => !v);
                    }}
                    className="mt-2 text-xs font-medium text-brand-600 underline dark:text-brand-400"
                  >
                    {showOptionalDetails ? "Hide options" : "Choose individually"}
                  </button>

                  {showOptionalDetails && optionalChoice === "custom" && (
                    <div className="mt-2 space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
                      {optionalPurposes.map((p) => (
                        <label
                          key={p.id}
                          className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300"
                        >
                          <input
                            type="checkbox"
                            className="mt-0.5 h-4 w-4"
                            checked={!!optionalConsent[p.id]}
                            onChange={(e) =>
                              setOptionalConsent((prev) => ({
                                ...prev,
                                [p.id]: e.target.checked,
                              }))
                            }
                          />
                          <span>
                            <span className="font-medium">{p.label}</span> — {p.description}
                          </span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit — disabled until the mandatory consent is given. */}
            <div className="pt-1">
              <Button
                type="submit"
                isLoading={isSubmitting}
                disabled={isSubmitting || !requiredConsent}
                className="h-11"
              >
                {isSubmitting ? "Registering..." : "Create account"}
              </Button>
              {!requiredConsent && (
                <p className="mt-2 text-center text-xs text-gray-500 dark:text-gray-400">
                  Tick the consent box above to enable sign-up.
                </p>
              )}
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-700 dark:text-gray-300">
            Already have an account?{" "}
            <Link
              to="/signin"
              className="font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterComponent;
