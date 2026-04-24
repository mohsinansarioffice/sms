import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Printer } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useAcademicStore from '../../store/academicStore';
import useTimetableStore from '../../store/timetableStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
];

const SUBJECT_COLORS = ['bg-blue-50 border-blue-200', 'bg-green-50 border-green-200', 'bg-purple-50 border-purple-200', 'bg-pink-50 border-pink-200', 'bg-indigo-50 border-indigo-200', 'bg-cyan-50 border-cyan-200', 'bg-orange-50 border-orange-200', 'bg-emerald-50 border-emerald-200'];

const teacherName = (teacher) =>
  `${teacher?.personalInfo?.firstName || ''} ${teacher?.personalInfo?.lastName || ''}`.trim();

const TimetableView = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const { academicYears, classes, sections, fetchAcademicYears, fetchClasses, fetchSections } = useAcademicStore();
  const { timeSlots, timetable, isFetching, fetchTimeSlots, fetchTimetable } = useTimetableStore();

  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  useEffect(() => {
    fetchAcademicYears();
    fetchClasses();
    fetchTimeSlots();
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

  const subjectColorMap = useMemo(() => {
    const map = {};
    const uniqueSubjects = timetable.filter((item) => item.subjectId?._id).map((item) => item.subjectId);
    uniqueSubjects.forEach((subject, index) => {
      map[subject._id] = SUBJECT_COLORS[index % SUBJECT_COLORS.length];
    });
    return map;
  }, [timetable]);

  const cellMap = useMemo(() => {
    const map = new Map();
    timetable.forEach((entry) => {
      map.set(`${entry.dayOfWeek}-${entry.timeSlotId?._id}`, entry);
    });
    return map;
  }, [timetable]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <AppHeader className="print:hidden" logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/dashboard"
          backLabel="Back to dashboard"
          title={user?.schoolName || 'School'}
          subtitle="Timetable view"
        />
      </AppHeader>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="card print:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">View Timetable</h2>
            <button onClick={handlePrint} className="btn-secondary inline-flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Academic Year</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
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
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 print:shadow-none print:border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Class Timetable</h2>
              <p className="text-sm text-gray-500">
                {classes.find((item) => item._id === selectedClass)?.name || 'Class'}{' '}
                {sections.find((item) => item._id === selectedSection)?.name || ''}
              </p>
            </div>
            {isFetching && (
              <span className="text-sm text-primary-600 inline-flex items-center gap-2 print:hidden">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            )}
          </div>

          {!selectedClass || !selectedAcademicYear ? (
            <div className="py-10 text-center text-gray-500">Select filters to view timetable.</div>
          ) : !timeSlots.length ? (
            <div className="py-10 text-center">
              <p className="text-gray-600 mb-3">No time slots available yet.</p>
              {isAdmin ? (
                <Link
                  to="/timetable/slots"
                  className="btn-primary inline-flex items-center gap-2 print:hidden"
                >
                  Create Time Slots
                </Link>
              ) : (
                <p className="text-sm text-gray-500 print:hidden">
                  Ask a school administrator to configure time slots.
                </p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Period</th>
                    {DAYS.map((day) => (
                      <th key={day.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">
                        {day.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((slot) => (
                    <tr key={slot._id} className="border-t border-gray-200">
                      <td className="px-3 py-3 align-top bg-gray-50 min-w-[160px]">
                        <p className="text-sm font-semibold text-gray-900">{slot.name}</p>
                        <p className="text-xs text-gray-500">
                          {slot.startTime} - {slot.endTime}
                        </p>
                      </td>
                      {DAYS.map((day) => {
                        const entry = cellMap.get(`${day.key}-${slot._id}`);
                        const colorClass = entry?.subjectId?._id ? subjectColorMap[entry.subjectId._id] : 'bg-white';
                        return (
                          <td
                            key={`${day.key}-${slot._id}`}
                            className={`px-2 py-2 align-top border-l border-gray-100 ${
                              slot.isBreak ? 'bg-amber-50' : colorClass
                            }`}
                          >
                            {slot.isBreak ? (
                              <p className="text-xs font-semibold text-amber-700 uppercase">Break</p>
                            ) : entry ? (
                              <div className={`rounded-lg border p-2 ${colorClass || 'border-gray-200 bg-white'}`}>
                                <p className="text-xs font-semibold text-gray-900">{entry.subjectId?.name || '-'}</p>
                                <p className="text-[11px] text-gray-600">{teacherName(entry.teacherId) || '-'}</p>
                                {entry.roomNumber ? (
                                  <p className="text-[11px] text-gray-500 mt-0.5">Room: {entry.roomNumber}</p>
                                ) : null}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">-</p>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TimetableView;
