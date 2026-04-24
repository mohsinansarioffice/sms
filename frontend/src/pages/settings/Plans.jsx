import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  Zap,
  Crown,
  Shield,
  Loader2,
  ArrowLeft,
  Mail,
} from "lucide-react";
import { toast } from "react-hot-toast";
import useSubscriptionStore from "../../store/subscriptionStore";
import useAuthStore from "../../store/authStore";
import BrandLogo from "../../components/common/BrandLogo";

const FEATURE_LABELS = {
  attendance: "Attendance",
  studentManagement: "Students",
  teacherManagement: "Teachers",
  academicSettings: "Academic setup (classes, sections, years)",
  csvImport: "CSV bulk import",
  reportsExport: "Reports & exports",
  fees: "Fees & payments",
  exams: "Exams & results",
  communication: "Announcements & messages",
  timetable: "Timetable",
  events: "Events & calendar",
  leaves: "Leave management",
  payroll: "Payroll",
  diary: "Class diary",
};

const SUPPORT_NOTE =
  "Paid plans are activated manually after payment. Email your platform administrator or the contact shown in your welcome materials with proof of payment to activate Basic or Premium.";

const getPlanIcon = (planId) => {
  if (planId === "premium") return <Crown className="w-7 h-7" />;
  if (planId === "basic") return <Zap className="w-7 h-7" />;
  return <Shield className="w-7 h-7" />;
};

const PLAN_COLORS = {
  free: {
    ring: "ring-gray-300",
    badge: "bg-gray-100 text-gray-700",
    icon: "bg-gray-100 text-gray-600",
    btn: "btn-secondary",
    accent: "border-gray-200",
  },
  basic: {
    ring: "ring-primary-500",
    badge: "bg-primary-100 text-primary-700",
    icon: "bg-primary-100 text-primary-600",
    btn: "btn-primary",
    accent: "border-primary-300",
  },
  premium: {
    ring: "ring-yellow-400",
    badge: "bg-yellow-100 text-yellow-700",
    icon: "bg-yellow-100 text-yellow-600",
    btn: "bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2.5 px-4 rounded-lg transition-colors",
    accent: "border-yellow-300",
  },
};

const Plans = () => {
  const { plans, fetchPlans, changePlan, isLoading } = useSubscriptionStore();
  const { user } = useAuthStore();
  const [changingTo, setChangingTo] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleChangePlan = async (planId, planName) => {
    if (planId !== "free") {
      toast.error(
        "Upgrades to paid plans are arranged offline. See the notice below.",
      );
      return;
    }
    if (!window.confirm(`Switch to the ${planName} plan?`)) return;
    setChangingTo(planId);
    const result = await changePlan(planId);
    setChangingTo(null);
    if (result.success) {
      toast.success(`Switched to ${planName} plan`);
    } else {
      toast.error(result.error || "Failed to change plan");
    }
  };

  if (isLoading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-3 sm:gap-4 min-w-0">
          <BrandLogo linkTo="/dashboard" />
          <Link
            to="/dashboard"
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-gray-900">
              {user?.schoolName}
            </h1>
            <p className="text-xs text-gray-500">Subscription Plans</p>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-14">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Compare features. Paid plans require manual activation after your
            payment is confirmed.
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan) => {
            const colors = PLAN_COLORS[plan.id];
            const isPaid = plan.id === "basic" || plan.id === "premium";
            return (
              <div
                key={plan.id}
                className={`card relative flex flex-col border-2 transition-shadow ${
                  plan.isCurrent
                    ? `ring-2 ${colors.ring} shadow-xl`
                    : "hover:shadow-lg"
                } ${colors.accent}`}
              >
                {/* Badges */}
                {plan.isCurrent && (
                  <div
                    className={`absolute -top-3 right-4 text-xs font-bold px-3 py-1 rounded-full ${colors.badge}`}
                  >
                    Current Plan
                  </div>
                )}
                {plan.id === "premium" && !plan.isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    Most Popular
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${colors.icon}`}
                  >
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">
                    {plan.name}
                  </h3>
                  <div className="text-5xl font-extrabold text-gray-900 mt-3">
                    ${plan.price}
                    <span className="text-base font-normal text-gray-500">
                      /mo
                    </span>
                  </div>
                </div>

                {/* Limits */}
                <div className="mb-6 p-4 bg-gray-50 rounded-xl text-sm space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Students</span>
                    <span className="font-semibold text-gray-900">
                      {plan.limits.maxStudents === 999999
                        ? "Unlimited"
                        : plan.limits.maxStudents}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">Teachers</span>
                    <span className="font-semibold text-gray-900">
                      {plan.limits.maxTeachers === 999999
                        ? "Unlimited"
                        : plan.limits.maxTeachers}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2.5 mb-8 flex-1">
                  {Object.entries(plan.features).map(([key, enabled]) => (
                    <li key={key} className="flex items-start gap-3">
                      <Check
                        className={`w-4 h-4 mt-0.5 flex-shrink-0 ${enabled ? "text-green-500" : "text-gray-300"}`}
                      />
                      <span
                        className={`text-sm ${enabled ? "text-gray-700" : "text-gray-400 line-through"}`}
                      >
                        {FEATURE_LABELS[key] || key}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {plan.isCurrent ? (
                  <button
                    disabled
                    className="w-full btn-secondary opacity-60 cursor-not-allowed"
                  >
                    Current Plan
                  </button>
                ) : isPaid ? (
                  <div className="space-y-2">
                    <div className="w-full p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 text-left">
                      <p className="font-medium flex items-start gap-2">
                        <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                        {SUPPORT_NOTE}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled
                      className="w-full btn-secondary opacity-70 cursor-not-allowed"
                    >
                      Paid plans — contact admin
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleChangePlan(plan.id, plan.name)}
                    disabled={!!changingTo}
                    className={`w-full flex items-center justify-center gap-2 ${colors.btn}`}
                  >
                    {changingTo === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        Switching...
                      </>
                    ) : (
                      <>
                        {plan.isDowngrade ? "⬇ Downgrade" : "Select"} to{" "}
                        {plan.name}
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* <div className="mt-12 p-5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3 text-sm text-slate-800">
          <Mail className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Manual billing:</strong> We do not collect card payments in this app. To upgrade, pay using the method agreed with your organization, then ask your platform operator to activate your plan. You can return to the free plan here at any time if your usage allows it.
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default Plans;
