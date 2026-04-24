import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Loader2, Save, Settings2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useAcademicStore from '../../store/academicStore';
import useTimetableStore from '../../store/timetableStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';
import axios from '../../lib/axios';

const DAY_OPTIONS = [
  { key: 'monday', label: 'Mon' },
  { key: 'tuesday', label: 'Tue' },
  { key: 'wednesday', label: 'Wed' },
  { key: 'thursday', label: 'Thu' },
  { key: 'friday', label: 'Fri' },
];

const SUBJECT_COLORS = ['bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-purple-50 border-purple-200', 'bg-pink-50 border-pink-200', 'bg-indigo-50 border-indigo-200', 'bg-cyan-50 border-cyan-200', 'bg-orange-50 border-orange-200', 'bg-emerald-50 border-emerald-200'];

const getTeacherName = (teacher) => {
  if (!teacher) return '';
  return `${teacher.personalInfo?.firstName || ''} ${teacher.personalInfo?.lastName || ''}`.trim();
};

const TimetableEditor = () => {
  const { user } = useAuthStore();
  const { academicYears, classes, sections, subjects, fetchAcademicYears, fetchClasses, fetchSections, fetchSubjects } =
    useAcademicStore();
  const {
    timeSlots,
    timetable,
    isLoading,
    isFetching,
    fetchTimeSlots,
    fetchTimetable,
    saveTimetableEntry,
    bulkCopyTimetable,
  } = useTimetableStore();

  const [teachers, setTeachers] = useState([]);
  const [allSections, setAllSections] = useState([]);
  const [days, setDays] = useState(DAY_OPTIONS.map((day) => day.key));
  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [activeCell, setActiveCell] = useState(null);
  const [cellForm, setCellForm] = useState({ subjectId: '', teacherId: '', roomNumber: '' });
  const [showBulkCopy, setShowBulkCopy] = useState(false);
  const [copyForm, setCopyForm] = useState({
    sourceClassId: '',
    sourceSectionId: '',
    targetClassId: '',
    targetSectionId: '',
  });

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([fetchAcademicYears(), fetchClasses(), fetchSubjects(), fetchTimeSlots()]);
      try {
        const teacherResponse = await axios.get('/teachers?limit=100');
        setTeachers(teacherResponse?.data?.teachers || []);
        const sectionResponse = await axios.get('/academic/sections');
        setAllSections(sectionResponse?.data?.sections || []);
      } catch (error) {
        toast.error(error.message || 'Unable to fetch teachers');
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (academicYears.length && !selectedAcademicYear) {
      const current = academicYears.find((year) => year.isCurrent);
      setSelectedAcademicYear(current?._id || academicYears[0]?._id || '');
    }
  }, [academicYears, selectedAcademicYear]);

  useEffect(() => {
    if (!selectedClass) return;
    fetchSections(selectedClass);
    setSelectedSection('');
  }, [selectedClass]);

  useEffect(() => {
    if (!selectedClass || !selectedAcademicYear) return;
    fetchTimetable(selectedClass, selectedSection || '', selectedAcademicYear);
  }, [selectedClass, selectedSection, selectedAcademicYear]);

  const dayMeta = useMemo(() => DAY_OPTIONS.filter((day) => days.includes(day.key)), [days]);

  const slotMap = useMemo(() => {
    const map = new Map();
    timetable.forEach((entry) => {
      map.set(`${entry.dayOfWeek}-${entry.timeSlotId?._id}`, entry);
    });
    return map;
  }, [timetable]);

  const subjectColorMap = useMemo(() => {
    const map = {};
    subjects.forEach((subject, index) => {
      map[subject._id] = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
    });
    return map;
  }, [subjects]);

  const openCellEditor = (day, slot) => {
    const existing = slotMap.get(`${day}-${slot._id}`);
    setActiveCell({
      day,
      slot,
      existing,
    });
    setCellForm({
      subjectId: existing?.subjectId?._id || '',
      teacherId: existing?.teacherId?._id || '',
      roomNumber: existing?.roomNumber || '',
    });
  };

  const closeCellEditor = () => {
    setActiveCell(null);
    setCellForm({ subjectId: '', teacherId: '', roomNumber: '' });
  };

  const saveCell = async () => {
    if (!activeCell || !selectedClass || !selectedAcademicYear) return;

    const payload = {
      _id: activeCell.existing?._id,
      academicYearId: selectedAcademicYear,
      classId: selectedClass,
      sectionId: selectedSection || null,
      dayOfWeek: activeCell.day,
      timeSlotId: activeCell.slot._id,
      subjectId: activeCell.slot.isBreak ? null : cellForm.subjectId || null,
      teacherId: activeCell.slot.isBreak ? null : cellForm.teacherId || null,
      roomNumber: activeCell.slot.isBreak ? '' : cellForm.roomNumber || '',
    };

    const result = await saveTimetableEntry(payload);
    if (result?.success) {
      toast.success('Timetable entry saved');
      closeCellEditor();
      fetchTimetable(selectedClass, selectedSection || '', selectedAcademicYear);
      return;
    }

    toast.error(result?.error || 'Unable to save entry');
  };

  const toggleDay = (dayKey) => {
    setDays((prev) => {
      if (prev.includes(dayKey)) {
        if (prev.length === 1) return prev;
        return prev.filter((key) => key !== dayKey);
      }
      return [...prev, dayKey];
    });
  };

  const handleBulkCopy = async () => {
    if (!selectedAcademicYear) {
      toast.error('Please select academic year first');
      return;
    }
    if (!copyForm.sourceClassId || !copyForm.targetClassId) {
      toast.error('Select source and target classes');
      return;
    }

    const result = await bulkCopyTimetable({
      ...copyForm,
      sourceSectionId: copyForm.sourceSectionId || null,
      targetSectionId: copyForm.targetSectionId || null,
      academicYearId: selectedAcademicYear,
    });

    if (result?.success) {
      toast.success('Timetable copied successfully');
      if (
        copyForm.targetClassId === selectedClass &&
        (copyForm.targetSectionId || '') === (selectedSection || '')
      ) {
        fetchTimetable(selectedClass, selectedSection || '', selectedAcademicYear);
      }
      setShowBulkCopy(false);
      return;
    }

    toast.error(result?.error || 'Unable to copy timetable');
  };

  const renderCellContent = (entry, slot) => {
    if (slot.isBreak) {
      return (
        <div className="text-center">
          <p className="text-xs font-semibold text-amber-700 uppercase">Break</p>
          <p className="text-xs text-amber-600 mt-0.5">{slot.name}</p>
        </div>
      );
    }

    if (!entry) {
      return <p className="text-xs text-gray-400 text-center">Click to assign</p>;
    }

    return (
      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-900">{entry.subjectId?.name || 'Subject not set'}</p>
        <p className="text-[11px] text-gray-600">{getTeacherName(entry.teacherId) || 'Teacher not set'}</p>
        {entry.roomNumber ? <p className="text-[11px] text-gray-500">Room: {entry.roomNumber}</p> : null}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/dashboard"
          backLabel="Back to dashboard"
          title={user?.schoolName || 'School'}
          subtitle="Timetable editor"
        />
      </AppHeader>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="card">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Editor Configuration</h2>
            <button onClick={() => setShowBulkCopy((prev) => !prev)} className="btn-secondary inline-flex items-center gap-2">
              <Copy className="w-4 h-4" />
              Bulk Copy
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year *</label>
              <select
                className="input-field"
                value={selectedAcademicYear}
                onChange={(e) => setSelectedAcademicYear(e.target.value)}
              >
                <option value="">Select Academic Year</option>
                {academicYears.map((year) => (
                  <option key={year._id} value={year._id}>
                    {year.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class *</label>
              <select className="input-field" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
                <option value="">Select Class</option>
                {classes.map((cls) => (
                  <option key={cls._id} value={cls._id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Section (optional)</label>
              <select className="input-field" value={selectedSection} onChange={(e) => setSelectedSection(e.target.value)}>
                <option value="">No Section</option>
                {sections.map((section) => (
                  <option key={section._id} value={section._id}>
                    {section.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Visible Days</label>
            <div className="flex flex-wrap gap-3">
              {DAY_OPTIONS.map((day) => (
                <label key={day.key} className="inline-flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={days.includes(day.key)} onChange={() => toggleDay(day.key)} />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {showBulkCopy && (
          <div className="card border border-primary-200">
            <h3 className="text-base font-semibold text-gray-900 mb-4 inline-flex items-center gap-2">
              <Copy className="w-4 h-4 text-primary-600" />
              Bulk Copy Timetable
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Source</p>
                <select
                  className="input-field mb-2"
                  value={copyForm.sourceClassId}
                  onChange={(e) => setCopyForm((prev) => ({ ...prev, sourceClassId: e.target.value, sourceSectionId: '' }))}
                >
                  <option value="">Source Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={copyForm.sourceSectionId}
                  onChange={(e) => setCopyForm((prev) => ({ ...prev, sourceSectionId: e.target.value }))}
                >
                  <option value="">Source Section (optional)</option>
                  {allSections
                    .filter((section) => section.classId?._id === copyForm.sourceClassId || section.classId === copyForm.sourceClassId)
                    .map((section) => (
                      <option key={section._id} value={section._id}>
                        {section.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-2">Target</p>
                <select
                  className="input-field mb-2"
                  value={copyForm.targetClassId}
                  onChange={(e) => setCopyForm((prev) => ({ ...prev, targetClassId: e.target.value, targetSectionId: '' }))}
                >
                  <option value="">Target Class</option>
                  {classes.map((cls) => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
                <select
                  className="input-field"
                  value={copyForm.targetSectionId}
                  onChange={(e) => setCopyForm((prev) => ({ ...prev, targetSectionId: e.target.value }))}
                >
                  <option value="">Target Section (optional)</option>
                  {allSections
                    .filter((section) => section.classId?._id === copyForm.targetClassId || section.classId === copyForm.targetClassId)
                    .map((section) => (
                      <option key={section._id} value={section._id}>
                        {section.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleBulkCopy} disabled={isLoading} className="btn-primary inline-flex items-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
                Copy Timetable
              </button>
              <button onClick={() => setShowBulkCopy(false)} className="btn-secondary">
                Close
              </button>
            </div>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-bold text-gray-900">Weekly Timetable Grid</h2>
            {(isFetching || isLoading) && (
              <span className="text-sm text-primary-600 inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Syncing...
              </span>
            )}
          </div>

          {!selectedClass || !selectedAcademicYear ? (
            <div className="py-12 text-center text-gray-500">Select academic year and class to start editing.</div>
          ) : !timeSlots.length ? (
            <div className="py-12 text-center">
              <p className="text-gray-600 mb-3">No time slots found. Create slots first to build timetable.</p>
              <Link to="/timetable/slots" className="btn-primary inline-flex items-center gap-2">
                Go To Time Slot Settings
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full border border-gray-200 rounded-xl overflow-hidden">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time Slot</th>
                      {dayMeta.map((day) => (
                        <th key={day.key} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeSlots.map((slot) => (
                      <tr key={slot._id} className="border-t border-gray-200">
                        <td className="px-3 py-3 align-top bg-gray-50 min-w-[180px]">
                          <p className="text-sm font-semibold text-gray-900">{slot.name}</p>
                          <p className="text-xs text-gray-500">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </td>
                        {dayMeta.map((day) => {
                          const entry = slotMap.get(`${day.key}-${slot._id}`);
                          const colorClass = entry?.subjectId?._id ? subjectColorMap[entry.subjectId._id] || 'bg-white border-gray-200' : 'bg-white border-gray-200';
                          return (
                            <td key={`${day.key}-${slot._id}`} className="px-2 py-2 align-top">
                              <button
                                onClick={() => openCellEditor(day.key, slot)}
                                className={`w-full min-h-[90px] text-left border rounded-lg p-2 transition hover:shadow-sm ${
                                  slot.isBreak ? 'bg-amber-50 border-amber-200' : colorClass
                                }`}
                              >
                                {renderCellContent(entry, slot)}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-4">
                {dayMeta.map((day) => (
                  <div key={day.key} className="border border-gray-200 rounded-xl p-3">
                    <h4 className="font-semibold text-gray-900 mb-2">{day.label}</h4>
                    <div className="space-y-2">
                      {timeSlots.map((slot) => {
                        const entry = slotMap.get(`${day.key}-${slot._id}`);
                        const colorClass = entry?.subjectId?._id ? subjectColorMap[entry.subjectId._id] || 'bg-white border-gray-200' : 'bg-white border-gray-200';
                        return (
                          <button
                            key={`${day.key}-${slot._id}`}
                            onClick={() => openCellEditor(day.key, slot)}
                            className={`w-full border rounded-lg p-3 text-left ${
                              slot.isBreak ? 'bg-amber-50 border-amber-200' : colorClass
                            }`}
                          >
                            <p className="text-xs text-gray-500 mb-1">
                              {slot.name} ({slot.startTime} - {slot.endTime})
                            </p>
                            {renderCellContent(entry, slot)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {activeCell && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">Edit Cell</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {activeCell.day.toUpperCase()} - {activeCell.slot.name} ({activeCell.slot.startTime} -{' '}
                  {activeCell.slot.endTime})
                </p>
              </div>
              <button onClick={closeCellEditor} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {activeCell.slot.isBreak ? (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                  This slot is marked as a break. Subject and teacher assignment is disabled.
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Subject</label>
                    <select
                      className="input-field"
                      value={cellForm.subjectId}
                      onChange={(e) => setCellForm((prev) => ({ ...prev, subjectId: e.target.value }))}
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((subject) => (
                        <option key={subject._id} value={subject._id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher</label>
                    <select
                      className="input-field"
                      value={cellForm.teacherId}
                      onChange={(e) => setCellForm((prev) => ({ ...prev, teacherId: e.target.value }))}
                    >
                      <option value="">Select Teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {getTeacherName(teacher)}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-500 mt-1 inline-flex items-center gap-1">
                      <Settings2 className="w-3 h-3" />
                      Teacher double-booking conflicts are blocked automatically.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Number</label>
                    <input
                      type="text"
                      className="input-field"
                      value={cellForm.roomNumber}
                      onChange={(e) => setCellForm((prev) => ({ ...prev, roomNumber: e.target.value }))}
                      placeholder="Optional room number"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="p-4 border-t flex gap-3">
              <button onClick={saveCell} disabled={isLoading} className="btn-primary inline-flex items-center gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save
              </button>
              <button onClick={closeCellEditor} className="btn-secondary">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimetableEditor;
