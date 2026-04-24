import { useState, useEffect, useMemo } from 'react';
import {
  Download,
  FileText,
  DollarSign,
  TrendingUp,
  Users,
  Calendar,
  PieChart,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart as RePieChart,
  Pie,
} from 'recharts';
import useFeeStore from '../../store/feeStore';
import useAcademicStore from '../../store/academicStore';
import useAuthStore from '../../store/authStore';
import DataTable from '../../components/common/DataTable';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';
import { createColumnHelper } from '@tanstack/react-table';

const TABS = [
  { id: 'collection', label: 'Collection summary', icon: TrendingUp },
  { id: 'defaulters', label: 'Defaulters', icon: Users },
];

const CHART_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'];

const FeeReports = () => {
  const [activeTab, setActiveTab] = useState('collection');
  const [dateFilters, setDateFilters] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    classId: '',
  });

  const { user } = useAuthStore();
  const { classes, fetchClasses } = useAcademicStore();
  const {
    collectionReport,
    defaulters,
    isLoading,
    fetchCollectionReport,
    fetchDefaulters,
  } = useFeeStore();

  useEffect(() => {
    fetchClasses();
    if (activeTab === 'collection') {
      fetchCollectionReport(dateFilters);
    } else {
      fetchDefaulters();
    }
  }, [activeTab, dateFilters, fetchClasses, fetchCollectionReport, fetchDefaulters]);

  const handleFilterChange = (e) => {
    setDateFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const methodData = useMemo(() => {
    if (!collectionReport?.summary?.paymentMethodBreakdown) return [];
    return Object.entries(collectionReport.summary.paymentMethodBreakdown)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.replace('_', ' '),
        value,
      }));
  }, [collectionReport]);

  const columnHelper = createColumnHelper();

  const defaulterColumns = useMemo(
    () => [
      columnHelper.accessor('studentId', {
        header: 'Student',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">
              {info.getValue()?.personalInfo?.firstName} {info.getValue()?.personalInfo?.lastName}
            </span>
            <span className="text-xs text-gray-500">Adm: {info.getValue()?.admissionNumber}</span>
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.studentId?.academicInfo?.classId?.name || '—', {
        id: 'class',
        header: 'Class',
        cell: (info) => <span className="text-gray-700 text-sm">{info.getValue()}</span>,
      }),
      columnHelper.accessor((row) => row.feeStructureId?.feeCategoryId?.name || '—', {
        id: 'feeType',
        header: 'Fee type',
        cell: (info) => <span className="text-gray-600 text-sm">{info.getValue()}</span>,
      }),
      columnHelper.accessor('totalAmount', {
        header: 'Charged',
        cell: (info) => (
          <span className="font-semibold text-gray-900">Rs. {info.getValue().toLocaleString()}</span>
        ),
      }),
      columnHelper.accessor('paidAmount', {
        header: 'Paid',
        cell: (info) => (
          <span className="font-semibold text-green-700">Rs. {info.getValue().toLocaleString()}</span>
        ),
      }),
      columnHelper.accessor((row) => row.totalAmount - row.discount - row.paidAmount, {
        id: 'due',
        header: 'Outstanding',
        cell: (info) => (
          <span className="font-semibold text-red-600">Rs. {info.getValue().toLocaleString()}</span>
        ),
      }),
      columnHelper.accessor('dueDate', {
        header: 'Due date',
        cell: (info) =>
          info.getValue() ? (
            <span className="text-xs text-gray-500">{format(new Date(info.getValue()), 'MMM d, yyyy')}</span>
          ) : (
            '—'
          ),
      }),
    ],
    [columnHelper]
  );

  const collectionColumns = useMemo(
    () => [
      columnHelper.accessor('paymentDate', {
        header: 'Date',
        cell: (info) => (
          <span className="text-xs text-gray-600">{format(new Date(info.getValue()), 'MMM d, yyyy')}</span>
        ),
      }),
      columnHelper.accessor('receiptNumber', {
        header: 'Receipt',
        cell: (info) => <span className="text-xs font-medium text-primary-700">{info.getValue()}</span>,
      }),
      columnHelper.accessor('studentId', {
        header: 'Student',
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900 text-sm">
              {info.getValue()?.personalInfo?.firstName} {info.getValue()?.personalInfo?.lastName}
            </span>
            <span className="text-xs text-gray-500">{info.getValue()?.academicInfo?.classId?.name}</span>
          </div>
        ),
      }),
      columnHelper.accessor('amount', {
        header: 'Amount',
        cell: (info) => (
          <span className="font-semibold text-gray-900">Rs. {info.getValue().toLocaleString()}</span>
        ),
      }),
      columnHelper.accessor('paymentMethod', {
        header: 'Method',
        cell: (info) => (
          <span className="px-2 py-0.5 bg-gray-100 rounded text-xs font-medium text-gray-600 capitalize">
            {info.getValue()?.replace('_', ' ')}
          </span>
        ),
      }),
    ],
    [columnHelper]
  );

  const avgPerDay =
    collectionReport?.payments?.length > 0
      ? (
          collectionReport.summary.totalCollection /
          (Math.max(
            1,
            Math.ceil(
              (new Date(dateFilters.endDate) - new Date(dateFilters.startDate)) / (1000 * 60 * 60 * 24)
            ) + 1
          ))
        ).toFixed(0)
      : '0';

  const totalOutstanding = defaulters.reduce(
    (s, d) => s + (d.totalAmount - d.paidAmount - d.discount),
    0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/dashboard"
          backLabel="Back to dashboard"
          title={user?.schoolName || 'School'}
          subtitle="Fee reports"
        />
      </AppHeader>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Finance overview</h2>
            <p className="text-sm text-gray-500 mt-1">Collection and outstanding balances</p>
          </div>

          <div className="flex p-1 bg-gray-100 rounded-lg border border-gray-200 w-fit">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-primary-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === 'collection' && (
          <div className="space-y-8">
            <div className="card grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    name="startDate"
                    value={dateFilters.startDate}
                    onChange={handleFilterChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    name="endDate"
                    value={dateFilters.endDate}
                    onChange={handleFilterChange}
                    className="input-field pl-10"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                <select
                  name="classId"
                  value={dateFilters.classId}
                  onChange={handleFilterChange}
                  className="input-field"
                >
                  <option value="">All classes</option>
                  {classes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="button"
                  className="w-full btn-primary flex items-center justify-center gap-2"
                  disabled
                  title="Export coming soon"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="card h-[400px] flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary-600" />
                      Collection by payment
                    </h3>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Total collected</p>
                      <p className="text-2xl font-bold text-gray-900">
                        Rs. {collectionReport?.summary?.totalCollection?.toLocaleString() ?? '0'}
                      </p>
                    </div>
                  </div>
                  <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={collectionReport?.payments || []}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis
                          dataKey="paymentDate"
                          tickFormatter={(d) => format(new Date(d), 'd MMM')}
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: '#6b7280' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '0.5rem',
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                          }}
                          itemStyle={{ fontWeight: 600, fontSize: '12px' }}
                          labelStyle={{ fontSize: '11px', color: '#6b7280' }}
                        />
                        <Bar dataKey="amount" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card p-0 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h4 className="font-semibold text-gray-900">Recent payments</h4>
                    <span className="text-xs font-medium text-primary-700 bg-primary-50 px-2 py-1 rounded-full">
                      {collectionReport?.payments?.length ?? 0} records
                    </span>
                  </div>
                  <DataTable
                    columns={collectionColumns}
                    data={collectionReport?.payments || []}
                    isLoading={isLoading}
                    searchable
                    placeholder="Search payments..."
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="card flex flex-col">
                  <h3 className="text-base font-bold text-gray-900 mb-4 text-center">Payment methods</h3>
                  <div className="h-56 w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={methodData}
                          cx="50%"
                          cy="50%"
                          innerRadius={52}
                          outerRadius={72}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {methodData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <PieChart className="w-5 h-5 text-gray-300 mb-1" />
                      <p className="text-xs text-gray-400">Mix</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {methodData.map((item, idx) => (
                      <div key={item.name} className="flex flex-col p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 mb-1">
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }}
                          />
                          <p className="text-xs text-gray-600 truncate">{item.name}</p>
                        </div>
                        <p className="font-semibold text-gray-900 text-sm">Rs. {item.value.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card border-l-4 border-l-primary-500">
                  <div className="flex items-center gap-2 text-primary-600 mb-2">
                    <DollarSign className="w-5 h-5" />
                    <p className="text-sm font-medium text-gray-600">Avg. per day (range)</p>
                  </div>
                  <p className="text-3xl font-bold text-gray-900">Rs. {Number(avgPerDay).toLocaleString()}</p>
                  <p className="text-xs text-gray-500 mt-2">Based on selected date range</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'defaulters' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card border-l-4 border-l-red-500">
                <p className="text-sm text-gray-500 mb-1">Defaulter records</p>
                <p className="text-3xl font-bold text-red-700">{defaulters.length}</p>
                <p className="text-xs text-gray-500 mt-2">Outstanding fee lines</p>
              </div>
              <div className="card border-l-4 border-l-red-600 bg-red-50">
                <p className="text-sm text-red-800/80 mb-1">Total outstanding</p>
                <p className="text-2xl font-bold text-red-800">Rs. {totalOutstanding.toLocaleString()}</p>
              </div>
              <div className="card flex flex-col justify-center items-center text-center border-2 border-dashed border-gray-200">
                <FileText className="w-8 h-8 text-gray-300 mb-2" />
                <p className="text-sm font-medium text-gray-700">Bulk notices</p>
                <p className="text-xs text-gray-500 mt-1">Print or export reminders (coming soon)</p>
              </div>
            </div>

            <div className="card p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                <h3 className="font-semibold text-gray-900">Defaulters</h3>
                <button
                  type="button"
                  className="text-sm font-medium text-primary-600 hover:text-primary-800 flex items-center gap-1"
                  disabled
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
              <DataTable
                columns={defaulterColumns}
                data={defaulters}
                isLoading={isLoading}
                searchable
                placeholder="Search student or class..."
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeeReports;
