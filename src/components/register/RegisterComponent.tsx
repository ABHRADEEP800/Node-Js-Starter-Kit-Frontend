import { Button, Input } from "../";
import { useForm } from "react-hook-form";
import UserService from "../../services/userService";
import { Link, useNavigate } from "react-router-dom";
import type { UserSignup } from "../../types";
import { toast } from "react-toastify";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { useDebouncedAsyncCheck, type AsyncCheckResult } from "../../hooks";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]+$/;
const EMAIL_PATTERN = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

/** Live format validation for the username field (empty = no message yet). */
function usernameFormatError(value: string): string | null {
  if (!value) return null;
  if (value.length < 3) return "Username must be at least 3 characters";
  if (!USERNAME_PATTERN.test(value)) {
    return "Invalid characters (use alphanumeric & _)";
  }
  return null;
}

/** Live format validation for the email field (empty = no message yet). */
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

/**
 * Maps a debounced availability check + client-side format validation into the
 * props the <Input> component needs to render its status row.
 */
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

  // Enterprise-grade debounced availability checks: trailing debounce, abortable
  // requests, and race protection so a stale response can never win.
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

  // Combine RHF + live format + debounced availability into Input props.
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
    // Defence-in-depth: reject invalid formats even if RHF validation didn't.
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

    // A request may be mid-debounce or mid-flight — never submit on stale data.
    if (usernameCheck.result.pending || emailCheck.result.pending) {
      toast.info(
        "Please wait for username/email availability checks to complete"
      );
      return;
    }

    if (!executeRecaptcha) {
      toast.error("reCAPTCHA not yet available");
      return;
    }

    const token = await executeRecaptcha("register");

    UserService.userSignup({ ...data, recaptchaToken: token })
      .then((res) => {
        navigate("/signin");
        toast.success(res.message, { autoClose: 10000 }); // Give them time to read email instructions
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="flex justify-center items-center px-4 bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 text-gray-900 dark:text-white">
          Create Account
        </h1>

        <form onSubmit={handleSubmit(userSignup)} className="space-y-5">
          {/* Full name */}
          <Input
            label="Full Name"
            error={errors.fullName?.message}
            placeholder="e.g. John Doe"
            {...register("fullName", { required: "Full Name is required" })}
          />

          {/* Username */}
          <Input
            label="Username"
            error={usernameFb.error}
            message={usernameFb.message}
            status={usernameFb.status}
            placeholder="e.g. johndoe"
            {...register("username", {
              required: "Username is required",
              minLength: {
                value: 3,
                message: "Username must be at least 3 characters",
              },
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

          {/* Password */}
          <Input
            label="Password"
            type="password"
            placeholder="e.g. Abc@123456"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              validate: (value) =>
                /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/.test(
                  value
                ) ||
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
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
          />

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              isLoading={isSubmitting}
              disabled={isSubmitting}
              className="h-11"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>

        <p className="text-center mt-6 text-sm text-gray-700 dark:text-gray-300">
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
  );
}

export default RegisterComponent;
