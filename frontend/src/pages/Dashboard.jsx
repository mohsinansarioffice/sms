import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LogOut,
  Users,
  GraduationCap,
  CalendarCheck,
  ArrowRight,
  Settings,
  TrendingUp,
  Calendar,
  Zap,
  BookOpen,
  FileText,
  CreditCard,
  DollarSign,
  Megaphone,
  Mail,
  NotebookPen,
  Menu,
  X,
} from "lucide-react";
import useAuthStore from "../store/authStore";
import useStudentStore from "../store/studentStore";
import useTeacherStore from "../store/teacherStore";
import useSubscriptionStore from "../store/subscriptionStore";
import useCommunicationStore from "../store/communicationStore";
import useEventStore from "../store/eventStore";
import NotificationBell from "../components/NotificationBell";
import NavbarAlertsLink from "../components/NavbarAlertsLink";
import {
  shouldShowBillingReminder,
  daysUntilDueDate,
  billingReminderTone,
} from "../lib/billingReminder";

/** When usage is still loading, features are treated as enabled to avoid flicker. */
function usePlanFeatures(usage) {
  const f = usage?.features;
  return (key) => (f == null ? true : !!f[key]);
}

/** Matches settings/Plans.jsx PLAN_COLORS for consistent plan badges. */
const PLAN_BADGE_CLASS = {
  free: "bg-gray-100 text-gray-700 ring-gray-200",
  basic: "bg-primary-100 text-primary-700 ring-primary-200",
  premium: "bg-yellow-100 text-yellow-700 ring-yellow-300",
};

function GatedLink({
  ok,
  to,
  className,
  children,
  lockedHint = "Not on your plan",
}) {
  if (ok) {
    return (
      <Link to={to} className={className}>
        {children}
      </Link>
    );
  }
  return (
    <div
      className={`${className} opacity-55 border-dashed border-gray-200 cursor-not-allowed`}
    >
      {children}
      <p className="text-xs text-amber-900/90 mt-2 text-center font-medium">
        {lockedHint}
      </p>
    </div>
  );
}

function GatedButton({
  ok,
  onClick,
  className,
  children,
  lockedHint = "Not on your plan",
}) {
  if (ok) {
    return (
      <button type="button" onClick={onClick} className={className}>
        {children}
      </button>
    );
  }
  return (
    <div
      className={`${className} opacity-55 border-dashed border-gray-200 cursor-not-allowed`}
    >
      {children}
      <p className="text-xs text-amber-900/90 mt-1 text-center font-medium">
        {lockedHint}
      </p>
    </div>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { total: studentTotal, fetchStudents } = useStudentStore();
  const { total: teacherTotal, fetchTeachers } = useTeacherStore();
  const { usage, fetchUsage } = useSubscriptionStore();
  const {
    announcements: recentAnnouncements,
    unreadAnnouncementsCount,
    unreadMessagesCount,
    fetchAnnouncements,
    fetchUnreadAnnouncementsCount,
    fetchUnreadMessagesCount,
  } = useCommunicationStore();
  const { events: upcomingEvents, fetchEvents } = useEventStore();

  const [dismissPendingPay, setDismissPendingPay] = useState(false);
  const [dismissBillingRem, setDismissBillingRem] = useState(false);
  const [navMenuOpen, setNavMenuOpen] = useState(false);

  const feat = usePlanFeatures(usage);
  const staff = user?.role === "admin" || user?.role === "teacher";
  const planId = usage?.plan?.id;
  const planBadgeId = String(
    planId || user?.subscriptionPlan || "free",
  ).toLowerCase();
  const planDisplayName =
    usage?.plan?.name || user?.subscriptionPlan || "Free";
  const pendingPayment = !!usage?.pendingPayment;
  const paymentDueDate = usage?.paymentDueDate;
  const daysLeft =
    paymentDueDate != null ? daysUntilDueDate(paymentDueDate) : null;
  const showPendingBanner =
    staff &&
    planId &&
    planId !== "free" &&
    pendingPayment &&
    !dismissPendingPay;
  const showBillingBanner =
    staff &&
    planId &&
    planId !== "free" &&
    paymentDueDate &&
    shouldShowBillingReminder(paymentDueDate) &&
    !dismissBillingRem;

  useEffect(() => {
    fetchStudents(1);
    fetchTeachers(1);
    fetchUsage();
  }, []);

  useEffect(() => {
    if (!usage) return;
    if (!usage.features?.communication) return;
    fetchAnnouncements(1, 5, "");
    fetchUnreadAnnouncementsCount();
    fetchUnreadMessagesCount();
  }, [
    usage,
    fetchAnnouncements,
    fetchUnreadAnnouncementsCount,
    fetchUnreadMessagesCount,
  ]);

  useEffect(() => {
    if (!usage) return;
    if (!usage.features?.events) return;
    fetchEvents({
      month: String(new Date().getMonth() + 1),
      year: String(new Date().getFullYear()),
    });
  }, [usage, fetchEvents]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setNavMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const studentLimit = usage?.usage?.students?.limit;
  const teacherLimit = usage?.usage?.teachers?.limit;
  const studentPct = usage?.usage?.students?.percentage ?? 0;
  const teacherPct = usage?.usage?.teachers?.percentage ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Nav ── */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h1
                  className="text-lg sm:text-xl font-bold text-gray-900 min-w-0 truncate"
                  title={user?.schoolName || ""}
                >
                  {user?.schoolName}
                </h1>
                <Link
                  to="/settings/plans"
                  title="View subscription plans"
                  className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ring-1 ring-inset transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
                    PLAN_BADGE_CLASS[planBadgeId] ?? PLAN_BADGE_CLASS.free
                  }`}
                >
                  {planDisplayName}
                </Link>
              </div>
              <p
                className="text-sm text-gray-600 truncate mt-0.5"
                title={
                  user?.name ? `Welcome back, ${user.name}` : undefined
                }
              >
                Welcome back, {user?.name}
              </p>
            </div>

            <div className="hidden lg:flex flex-shrink-0 flex-wrap items-center justify-end gap-2 xl:gap-3">
              <NotificationBell />
              <NavbarAlertsLink />
              {(user?.role === "admin" || user?.role === "teacher") &&
                feat("communication") && (
                  <Link
                    to="/announcements/new"
                    className="btn-primary inline-flex items-center gap-2 whitespace-nowrap"
                  >
                    <Megaphone className="w-4 h-4 shrink-0" /> New announcement
                  </Link>
                )}
              <button
                type="button"
                onClick={() => navigate("/settings/usage")}
                className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap"
              >
                <Settings className="w-4 h-4 shrink-0" /> Settings
              </button>
              <button
                type="button"
                onClick={logout}
                className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap"
              >
                <LogOut className="w-4 h-4 shrink-0" /> Logout
              </button>
            </div>

            <div className="flex lg:hidden flex-shrink-0 items-center gap-0.5">
              <NotificationBell />
              <button
                type="button"
                className="p-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-expanded={navMenuOpen}
                aria-controls="dashboard-nav-menu"
                aria-label={navMenuOpen ? "Close menu" : "Open menu"}
                onClick={() => setNavMenuOpen((o) => !o)}
              >
                {navMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {navMenuOpen ? (
            <div
              id="dashboard-nav-menu"
              className="lg:hidden mt-3 pt-3 border-t border-gray-100 flex flex-col gap-2"
            >
              <NavbarAlertsLink
                className="btn-secondary flex w-full items-center justify-center gap-2 py-2.5"
                onNavigate={() => setNavMenuOpen(false)}
              />
              {(user?.role === "admin" || user?.role === "teacher") &&
                feat("communication") && (
                  <Link
                    to="/announcements/new"
                    className="btn-primary flex w-full items-center justify-center gap-2 py-2.5"
                    onClick={() => setNavMenuOpen(false)}
                  >
                    <Megaphone className="w-4 h-4 shrink-0" /> New announcement
                  </Link>
                )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setNavMenuOpen(false);
                    navigate("/settings/usage");
                  }}
                  className="btn-secondary flex items-center justify-center gap-2 py-2.5"
                >
                  <Settings className="w-4 h-4 shrink-0" /> Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNavMenuOpen(false);
                    logout();
                  }}
                  className="btn-secondary flex items-center justify-center gap-2 py-2.5"
                >
                  <LogOut className="w-4 h-4 shrink-0" /> Logout
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* ── Upgrade Banner (free plan only) ── */}
        {user?.subscriptionPlan === "free" && (
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-lg">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">Unlock More Features!</h3>
                <p className="text-primary-100 text-sm mt-0.5">
                  Compare Basic and Premium features. Activation is manual after
                  payment—see Plans for details.
                </p>
              </div>
            </div>
            <Link
              to="/settings/plans"
              className="bg-white text-primary-700 hover:bg-primary-50 font-semibold py-2.5 px-6 rounded-lg transition-colors text-sm whitespace-nowrap"
            >
              View Plans
            </Link>
          </div>
        )}

        {/* Pending offline payment (paid plan, not yet confirmed) */}
        {showPendingBanner && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-amber-950">
              <strong>Payment required:</strong> Your{" "}
              {usage?.plan?.name || "paid"} plan is pending payment
              confirmation. Complete payment using the method agreed with your
              administrator. Your access may be adjusted if payment is not
              received on time.
            </p>
            <button
              type="button"
              onClick={() => setDismissPendingPay(true)}
              className="text-sm font-medium text-amber-900 underline shrink-0"
            >
              Dismiss for this session
            </button>
          </div>
        )}

        {/* Monthly payment reminder */}
        {showBillingBanner && daysLeft != null && (
          <div
            className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
              billingReminderTone(daysLeft) === "danger"
                ? "border-red-300 bg-red-50 text-red-950"
                : billingReminderTone(daysLeft) === "warning"
                  ? "border-amber-300 bg-amber-50 text-amber-950"
                  : "border-blue-200 bg-blue-50 text-blue-950"
            }`}
          >
            <p className="text-sm">
              {daysLeft < 0 ? (
                <>
                  <strong>Payment overdue:</strong> The due date was{" "}
                  {new Date(paymentDueDate).toLocaleDateString()}. Please
                  contact your administrator to arrange payment and avoid
                  service changes.
                </>
              ) : daysLeft === 0 ? (
                <>
                  <strong>Payment due today.</strong> Please ensure your
                  subscription payment is submitted as agreed.
                </>
              ) : (
                <>
                  <strong>Subscription payment:</strong>{" "}
                  {daysLeft === 1 ? "1 day" : `${daysLeft} days`} until your due
                  date ({new Date(paymentDueDate).toLocaleDateString()}).
                </>
              )}
            </p>
            <button
              type="button"
              onClick={() => setDismissBillingRem(true)}
              className="text-sm font-medium underline shrink-0 opacity-90"
            >
              Dismiss for this session
            </button>
          </div>
        )}

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {/* Students */}
          <Link
            to="/students"
            className="card group cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-xl">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Students</p>
            <h3 className="text-3xl font-bold text-gray-900">{studentTotal}</h3>
            {studentLimit && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>
                    Limit: {studentLimit === 999999 ? "∞" : studentLimit}
                  </span>
                  {studentLimit !== 999999 && (
                    <span>{studentPct.toFixed(0)}%</span>
                  )}
                </div>
                {studentLimit !== 999999 && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        studentPct >= 90
                          ? "bg-red-500"
                          : studentPct >= 75
                            ? "bg-yellow-500"
                            : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(studentPct, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </Link>

          {/* Teachers */}
          <Link
            to="/teachers"
            className="card group cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Teachers</p>
            <h3 className="text-3xl font-bold text-gray-900">{teacherTotal}</h3>
            {teacherLimit && (
              <div className="mt-3">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>
                    Limit: {teacherLimit === 999999 ? "∞" : teacherLimit}
                  </span>
                  {teacherLimit !== 999999 && (
                    <span>{teacherPct.toFixed(0)}%</span>
                  )}
                </div>
                {teacherLimit !== 999999 && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${
                        teacherPct >= 90
                          ? "bg-red-500"
                          : teacherPct >= 75
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(teacherPct, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </Link>

          {/* Attendance */}
          <GatedLink
            ok={feat("attendance")}
            to="/attendance/mark"
            className="card group cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-xl">
                <CalendarCheck className="w-6 h-6 text-purple-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Attendance</p>
            <h3 className="text-3xl font-bold text-gray-900">Mark</h3>
            <p className="text-xs text-gray-400 mt-1">
              Record daily attendance
            </p>
          </GatedLink>

          {/* Exams */}
          <GatedLink
            ok={feat("exams")}
            to="/exams"
            className="card group cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 rounded-xl">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Exams & Results</p>
            <h3 className="text-3xl font-bold text-gray-900">Manage</h3>
            <p className="text-xs text-gray-400 mt-1">Assessments and marks</p>
          </GatedLink>

          {/* Fees */}
          <GatedLink
            ok={feat("fees")}
            to="/fees/students"
            className="card group cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-green-500 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Fee Management</p>
            <h3 className="text-3xl font-bold text-gray-900 leading-none">
              Collect
            </h3>
            <p className="text-xs text-gray-400 mt-1">Payments & Defaulters</p>
          </GatedLink>

          {/* Diary */}
          <GatedLink
            ok={feat("diary")}
            to="/diary"
            className="card group cursor-pointer hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-teal-50 rounded-xl">
                <NotebookPen className="w-6 h-6 text-teal-600" />
              </div>
              <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-sm text-gray-500 mb-1">Class Diary</p>
            <h3 className="text-3xl font-bold text-gray-900">Log</h3>
            <p className="text-xs text-gray-400 mt-1">Homework & notices</p>
          </GatedLink>
        </div>

        {/* ── Communications snapshot ── */}
        {feat("communication") ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary-600" />
                    Announcements
                  </h2>
                  {unreadAnnouncementsCount > 0 && (
                    <p className="text-sm text-primary-600 font-medium mt-1">
                      {unreadAnnouncementsCount} unread
                    </p>
                  )}
                </div>
                <Link
                  to="/announcements"
                  className="text-sm text-primary-600 font-medium"
                >
                  View all →
                </Link>
              </div>
              {!recentAnnouncements?.length ? (
                <p className="text-sm text-gray-500">No announcements yet.</p>
              ) : (
                <ul className="space-y-3">
                  {recentAnnouncements.slice(0, 5).map((a) => (
                    <li key={a._id}>
                      <Link
                        to={`/announcements/${a._id}`}
                        className="block group"
                      >
                        <p
                          className={`text-sm text-gray-900 group-hover:text-primary-700 ${
                            !a.isRead ? "font-semibold" : ""
                          }`}
                        >
                          {!a.isRead && (
                            <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 mr-2 align-middle" />
                          )}
                          {a.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {a.createdAt
                            ? new Date(a.createdAt).toLocaleDateString()
                            : ""}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Mail className="w-5 h-5 text-primary-600" />
                    Messages
                  </h2>
                  {unreadMessagesCount > 0 && (
                    <p className="text-sm text-amber-700 font-medium mt-1">
                      {unreadMessagesCount} unread in inbox
                    </p>
                  )}
                </div>
                <Link
                  to="/messages"
                  className="text-sm text-primary-600 font-medium"
                >
                  Open inbox →
                </Link>
              </div>
              <p className="text-sm text-gray-600">
                Send and receive direct messages with staff and students in your
                school.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  to="/messages/compose"
                  className="btn-primary text-sm py-2 px-3"
                >
                  Compose
                </Link>
                <Link
                  to="/messages"
                  className="btn-secondary text-sm py-2 px-3"
                >
                  Inbox
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="card border-dashed border-amber-200 bg-amber-50/90 text-sm text-amber-950">
            <p className="font-medium mb-1">Announcements &amp; messages</p>
            <p className="mb-3">
              Not included on your current plan. Upgrade to use school-wide
              announcements and messaging.
            </p>
            <Link
              to="/settings/plans"
              className="text-primary-700 font-semibold underline"
            >
              Compare plans
            </Link>
          </div>
        )}

        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary-600" />
              Upcoming Events
            </h2>
            {feat("events") ? (
              <Link
                to="/events"
                className="text-sm text-primary-600 font-medium"
              >
                View calendar →
              </Link>
            ) : (
              <span className="text-xs text-gray-400">Not on your plan</span>
            )}
          </div>
          {!feat("events") ? (
            <p className="text-sm text-gray-500">
              Events are available on a higher plan.{" "}
              <Link
                to="/settings/plans"
                className="text-primary-600 font-medium underline"
              >
                View plans
              </Link>
            </p>
          ) : !upcomingEvents?.length ? (
            <p className="text-sm text-gray-500">No events this month.</p>
          ) : (
            <div className="space-y-2">
              {upcomingEvents.slice(0, 4).map((event) => (
                <div
                  key={event._id}
                  className="border rounded-lg p-3 bg-gray-50"
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {event.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(event.eventDate).toLocaleDateString()} |{" "}
                    {event.type}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Quick Actions ── */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-5">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <GatedButton
              ok={feat("studentManagement")}
              onClick={() => navigate("/students/new")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all group"
            >
              <Users className="w-6 h-6 text-gray-400 group-hover:text-primary-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-primary-700 transition-colors">
                Add Student
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("teacherManagement")}
              onClick={() => navigate("/teachers/new")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <GraduationCap className="w-6 h-6 text-gray-400 group-hover:text-green-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-green-700 transition-colors">
                Add Teacher
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("attendance")}
              onClick={() => navigate("/attendance/mark")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
            >
              <Calendar className="w-6 h-6 text-gray-400 group-hover:text-purple-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-purple-700 transition-colors">
                Mark Attendance
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("attendance")}
              onClick={() => navigate("/attendance/report")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-yellow-400 hover:bg-yellow-50 transition-all group"
            >
              <TrendingUp className="w-6 h-6 text-gray-400 group-hover:text-yellow-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-yellow-700 transition-colors">
                View Reports
              </p>
            </GatedButton>
            <button
              onClick={() => navigate("/settings/usage")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <Zap className="w-6 h-6 text-gray-400 group-hover:text-blue-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors">
                Subscription
              </p>
            </button>
            <GatedButton
              ok={feat("academicSettings")}
              onClick={() => navigate("/settings/academic")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
            >
              <BookOpen className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-indigo-700 transition-colors">
                Academic
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("exams")}
              onClick={() => navigate("/exams")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <FileText className="w-6 h-6 text-gray-400 group-hover:text-blue-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-blue-700 transition-colors text-center">
                Exams
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("fees")}
              onClick={() => navigate("/fees/settings")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <Settings className="w-6 h-6 text-gray-400 group-hover:text-green-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-green-700 transition-colors text-center">
                Fee Settings
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("fees")}
              onClick={() => navigate("/fees/reports")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-red-400 hover:bg-red-50 transition-all group"
            >
              <TrendingUp className="w-6 h-6 text-gray-400 group-hover:text-red-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-red-700 transition-colors text-center">
                Revenue Analysis
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("fees")}
              onClick={() => navigate("/fees/students")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition-all group"
            >
              <CreditCard className="w-6 h-6 text-gray-400 group-hover:text-primary-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-primary-700 transition-colors text-center">
                Payments
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("studentManagement")}
              onClick={() => navigate("/students/promote")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all group"
            >
              <Users className="w-6 h-6 text-gray-400 group-hover:text-emerald-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-emerald-700 transition-colors text-center">
                Promote
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("leaves")}
              onClick={() => navigate("/leaves")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-400 hover:bg-amber-50 transition-all group"
            >
              <CalendarCheck className="w-6 h-6 text-gray-400 group-hover:text-amber-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-amber-700 transition-colors text-center">
                Leaves
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("events")}
              onClick={() => navigate("/events")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-violet-400 hover:bg-violet-50 transition-all group"
            >
              <Calendar className="w-6 h-6 text-gray-400 group-hover:text-violet-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-violet-700 transition-colors text-center">
                Events
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("payroll")}
              onClick={() => navigate("/payroll")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-rose-400 hover:bg-rose-50 transition-all group"
            >
              <DollarSign className="w-6 h-6 text-gray-400 group-hover:text-rose-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-rose-700 transition-colors text-center">
                Payroll
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("timetable")}
              onClick={() => navigate("/timetable/editor")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
            >
              <Calendar className="w-6 h-6 text-gray-400 group-hover:text-indigo-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-indigo-700 transition-colors text-center">
                Timetable Editor
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("timetable")}
              onClick={() => navigate("/timetable/view")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-purple-400 hover:bg-purple-50 transition-all group"
            >
              <CalendarCheck className="w-6 h-6 text-gray-400 group-hover:text-purple-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-purple-700 transition-colors text-center">
                View Timetable
              </p>
            </GatedButton>
            <GatedButton
              ok={feat("diary")}
              onClick={() => navigate("/diary/new")}
              className="p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-teal-400 hover:bg-teal-50 transition-all group"
            >
              <NotebookPen className="w-6 h-6 text-gray-400 group-hover:text-teal-600 mb-2 mx-auto transition-colors" />
              <p className="text-sm font-medium text-gray-600 group-hover:text-teal-700 transition-colors text-center">
                Add Diary Entry
              </p>
            </GatedButton>
          </div>
        </div>

        {/* ── Plan / Role badge ── */}
        <div className="flex items-center justify-between p-4 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-600">
          <div>
            <strong>Plan:</strong>{" "}
            <span className="uppercase font-semibold text-gray-800">
              {user?.subscriptionPlan}
            </span>
            <span className="mx-3 text-gray-300">|</span>
            <strong>Role:</strong>{" "}
            <span className="uppercase font-semibold text-gray-800">
              {user?.role}
            </span>
          </div>
          <Link
            to="/settings/usage"
            className="text-primary-600 hover:text-primary-800 font-medium"
          >
            View Usage →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
