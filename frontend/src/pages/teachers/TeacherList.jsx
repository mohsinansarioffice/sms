import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Filter, Trash2, Edit, Eye,
  ChevronLeft, ChevronRight, GraduationCap, Loader2,
  AlertCircle, X, Briefcase
} from 'lucide-react';
import toast from 'react-hot-toast';
import useTeacherStore from '../../store/teacherStore';
import useAuthStore from '../../store/authStore';
import DataTable from '../../components/common/DataTable';
import BrandLogo from '../../components/common/BrandLogo';
import LogoutButton from '../../components/common/LogoutButton';
import { createColumnHelper } from '@tanstack/react-table';

// ── Delete confirmation dialog ─────────────────────────────────────────────────
const DeleteDialog = ({ teacher, onConfirm, onCancel, isLoading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Delete Teacher</h3>
          <p className="mt-1 text-sm text-gray-600">
            Are you sure you want to delete{' '}
            <strong>
              {teacher?.personalInfo?.firstName} {teacher?.personalInfo?.lastName}
            </strong>
            ? This action cannot be undone.
          </p>
        </div>
      </div>
      <div className="mt-6 flex gap-3 justify-end">
        <button onClick={onCancel} className="btn-secondary" disabled={isLoading}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>
    </div>
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const TeacherList = () => {
  const { user } = useAuthStore();
  const {
    teachers, total, currentPage, totalPages,
    isLoading, error, filters,
    fetchTeachers, deleteTeacher, setFilters, clearError,
  } = useTeacherStore();

  const [searchInput, setSearchInput] = useState(filters.search);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => { fetchTeachers(1); }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) setFilters({ search: searchInput });
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteTeacher(deleteTarget._id);
    setIsDeleting(false);
    if (result.success) {
      toast.success('Teacher deleted successfully');
      setDeleteTarget(null);
    } else {
      toast.error(result.error || 'Failed to delete teacher');
    }
  };

  const handlePageChange = (page) => {
    fetchTeachers(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const departments = ['Science', 'Mathematics', 'English', 'Urdu', 'Social Studies',
    'Islamiat', 'Computer', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography'];

  const columnHelper = createColumnHelper();

  const teacherColumns = useMemo(() => [
    columnHelper.accessor(row => row, {
      id: 'teacherInfo',
      header: 'Teacher',
      cell: info => {
        const teacher = info.getValue();
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <span className="text-green-700 font-semibold text-sm">
                {teacher.personalInfo?.firstName?.[0] || ''}{teacher.personalInfo?.lastName?.[0] || ''}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {teacher.personalInfo?.firstName} {teacher.personalInfo?.lastName}
              </p>
              <p className="text-xs text-gray-500">{teacher.personalInfo?.gender}</p>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor('employeeId', {
      header: 'Employee ID',
      cell: info => <span className="text-sm text-gray-600 font-mono">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => row, {
      id: 'department',
      header: 'Department',
      cell: info => <span className="text-sm text-gray-600">{info.getValue().professionalInfo?.department || '—'}</span>
    }),
    columnHelper.accessor(row => row, {
      id: 'designation',
      header: 'Designation',
      cell: info => {
        const teacher = info.getValue();
        return (
          <div>
            <p className="text-sm text-gray-900">{teacher.professionalInfo?.designation || '—'}</p>
            {teacher.professionalInfo?.experience > 0 && (
              <p className="text-xs text-gray-400">{teacher.professionalInfo.experience} yr exp.</p>
            )}
          </div>
        )
      }
    }),
    columnHelper.accessor(row => row, {
      id: 'contactInfo',
      header: 'Contact',
      cell: info => <span className="text-sm text-gray-600">{info.getValue().contactInfo?.phone || '—'}</span>
    }),
    columnHelper.accessor('isActive', {
      header: 'Status',
      cell: info => {
        const isActive = info.getValue();
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {isActive ? 'Active' : 'Inactive'}
          </span>
        )
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right w-full">Actions</div>,
      cell: props => {
        const teacher = props.row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Link
              to={`/teachers/${teacher._id}`}
              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Link>
            {user?.role === 'admin' && (
              <>
                <Link
                  to={`/teachers/${teacher._id}/edit`}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setDeleteTarget(teacher)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )
      }
    })
  ], [user, setDeleteTarget]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Nav ── */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <BrandLogo linkTo="/dashboard" />
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm font-medium shrink-0">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
              <p className="text-xs text-gray-500">Teacher Management</p>
            </div>
          </div>
          <LogoutButton className="btn-secondary flex items-center gap-2" />
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-green-600" /> Teachers
            </h2>
            <p className="text-gray-500 mt-1">
              {isLoading ? 'Loading...' : `${total} teacher${total !== 1 ? 's' : ''} total`}
            </p>
          </div>
          {user?.role === 'admin' && (
            <Link to="/teachers/new" className="btn-primary flex items-center gap-2 self-start sm:self-auto">
              <Plus className="w-5 h-5" /> Add Teacher
            </Link>
          )}
        </div>

        {/* ── Error Banner ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm flex-1">{error}</span>
            <button onClick={clearError}><X className="w-4 h-4" /></button>
          </div>
        )}

        {/* ── Filters ── */}
        <div className="card">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="sm:col-span-2 lg:col-span-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search by name or employee ID..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>

            {/* Department filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="input-field pl-9 appearance-none"
                value={filters.department}
                onChange={e => setFilters({ department: e.target.value })}
              >
                <option value="">All Departments</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {/* Status tabs */}
          <div className="mt-4 flex gap-2 border-b">
            {['active', 'inactive', ''].map((s) => (
              <button
                key={s}
                onClick={() => setFilters({ status: s })}
                className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                  filters.status === s
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* ── Table ── */}
        <div className="card p-0 overflow-hidden border border-gray-200">
          <DataTable
            columns={teacherColumns}
            data={teachers}
            searchable={false}
            hidePagination={true}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center justify-center">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No teachers found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {filters.search || filters.department
                    ? 'Try adjusting your filters'
                    : 'Add your first teacher to get started'}
                </p>
                {user?.role === 'admin' && !filters.search && !filters.department && (
                  <Link to="/teachers/new" className="btn-primary inline-flex items-center gap-2 mt-4">
                    <Plus className="w-4 h-4" /> Add Teacher
                  </Link>
                )}
              </div>
            }
          />

          {/* ── Pagination ── */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t bg-gray-50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> — {total} results
              </p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || isLoading}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) page = i + 1;
                  else if (currentPage <= 3) page = i + 1;
                  else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                  else page = currentPage - 2 + i;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={isLoading}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === currentPage ? 'bg-green-600 text-white' : 'text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || isLoading}
                  className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Delete Dialog ── */}
      {deleteTarget && (
        <DeleteDialog
          teacher={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}
    </div>
  );
};

export default TeacherList;
