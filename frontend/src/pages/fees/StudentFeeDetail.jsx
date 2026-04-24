import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  Calendar,
  CreditCard,
  Receipt,
  Loader2,
  User,
  BookOpen,
  AlertCircle,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import useFeeStore from '../../store/feeStore';
import useAuthStore from '../../store/authStore';
import BrandLogo from '../../components/common/BrandLogo';

const StudentFeeDetail = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentStudentFee,
    isLoading,
    fetchStudentFees,
    recordPayment,
    fetchStudentPayments,
    payments,
  } = useFeeStore();

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'cash',
    remarks: '',
    transactionId: '',
  });

  useEffect(() => {
    if (studentId) {
      fetchStudentFees(studentId);
      fetchStudentPayments(studentId);
    }
  }, [studentId, fetchStudentFees, fetchStudentPayments]);

  const handleOpenPayment = (fee) => {
    setSelectedFee(fee);
    setPaymentData({
      amount: fee.totalAmount - fee.discount - fee.paidAmount,
      paymentMethod: 'cash',
      remarks: '',
      transactionId: '',
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    if (!paymentData.amount || paymentData.amount <= 0) {
      return toast.error('Please enter a valid amount');
    }

    const res = await recordPayment({
      studentFeeId: selectedFee._id,
      amount: parseFloat(paymentData.amount),
      paymentMethod: paymentData.paymentMethod,
      remarks: paymentData.remarks,
      transactionId: paymentData.transactionId,
    });

    if (res.success) {
      toast.success('Payment recorded successfully');
      setShowPaymentModal(false);
      fetchStudentFees(studentId);
      fetchStudentPayments(studentId);
    } else {
      toast.error(res.error || 'Failed to record payment');
    }
  };

  if (isLoading && !currentStudentFee) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading fee details...</p>
        </div>
      </div>
    );
  }

  const { student, fees, summary } = currentStudentFee || {};
  const statusBadge = (status) => {
    const map = {
      paid: 'bg-green-100 text-green-800',
      partial: 'bg-blue-100 text-blue-800',
      overdue: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <BrandLogo linkTo="/dashboard" />
            <Link
              to="/fees/students"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
              <p className="text-xs text-gray-500">Student fee details</p>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 card flex flex-col sm:flex-row gap-6">
            <div className="p-3 bg-primary-50 rounded-xl h-fit self-start">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">{student?.name}</h2>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-gray-600">
                  <CreditCard className="w-4 h-4" />
                  Adm: {student?.admissionNumber}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-gray-600">
                  <BookOpen className="w-4 h-4" />
                  Class: {student?.class || '—'}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 rounded-full text-green-800 text-xs font-medium">
                  Active
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:flex-[2]">
            <div className="card p-4">
              <p className="text-sm text-gray-500 mb-1">Total assigned</p>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {(summary?.totalFees ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="card p-4 border-l-4 border-l-green-500">
              <p className="text-sm text-gray-500 mb-1">Total paid</p>
              <p className="text-2xl font-bold text-green-700">
                Rs. {(summary?.totalPaid ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="card p-4 border-l-4 border-l-yellow-500">
              <p className="text-sm text-gray-500 mb-1">Discounts</p>
              <p className="text-2xl font-bold text-yellow-800">
                Rs. {(summary?.totalDiscount ?? 0).toLocaleString()}
              </p>
            </div>
            <div className="card p-4 border-l-4 border-l-red-500">
              <p className="text-sm text-gray-500 mb-1">Outstanding</p>
              <p className="text-2xl font-bold text-red-700">
                Rs. {(summary?.totalOutstanding ?? 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Fee breakdown</h3>

            {!fees?.length ? (
              <div className="card p-12 text-center border-2 border-dashed border-gray-200">
                <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 text-sm mb-3">No fees assigned to this student yet.</p>
                <Link to="/fees/assign" className="text-primary-600 font-medium text-sm hover:underline">
                  Assign fees →
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {fees.map((fee) => (
                  <div key={fee._id} className="card relative">
                    <div className="absolute top-4 right-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusBadge(
                          fee.status
                        )}`}
                      >
                        {fee.status}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pr-20">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {fee.feeStructureId?.feeCategoryId?.name || 'Fee'}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            Due:{' '}
                            {fee.dueDate ? format(new Date(fee.dueDate), 'MMM d, yyyy') : '—'}
                          </span>
                          <span className="text-gray-300">·</span>
                          <span>Year: {fee.academicYearId?.name || '—'}</span>
                        </p>
                      </div>
                      <div className="flex flex-col sm:items-end gap-2">
                        <p className="text-sm text-gray-500">
                          Balance{' '}
                          <span className="font-semibold text-gray-900">
                            Rs. {fee.outstandingAmount?.toLocaleString?.() ?? '—'}
                          </span>
                        </p>
                        <p className="text-lg font-bold text-gray-900">
                          Total Rs. {fee.totalAmount.toLocaleString()}
                        </p>
                        {fee.status !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => handleOpenPayment(fee)}
                            className="btn-primary text-sm py-2 px-4 self-start sm:self-end"
                          >
                            Record payment
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-900">Payment history</h3>
            <div className="card p-0 overflow-hidden">
              {!payments?.length ? (
                <div className="p-8 text-center text-sm text-gray-500">No payments recorded yet.</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {payments.map((payment) => (
                    <div key={payment._id} className="p-4 hover:bg-gray-50 transition-colors group">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="text-sm font-semibold text-primary-700">{payment.receiptNumber}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {format(new Date(payment.paymentDate), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-green-700">
                          Rs. {payment.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500 capitalize inline-flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5" />
                          {payment.paymentMethod?.replace('_', ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => navigate(`/fees/receipt/${payment._id}`)}
                          className="text-xs font-medium text-primary-600 hover:text-primary-800 inline-flex items-center gap-1 opacity-80 group-hover:opacity-100"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          Receipt
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary-50 rounded-lg">
                  <DollarSign className="w-6 h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Record payment</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {selectedFee?.feeStructureId?.feeCategoryId?.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 mb-6">
              <p className="text-xs font-medium text-gray-500 uppercase mb-1">Balance due</p>
              <p className="text-xs text-gray-500 mb-2">
                Fee total: Rs. {selectedFee?.totalAmount?.toLocaleString()}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                Rs. {selectedFee?.outstandingAmount?.toLocaleString?.() ?? '—'}
              </p>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment amount *</label>
                <input
                  type="number"
                  step="any"
                  required
                  className="input-field"
                  value={paymentData.amount}
                  max={selectedFee?.outstandingAmount}
                  onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Method</label>
                  <select
                    className="input-field"
                    value={paymentData.paymentMethod}
                    onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="online">Online</option>
                    <option value="cheque">Cheque</option>
                    <option value="bank_transfer">Bank transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID (optional)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. REF123"
                    value={paymentData.transactionId}
                    onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (optional)</label>
                <textarea
                  className="input-field min-h-[80px]"
                  placeholder="Internal notes..."
                  value={paymentData.remarks}
                  onChange={(e) => setPaymentData({ ...paymentData, remarks: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button type="button" onClick={() => setShowPaymentModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Confirm payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentFeeDetail;
