import { Button, Input } from "../";
import { useForm } from "react-hook-form";
import UserService from "../../services/userService";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../store/auth/authSlice";
import { useDispatch } from "react-redux";
import type { UserSignup } from "../../types";
import { toast } from "react-toastify";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

function RegisterComponent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserSignup>();

  const password = watch("password");

  const userSignup = async (data: UserSignup): Promise<void> => {
    if (!executeRecaptcha) {
      toast.error("reCAPTCHA not yet available");
      return;
    }

    const token = await executeRecaptcha("register");

    UserService.userSignup({ ...data, recaptchaToken: token })
      .then((res) => {
        dispatch(login(res.data.user));
        navigate("/signin");
        toast.success(res.message);
      })
      .catch((err) => toast.error(err.message));
  };

  return (
    <div className="flex justify-center items-center pt-2 px-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-6 text-gray-900 dark:text-white">
          Create Account
        </h1>

        <form onSubmit={handleSubmit(userSignup)} className="space-y-4">
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
            error={errors.username?.message}
            placeholder="e.g. johndoe"
            {...register("username", { required: "Username is required" })}
          />

          {/* Email */}
          <Input
            label="Email"
            placeholder="e.g. example@domain.com"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              validate: (value) =>
                /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(value) ||
                "Enter a valid email address",
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
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md transition dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-blue-300"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>

        <p className="text-center mt-6 text-sm text-gray-700 dark:text-gray-300">
          Already have an account?{" "}
          <Link
            to="/signin"
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterComponent;
