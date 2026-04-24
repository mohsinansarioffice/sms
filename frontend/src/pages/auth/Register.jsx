import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, Navigate } from "react-router-dom";
import {
  Building2,
  User,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";
import useAuthStore from "../../store/authStore";
import BrandLogo from "../../components/common/BrandLogo";

const Register = () => {
  const navigate = useNavigate();
  const {
    register: registerUser,
    isLoading,
    error,
    clearError,
    user,
  } = useAuthStore();
  const [registerError, setRegisterError] = useState("");

  const [selectedPlan, setSelectedPlan] = useState("free");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  if (user) {
    return <Navigate to="/dashboard" />;
  }

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "$0",
      features: [
        "Up to 50 students & 3 teachers",
        "Attendance, students, teachers & academic setup",
        "Leave management",
      ],
    },
    {
      id: "basic",
      name: "Basic",
      price: "$9",
      features: [
        "Up to 200 students & 15 teachers",
        "Everything in Free, plus fees & exams",
        "Core academics—upgrade for messaging, calendar & more",
      ],
    },
    {
      id: "premium",
      name: "Premium",
      price: "$29",
      features: [
        "Unlimited students & teachers",
        "Everything in Basic, plus announcements, messages & events",
        "Timetable, class diary, exports, CSV import & payroll",
      ],
    },
  ];

  const onSubmit = async (data) => {
    clearError();
    setRegisterError("");

    const result = await registerUser({
      schoolName: data.schoolName,
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone,
      subscriptionPlan: selectedPlan,
    });

    if (result.success) {
      navigate("/dashboard");
    } else {
      setRegisterError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mb-5 flex justify-center">
            <BrandLogo variant="auth" />
          </div>
        </div>

        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900 text-center">
            Register Your School
          </h1>
          <p className="text-gray-600 mb-3 text-center">
            Advancing schools, empowering future!
          </p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Alert */}
            {(registerError || error) && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{registerError || error}</span>
              </div>
            )}

            {/* Plan Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Choose Your Plan
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`cursor-pointer border-2 rounded-lg p-4 transition-all ${
                      selectedPlan === plan.id
                        ? "border-primary-600 bg-primary-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {selectedPlan === plan.id && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-3">
                      {plan.price}
                      <span className="text-sm text-gray-500">/month</span>
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="text-sm text-gray-600 flex items-start gap-2"
                        >
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {(selectedPlan === "basic" || selectedPlan === "premium") && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                You get a <strong>1-day</strong> trial on the selected paid
                plan. Payment must be confirmed by your platform administrator
                to continue without interruption—complete payment using the
                method they provide.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* School Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  School Name
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    className={`input-field pl-10 ${errors.schoolName ? "border-red-500" : ""}`}
                    placeholder="Green Valley High School"
                    {...register("schoolName", {
                      required: "School name is required",
                    })}
                  />
                </div>
                {errors.schoolName && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.schoolName.message}
                  </p>
                )}
              </div>

              {/* Admin Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    className={`input-field pl-10 ${errors.name ? "border-red-500" : ""}`}
                    placeholder="John Doe"
                    {...register("name", { required: "Name is required" })}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    className={`input-field pl-10 ${errors.phone ? "border-red-500" : ""}`}
                    placeholder="+92-300-1234567"
                    {...register("phone")}
                  />
                </div>
              </div>

              {/* Email */}
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

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="password"
                    className={`input-field pl-10 ${errors.password ? "border-red-500" : ""}`}
                    placeholder="••••••••"
                    {...register("password", {
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters",
                      },
                    })}
                  />
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-1"
                {...register("terms", {
                  required: "You must accept the terms",
                })}
              />
              <label htmlFor="terms" className="text-sm text-gray-600">
                I agree to the Terms of Service and Privacy Policy
              </label>
            </div>
            {errors.terms && (
              <p className="text-red-500 text-sm -mt-4">
                {errors.terms.message}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
