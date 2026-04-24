import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, ArrowLeft, ChevronLeft, ChevronRight, Loader2,
  ClipboardList, BookMarked, Megaphone, MessageSquare, Calendar
} from 'lucide-react';
import { format, addDays, subDays, isToday, isFuture } from 'date-fns';
import toast from 'react-hot-toast';
import useDiaryStore from '../../store/diaryStore';
import useAuthStore from '../../store/authStore';
import useAcademicStore from '../../store/academicStore';
import useParentStore from '../../store/parentStore';
import BrandLogo from '../../components/common/BrandLogo';

const PARENT_STUDENT_STORAGE_KEY = 'parentPortal.selectedStudentId';

function getStoredParentStudentId() {
  try {
    return localStorage.getItem(PARENT_STUDENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

const TYPE_CONFIG = {
  homework: {
    label: 'Homework',
    icon: ClipboardList,
    headerClass: 'bg-blue-50 border-blue-200',
    badgeClass: 'bg-blue-100 text-blue-800',
    iconClass: 'text-blue-600'
  },
  classwork: {
    label: 'Classwork / Topics Covered',
    icon: BookMarked,
    headerClass: 'bg-green-50 border-green-200',
    badgeClass: 'bg-green-100 text-green-800',
    iconClass: 'text-green-600'
  },
  notice: {
    label: 'Notices',
    icon: Megaphone,
    headerClass: 'bg-yellow-50 border-yellow-200',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    iconClass: 'text-yellow-600'
  },
  remark: {
    label: 'Teacher Remarks',
    icon: MessageSquare,
    headerClass: 'bg-gray-50 border-gray-200',
    badgeClass: 'bg-gray-100 text-gray-700',
    iconClass: 'text-gray-500'
  }
};

const EntryCard = ({ entry }) => {
  const teacherName = entry.teacherId
    ? `${entry.teacherId.personalInfo?.firstName || ''} ${entry.teacherId.personalInfo?.lastName || ''}`.trim()
    : null;

  return (
    <div className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {entry.subjectId && (
          <span className="text-xs font-semibold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full">
            {entry.subjectId.name}
          </span>
        )}
        {entry.type === 'homework' && entry.dueDate && (
          <span className="text-xs font-medium text-orange-700 bg-orange-50 px-2 py-0.5 rounded-full">
            Due: {format(new Date(entry.dueDate), 'EEE, MMM d')}
          </span>
        )}
      </div>
      <p className="font-semibold text-gray-900">{entry.title}</p>
      <p className="text-sm text-gray-600 mt-1 whitespace-pre-line">{entry.description}</p>
      {teacherName && (
        <p className="text-xs text-gray-400 mt-2">— {teacherName}</p>
      )}
    </div>
  );
};

const DiaryView = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { selectedStudentId, setSelectedStudentId } = useParentStore();
  const { classGrouped, isLoading, error, fetchClassDiary, clearError } = useDiaryStore();
  const { classes, sections, fetchClasses, fetchSections } = useAcademicStore();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');

  const isParent = user?.role === 'parent';

  const dateStr = format(selectedDate, 'yyyy-MM-dd');

  const load = useCallback(() => {
    const params = { date: dateStr };
    if (isParent) {
      const sid = selectedStudentId || getStoredParentStudentId();
      if (sid) params.studentId = sid;
    } else {
      if (classId) params.classId = classId;
      if (sectionId) params.sectionId = sectionId;
    }
    fetchClassDiary(params);
  }, [dateStr, classId, sectionId, isParent, selectedStudentId, fetchClassDiary]);

  useEffect(() => {
    if (!isParent) {
      fetchClasses();
    }
  }, [isParent, fetchClasses]);

  // Restore selected child from localStorage when opening diary directly (e.g. refresh)
  useEffect(() => {
    if (!isParent) return;
    if (selectedStudentId) return;
    const stored = getStoredParentStudentId();
    if (stored) setSelectedStudentId(stored);
  }, [isParent, selectedStudentId, setSelectedStudentId]);

  useEffect(() => {
    if (!isParent && classId) fetchSections(classId);
  }, [classId, isParent]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const prevDay = () => setSelectedDate((d) => subDays(d, 1));
  const nextDay = () => {
    const next = addDays(selectedDate, 1);
    if (!isFuture(next)) setSelectedDate(next);
    else setSelectedDate(next);
  };
  const goToday = () => setSelectedDate(new Date());

  const hasEntries = Object.values(classGrouped).some((arr) => arr.length > 0);
  const orderedTypes = ['homework', 'notice', 'classwork', 'remark'];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-2 sm:gap-3">
            <BrandLogo linkTo={isParent ? '/parent/dashboard' : '/dashboard'} />
            <button
              type="button"
              onClick={() => navigate(isParent ? '/parent/dashboard' : '/dashboard')}
              className="btn-secondary flex items-center gap-2 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              {isParent ? 'Portal' : 'Dashboard'}
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              Class Diary
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {/* Class/Section filter — admin/teacher only */}
        {!isParent && (
          <div className="card">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                className="input-field"
                value={classId}
                onChange={(e) => { setClassId(e.target.value); setSectionId(''); }}
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
              <select
                className="input-field"
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                disabled={!classId}
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Date Navigator */}
        <div className="card">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={prevDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">
                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
              </p>
              {isToday(selectedDate) && (
                <span className="text-xs text-primary-600 font-medium">Today</span>
              )}
            </div>
            <button
              type="button"
              onClick={nextDay}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          {!isToday(selectedDate) && (
            <div className="flex justify-center mt-3">
              <button
                type="button"
                onClick={goToday}
                className="text-sm text-primary-600 hover:underline flex items-center gap-1"
              >
                <Calendar className="w-3.5 h-3.5" /> Go to Today
              </button>
            </div>
          )}
        </div>

        {/* Entries */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : !hasEntries ? (
          <div className="card text-center py-12 text-gray-500">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
            <p className="font-medium text-gray-700">No diary entries for this day</p>
            {!isParent && !classId && (
              <p className="text-sm mt-1">Select a class above to view its diary.</p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {orderedTypes.map((type) => {
              const items = classGrouped[type] || [];
              if (!items.length) return null;
              const config = TYPE_CONFIG[type];
              const Icon = config.icon;
              return (
                <div key={type} className={`rounded-xl border-2 overflow-hidden ${config.headerClass}`}>
                  <div className={`px-4 py-3 border-b ${config.headerClass} flex items-center gap-2`}>
                    <Icon className={`w-4 h-4 ${config.iconClass}`} />
                    <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
                      {config.label}
                    </h3>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ml-auto ${config.badgeClass}`}>
                      {items.length}
                    </span>
                  </div>
                  <div className="p-4 space-y-3 bg-white/60">
                    {items.map((entry) => (
                      <EntryCard key={entry._id} entry={entry} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default DiaryView;
