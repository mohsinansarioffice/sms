import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Search, Filter, Eye, DollarSign, 
  CreditCard, Calendar, Loader2, Plus 
} from 'lucide-react';
import { format } from 'date-fns';
import useFeeStore from '../../store/feeStore';
import useAcademicStore from '../../store/academicStore';
import useAuthStore from '../../store/authStore';
import DataTable from '../../components/common/DataTable';
import BrandLogo from '../../components/common/BrandLogo';
import { createColumnHelper } from '@tanstack/react-table';

const StudentFeeList = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    studentFees, isLoading, fetchAllStudentFees,
    total, totalPages, currentPage 
  } = useFeeStore();
  const { classes, academicYears, fetchClasses, fetchAcademicYears } = useAcademicStore();

  const [filters, setFilters] = useState({
    status: '',
    classId: '',
    academicYearId: ''
  });

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
    fetchAllStudentFees();
  }, [fetchClasses, fetchAcademicYears, fetchAllStudentFees]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const applyFilters = () => {
    fetchAllStudentFees(filters);
  };

  const columnHelper = createColumnHelper();

  const columns = useMemo(() => [
    columnHelper.accessor('studentId', {
      header: 'Student',
      cell: info => {
        const student = info.getValue();
        const personalInfo = student?.personalInfo;
        return (
          <div className="flex flex-col">
            <span className="font-semibold text-gray-900">
              {personalInfo?.firstName} {personalInfo?.lastName}
            </span>
            <span className="text-xs text-gray-500">Adm: {student?.admissionNumber}</span>
          </div>
        );
      }
    }),
    columnHelper.accessor(row => row.studentId?.academicInfo?.classId?.name || '—', {
      id: 'class',
      header: 'Class',
      cell: info => <span className="text-gray-600 font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => row.feeStructureId?.feeCategoryId?.name || '—', {
      id: 'feeType',
      header: 'Fee Type',
      cell: info => <span className="text-gray-600">{info.getValue()}</span>
    }),
    columnHelper.accessor('totalAmount', {
      header: 'Total',
      cell: info => <span className="font-semibold">Rs. {info.getValue().toLocaleString()}</span>
    }),
    columnHelper.accessor('paidAmount', {
      header: 'Paid',
      cell: info => <span className="text-green-600 font-medium">Rs. {info.getValue().toLocaleString()}</span>
    }),
    columnHelper.accessor(row => row.totalAmount - row.discount - row.paidAmount, {
      id: 'outstanding',
      header: 'Balance',
      cell: info => {
        const balance = info.getValue();
        return (
          <span className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
            Rs. {balance.toLocaleString()}
          </span>
        );
      }
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: info => {
        const status = info.getValue();
        const colors = {
          pending: 'bg-yellow-100 text-yellow-800',
          partial: 'bg-blue-100 text-blue-800',
          paid: 'bg-green-100 text-green-800',
          overdue: 'bg-red-100 text-red-800'
        };
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${colors[status] || 'bg-gray-100'}`}>
            {status}
          </span>
        );
      }
    }),
    columnHelper.display({
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: props => (
        <div className="flex justify-end gap-2">
          <button 
            onClick={() => navigate(`/fees/student/${props.row.original.studentId?._id}`)}
            className="p-1.5 rounded text-primary-600 hover:bg-primary-50 transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            onClick={() => navigate(`/fees/student/${props.row.original.studentId?._id}`)}
            className="p-1.5 rounded text-green-600 hover:bg-green-50 transition-colors"
            title="Pay Now"
          >
            <DollarSign className="w-4 h-4" />
          </button>
        </div>
      )
    })
  ], [navigate, columnHelper]);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <BrandLogo linkTo="/dashboard" />
            <Link to="/dashboard" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
              <p className="text-xs text-gray-500">Student Fee Management</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to="/fees/assign" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Assign Fees
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Student Fees</h2>
            <p className="text-gray-500 text-sm mt-0.5">Track and manage student payments and outstanding balances</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <Filter className="w-4 h-4 text-gray-400" />
              <select 
                name="academicYearId"
                value={filters.academicYearId}
                onChange={handleFilterChange}
                className="text-sm border-none bg-transparent focus:ring-0 text-gray-700"
              >
                <option value="">All Years</option>
                {academicYears.map(y => <option key={y._id} value={y._id}>{y.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <select 
                name="classId"
                value={filters.classId}
                onChange={handleFilterChange}
                className="text-sm border-none bg-transparent focus:ring-0 text-gray-700 font-medium"
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
              <select 
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                className="text-sm border-none bg-transparent focus:ring-0 text-gray-700"
              >
                <option value="">All Status</option>
                <option value="pending" className="text-yellow-600">Pending</option>
                <option value="partial" className="text-blue-600">Partial</option>
                <option value="paid" className="text-green-600">Paid</option>
                <option value="overdue" className="text-red-600">Overdue</option>
              </select>
            </div>

            <button type="button" onClick={applyFilters} className="btn-primary">
              Apply filters
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Records</p>
                <p className="text-2xl font-bold text-gray-900">{total || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="card border-l-4 border-l-green-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fully Paid</p>
                <p className="text-2xl font-bold text-gray-900">
                  {studentFees.filter(f => f.status === 'paid').length}
                </p>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-l-yellow-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending/Partial</p>
                <p className="text-2xl font-bold text-gray-900">
                  {studentFees.filter(f => ['pending', 'partial'].includes(f.status)).length}
                </p>
              </div>
            </div>
          </div>

          <div className="card border-l-4 border-l-red-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-gray-900">
                   {studentFees.filter(f => f.status === 'overdue').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-0 overflow-hidden bg-white shadow-sm border border-gray-200 rounded-xl">
          <DataTable 
            columns={columns} 
            data={studentFees} 
            isLoading={isLoading} 
            searchable={true}
            placeholder="Search by student name or admission number..."
          />
        </div>
      </div>
    </div>
  );
};

export default StudentFeeList;
