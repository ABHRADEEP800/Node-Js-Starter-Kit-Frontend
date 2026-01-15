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
    <div className="flex justify-center items-center px-4 bg-gray-50 dark:bg-gray-900 pt-2">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 text-gray-900 dark:text-white">
          Login
        </h1>

        <form onSubmit={handleSubmit(userLogin)} className="space-y-4">
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

          <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              {...register("rememberMe")}
              className="mr-2"
            />
            <label
              htmlFor="rememberMe"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              Remember this device
            </label>
          </div>

          {/* Submit */}
          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md transition dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-blue-300"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </Button>
          </div>
        </form>
        <p className="text-center mt-6 text-sm text-gray-700 dark:text-gray-300">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default LoginComponent;
