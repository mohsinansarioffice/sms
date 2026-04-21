import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import useSuperAdminStore from '../../store/superAdminStore';
import useAuthStore from '../../store/authStore';
import ToggleSwitch from '../../components/superadmin/ToggleSwitch';

const FEATURE_LABELS = {
  attendance: 'Attendance',
  studentManagement: 'Students',
  teacherManagement: 'Teachers',
  academicSettings: 'Academic setup',
  csvImport: 'CSV import',
  reportsExport: 'Reports & exports',
  fees: 'Fees',
  exams: 'Exams',
  communication: 'Announcements & messages',
  timetable: 'Timetable',
  events: 'Events',
  leaves: 'Leaves',
  payroll: 'Payroll',
  diary: 'Class diary',
};

const SchoolDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const {
    schoolDetail,
    fetchSchool,
    updateSchoolPlan,
    updateSchoolFeature,
    isLoading,
    error,
    clearError,
  } = useSuperAdminStore();

  const [planSelect, setPlanSelect] = useState('free');
  const [paymentDueInput, setPaymentDueInput] = useState('');
  const [savingFeatureKey, setSavingFeatureKey] = useState(null);
  const [savingPlan, setSavingPlan] = useState(false);

  const school = schoolDetail?.school;

  useEffect(() => {
    if (id) fetchSchool(id);
  }, [id, fetchSchool]);

  useEffect(() => {
    if (!school) return;
    setPlanSelect(school.subscriptionPlan || 'free');
    if (school.paymentDueDate) {
      const d = new Date(school.paymentDueDate);
      setPaymentDueInput(Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10));
    } else {
      setPaymentDueInput('');
    }
  }, [school]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);
  const stats = schoolDetail?.stats;
  const planDefaults = schoolDetail?.planDefaults || {};
  const effectiveFeatures = schoolDetail?.effectiveFeatures || {};

  const overrides = useMemo(() => {
    const raw = school?.featureOverrides;
    if (!raw) return {};
    if (typeof raw === 'object' && !(raw instanceof Map)) return { ...raw };
    return {};
  }, [school]);

  const handleSavePlanAndBilling = async () => {
    setSavingPlan(true);
    try {
      const res = await updateSchoolPlan(id, {
        newPlan: planSelect,
        paymentDueDate: paymentDueInput || null,
      });
      if (res.success) toast.success('Plan and billing date updated');
      else toast.error(res.error || 'Failed to update');
    } finally {
      setSavingPlan(false);
    }
  };

  const handleFeatureToggle = async (key, checked) => {
    const def = planDefaults[key];
    const payload =
      checked === def
        ? { featureKey: key, clear: true }
        : { featureKey: key, value: checked, clear: false };

    setSavingFeatureKey(key);
    try {
      const res = await updateSchoolFeature(id, payload);
      if (res.success) toast.success('Feature updated');
      else toast.error(res.error || 'Failed');
    } finally {
      setSavingFeatureKey(null);
    }
  };

  if (isLoading && !school) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 text-center">
        <p className="text-gray-600">School not found.</p>
        <Link to="/superadmin/schools" className="text-primary-600 mt-4 inline-block">
          Back to schools
        </Link>
      </div>
    );
  }

  const featureKeys = Object.keys(planDefaults);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <button type="button" onClick={() => navigate('/superadmin/schools')} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <button type="button" onClick={() => logout()} className="btn-secondary inline-flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div className="card">
          <h1 className="text-2xl font-bold text-gray-900">{school.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {school.isActive ? <span className="text-green-700 font-medium">Active</span> : <span className="text-red-700 font-medium">Inactive</span>}
            {' · '}
            Expires: {school.subscriptionExpiry ? new Date(school.subscriptionExpiry).toLocaleDateString() : '—'}
            {school.pendingPayment && (
              <span className="ml-2 text-amber-700 font-medium">· Pending payment confirmation</span>
            )}
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Usage</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Students</p>
              <p className="text-xl font-semibold">{stats?.studentCount ?? 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Teachers</p>
              <p className="text-xl font-semibold">{stats?.teacherCount ?? 0}</p>
            </div>
            <div>
              <p className="text-gray-500">Fees collected</p>
              <p className="text-xl font-semibold">
                {stats?.feeCollected != null ? Number(stats.feeCollected).toLocaleString() : '0'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Last payment</p>
              <p className="text-sm font-medium">
                {stats?.lastPaymentDate ? new Date(stats.lastPaymentDate).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Subscription & billing</h2>
          <p className="text-sm text-gray-600">
            Set the plan after you receive payment manually. Clear the payment due field if not billing this school on a schedule.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:items-end flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Plan</label>
              <select
                className="input-field max-w-xs"
                value={planSelect}
                onChange={(e) => setPlanSelect(e.target.value)}
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Payment due date</label>
              <input
                type="date"
                className="input-field max-w-xs"
                value={paymentDueInput}
                onChange={(e) => setPaymentDueInput(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="btn-primary inline-flex items-center justify-center gap-2 min-w-[10rem]"
              onClick={handleSavePlanAndBilling}
              disabled={savingPlan}
            >
              {savingPlan ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                'Save plan & billing'
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Current due date:{' '}
            {school.paymentDueDate
              ? new Date(school.paymentDueDate).toLocaleDateString()
              : '—'}
          </p>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Feature access</h2>
          <p className="text-sm text-gray-600 mb-4">
            Toggle overrides per feature. When off, the plan default applies. Clearing an override restores the plan default.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 pr-4">Feature</th>
                  <th className="py-2 pr-4">Plan default</th>
                  <th className="py-2 pr-4">Override</th>
                  <th className="py-2">Effective</th>
                </tr>
              </thead>
              <tbody>
                {featureKeys.map((key) => {
                  const def = !!planDefaults[key];
                  const hasOverride = Object.prototype.hasOwnProperty.call(overrides, key);
                  const eff = !!effectiveFeatures[key];
                  return (
                    <tr key={key} className="border-b border-gray-100">
                      <td className="py-3 pr-4 font-medium text-gray-900">{FEATURE_LABELS[key] || key}</td>
                      <td className="py-3 pr-4">{def ? 'On' : 'Off'}</td>
                      <td className="py-3 pr-4">
                        {hasOverride ? (overrides[key] ? 'On' : 'Off') : '—'}
                      </td>
                      <td className="py-3">
                        <ToggleSwitch
                          checked={eff}
                          onCheckedChange={(next) => handleFeatureToggle(key, next)}
                          disabled={savingFeatureKey !== null}
                          loading={savingFeatureKey === key}
                          ariaLabel={`${FEATURE_LABELS[key] || key}: effective access`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetail;
