import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, GraduationCap, AlertCircle, CheckCircle, ExternalLink, Loader2, KeyRound } from 'lucide-react';
import useSubscriptionStore from '../../store/subscriptionStore';
import useAuthStore from '../../store/authStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

const FEATURE_LABELS = {
  attendance: 'Attendance',
  studentManagement: 'Students',
  teacherManagement: 'Teachers',
  academicSettings: 'Academic setup (classes, sections, years)',
  csvImport: 'CSV bulk import',
  reportsExport: 'Reports & exports',
  fees: 'Fees & payments',
  exams: 'Exams & results',
  communication: 'Announcements & messages',
  timetable: 'Timetable',
  events: 'Events & calendar',
  leaves: 'Leave management',
  payroll: 'Payroll',
  diary: 'Class diary',
};

const getBarColor = (pct) => {
  if (pct >= 90) return 'bg-red-500';
  if (pct >= 75) return 'bg-yellow-500';
  return 'bg-green-500';
};

const getAlertLevel = (pct) => {
  if (pct >= 90) return 'danger';
  if (pct >= 75) return 'warning';
  return 'ok';
};

const UsageCard = ({ icon: Icon, iconBg, iconColor, label, current, limit, percentage }) => {
  const alertLevel = getAlertLevel(percentage);
  const isUnlimited = limit === 999999;

  return (
    <div className="card">
      <div className="flex items-center gap-4 mb-5">
        <div className={`p-3 rounded-xl ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">{label}</h3>
          <p className="text-sm text-gray-500">
            <span className="text-xl font-bold text-gray-900">{current}</span>
            {' / '}
            <span>{isUnlimited ? '∞ Unlimited' : limit}</span>
          </p>
        </div>
      </div>

      {!isUnlimited && (
        <>
          <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${getBarColor(percentage)}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mb-4">{percentage.toFixed(1)}% used</p>

          {alertLevel === 'danger' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-red-800">
                <strong>Almost full!</strong> You're very close to your {label.toLowerCase()} limit.{' '}
                <Link to="/settings/plans" className="underline font-medium">Upgrade now</Link>.
              </p>
            </div>
          )}
          {alertLevel === 'warning' && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                {percentage.toFixed(0)}% of your {label.toLowerCase()} limit used.{' '}
                <Link to="/settings/plans" className="underline font-medium">Consider upgrading</Link>.
              </p>
            </div>
          )}
        </>
      )}

      {isUnlimited && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-green-800">Unlimited on your current plan</p>
        </div>
      )}
    </div>
  );
};

const Usage = () => {
  const { usage, fetchUsage, isLoading } = useSubscriptionStore();
  const { user } = useAuthStore();

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  if (isLoading && !usage) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <AppHeader logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/dashboard"
          backLabel="Back to dashboard"
          title={user?.schoolName || 'School'}
          subtitle="Usage & limits"
        />
      </AppHeader>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Usage & Limits</h2>
          <p className="text-gray-500 text-sm mt-0.5">Monitor your subscription usage and resource limits</p>
        </div>

        {!usage ? (
          <div className="card text-center py-12 text-gray-500">No usage data available.</div>
        ) : (
          <>
            {/* Current Plan Banner */}
            <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="text-primary-100 text-sm mb-1">Current Plan</p>
                  <h2 className="text-3xl font-bold">{usage.plan.name}</h2>
                  <p className="text-primary-200 mt-1">
                    {usage.plan.price === 0 ? 'Free forever' : `$${usage.plan.price}/month`}
                    {usage.subscriptionExpiry && (
                      <span className="ml-3 text-xs">
                        Expires: {new Date(usage.subscriptionExpiry).toLocaleDateString()}
                      </span>
                    )}
                  </p>
                </div>
                <Link
                  to="/settings/plans"
                  className="bg-white text-primary-700 hover:bg-primary-50 font-semibold py-2 px-5 rounded-lg transition-colors flex items-center gap-2 text-sm"
                >
                  <ExternalLink className="w-4 h-4" /> Change Plan
                </Link>
              </div>
            </div>

            {/* Resource Usage Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <UsageCard
                icon={Users}
                iconBg="bg-blue-100"
                iconColor="text-blue-600"
                label="Students"
                current={usage.usage.students.current}
                limit={usage.usage.students.limit}
                percentage={usage.usage.students.percentage}
              />
              <UsageCard
                icon={GraduationCap}
                iconBg="bg-green-100"
                iconColor="text-green-600"
                label="Teachers"
                current={usage.usage.teachers.current}
                limit={usage.usage.teachers.limit}
                percentage={usage.usage.teachers.percentage}
              />
            </div>

            {/* Features */}
            <div className="card">
              <h3 className="text-lg font-bold text-gray-900 mb-5">Available Features</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(usage.features).map(([key, enabled]) => (
                  <div
                    key={key}
                    className={`p-3.5 rounded-xl border ${
                      enabled
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {enabled ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
                      )}
                      <span className={`text-sm font-medium ${enabled ? 'text-gray-800' : 'text-gray-400'}`}>
                        {FEATURE_LABELS[key] || key}
                      </span>
                    </div>
                    {!enabled && (
                      <Link
                        to="/settings/plans"
                        className="text-xs text-primary-600 hover:underline mt-1.5 ml-6.5 block"
                      >
                        Upgrade to unlock →
                      </Link>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-gray-100 text-gray-700">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Account security</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Change the password for your administrator login.
                  </p>
                </div>
              </div>
              <Link
                to="/settings/password"
                className="btn-secondary whitespace-nowrap inline-flex items-center justify-center"
              >
                Change password
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Usage;
