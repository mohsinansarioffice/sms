import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus, Search, Filter, Trash2, Edit, Eye,
  ChevronLeft, ChevronRight, Users, Loader2,
  AlertCircle, X, LogOut, Upload, FileDown, Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import useStudentStore from '../../store/studentStore';
import useAuthStore from '../../store/authStore';
import useAcademicStore from '../../store/academicStore';
import useSubscriptionStore from '../../store/subscriptionStore';
import DataTable from '../../components/common/DataTable';
import { createColumnHelper } from '@tanstack/react-table';

const STUDENT_IMPORT_SAMPLE_CSV = `firstName,lastName,guardianName,guardianPhone,className,sectionName,gender,dateOfBirth,phone,email
Jane,Doe,Mary Doe,+1234567890,Grade 1,A,Female,2015-03-15,+1987654321,jane@example.com
`;

// ── Delete confirmation dialog ────────────────────────────────────────────────
const DeleteDialog = ({ student, onConfirm, onCancel, isLoading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Delete Student</h3>
          <p className="mt-1 text-sm text-gray-600">
            Are you sure you want to delete{' '}
            <strong>{student?.personalInfo?.firstName} {student?.personalInfo?.lastName}</strong>?
            This action cannot be undone.
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

// ── CSV import modal (Premium) ─────────────────────────────────────────────────
const ImportStudentsModal = ({ open, onClose, onSuccess }) => {
  const { importStudentsCsv } = useStudentStore();
  const [file, setFile] = useState(null);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setIsImporting(false);
    }
  }, [open]);

  if (!open) return null;

  const downloadSample = () => {
    const blob = new Blob([STUDENT_IMPORT_SAMPLE_CSV], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students-import-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Choose a CSV file');
      return;
    }
    setIsImporting(true);
    const result = await importStudentsCsv(file);
    setIsImporting(false);
    if (result.success) {
      const { created = 0, failed = 0, errors = [], errorsTruncated = 0 } = result.data || {};
      toast.success(`Imported ${created} student(s)${failed ? `, ${failed} row(s) failed` : ''}`);
      if (errors.length) {
        const preview = errors.slice(0, 5).map((errRow) => `Row ${errRow.row}: ${errRow.message}`).join('; ');
        toast.error(
          `${preview}${errors.length > 5 ? '…' : ''}${errorsTruncated ? ` (+${errorsTruncated} more errors omitted)` : ''}`,
          { duration: 8000 }
        );
      }
      onSuccess?.();
      onClose();
    } else {
      if (result.featureLocked) {
        toast.error(result.error || 'Upgrade to Premium to import CSV');
      } else {
        toast.error(result.error || 'Import failed');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-600" />
          Import students from CSV
        </h3>
        <p className="text-sm text-gray-500 mt-2">
          Required columns: <span className="font-medium text-gray-700">firstName</span>,{' '}
          <span className="font-medium text-gray-700">lastName</span>,{' '}
          <span className="font-medium text-gray-700">guardianName</span>,{' '}
          <span className="font-medium text-gray-700">guardianPhone</span>.
          Optional: className, sectionName (section needs class), gender, dateOfBirth, rollNumber,
          admissionDate, phone, email, address, bloodGroup, guardianEmail, guardianRelationship.
          Class and section names must match your academic setup.
        </p>
        <button
          type="button"
          onClick={downloadSample}
          className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium inline-flex items-center gap-1"
        >
          <FileDown className="w-4 h-4" />
          Download sample CSV
        </button>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <input
            type="file"
            accept=".csv,text/csv"
            className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-700 file:font-medium"
            onChange={(ev) => setFile(ev.target.files?.[0] || null)}
          />
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary" disabled={isImporting}>
              Cancel
            </button>
            <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={isImporting}>
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Import
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const StudentList = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { usage, fetchUsage } = useSubscriptionStore();
  const {
    students, total, currentPage, totalPages,
    isLoading, error, filters,
    fetchStudents, deleteStudent, setFilters, clearError
  } = useStudentStore();

  const [searchInput, setSearchInput] = useState(filters.search);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Academic data for filters
  const { classes: academicClasses, sections: academicSections, fetchClasses, fetchSections } = useAcademicStore();

  /** While usage is loading, allow Import to avoid flicker; API still enforces plan. */
  const csvImportAllowed =
    usage?.features == null ? true : !!usage.features.csvImport;

  // Initial load
  useEffect(() => {
    fetchStudents(1);
    fetchClasses();
    fetchSections();
    fetchUsage();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== filters.search) {
        setFilters({ search: searchInput });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleFilterChange = (key, value) => {
    setFilters({ [key]: value });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const result = await deleteStudent(deleteTarget._id);
    setIsDeleting(false);
    if (result.success) {
      toast.success('Student deleted successfully');
      setDeleteTarget(null);
    } else {
      toast.error(result.error || 'Failed to delete student');
    }
  };

  const handlePageChange = (page) => {
    fetchStudents(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const columnHelper = createColumnHelper();

  const studentColumns = useMemo(() => [
    columnHelper.accessor(row => row, {
      id: 'studentInfo',
      header: 'Student',
      cell: info => {
        const student = info.getValue();
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-700 font-semibold text-sm">
                {student.personalInfo?.firstName?.[0] || ''}{student.personalInfo?.lastName?.[0] || ''}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {student.personalInfo?.firstName} {student.personalInfo?.lastName}
              </p>
              <p className="text-xs text-gray-500">{student.personalInfo?.gender}</p>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor('admissionNumber', {
      header: 'Admission No.',
      cell: info => <span className="text-sm text-gray-600 font-mono">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => row, {
      id: 'classInfo',
      header: 'Class',
      cell: info => {
        const student = info.getValue();
        return <span className="text-sm text-gray-600">
          {student.academicInfo?.classId?.name || student.academicInfo?.class
            ? `${student.academicInfo?.classId?.name || student.academicInfo?.class}${student.academicInfo?.sectionId?.name || student.academicInfo?.section ? ' - ' + (student.academicInfo?.sectionId?.name || student.academicInfo?.section) : ''}`
            : '—'}
        </span>
      }
    }),
    columnHelper.accessor(row => row, {
      id: 'guardianInfo',
      header: 'Guardian',
      cell: info => {
        const student = info.getValue();
        return (
          <div>
            <p className="text-sm text-gray-900">{student.guardianInfo?.name || '—'}</p>
            <p className="text-xs text-gray-400">{student.guardianInfo?.relationship}</p>
          </div>
        )
      }
    }),
    columnHelper.accessor(row => row, {
      id: 'contactInfo',
      header: 'Contact',
      cell: info => {
        const student = info.getValue();
        return <span className="text-sm text-gray-600">{student.contactInfo?.phone || student.guardianInfo?.phone || '—'}</span>
      }
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
        const student = props.row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Link
              to={`/students/${student._id}`}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              title="View"
            >
              <Eye className="w-4 h-4" />
            </Link>
            {user?.role === 'admin' && (
              <>
                <Link
                  to={`/students/${student._id}/edit`}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setDeleteTarget(student)}
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
        <div className="max-w-7xl mx-auto px-4 sm:px-5 py-4">
          {/* Mobile: toolbar row, then branding — avoids cramming link + title on one line */}
          <div className="sm:hidden space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md py-1 pr-1 -ml-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              >
                ← Dashboard
              </Link>
              <button
                type="button"
                onClick={logout}
                className="inline-flex shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white p-2.5 text-gray-700 shadow-sm hover:bg-gray-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
                aria-label="Log out"
              >
                <LogOut className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <div className="min-w-0 space-y-1.5 pb-0.5">
              <h1
                className="text-lg font-bold text-gray-900 leading-snug break-words line-clamp-2"
                title={user?.schoolName || ''}
              >
                {user?.schoolName}
              </h1>
              <p className="text-xs text-gray-500">Student Management</p>
            </div>
          </div>

          {/* sm+: single horizontal bar */}
          <div className="hidden sm:flex sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Link
                to="/dashboard"
                className="shrink-0 text-sm font-medium text-gray-500 hover:text-gray-700 whitespace-nowrap"
              >
                ← Dashboard
              </Link>
              <span className="shrink-0 text-gray-300 select-none" aria-hidden>
                |
              </span>
              <div className="min-w-0 flex-1">
                <h1
                  className="text-xl font-bold text-gray-900 truncate"
                  title={user?.schoolName || ''}
                >
                  {user?.schoolName}
                </h1>
                <p className="text-xs text-gray-500 truncate">Student Management</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="btn-secondary inline-flex shrink-0 items-center gap-2"
            >
              <LogOut className="w-4 h-4 shrink-0" aria-hidden />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-7 h-7 text-primary-600" /> Students
            </h2>
            <p className="text-gray-500 mt-1">
              {isLoading ? 'Loading...' : `${total} student${total !== 1 ? 's' : ''} total`}
            </p>
          </div>
          {user?.role === 'admin' && (
            <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
              {csvImportAllowed ? (
                <button
                  type="button"
                  onClick={() => setImportOpen(true)}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Import CSV
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate('/settings/plans')}
                  className="btn-secondary flex items-center gap-2 border-dashed border-amber-200 bg-amber-50/80 text-amber-900 hover:bg-amber-50"
                  title="Premium feature"
                >
                  <Crown className="w-5 h-5 text-amber-600" />
                  Import CSV
                  <span className="text-xs font-normal opacity-90">(Premium)</span>
                </button>
              )}
              <Link to="/students/new" className="btn-primary flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Add Student
              </Link>
            </div>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="sm:col-span-2 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                className="input-field pl-10"
                placeholder="Search by name or admission no..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
              />
            </div>

            {/* Class filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="input-field pl-9 appearance-none"
                value={filters.class}
                onChange={e => handleFilterChange('class', e.target.value)}
              >
                <option value="">All Classes</option>
                {academicClasses.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Section filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                className="input-field pl-9 appearance-none"
                value={filters.section}
                onChange={e => handleFilterChange('section', e.target.value)}
              >
                <option value="">All Sections</option>
                {academicSections.map(s => (
                  <option key={s._id} value={s.name}>{s.classId?.name ? `${s.classId.name} - ${s.name}` : s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status tabs */}
          <div className="mt-4 flex gap-2 border-b">
            {['active', 'inactive', ''].map((s) => (
              <button
                key={s}
                onClick={() => handleFilterChange('status', s)}
                className={`pb-2 px-3 text-sm font-medium border-b-2 transition-colors ${
                  filters.status === s
                    ? 'border-primary-600 text-primary-600'
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
            columns={studentColumns}
            data={students}
            searchable={false}
            hidePagination={true}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center justify-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No students found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {filters.search || filters.class || filters.section
                    ? 'Try adjusting your filters'
                    : 'Add your first student to get started'}
                </p>
                {user?.role === 'admin' && !filters.search && !filters.class && (
                  <Link to="/students/new" className="btn-primary inline-flex items-center gap-2 mt-4">
                    <Plus className="w-4 h-4" /> Add Student
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
                        page === currentPage
                          ? 'bg-primary-600 text-white'
                          : 'text-gray-600 hover:bg-gray-200'
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
          student={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />
      )}

      <ImportStudentsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => fetchStudents(currentPage)}
      />
    </div>
  );
};

export default StudentList;
