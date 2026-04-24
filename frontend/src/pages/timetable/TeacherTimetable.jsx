import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useAuthStore from '../../store/authStore';
import useAcademicStore from '../../store/academicStore';
import useTimetableStore from '../../store/timetableStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';
import axios from '../../lib/axios';

const DAYS = [
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
];

const teacherName = (teacher) =>
  `${teacher?.personalInfo?.firstName || ''} ${teacher?.personalInfo?.lastName || ''}`.trim();

const TeacherTimetable = () => {
  const { teacherId: routeTeacherId } = useParams();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const { academicYears, fetchAcademicYears } = useAcademicStore();
  const { timeSlots, teacherTimetable, isFetching, fetchTimeSlots, fetchTeacherTimetable } = useTimetableStore();

  const [selectedAcademicYear, setSelectedAcademicYear] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState(routeTeacherId || '');
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const bootstrap = async () => {
      await Promise.all([fetchAcademicYears(), fetchTimeSlots()]);
      try {
        const response = await axios.get('/teachers?limit=100');
        setTeachers(response?.data?.teachers || []);
      } catch (error) {
        toast.error(error.message || 'Unable to fetch teachers');
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    if (routeTeacherId) setSelectedTeacher(routeTeacherId);
  }, [routeTeacherId]);

  useEffect(() => {
    if (academicYears.length && !selectedAcademicYear) {
      const current = academicYears.find((year) => year.isCurrent);
      setSelectedAcademicYear(current?._id || academicYears[0]?._id || '');
    }
  }, [academicYears, selectedAcademicYear]);

  useEffect(() => {
    if (!selectedTeacher || !selectedAcademicYear) return;
    fetchTeacherTimetable(selectedTeacher, selectedAcademicYear);
  }, [selectedTeacher, selectedAcademicYear]);

  const teacherInfo = useMemo(
    () => teachers.find((teacher) => teacher._id === selectedTeacher),
    [teachers, selectedTeacher]
  );

  const cellMap = useMemo(() => {
    const map = new Map();
    teacherTimetable.forEach((entry) => {
      map.set(`${entry.dayOfWeek}-${entry.timeSlotId?._id}`, entry);
    });
    return map;
  }, [teacherTimetable]);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <AppHeader className="print:hidden" logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/dashboard"
          backLabel="Back to dashboard"
          title={user?.schoolName || 'School'}
          subtitle="Teacher timetable"
        />
      </AppHeader>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="card print:hidden">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Teacher Schedule</h2>
            <button onClick={() => window.print()} className="btn-secondary inline-flex items-center gap-2">
              <Printer className="w-4 h-4" />
              Print
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Teacher</label>
              <select className="input-field" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher._id} value={teacher._id}>
                    {teacherName(teacher)}
                  </option>
                ))}
              </select>
            </div>
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
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 print:shadow-none print:border-gray-300">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{teacherName(teacherInfo) || 'Teacher Timetable'}</h2>
              <p className="text-sm text-gray-500">
                {teacherInfo?.employeeId ? `Employee ID: ${teacherInfo.employeeId}` : 'Weekly schedule'}
              </p>
            </div>
            {isFetching && (
              <span className="text-sm text-primary-600 inline-flex items-center gap-2 print:hidden">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            )}
          </div>

          {!selectedTeacher || !selectedAcademicYear ? (
            <div className="py-10 text-center text-gray-500">Select teacher and academic year to view schedule.</div>
          ) : !timeSlots.length ? (
            <div className="py-10 text-center">
              <p className="text-gray-600 mb-3">No time slots configured yet.</p>
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
                        return (
                          <td
                            key={`${day.key}-${slot._id}`}
                            className={`px-2 py-2 align-top border-l border-gray-100 ${
                              slot.isBreak ? 'bg-amber-50' : 'bg-white'
                            }`}
                          >
                            {slot.isBreak ? (
                              <p className="text-xs font-semibold text-amber-700 uppercase">Break</p>
                            ) : entry ? (
                              <div className="rounded-lg border border-gray-200 p-2 bg-gray-50">
                                <p className="text-xs font-semibold text-gray-900">{entry.subjectId?.name || '-'}</p>
                                <p className="text-[11px] text-gray-600">
                                  {entry.classId?.name || '-'}
                                  {entry.sectionId?.name ? ` ${entry.sectionId.name}` : ''}
                                </p>
                                {entry.roomNumber ? (
                                  <p className="text-[11px] text-gray-500 mt-0.5">Room: {entry.roomNumber}</p>
                                ) : null}
                              </div>
                            ) : (
                              <p className="text-xs text-gray-400">Free</p>
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

export default TeacherTimetable;
