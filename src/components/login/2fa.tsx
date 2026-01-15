import React, { useState, useEffect, useRef } from "react";
import userService from "../../services/userService";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../../store/auth/authSlice";
import { toast } from "react-toastify";
import { Button } from "../"; // Importing your custom Button component

const Login2FAPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [verificationCode, setVerificationCode] = useState<string[]>(Array(6).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // 1️⃣ SECURITY GUARD
  useEffect(() => {
    const checkSession = async () => {
      try {
        await userService.getCurrentUser();
        // If successful, user is already logged in
        toast.info("You are already logged in");
        navigate("/"); 
      } catch (err: any) {
        // Specific check: usually 403 or specific message implies 2FA is needed
        if (err.message?.includes("2FA verification incomplete") || err.statusCode === 403) {
          setIsCheckingSession(false);
        } else {
          toast.error("Session expired. Please login again.");
          navigate("/signin"); // Changed to /signin to match your previous Link
        }
      }
    };
    checkSession();
  }, [navigate]);

  // 2️⃣ TIMER LOGIC
  useEffect(() => {
    if (isCheckingSession) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCheckingSession]);

  // INPUT HANDLERS
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // Only allow numbers
    const newCode = [...verificationCode];
    newCode[index] = value;
    setVerificationCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle backspace to focus previous input
    if (e.key === "Backspace" && !verificationCode[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").split("").slice(0, 6);
    const newCode = [...verificationCode];
    digits.forEach((d, i) => { if (i < 6) newCode[i] = d; });
    setVerificationCode(newCode);
    const focusIndex = digits.length < 6 ? digits.length : 5;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = verificationCode.join("");
    if (code.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.verifyLogin2FA(code);
      if (response.success) {
        dispatch(login(response.data.user));
        navigate("/");
        toast.success(response.message);
      }
    } catch (error: any) {
      setError(error?.message || "Verification failed");
      toast.error(error?.message || "Verification failed");
      if (error?.message?.includes("expired")) {
        setTimeout(() => navigate("/signin"), 2000);
      }
      // Reset inputs on failure
      setVerificationCode(Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isCheckingSession) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50 dark:bg-gray-900">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center px-4 bg-gray-50 dark:bg-gray-900 min-h-screen pt-2">
      {/* Container matching LoginComponent */}
      <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 sm:p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        
        <h1 className="text-3xl sm:text-4xl font-extrabold text-center mb-2 text-gray-900 dark:text-white">
          2FA Verification
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6 text-sm">
          Enter the 6-digit code from your authenticator app.
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          
          {/* 6 Digit Input Grid */}
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {verificationCode.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el; }}
                type="text" 
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                disabled={isLoading || timeLeft === 0}
                className={`
                  w-10 h-10 sm:w-12 sm:h-12 
                  text-center text-xl font-bold 
                  rounded-lg border outline-none transition-all
                  ${error 
                    ? "border-red-500 bg-red-50 text-red-600 focus:ring-2 focus:ring-red-200" 
                    : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
                  }
                `}
              />
            ))}
          </div>

          {/* Timer & Error Display */}
          <div className="flex justify-between items-center text-sm">
            {error ? (
              <span className="text-red-600 font-medium">{error}</span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">Time remaining:</span>
            )}
            
            <span className={`font-mono font-bold ${timeLeft < 60 ? "text-red-500" : "text-blue-600 dark:text-blue-400"}`}>
              {timeLeft > 0 ? formatTime(timeLeft) : "Expired"}
            </span>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            {timeLeft > 0 ? (
              <Button
                type="submit"
                disabled={isLoading}
                isLoading={isLoading}
                className="w-full h-10 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg shadow-md transition dark:bg-blue-500 dark:hover:bg-blue-400 dark:disabled:bg-blue-300"
              >
                {isLoading ? "Verifying..." : "Verify Code"}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => navigate("/signin")}
                className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-md transition"
              >
                Back to Login
              </Button>
            )}
          </div>
        </form>

        <p className="text-center mt-6 text-sm text-gray-700 dark:text-gray-300">
          Lost your device?{" "}
          <button
            type="button"
            className="text-blue-600 dark:text-blue-400 font-medium hover:underline focus:outline-none"
            onClick={() => toast.info("Please contact support to reset 2FA")}
          >
            Contact Support
          </button>
        </p>

      </div>
    </div>
  );
};

export default Login2FAPage;