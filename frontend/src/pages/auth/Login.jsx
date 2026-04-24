import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import useAuthStore from "../../store/authStore";
import BrandLogo from "../../components/common/BrandLogo";

const Login = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, user } = useAuthStore();
  const [loginError, setLoginError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  if (user) {
    if (user.role === "superadmin") {
      return <Navigate to="/superadmin/dashboard" replace />;
    }
    if (user.role === "student") {
      return <Navigate to="/student/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data) => {
    clearError();
    setLoginError("");

    const result = await login(data.email, data.password);

    if (result.success) {
      const u = useAuthStore.getState().user;
      const destination =
        u?.role === "superadmin"
          ? "/superadmin/dashboard"
          : u?.role === "student"
            ? "/student/dashboard"
            : "/dashboard";
      navigate(destination);
    } else {
      setLoginError(result.error);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center login-animated-bg px-4">
      <div className="relative z-10 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-5 flex justify-center">
            <BrandLogo variant="auth" />
          </div>
        </div>

        {/* Form Card */}
        <div className="card">
          <h1 class="text-2xl font-bold text-gray-900 text-center">
            Welcome Back
          </h1>
          <p class="text-gray-600 mb-3 text-center">
            Sign in to your school account
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Error Alert */}
            {(loginError || error) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{loginError || error}</span>
              </div>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  className={`input-field pl-10 ${errors.email ? "border-red-500" : ""}`}
                  placeholder="admin@school.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^\S+@\S+\.\S+$/,
                      message: "Invalid email address",
                    },
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  className={`input-field pl-10 pr-10 ${errors.password ? "border-red-500" : ""}`}
                  placeholder="••••••••"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Register your school
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
