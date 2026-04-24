import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Trophy, AlertTriangle, Users, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import useExamStore from '../../store/examStore';
import useAuthStore from '../../store/authStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

const ExamAnalytics = () => {
  const { id } = useParams();
  const { user } = useAuthStore();
  const { fetchExamAnalytics, examAnalytics, isLoading } = useExamStore();

  useEffect(() => {
    fetchExamAnalytics(id);
  }, [id, fetchExamAnalytics]);

  if (isLoading || !examAnalytics) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const { exam, analytics } = examAnalytics;

  const chartData = [
    { name: 'A+', count: analytics.gradeDistribution['A+'] || 0, color: '#16a34a' },
    { name: 'A', count: analytics.gradeDistribution['A'] || 0, color: '#22c55e' },
    { name: 'B+', count: analytics.gradeDistribution['B+'] || 0, color: '#eab308' },
    { name: 'B', count: analytics.gradeDistribution['B'] || 0, color: '#facc15' },
    { name: 'C+', count: analytics.gradeDistribution['C+'] || 0, color: '#f97316' },
    { name: 'C', count: analytics.gradeDistribution['C'] || 0, color: '#fb923c' },
    { name: 'D', count: analytics.gradeDistribution['D'] || 0, color: '#ef4444' },
    { name: 'F', count: analytics.gradeDistribution['F'] || 0, color: '#b91c1c' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <AppHeader logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/exams"
          backLabel="Back to exams"
          title={user?.schoolName || 'School'}
          subtitle={exam?.name ? `${exam.name} — analytics` : 'Exam analytics'}
        />
      </AppHeader>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        {exam ? (
          <p className="text-sm text-gray-600 -mt-2 mb-2">
            {exam.classId?.name} | {exam.subjectId?.name}
          </p>
        ) : null}
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card p-5 bg-white border-l-4 border-l-blue-500">
             <div className="flex items-center gap-3 text-gray-500 mb-2">
               <Users className="w-5 h-5" />
               <span className="font-medium text-sm uppercase tracking-wider">Pass Percentage</span>
             </div>
             <div className="text-3xl font-bold text-gray-900">{analytics.passPercentage}%</div>
             <p className="text-xs text-gray-500 mt-1">{analytics.passed} out of {analytics.present} passed</p>
          </div>
          <div className="card p-5 bg-white border-l-4 border-l-green-500">
             <div className="flex items-center gap-3 text-gray-500 mb-2">
               <BookOpen className="w-5 h-5" />
               <span className="font-medium text-sm uppercase tracking-wider">Average Marks</span>
             </div>
             <div className="text-3xl font-bold text-gray-900">{analytics.avgMarks}</div>
             <p className="text-xs text-gray-500 mt-1">Out of {exam?.totalMarks} ({analytics.avgPercentage}%)</p>
          </div>
          <div className="card p-5 bg-white border-l-4 border-l-yellow-500">
             <div className="flex items-center gap-3 text-gray-500 mb-2">
               <Trophy className="w-5 h-5" />
               <span className="font-medium text-sm uppercase tracking-wider">Highest Marks</span>
             </div>
             <div className="text-3xl font-bold text-gray-900">{analytics.highestMarks}</div>
          </div>
          <div className="card p-5 bg-white border-l-4 border-l-red-500">
             <div className="flex items-center gap-3 text-gray-500 mb-2">
               <AlertTriangle className="w-5 h-5" />
               <span className="font-medium text-sm uppercase tracking-wider">Lowest Marks</span>
             </div>
             <div className="text-3xl font-bold text-gray-900">{analytics.lowestMarks}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart */}
          <div className="card col-span-1 lg:col-span-2 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Grade Distribution</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Attendance Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Total Enrolled</span>
                <span className="font-semibold text-gray-900">{analytics.totalStudents}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Present</span>
                <span className="font-semibold text-green-600">{analytics.present}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b">
                <span className="text-gray-600">Absent</span>
                <span className="font-semibold text-red-600">{analytics.absent}</span>
              </div>
              <div className="flex justify-between items-center py-2 mt-4 bg-gray-50 rounded-lg px-3">
                <span className="text-gray-700 font-medium">Failed</span>
                <span className="font-bold text-red-600">{analytics.failed}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamAnalytics;
