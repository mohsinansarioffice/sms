import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  GraduationCap,
  DollarSign,
  PieChart,
  Loader2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useSuperAdminStore from '../../store/superAdminStore';
import LogoutButton from '../../components/common/LogoutButton';
import BrandLogo from '../../components/common/BrandLogo';

const SuperAdminDashboard = () => {
  const { overview, fetchOverview, fetchPaymentAlerts, paymentAlerts, isLoading, error, clearError } =
    useSuperAdminStore();
  const [dismissPaymentPanel, setDismissPaymentPanel] = useState(false);

  useEffect(() => {
    fetchOverview();
    fetchPaymentAlerts();
  }, [fetchOverview, fetchPaymentAlerts]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  if (isLoading && !overview) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  const planDist = overview?.planDistribution || {};
  const dueOrOverdue = paymentAlerts?.dueOrOverdue || [];
  const awaitingPayment = paymentAlerts?.awaitingPayment || [];
  const hasPaymentAttention =
    !dismissPaymentPanel && (dueOrOverdue.length > 0 || awaitingPayment.length > 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex min-w-0 items-start gap-3 sm:gap-4">
            <BrandLogo linkTo="/superadmin/dashboard" className="mt-0.5" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Platform overview</h1>
              <p className="text-sm text-gray-500">All schools</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/superadmin/schools" className="btn-primary inline-flex items-center gap-2">
              Manage schools <ArrowRight className="w-4 h-4" />
            </Link>
            <LogoutButton className="btn-secondary inline-flex items-center gap-2" />
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {hasPaymentAttention && (
          <div className="card border-amber-300 bg-amber-50">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                <h2 className="text-lg font-bold text-amber-950">Payment attention</h2>
              </div>
              <button
                type="button"
                onClick={() => setDismissPaymentPanel(true)}
                className="text-sm text-amber-900 underline"
              >
                Dismiss for this session
              </button>
            </div>
            {awaitingPayment.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-amber-950 mb-2">Awaiting payment confirmation</p>
                <ul className="text-sm space-y-1">
                  {awaitingPayment.map((s) => (
                    <li key={s._id}>
                      <Link
                        to={`/superadmin/schools/${s._id}`}
                        className="text-primary-700 hover:underline font-medium"
                      >
                        {s.name}
                      </Link>
                      <span className="text-amber-900">
                        {' '}
                        — {s.subscriptionPlan} (pending)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dueOrOverdue.length > 0 && (
              <div>
                <p className="text-sm font-medium text-amber-950 mb-2">Due today or overdue</p>
                <ul className="text-sm space-y-1">
                  {dueOrOverdue.map((s) => (
                    <li key={s._id}>
                      <Link
                        to={`/superadmin/schools/${s._id}`}
                        className="text-primary-700 hover:underline font-medium"
                      >
                        {s.name}
                      </Link>
                      <span className="text-amber-900">
                        {' '}
                        — due {s.paymentDueDate ? new Date(s.paymentDueDate).toLocaleDateString() : '—'}
                        {s.pendingPayment ? ' (also marked pending)' : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="w-8 h-8 text-primary-600" />
              <p className="text-sm text-gray-500">Schools (total)</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{overview?.totalSchools ?? '—'}</p>
            <p className="text-xs text-gray-400 mt-1">Active: {overview?.activeSchools ?? '—'}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-8 h-8 text-blue-600" />
              <p className="text-sm text-gray-500">Students</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{overview?.totalStudents ?? '—'}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <GraduationCap className="w-8 h-8 text-green-600" />
              <p className="text-sm text-gray-500">Teachers</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{overview?.totalTeachers ?? '—'}</p>
          </div>
          <div className="card">
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-8 h-8 text-amber-600" />
              <p className="text-sm text-gray-500">Fee payments (total)</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.totalFeeCollected != null
                ? Number(overview.totalFeeCollected).toLocaleString()
                : '—'}
            </p>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-bold text-gray-900">Plan distribution</h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {['free', 'basic', 'premium'].map((plan) => (
              <div key={plan} className="border rounded-lg p-4 text-center">
                <p className="text-sm font-medium text-gray-500 capitalize">{plan}</p>
                <p className="text-2xl font-bold text-gray-900">{planDist[plan] ?? 0}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
