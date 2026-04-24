import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Plus, Loader2, ArrowLeft, Pencil, Trash2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import useDiaryStore from '../../store/diaryStore';
import useAuthStore from '../../store/authStore';
import useAcademicStore from '../../store/academicStore';
import BrandLogo from '../../components/common/BrandLogo';

const TYPE_LABELS = {
  homework: { label: 'Homework', color: 'bg-blue-100 text-blue-800' },
  classwork: { label: 'Classwork', color: 'bg-green-100 text-green-800' },
  notice: { label: 'Notice', color: 'bg-yellow-100 text-yellow-800' },
  remark: { label: 'Remark', color: 'bg-gray-100 text-gray-700' }
};

const STATUS_LABELS = {
  published: { label: 'Published', color: 'bg-green-100 text-green-700' },
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-500' }
};

const DiaryList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const homePath =
    user?.role === 'parent'
      ? '/parent/dashboard'
      : user?.role === 'student'
        ? '/student/dashboard'
        : '/dashboard';
  const { entries, total, currentPage, totalPages, isLoading, error, fetchEntries, deleteEntry, clearError } = useDiaryStore();
  const { classes, sections, fetchClasses, fetchSections } = useAcademicStore();

  const today = format(new Date(), 'yyyy-MM-dd');

  const [filters, setFilters] = useState({
    classId: '',
    sectionId: '',
    date: today,
    type: '',
    status: '',
    page: 1
  });

  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (filters.classId) fetchSections(filters.classId);
  }, [filters.classId]);

  const load = useCallback(
    (overrides = {}) => {
      const params = { ...filters, ...overrides };
      fetchEntries(params);
    },
    [filters, fetchEntries]
  );

  useEffect(() => {
    load();
  }, [filters]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'classId' ? { sectionId: '', page: 1 } : { page: 1 })
    }));
  };

  const handleDelete = async (id) => {
    const result = await deleteEntry(id);
    if (result.success) {
      toast.success('Diary entry deleted');
      setDeleteConfirm(null);
    } else {
      toast.error(result.error || 'Delete failed');
    }
  };

  const goPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setFilters((prev) => ({ ...prev, page: p }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap justify-between items-center gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <BrandLogo linkTo={homePath} />
            <button type="button" onClick={() => navigate(homePath)} className="btn-secondary flex items-center gap-2 shrink-0">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Class Diary
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/diary/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Entry
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <input
              type="date"
              className="input-field"
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            />
            <select
              className="input-field"
              value={filters.classId}
              onChange={(e) => handleFilterChange('classId', e.target.value)}
            >
              <option value="">All Classes</option>
              {classes.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={filters.sectionId}
              onChange={(e) => handleFilterChange('sectionId', e.target.value)}
              disabled={!filters.classId}
            >
              <option value="">All Sections</option>
              {sections.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
            <select
              className="input-field"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="homework">Homework</option>
              <option value="classwork">Classwork</option>
              <option value="notice">Notice</option>
              <option value="remark">Remark</option>
            </select>
            <select
              className="input-field"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => setFilters({ classId: '', sectionId: '', date: '', type: '', status: '', page: 1 })}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* List */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <h2 className="font-semibold text-gray-900">
              Entries
              {total > 0 && <span className="ml-2 text-sm font-normal text-gray-500">({total} total)</span>}
            </h2>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">No diary entries found</p>
              <p className="text-sm mt-1">Add the first entry using the "New Entry" button.</p>
            </div>
          ) : (
            <div className="divide-y">
              {entries.map((entry) => {
                const typeInfo = TYPE_LABELS[entry.type] || {};
                const statusInfo = STATUS_LABELS[entry.status] || {};
                const teacherName = entry.teacherId
                  ? `${entry.teacherId.personalInfo?.firstName || ''} ${entry.teacherId.personalInfo?.lastName || ''}`.trim()
                  : '—';
                return (
                  <div key={entry._id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusInfo.color}`}>
                            {statusInfo.label}
                          </span>
                          {entry.classId && (
                            <span className="text-xs text-gray-500">
                              {entry.classId.name}{entry.sectionId ? ` · ${entry.sectionId.name}` : ''}
                            </span>
                          )}
                          {entry.subjectId && (
                            <span className="text-xs font-medium text-primary-700">{entry.subjectId.name}</span>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 truncate">{entry.title}</p>
                        <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{entry.description}</p>
                        <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                          <span>{format(new Date(entry.date), 'EEE, MMM d, yyyy')}</span>
                          {entry.dueDate && (
                            <span className="text-orange-600 font-medium">
                              Due: {format(new Date(entry.dueDate), 'MMM d, yyyy')}
                            </span>
                          )}
                          <span>By: {teacherName || '—'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => navigate(`/diary/${entry._id}/edit`)}
                          className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(entry._id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="btn-secondary p-2"
                  onClick={() => goPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Diary Entry</h3>
            <p className="text-gray-600 text-sm mb-6">
              Are you sure you want to delete this diary entry? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiaryList;
