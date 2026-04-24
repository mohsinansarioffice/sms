import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, subDays, parseISO } from 'date-fns';
import { 
  FileText, Calendar, Filter, Loader2, ArrowLeft, Download, Printer, User
} from 'lucide-react';
import useAttendanceStore from '../../store/attendanceStore';
import useAuthStore from '../../store/authStore';
import DataTable from '../../components/common/DataTable';
import BrandLogo from '../../components/common/BrandLogo';
import { createColumnHelper } from '@tanstack/react-table';

const AttendanceReport = () => {
  const { user } = useAuthStore();
  const { fetchReport, report, isLoading } = useAttendanceStore();

  const [dateRange, setDateRange] = useState('7'); // days
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [classFilter, setClassFilter] = useState('');
  
  const classes = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  const handleRangeSelect = (days) => {
    setDateRange(days);
    if (days !== 'custom') {
      setStartDate(format(subDays(new Date(), parseInt(days)), 'yyyy-MM-dd'));
      setEndDate(format(new Date(), 'yyyy-MM-dd'));
    }
  };

  const generateReport = () => {
    fetchReport({
      startDate,
      endDate,
      class: classFilter
    });
  };

  // Initial fetch
  useEffect(() => {
    generateReport();
    // eslint-disable-next-line
  }, []);

  // Compute aggregate stats from the report array
  const aggregateStats = React.useMemo(() => {
    if (!report?.report || report.report.length === 0) return null;
    
    const records = report.report;
    let totalPresent = 0;
    let totalDays = 0;
    
    records.forEach(r => {
      totalPresent += r.presentDays;
      totalDays += r.totalDays;
    });
    
    const avgPercentage = totalDays > 0 ? (totalPresent / totalDays) * 100 : 0;
    
    return {
      studentCount: records.length,
      avgPercentage: Math.round(avgPercentage * 10) / 10
    };
  }, [report]);

  const columnHelper = createColumnHelper();

  const reportColumns = useMemo(() => [
    columnHelper.accessor(row => row, {
      id: 'studentName',
      header: 'Student Name',
      cell: info => {
        const row = info.getValue();
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{row.studentName}</span>
            <span className="text-xs text-gray-500 font-mono">{row.admissionNumber}</span>
          </div>
        );
      }
    }),
    columnHelper.accessor(row => `${row.class}${row.section ? `-${row.section}` : ''}`, {
      id: 'classSec',
      header: 'Class/Sec',
      cell: info => <span className="text-sm text-gray-600">{info.getValue()}</span>
    }),
    columnHelper.accessor('presentDays', {
      header: 'Present',
      cell: info => <span className="text-green-600 font-medium text-center block">{info.getValue()}</span>
    }),
    columnHelper.accessor('absentDays', {
      header: 'Absent',
      cell: info => <span className="text-red-500 font-medium text-center block">{info.getValue()}</span>
    }),
    columnHelper.accessor('lateDays', {
      header: 'Late',
      cell: info => <span className="text-yellow-600 font-medium text-center block">{info.getValue()}</span>
    }),
    columnHelper.accessor('percentage', {
      header: 'Percentage',
      cell: info => {
        const percentage = Math.round(info.getValue());
        return (
          <div className="flex items-center gap-2 w-32">
            <span className={`text-sm font-bold w-10 text-right ${
              percentage >= 90 ? 'text-green-600' : 
              percentage >= 75 ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {percentage}%
            </span>
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className={`h-full ${
                  percentage >= 90 ? 'bg-green-500' : 
                  percentage >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>
          </div>
        );
      }
    })
  ], []);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <BrandLogo linkTo="/dashboard" />
            <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm font-medium shrink-0">
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
              <p className="text-xs text-gray-500">Attendance Reports</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4 mb-2">
          <Link to="/dashboard" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Attendance Report</h2>
            <p className="text-gray-500 text-sm mt-0.5">Generate and analyze student attendance data</p>
          </div>
        </div>

        {/* Configuration Card */}
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="space-y-4 col-span-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Date Range</label>
              <div className="flex flex-wrap gap-2">
                {['7', '30', '90', 'custom'].map(val => (
                  <button
                    key={val}
                    onClick={() => handleRangeSelect(val)}
                    className={`px-3 py-1.5 text-sm rounded-md border ${
                      dateRange === val 
                        ? 'bg-primary-50 border-primary-500 text-primary-700 font-medium' 
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {val === 'custom' ? 'Custom' : `Last ${val} Days`}
                  </button>
                ))}
              </div>
              
              {dateRange === 'custom' && (
                <div className="flex gap-4 items-center">
                  <div className="flex-1 relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="date" 
                      className="input-field pl-9 text-sm"
                      value={startDate}
                      max={endDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <span className="text-gray-500">to</span>
                  <div className="flex-1 relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input 
                      type="date" 
                      className="input-field pl-9 text-sm"
                      value={endDate}
                      min={startDate}
                      max={format(new Date(), 'yyyy-MM-dd')}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Class</label>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <select 
                  className="input-field pl-9"
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                >
                  <option value="">All Classes</option>
                  {classes.map(c => <option key={c} value={c}>Class {c}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={generateReport}
              disabled={isLoading}
              className="btn-primary flex items-center justify-center gap-2 h-10 w-full"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              Generate Report
            </button>
          </div>
        </div>

        {/* Results */}
        {report?.report && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Report Analysis ({format(parseISO(startDate), 'MMM d')} - {format(parseISO(endDate), 'MMM d, yyyy')})
              </h3>
              <div className="flex gap-2">
                <button 
                    onClick={() => window.print()}
                    className="btn-secondary py-1.5 px-3 flex items-center gap-2 text-sm"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                {user?.subscriptionPlan === 'premium' ? (
                  <button className="btn-primary py-1.5 px-3 flex items-center gap-2 text-sm">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                ) : (
                  <button className="btn-secondary py-1.5 px-3 flex items-center gap-2 text-sm opacity-50 cursor-not-allowed" title="Export available on premium plan">
                    <Download className="w-4 h-4" /> Export CSV
                  </button>
                )}
              </div>
            </div>

            {/* Summary Cards */}
            {aggregateStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="card p-5 bg-white border-l-4 border-l-primary-500">
                  <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <User className="w-5 h-5" />
                    <span className="font-medium">Total Students Evaluated</span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{aggregateStats.studentCount}</div>
                </div>
                <div className="card p-5 bg-white border-l-4 border-l-green-500">
                   <div className="flex items-center gap-2 text-gray-500 mb-2">
                    <FileText className="w-5 h-5" />
                    <span className="font-medium">Average Attendance</span>
                  </div>
                  <div className="text-3xl font-bold text-green-600">{aggregateStats.avgPercentage}%</div>
                </div>
              </div>
            )}

            {/* Table */}
            <div className="card p-0 overflow-hidden shadow-sm border border-gray-200">
              <DataTable
                columns={reportColumns}
                data={report.report || []}
                searchable={true}
                placeholder="Search by student name..."
                hidePagination={false}
                isLoading={isLoading}
                emptyState="No attendance data found for this period"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceReport;
