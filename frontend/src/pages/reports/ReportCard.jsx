import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { format, isValid, parseISO } from 'date-fns';
import {
  Loader2,
  Printer,
  User,
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  Percent,
  Hash,
  CalendarDays,
  School,
  ClipboardList,
} from 'lucide-react';
import useAcademicStore from '../../store/academicStore';
import useReportStore from '../../store/reportStore';
import useAuthStore from '../../store/authStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

function formatExamDate(value) {
  if (!value) return '—';
  try {
    const d = typeof value === 'string' ? parseISO(value) : new Date(value);
    if (!isValid(d)) return '—';
    return format(d, 'MMM d, yyyy');
  } catch {
    return '—';
  }
}

function gradePillClass(grade) {
  if (!grade || grade === '—' || grade === '-') {
    return 'bg-gray-100 text-gray-600';
  }
  const g = String(grade).trim().toUpperCase();
  if (g.startsWith('A')) return 'bg-emerald-100 text-emerald-800';
  if (g.startsWith('B')) return 'bg-green-100 text-green-800';
  if (g.startsWith('C')) return 'bg-amber-100 text-amber-900';
  if (g.startsWith('D')) return 'bg-orange-100 text-orange-800';
  if (g.startsWith('F') || g.includes('FAIL')) return 'bg-red-100 text-red-800';
  return 'bg-slate-100 text-slate-800';
}

const StatCard = ({ icon: Icon, label, value, sub, accentClass = 'text-gray-900' }) => (
  <div className="rounded-xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/80 p-4 shadow-sm">
    <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
      <Icon className="h-4 w-4" />
    </div>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    <p className={`mt-1 text-xl font-bold tabular-nums ${accentClass}`}>{value}</p>
    {sub ? <p className="mt-0.5 text-xs text-gray-500">{sub}</p> : null}
  </div>
);

const ReportCard = () => {
  const { studentId } = useParams();
  const { user } = useAuthStore();
  const { academicYears, fetchAcademicYears } = useAcademicStore();
  const { reportCard, isLoading, error, fetchReportCard } = useReportStore();
  const [academicYearId, setAcademicYearId] = useState('');

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

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
  }, [studentId, academicYearId, fetchReportCard]);

  const selectedYear = useMemo(
    () => academicYears.find((y) => y._id === academicYearId),
    [academicYears, academicYearId]
  );

  const studentInitials = useMemo(() => {
    const n = reportCard?.student?.name;
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }, [reportCard?.student?.name]);

  const att = reportCard?.attendance;
  const attPct = att?.attendancePercentage ?? 0;
  const attBarClass =
    attPct >= 90
      ? 'from-emerald-500 to-teal-500'
      : attPct >= 75
        ? 'from-amber-400 to-orange-500'
        : 'from-rose-400 to-red-500';

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

      <div className="print:hidden mx-auto max-w-4xl px-4 pt-2 pb-4">
        <div className="card flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Academic year</p>
            <select
              className="input-field mt-1 max-w-md"
              value={academicYearId}
              onChange={(e) => setAcademicYearId(e.target.value)}
            >
              <option value="">Select academic year</option>
              {academicYears.map((year) => (
                <option key={year._id} value={year._id}>
                  {year.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            className="btn-primary inline-flex shrink-0 items-center justify-center gap-2"
            onClick={() => window.print()}
          >
            <Printer className="h-4 w-4" />
            Print
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-4 print:max-w-none print:px-6 print:py-6">
        {isLoading ? (
          <div className="card flex h-64 flex-col items-center justify-center gap-3 text-gray-500">
            <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            <p className="text-sm">Loading report card…</p>
          </div>
        ) : error ? (
          <div className="card border-red-200 bg-red-50/80 text-center text-red-800">
            <p className="font-medium">Could not load report card</p>
            <p className="mt-1 text-sm opacity-90">{error}</p>
          </div>
        ) : !reportCard ? (
          <div className="card text-center text-gray-500">
            <ClipboardList className="mx-auto mb-3 h-10 w-10 text-gray-300" />
            <p className="font-medium text-gray-700">No report card data for this year</p>
            <p className="mt-1 text-sm">Try another academic year, or add exam results for this student.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-md ring-1 ring-gray-100 print:shadow-none print:ring-0">
            <div className="border-b border-gray-100 bg-gradient-to-r from-primary-50/80 via-white to-sky-50/50 px-6 py-6 print:border-b print:bg-white">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-lg font-bold text-white shadow-md ring-2 ring-primary-200 print:grayscale-0"
                    aria-hidden
                  >
                    {studentInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary-700/80">
                      Report card
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 print:text-2xl">
                      {reportCard.student.name}
                    </h1>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-gray-400" />
                        {reportCard.student.admissionNumber}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <School className="h-3.5 w-3.5 text-gray-400" />
                        {reportCard.student.className}
                        {reportCard.student.sectionName
                          ? ` · ${reportCard.student.sectionName}`
                          : ''}
                      </span>
                    </div>
                    {selectedYear && (
                      <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {selectedYear.name}
                      </p>
                    )}
                  </div>
                </div>
                {user?.schoolName && (
                  <div className="hidden text-right sm:block print:block">
                    <p className="text-xs text-gray-500">School</p>
                    <p className="max-w-xs text-sm font-semibold text-gray-800">{user.schoolName}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-8 px-4 py-6 sm:px-6 sm:py-8">
              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <Award className="h-4 w-4 text-primary-600" />
                  Performance summary
                </h2>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
                  <StatCard
                    icon={Percent}
                    label="Overall"
                    value={`${reportCard.summary.overallPercentage ?? 0}%`}
                    sub="Aggregate percentage"
                    accentClass="text-primary-700"
                  />
                  <StatCard
                    icon={BookOpen}
                    label="Marks"
                    value={
                      <span className="tabular-nums">
                        {reportCard.summary.marksObtained ?? 0} / {reportCard.summary.totalMarks || 0}
                      </span>
                    }
                    sub="Obtained / maximum"
                    accentClass="text-gray-900"
                  />
                  <StatCard
                    icon={CheckCircle2}
                    label="Passed"
                    value={reportCard.summary.passedSubjects}
                    sub={`of ${reportCard.summary.totalSubjects} subjects`}
                    accentClass="text-emerald-600"
                  />
                  <StatCard
                    icon={XCircle}
                    label="Did not pass"
                    value={reportCard.summary.failedSubjects}
                    sub="Below passing marks"
                    accentClass="text-rose-600"
                  />
                  <StatCard
                    icon={Award}
                    label="Class rank"
                    value={
                      reportCard.summary.classRank
                        ? `${reportCard.summary.classRank}${
                            reportCard.summary.classStrength
                              ? ` / ${reportCard.summary.classStrength}`
                              : ''
                          }`
                        : '—'
                    }
                    sub="By average % in cohort"
                    accentClass="text-amber-700"
                  />
                </div>
              </div>

              <div>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                  <BookOpen className="h-4 w-4 text-primary-600" />
                  Exam results
                </h2>
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-slate-50/90">
                          <th className="px-3 py-3 pl-4 text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Type
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Exam
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Subject
                          </th>
                          <th className="px-3 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Date
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Marks
                          </th>
                          <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-600">
                            %
                          </th>
                          <th className="px-3 py-3 pr-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-600">
                            Grade
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportCard.subjectResults.map((row, idx) => (
                          <tr
                            key={`${row.examId}-${row.subject}-${idx}`}
                            className="border-b border-gray-100 last:border-0 even:bg-slate-50/40"
                          >
                            <td className="px-3 py-2.5 pl-4">
                              {row.examType ? (
                                <span className="inline-block max-w-[120px] truncate rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-800">
                                  {row.examType}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-medium text-gray-900">{row.examName}</td>
                            <td className="px-3 py-2.5 text-gray-800">{row.subject || '—'}</td>
                            <td className="px-3 py-2.5 whitespace-nowrap text-gray-600">
                              {formatExamDate(row.examDate)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono text-[13px] text-gray-800">
                              {row.isAbsent ? (
                                <span className="font-sans text-amber-700">Absent</span>
                              ) : (
                                `${row.marksObtained} / ${row.totalMarks}`
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right tabular-nums text-gray-800">
                              {row.isAbsent ? '—' : `${row.percentage}%`}
                            </td>
                            <td className="px-3 py-2.5 pr-4 text-center">
                              <span
                                className={`inline-block min-w-[2.5rem] rounded-md px-2 py-0.5 text-xs font-bold ${gradePillClass(
                                  row.grade
                                )}`}
                              >
                                {row.isAbsent ? 'ABS' : row.grade}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                {reportCard.subjectResults.length === 0 && (
                  <p className="mt-2 text-center text-sm text-gray-500">No exam results in this year.</p>
                )}
              </div>

              {att && (
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <User className="h-4 w-4 text-primary-600" />
                    Attendance
                  </h2>
                  <div className="grid gap-4 rounded-xl border border-gray-200 bg-slate-50/50 p-4 sm:grid-cols-2 sm:p-5">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                        Attendance rate
                      </p>
                      <p className="mt-1 text-3xl font-bold tabular-nums text-primary-800 print:text-3xl">
                        {att.attendancePercentage ?? 0}%
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        of {att.totalDays ?? 0} school days in period
                      </p>
                      <div className="mt-3 h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${attBarClass} transition-all`}
                          style={{ width: `${Math.min(100, Math.max(0, att.attendancePercentage ?? 0))}%` }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <div className="rounded-lg border border-white bg-white/80 px-3 py-2 shadow-sm">
                        <p className="text-xs text-gray-500">Present</p>
                        <p className="text-lg font-semibold text-emerald-700 tabular-nums">{att.present}</p>
                      </div>
                      <div className="rounded-lg border border-white bg-white/80 px-3 py-2 shadow-sm">
                        <p className="text-xs text-gray-500">Late</p>
                        <p className="text-lg font-semibold text-amber-700 tabular-nums">{att.late}</p>
                      </div>
                      <div className="rounded-lg border border-white bg-white/80 px-3 py-2 shadow-sm">
                        <p className="text-xs text-gray-500">Absent</p>
                        <p className="text-lg font-semibold text-rose-700 tabular-nums">{att.absent}</p>
                      </div>
                      <div className="rounded-lg border border-white bg-white/80 px-3 py-2 shadow-sm">
                        <p className="text-xs text-gray-500">Excused</p>
                        <p className="text-lg font-semibold text-slate-600 tabular-nums">{att.excused ?? 0}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportCard;
