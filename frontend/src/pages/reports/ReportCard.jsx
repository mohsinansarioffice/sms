import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Printer } from 'lucide-react';
import useAcademicStore from '../../store/academicStore';
import useReportStore from '../../store/reportStore';
import useAuthStore from '../../store/authStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

const ReportCard = () => {
  const { studentId } = useParams();
  const { user } = useAuthStore();
  const { academicYears, fetchAcademicYears } = useAcademicStore();
  const { reportCard, isLoading, fetchReportCard } = useReportStore();
  const [academicYearId, setAcademicYearId] = useState('');

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (academicYears.length && !academicYearId) {
      const current = academicYears.find((year) => year.isCurrent);
      setAcademicYearId(current?._id || academicYears[0]?._id || '');
    }
  }, [academicYears, academicYearId]);

  useEffect(() => {
    if (studentId && academicYearId) {
      fetchReportCard({ studentId, academicYearId });
    }
  }, [studentId, academicYearId]);

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <AppHeader className="print:hidden" logoHref="/dashboard">
        <AppPageHeaderContext
          backTo={`/students/${studentId}`}
          backLabel="Back to student"
          title={user?.schoolName || 'School'}
          subtitle="Report card"
        />
      </AppHeader>
      <div className="print:hidden max-w-5xl mx-auto px-4 pt-2 pb-4 flex flex-wrap items-center justify-end gap-3">
        <select
          className="input-field min-w-[220px]"
          value={academicYearId}
          onChange={(e) => setAcademicYearId(e.target.value)}
        >
          <option value="">Select Academic Year</option>
          {academicYears.map((year) => (
            <option key={year._id} value={year._id}>
              {year.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="btn-secondary inline-flex items-center gap-2"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {isLoading ? (
          <div className="h-72 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : !reportCard ? (
          <div className="card text-center py-12 text-gray-500">No report card data available.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <div className="mb-6 pb-4 border-b">
              <h1 className="text-2xl font-bold text-gray-900">Student Report Card</h1>
              <p className="text-sm text-gray-500 mt-1">
                {reportCard.student.name} ({reportCard.student.admissionNumber})
              </p>
              <p className="text-sm text-gray-500">
                {reportCard.student.className} {reportCard.student.sectionName}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Overall %</p>
                <p className="text-xl font-bold text-gray-900">{reportCard.summary.overallPercentage}%</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Passed</p>
                <p className="text-xl font-bold text-green-600">{reportCard.summary.passedSubjects}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Failed</p>
                <p className="text-xl font-bold text-red-600">{reportCard.summary.failedSubjects}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">Class Rank</p>
                <p className="text-xl font-bold text-primary-700">
                  {reportCard.summary.classRank || '-'}
                  {reportCard.summary.classStrength ? ` / ${reportCard.summary.classStrength}` : ''}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Exam</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase">Subject</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">Marks</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700 uppercase">%</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {reportCard.subjectResults.map((row) => (
                    <tr key={row.examId} className="border-t border-gray-200">
                      <td className="px-3 py-2 text-sm text-gray-900">{row.examName}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{row.subject}</td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">
                        {row.isAbsent ? 'ABS' : `${row.marksObtained} / ${row.totalMarks}`}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900 text-right">{row.isAbsent ? '-' : `${row.percentage}%`}</td>
                      <td className="px-3 py-2 text-center text-sm font-semibold text-gray-900">{row.grade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 pt-4 border-t">
              <h3 className="font-semibold text-gray-900 mb-2">Attendance Summary</h3>
              <p className="text-sm text-gray-700">
                Present: {reportCard.attendance.present}, Absent: {reportCard.attendance.absent}, Late:{' '}
                {reportCard.attendance.late}, Attendance: {reportCard.attendance.attendancePercentage}%
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
