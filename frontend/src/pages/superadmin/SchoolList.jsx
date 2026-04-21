import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Building2, Search, Loader2, ChevronLeft, ChevronRight, ArrowLeft, LogOut } from 'lucide-react';
import toast from 'react-hot-toast';
import useSuperAdminStore from '../../store/superAdminStore';
import useAuthStore from '../../store/authStore';
import ToggleSwitch from '../../components/superadmin/ToggleSwitch';

const planBadge = (plan) => {
  const colors = {
    free: 'bg-gray-100 text-gray-800',
    basic: 'bg-blue-100 text-blue-800',
    premium: 'bg-purple-100 text-purple-800'
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${colors[plan] || 'bg-gray-100'}`}>
      {plan}
    </span>
  );
};

const SchoolList = () => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const {
    schools,
    total,
    currentPage,
    totalPages,
    isLoading,
    error,
    fetchSchools,
    updateSchoolActive,
    clearError
  } = useSuperAdminStore();
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  const [savingSchoolId, setSavingSchoolId] = useState(null);

  useEffect(() => {
    fetchSchools(1, q);
  }, [q]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const submitSearch = (e) => {
    e.preventDefault();
    setQ(search.trim());
  };

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    fetchSchools(p, q);
  };

  const toggleActive = async (school, next) => {
    setSavingSchoolId(school._id);
    try {
      const res = await updateSchoolActive(school._id, next);
      if (res.success) toast.success(next ? 'School activated' : 'School deactivated');
      else toast.error(res.error || 'Failed');
    } finally {
      setSavingSchoolId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/superadmin/dashboard')} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Overview
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary-600" /> Schools
            </h1>
          </div>
          <button type="button" onClick={() => logout()} className="btn-secondary inline-flex items-center gap-2">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <form onSubmit={submitSearch} className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              className="input-field pl-10"
              placeholder="Search by school name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        <div className="card overflow-x-auto p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">School</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Teachers</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Active</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {schools.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{s.name}</td>
                    <td className="px-4 py-3">{planBadge(s.subscriptionPlan)}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{s.studentCount ?? 0}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-600">{s.teacherCount ?? 0}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <ToggleSwitch
                          checked={!!s.isActive}
                          onCheckedChange={(next) => toggleActive(s, next)}
                          disabled={savingSchoolId !== null && savingSchoolId !== s._id}
                          loading={savingSchoolId === s._id}
                          ariaLabel={`${s.name}: school active`}
                          showStateLabel={false}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/superadmin/schools/${s._id}`} className="text-primary-600 text-sm font-medium hover:underline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!isLoading && schools.length === 0 && (
            <p className="text-center py-12 text-gray-500">No schools found.</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button type="button" className="btn-secondary p-2" onClick={() => goPage(currentPage - 1)} disabled={currentPage === 1}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="btn-secondary p-2"
                onClick={() => goPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolList;
