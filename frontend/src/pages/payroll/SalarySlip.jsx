import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Printer } from 'lucide-react';
import usePayrollStore from '../../store/payrollStore';

const SalarySlip = () => {
  const { id } = useParams();
  const { salarySlip, fetchSalarySlip, isLoading } = usePayrollStore();

  useEffect(() => {
    fetchSalarySlip(id);
  }, [id]);

  if (isLoading || !salarySlip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white">
      <nav className="bg-white border-b shadow-sm print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/payroll" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <button className="btn-secondary inline-flex items-center gap-2" onClick={() => window.print()}>
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border rounded-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Salary Slip</h1>
          <p className="text-sm text-gray-500 mb-6">
            {salarySlip.month}/{salarySlip.year}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Teacher</p>
              <p className="font-semibold text-gray-900">
                {salarySlip.teacherId?.personalInfo?.firstName} {salarySlip.teacherId?.personalInfo?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Employee ID</p>
              <p className="font-semibold text-gray-900">{salarySlip.teacherId?.employeeId || '-'}</p>
            </div>
          </div>
          <div className="border rounded-lg divide-y">
            <div className="p-3 flex justify-between">
              <span>Basic Salary</span>
              <span className="font-semibold">Rs. {salarySlip.basicSalary.toLocaleString()}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span>Allowances</span>
              <span className="font-semibold">Rs. {salarySlip.allowances.toLocaleString()}</span>
            </div>
            <div className="p-3 flex justify-between">
              <span>Deductions</span>
              <span className="font-semibold">Rs. {salarySlip.deductions.toLocaleString()}</span>
            </div>
            <div className="p-3 flex justify-between bg-gray-50">
              <span className="font-semibold">Net Salary</span>
              <span className="font-bold text-lg">Rs. {salarySlip.netSalary.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalarySlip;
