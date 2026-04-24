import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { 
  Calendar, Search, Filter, Loader2,
  ChevronLeft, ChevronRight, AlertCircle, Edit, Download
} from 'lucide-react';
import useAttendanceStore from '../../store/attendanceStore';
import useAuthStore from '../../store/authStore';
import DataTable from '../../components/common/DataTable';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';
import { createColumnHelper } from '@tanstack/react-table';

const AttendanceList = () => {
  const { user } = useAuthStore();
  const { 
    attendanceRecords, 
    fetchAttendance, 
    isLoading, 
    error
  } = useAttendanceStore();

  const [dateQuery, setDateQuery] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [classFilter, setClassFilter] = useState('');
  
  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  useEffect(() => {
    fetchAttendance({ date: dateQuery, class: classFilter });
  }, [dateQuery, classFilter, fetchAttendance]);

  const handleDateChange = (change) => {
    const current = new Date(dateQuery);
    current.setDate(current.getDate() + change);
    setDateQuery(format(current, 'yyyy-MM-dd'));
  };

  const getStats = (records) => {
    const total = records.length;
    const present = records.filter(r => ['present', 'late'].includes(r.status)).length;
    const absent = records.filter(r => r.status === 'absent').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    
    return { total, present, absent, percentage };
  };

  const columnHelper = createColumnHelper();

  const attendanceColumns = useMemo(() => [
    columnHelper.accessor(row => row, {
      id: 'classSection',
      header: 'Class/Section',
      cell: info => {
        const record = info.getValue();
        return (
          <div className="font-semibold text-gray-900">
            Class {record.class} {record.section ? `- ${record.section}` : ''}
          </div>
        )
      }
    }),
    columnHelper.accessor(row => getStats(row.records).total, {
      id: 'total',
      header: 'Total Students',
      cell: info => <span className="font-medium text-gray-700">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => getStats(row.records).present, {
      id: 'present',
      header: 'Present/Late',
      cell: info => <span className="text-green-600 font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => getStats(row.records).absent, {
      id: 'absent',
      header: 'Absent',
      cell: info => <span className="text-red-500 font-medium">{info.getValue()}</span>
    }),
    columnHelper.accessor(row => getStats(row.records).percentage, {
      id: 'percentage',
      header: 'Percentage',
      cell: info => {
        const percentage = info.getValue();
        return (
          <div className="flex items-center gap-2">
            <span className={`font-semibold ${
              percentage >= 90 ? 'text-green-600' : 
              percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {percentage}%
            </span>
            <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  percentage >= 90 ? 'bg-green-500' : 
                  percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        )
      }
    }),
    columnHelper.accessor('markedBy.profile.name', {
      header: 'Marked By',
      cell: info => <span className="text-sm text-gray-500">{info.getValue() || 'Unknown'}</span>
    }),
    columnHelper.display({
      id: 'action',
      header: () => <div className="text-right w-full">Action</div>,
      cell: props => {
        const record = props.row.original;
        return (
          <Link
            to={`/attendance/mark`}
            state={{ date: dateQuery, class: record.class, section: record.section }}
            className="text-primary-600 hover:text-primary-900 font-medium text-sm flex items-center justify-end gap-1 w-full"
          >
            <Edit className="w-4 h-4" /> Edit
          </Link>
        )
      }
    })
  ], [dateQuery]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/dashboard"
          backLabel="Back to dashboard"
          title={user?.schoolName || 'School'}
          subtitle="Attendance history"
        />
      </AppHeader>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-2">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Attendance History</h2>
            <p className="text-gray-500 text-sm mt-0.5">View and manage class attendance records</p>
          </div>
          <Link to="/attendance/mark" className="btn-primary py-1.5 text-sm self-start shrink-0">
            Mark Attendance
          </Link>
        </div>

        {/* Filters */}
        <div className="card flex flex-col md:flex-row gap-4 justify-between items-center bg-white border border-gray-200">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => handleDateChange(-1)}
              className="p-2 border rounded hover:bg-gray-50"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="date" 
                className="input-field pl-9 py-2 w-48"
                value={dateQuery}
                onChange={(e) => setDateQuery(e.target.value)}
              />
            </div>
            <button 
              onClick={() => handleDateChange(1)}
              className="p-2 border rounded hover:bg-gray-50"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setDateQuery(format(new Date(), 'yyyy-MM-dd'))}
              className="ml-2 text-primary-600 text-sm font-medium hover:underline"
            >
              Today
            </button>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select 
                className="input-field pl-9 py-2 appearance-none"
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
              </select>
            </div>
            {user?.subscriptionPlan === 'premium' ? (
              <button className="btn-secondary flex items-center justify-center gap-2">
                <Download className="w-4 h-4" /> Export
              </button>
            ) : (
                <button className="btn-secondary flex items-center justify-center gap-2 opacity-50 cursor-not-allowed" title="Export available on premium plan">
                  <Download className="w-4 h-4" /> Export
                </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="card p-0 overflow-hidden shadow-sm border border-gray-200">
          <DataTable
            columns={attendanceColumns}
            data={attendanceRecords}
            searchable={false}
            hidePagination={true}
            isLoading={isLoading}
            emptyState={
              <div className="flex flex-col items-center justify-center">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>No attendance records found for {format(parseISO(dateQuery), 'MMM d, yyyy')}</p>
                {classFilter && <p className="text-sm text-gray-400 mt-1">for Class {classFilter}</p>}
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
};

export default AttendanceList;
