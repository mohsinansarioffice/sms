import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, LogOut, ChevronDown, BookOpen, Mail } from 'lucide-react';
import { format } from 'date-fns';
import useAuthStore from '../../store/authStore';
import useParentStore from '../../store/parentStore';
import useDiaryStore from '../../store/diaryStore';

const ParentDashboard = () => {
  const { user, logout } = useAuthStore();
  const {
    children,
    dashboard,
    selectedStudentId,
    isLoading,
    error,
    initParentPortal,
    selectChildAndRefresh,
  } = useParentStore();
  const { classGrouped, fetchClassDiary } = useDiaryStore();

  useEffect(() => {
    initParentPortal();
    // Intentionally run once on mount; initParentPortal is stable from Zustand.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only bootstrap
  }, []);

  useEffect(() => {
    if (!selectedStudentId) return;
    fetchClassDiary({
      date: format(new Date(), 'yyyy-MM-dd'),
      studentId: selectedStudentId,
    });
  }, [selectedStudentId, fetchClassDiary]);

  if (isLoading && !dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!children.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Parent Portal</h1>
              <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
            </div>
            <button type="button" onClick={logout} className="btn-secondary inline-flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </nav>
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="card text-center text-gray-600">
            No student is linked to your account yet. Please contact the school office.
          </div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        ) : (
          <div className="card max-w-md text-center text-gray-700">
            <p className="font-medium text-gray-900 mb-1">Could not load dashboard</p>
            <p className="text-sm">{error || 'Something went wrong. Try logging in again.'}</p>
          </div>
        )}
      </div>
    );
  }

  const { student, attendance, academics, fees, announcements } = dashboard;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Parent Portal</h1>
            <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {children.length > 1 ? (
              <div className="relative inline-flex items-center">
                <select
                  className="input-field py-2 pr-8 pl-3 text-sm font-medium min-w-[200px] appearance-none cursor-pointer"
                  value={selectedStudentId || ''}
                  onChange={(e) => selectChildAndRefresh(e.target.value)}
                  aria-label="Select child"
                >
                  {children.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                      {c.admissionNumber ? ` (${c.admissionNumber})` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-gray-500 absolute right-2 pointer-events-none" />
              </div>
            ) : null}
            <Link
              to="/messages"
              className="btn-secondary inline-flex items-center gap-2"
            >
              <Mail className="w-4 h-4" />
              Messages
            </Link>
            <button type="button" onClick={logout} className="btn-secondary inline-flex items-center gap-2">
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900">{student.name}</h2>
          <p className="text-sm text-gray-500">
            {student.admissionNumber} | {student.className} {student.sectionName}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <p className="text-sm text-gray-500">Attendance</p>
            <p className="text-2xl font-bold text-primary-700">{attendance.percentage}%</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Average Result</p>
            <p className="text-2xl font-bold text-green-700">{academics.averagePercentage}%</p>
          </div>
          <div className="card">
            <p className="text-sm text-gray-500">Outstanding Fees</p>
            <p className="text-2xl font-bold text-red-700">Rs. {fees.outstanding.toLocaleString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Latest Exam Results</h3>
            {!academics.results.length ? (
              <p className="text-sm text-gray-500">No exam results yet.</p>
            ) : (
              <div className="space-y-2">
                {academics.results.slice(0, 6).map((result) => (
                  <div key={result._id} className="border rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">{result.examId?.name}</p>
                    <p className="text-xs text-gray-500">
                      {result.examId?.subjectId?.name} - {result.percentage}% ({result.grade})
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Recent Announcements</h3>
            {!announcements.length ? (
              <p className="text-sm text-gray-500">No announcements.</p>
            ) : (
              <div className="space-y-2">
                {announcements.map((item) => (
                  <div key={item._id} className="border rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{item.content?.slice(0, 120)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Today's Diary */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Today's Diary — {format(new Date(), 'EEE, MMM d')}
            </h3>
            <Link to="/diary/view" className="text-sm text-primary-600 font-medium">
              View full diary →
            </Link>
          </div>
          {(() => {
            const allEntries = [
              ...classGrouped.homework,
              ...classGrouped.notice,
              ...classGrouped.classwork,
              ...classGrouped.remark
            ];
            if (!allEntries.length) {
              return <p className="text-sm text-gray-500">No diary entries for today.</p>;
            }
            const TYPE_COLORS = {
              homework: 'bg-blue-100 text-blue-800',
              classwork: 'bg-green-100 text-green-800',
              notice: 'bg-yellow-100 text-yellow-800',
              remark: 'bg-gray-100 text-gray-700'
            };
            return (
              <div className="space-y-2">
                {allEntries.slice(0, 5).map((entry) => (
                  <div key={entry._id} className="border rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${TYPE_COLORS[entry.type] || ''}`}>
                        {entry.type}
                      </span>
                      {entry.subjectId?.name && (
                        <span className="text-xs text-primary-700 font-medium">{entry.subjectId.name}</span>
                      )}
                      {entry.type === 'homework' && entry.dueDate && (
                        <span className="text-xs text-orange-600 ml-auto">
                          Due: {format(new Date(entry.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{entry.description}</p>
                  </div>
                ))}
                {allEntries.length > 5 && (
                  <Link to="/diary/view" className="text-sm text-primary-600 hover:underline">
                    +{allEntries.length - 5} more entries
                  </Link>
                )}
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
