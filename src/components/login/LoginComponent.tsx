import { Button, Input } from "../";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../store/auth/authSlice";
import { useDispatch } from "react-redux";
import type { UserLogin } from "../../types";
import { toast } from "react-toastify";
import userService from "../../services/userService";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

function LoginComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,

    formState: { errors, isSubmitting },
  } = useForm<UserLogin>();

  const userLogin = async (data: UserLogin): Promise<void> => {
    if (!executeRecaptcha) {
      toast.error("Recaptcha not yet available");
      return;
    }

    const token = await executeRecaptcha("login");
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
    <div className="flex justify-center items-center px-4 bg-gray-50 dark:bg-gray-950 min-h-[calc(100vh-4rem)] py-12">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-5 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 text-gray-900 dark:text-white">
          Login
        </h1>

        <form onSubmit={handleSubmit(userLogin)} className="space-y-5">
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
          <div className="pt-4">
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
        <p className="text-center mt-6 text-sm text-gray-700 dark:text-gray-300">
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
  );
}

export default LoginComponent;
