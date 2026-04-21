import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Trophy, Award, BookOpen, FileText } from 'lucide-react';
import useExamStore from '../../store/examStore';
import { format } from 'date-fns';

const StudentResults = () => {
  const { studentId } = useParams();
  const { fetchStudentResults, studentResults, isLoading } = useExamStore();

  useEffect(() => {
    fetchStudentResults(studentId);
  }, [studentId, fetchStudentResults]);

  if (isLoading || !studentResults) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  const { student, results, stats } = studentResults;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={`/students/${studentId}`} className="text-gray-500 hover:text-gray-700 flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Back to Profile
          </Link>
          <div className="text-right flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
              <p className="text-sm text-gray-500">Adm No: {student.admissionNumber}</p>
            </div>
            <Link to={`/students/${studentId}/report-card`} className="btn-secondary inline-flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Report Card
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card p-5 bg-white flex flex-col justify-center border-l-4 border-l-blue-500">
             <span className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-1">Total Exams</span>
             <div className="text-3xl font-bold text-gray-900">{stats.totalExams}</div>
          </div>
          <div className="card p-5 bg-white flex flex-col justify-center border-l-4 border-l-green-500">
             <span className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-1">Passed exams</span>
             <div className="text-3xl font-bold text-green-600">{stats.passedExams}</div>
          </div>
          <div className="card p-5 bg-white flex flex-col justify-center border-l-4 border-l-red-500">
             <span className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-1">Failed exams</span>
             <div className="text-3xl font-bold text-red-600">{stats.failedExams}</div>
          </div>
          <div className="card p-5 bg-white flex flex-col justify-center border-l-4 border-l-purple-500">
             <span className="text-gray-500 font-medium text-sm uppercase tracking-wider mb-1">Average Perf.</span>
             <div className="text-3xl font-bold text-purple-600">{stats.avgPercentage}%</div>
          </div>
        </div>

        {/* Results List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-bold text-gray-900">Academic Results log</h3>
          </div>
          
          {results.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No exams recorded for this student.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {results.map(r => (
                <div key={r._id} className="p-6 hover:bg-gray-50 transition-colors flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="text-lg font-bold text-gray-900">{r.examId?.name}</h4>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded">{r.examId?.examTypeId?.name}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Subject: <span className="font-medium text-gray-900">{r.examId?.subjectId?.name}</span> • Class: {r.examId?.classId?.name}</p>
                    {r.remarks && <p className="text-sm text-gray-500 italic">"{r.remarks}"</p>}
                  </div>

                  <div className="flex items-center gap-6 text-center">
                     <div>
                       <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Marks</p>
                       <p className="font-mono font-medium text-gray-900">{r.isAbsent ? 'ABS' : `${r.marksObtained}/${r.examId?.totalMarks}`}</p>
                     </div>
                     <div>
                       <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Percentage</p>
                       <p className="font-mono font-medium text-gray-900">{r.isAbsent ? '-' : `${r.percentage}%`}</p>
                     </div>
                     <div className="w-16">
                       <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Grade</p>
                       <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm bg-gray-100
                         ${r.grade === 'A+' || r.grade === 'A' ? 'text-green-600 bg-green-100' : ''}
                         ${r.grade === 'B+' || r.grade === 'B' ? 'text-yellow-600 bg-yellow-100' : ''}
                         ${r.grade === 'F' ? 'text-red-600 bg-red-100' : ''}
                       `}>
                         {r.grade}
                       </span>
                     </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentResults;
