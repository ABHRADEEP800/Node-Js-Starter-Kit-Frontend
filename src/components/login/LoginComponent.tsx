import { Button, Input } from "../";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../store/auth/authSlice";
import { useDispatch } from "react-redux";
import type { UserLogin } from "../../types";
import { toast } from "react-toastify";
import userService from "../../services/userService";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { withTimeout } from "../../util/errors";
import PasskeyLoginButton from "./PasskeyLogin";
import {
  ShieldCheckIcon,
  LockClosedIcon,
  FingerPrintIcon,
} from "@heroicons/react/24/outline";

const HIGHLIGHTS = [
  {
    icon: LockClosedIcon,
    title: "Secure sessions",
    text: "Device-bound, rotating sessions with CSRF protection.",
  },
  {
    icon: FingerPrintIcon,
    title: "Passkeys & 2FA",
    text: "Sign in with a passkey or a one-time code.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Privacy first",
    text: "Consent-governed data with DPDP-aligned controls.",
  },
];

function LoginComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserLogin>({
    defaultValues: {
      username: "",
      password: "",
      rememberMe: false,
    },
  });

  const usernameValue = watch("username") || "";

  const userLogin = async (data: UserLogin): Promise<void> => {
    if (!executeRecaptcha) {
      toast.error("Recaptcha not yet available");
      return;
    }

    const token = await withTimeout(
      executeRecaptcha("login"),
      "reCAPTCHA timed out. Please try again.",
      8000
    );
    if (!token) {
      toast.error("Recaptcha verification failed");
      return;
    }

    userService
      .userLogin({ ...data, recaptchaToken: token })
      .then((res) => {
        if (res.data.twofaEnabled === true) {
          // Handle 2FA required case
          toast.info("Two-factor authentication is required.");
          navigate("/twofa");
        } else {
          dispatch(login(res.data.user));
          navigate("/");
          toast.success(res.message);
        }
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-950">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Brand panel — desktop only. */}
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
              Welcome back
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-brand-100">
              Sign in to pick up right where you left off.
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
              Sign in
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Login to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit(userLogin)} className="mt-6 space-y-4">
            {/* Username */}
            <Input
              label="Username or email"
              error={errors.username?.message}
              placeholder="e.g. johndoe"
              {...register("username", { required: "Username is required" })}
            />

            {/* Password */}
            <Input
              label="Password"
              type="password"
              placeholder="e.g. Abc@123456"
              error={errors.password?.message}
              {...register("password", {
                required: "Password is required",
              })}
            />

            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  id="rememberMe"
                  {...register("rememberMe")}
                  className="h-4 w-4 cursor-pointer rounded border-gray-300 bg-white text-brand-600 accent-brand-600 focus-visible:outline-2 focus-visible:outline-brand-600 focus-visible:outline-offset-2 dark:border-gray-600 dark:bg-gray-800"
                />
                Remember this device
              </label>
              <Link
                to="/forgot-password"
                className="shrink-0 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <div className="pt-1">
              <Button
                type="submit"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                className="h-11"
              >
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>

          {/* Passkey login */}
          <div className="mt-5">
            <div className="relative my-4">
              <div aria-hidden className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                  or
                </span>
              </div>
            </div>
            <PasskeyLoginButton
              identifier={usernameValue}
              executeRecaptcha={executeRecaptcha}
              disabled={isSubmitting}
            />
          </div>

          <p className="mt-6 text-center text-sm text-gray-700 dark:text-gray-300">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="font-medium text-brand-600 hover:underline dark:text-brand-400"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginComponent;
