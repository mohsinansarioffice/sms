import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, FileText, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useTeacherStore from '../../store/teacherStore';
import usePayrollStore from '../../store/payrollStore';
import BrandLogo from '../../components/common/BrandLogo';

const PayrollList = () => {
  const { teachers, fetchTeachers } = useTeacherStore();
  const { records, totalPaid, fetchPayroll, createPayroll, isLoading } = usePayrollStore();
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [teacherId, setTeacherId] = useState('');
  const [allowances, setAllowances] = useState('0');
  const [deductions, setDeductions] = useState('0');

  useEffect(() => {
    fetchTeachers(1);
  }, []);

  useEffect(() => {
    fetchPayroll({ month, year });
  }, [month, year]);

  const selectedTeacher = useMemo(() => teachers.find((row) => row._id === teacherId), [teachers, teacherId]);

  const recordSalary = async () => {
    if (!teacherId) {
      toast.error('Select a teacher');
      return;
    }
    const result = await createPayroll({
      teacherId,
      month: Number(month),
      year: Number(year),
      allowances: Number(allowances),
      deductions: Number(deductions),
    });
    if (result.success) {
      toast.success('Salary recorded successfully');
      setTeacherId('');
      setAllowances('0');
      setDeductions('0');
      return;
    }
    toast.error(result.error || 'Unable to record salary');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3 sm:gap-4 min-w-0">
          <BrandLogo linkTo="/dashboard" />
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 shrink-0">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
      </nav>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Record Monthly Salary</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <select className="input-field md:col-span-2" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
              <option value="">Select Teacher</option>
              {teachers.map((teacher) => (
                <option key={teacher._id} value={teacher._id}>
                  {teacher.personalInfo?.firstName} {teacher.personalInfo?.lastName}
                </option>
              ))}
            </select>
            <input className="input-field" type="number" value={month} onChange={(e) => setMonth(e.target.value)} min="1" max="12" placeholder="Month" />
            <input className="input-field" type="number" value={year} onChange={(e) => setYear(e.target.value)} min="2000" placeholder="Year" />
            <button className="btn-primary" onClick={recordSalary} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin inline" /> : 'Record Salary'}
            </button>
          </div>
          {selectedTeacher ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <input className="input-field" type="number" value={allowances} onChange={(e) => setAllowances(e.target.value)} placeholder="Allowances" />
              <input className="input-field" type="number" value={deductions} onChange={(e) => setDeductions(e.target.value)} placeholder="Deductions" />
            </div>
          ) : null}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Payroll Records ({month}/{year})
            </h3>
            <p className="text-sm text-gray-600">Total Paid: Rs. {totalPaid.toLocaleString()}</p>
          </div>
          {!records.length ? (
            <p className="text-sm text-gray-500 py-8 text-center">No salary records for this month.</p>
          ) : (
            <div className="space-y-2">
              {records.map((record) => (
                <div key={record._id} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {record.teacherId?.personalInfo?.firstName} {record.teacherId?.personalInfo?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">
                      Basic: {record.basicSalary} | Net: {record.netSalary}
                    </p>
                  </div>
                  <Link to={`/payroll/slip/${record._id}`} className="btn-secondary inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Slip
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayrollList;
