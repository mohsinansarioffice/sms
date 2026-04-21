import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Search, Filter, Edit, Trash2, BarChart2, FileText, Loader2, PlayCircle, StopCircle } from 'lucide-react';
import useExamStore from '../../store/examStore';
import useAcademicStore from '../../store/academicStore';
import useAuthStore from '../../store/authStore';
import DataTable from '../../components/common/DataTable';
import { createColumnHelper } from '@tanstack/react-table';

const ExamList = () => {
  const { user } = useAuthStore();
  const { exams, fetchExams, deleteExam, isLoading } = useExamStore();
  const { classes, subjects, academicYears, fetchClasses, fetchSubjects, fetchAcademicYears } = useAcademicStore();
  
  const [filters, setFilters] = useState({
    classId: '',
    subjectId: '',
    academicYearId: ''
  });

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
    fetchAcademicYears();
  }, [fetchClasses, fetchSubjects, fetchAcademicYears]);

  useEffect(() => {
    fetchExams(filters);
  }, [filters, fetchExams]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      await deleteExam(id);
    }
  };

  const columnHelper = createColumnHelper();

  const examColumns = useMemo(() => [
    columnHelper.accessor('name', {
      header: 'Exam Name',
      cell: info => <span className="font-semibold text-gray-900">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => row.classId?.name || '-', {
      id: 'class',
      header: 'Class',
      cell: info => <span className="text-gray-600">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => row.subjectId?.name || '-', {
      id: 'subject',
      header: 'Subject',
      cell: info => <span className="text-gray-600">{info.getValue()}</span>
    }),
    columnHelper.accessor('examDate', {
      header: 'Date',
      cell: info => <span className="text-sm">{info.getValue() ? format(new Date(info.getValue()), 'MMM d, yyyy') : '-'}</span>
    }),
    columnHelper.accessor('totalMarks', {
      header: 'Marks',
      cell: info => <span className="text-sm font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor('isPublished', {
      header: 'Status',
      cell: info => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${info.getValue() ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
          {info.getValue() ? 'Published' : 'Draft'}
        </span>
      )
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: info => {
        const examId = info.row.original._id;
        return (
          <div className="flex justify-end gap-2">
            <Link to={`/exams/${examId}/results`} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="Enter/View Results">
              <FileText className="w-4 h-4" />
            </Link>
            <Link to={`/exams/${examId}`} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-md" title="Analytics">
              <BarChart2 className="w-4 h-4" />
            </Link>
            {(user?.role === 'admin' || user?.role === 'teacher') && (
              <>
                <Link to={`/exams/${examId}/edit`} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-md" title="Edit">
                  <Edit className="w-4 h-4" />
                </Link>
                {user?.role === 'admin' && (
                  <button onClick={() => handleDelete(examId)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-md" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}
          </div>
        )
      }
    }),
  ], [user]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
              <p className="text-xs text-gray-500">Exam Management</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Exams</h2>
            <p className="text-gray-500 text-sm mt-0.5">Manage examinations and academic assessments</p>
          </div>
          {(user?.role === 'admin' || user?.role === 'teacher') && (
            <Link to="/exams/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" /> New Exam
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="card grid grid-cols-1 md:grid-cols-3 gap-4 bg-white border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select name="academicYearId" value={filters.academicYearId} onChange={handleFilterChange} className="input-field pl-9">
                <option value="">All Years</option>
                {academicYears.map(ay => <option key={ay._id} value={ay._id}>{ay.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select name="classId" value={filters.classId} onChange={handleFilterChange} className="input-field pl-9">
                <option value="">All Classes</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select name="subjectId" value={filters.subjectId} onChange={handleFilterChange} className="input-field pl-9">
                <option value="">All Subjects</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div className="card p-0 overflow-hidden border border-gray-200 shadow-sm">
          <DataTable
            columns={examColumns}
            data={exams}
            searchable={true}
            placeholder="Search exams..."
            isLoading={isLoading}
            hidePagination={false}
            emptyState={
               <div className="flex flex-col items-center justify-center text-center p-6">
                 <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                 <p className="text-gray-500 font-medium">No exams found</p>
                 <p className="text-gray-400 text-sm mt-1">Adjust filters or create a new exam.</p>
               </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default ExamList;
