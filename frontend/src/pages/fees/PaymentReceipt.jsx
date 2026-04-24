import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import useFeeStore from '../../store/feeStore';
import useAuthStore from '../../store/authStore';
import BrandLogo from '../../components/common/BrandLogo';

const PaymentReceipt = () => {
  const { paymentId } = useParams();
  const { user } = useAuthStore();
  const { fetchPaymentReceipt, isLoading } = useFeeStore();
  const [payment, setPayment] = useState(null);
  const printRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      const res = await fetchPaymentReceipt(paymentId);
      if (res.success) setPayment(res.data.payment);
    };
    load();
  }, [paymentId, fetchPaymentReceipt]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !payment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-3 text-gray-500 text-sm">Loading receipt...</p>
        </div>
      </div>
    );
  }

  const { studentId: student, studentFeeId: fee, receivedBy } = payment;

  return (
    <div className="min-h-screen bg-gray-50 pb-12 print:bg-white print:p-0">
      <nav className="bg-white shadow-sm border-b no-print">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <BrandLogo linkTo="/dashboard" />
            <Link
              to={`/fees/student/${student?._id}`}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
              <p className="text-xs text-gray-500">Payment receipt</p>
            </div>
          </div>
          <button type="button" onClick={handlePrint} className="btn-primary py-2 flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8 print:py-0 print:px-0 print:max-w-none">
        <div
          ref={printRef}
          className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden print:shadow-none print:border-none print:rounded-none"
        >
          <div className="h-1.5 bg-primary-600" />

          <div className="p-8 sm:p-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-10 pb-8 border-b border-gray-200">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-50 rounded-lg">
                    <ShieldCheck className="w-7 h-7 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{user?.schoolName}</h2>
                </div>
                <p className="text-sm text-gray-500">Official fee receipt</p>
              </div>
              <div className="text-left md:text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-800 text-xs font-medium mb-3">
                  <CheckCircle className="w-4 h-4" />
                  Payment received
                </div>
                <p className="text-2xl font-bold text-gray-900">{payment.receiptNumber}</p>
                <p className="text-xs text-gray-500 mt-1">Receipt number</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b">Student</h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500 font-medium">Name</dt>
                    <dd className="font-semibold text-gray-900 mt-0.5">
                      {student?.personalInfo?.firstName} {student?.personalInfo?.lastName}
                    </dd>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <dt className="text-gray-500 font-medium">Admission</dt>
                      <dd className="font-semibold text-primary-700 mt-0.5">{student?.admissionNumber}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 font-medium">Class / section</dt>
                      <dd className="font-semibold text-gray-900 mt-0.5">
                        {student?.academicInfo?.classId?.name || '—'} —{' '}
                        {student?.academicInfo?.sectionId?.name || '—'}
                      </dd>
                    </div>
                  </div>
                  <div>
                    <dt className="text-gray-500 font-medium">Guardian</dt>
                    <dd className="text-gray-900 mt-0.5">{student?.guardianInfo?.name || '—'}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4 pb-2 border-b">Transaction</h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-gray-500 font-medium">Date</dt>
                    <dd className="font-semibold text-gray-900 mt-0.5">
                      {format(new Date(payment.paymentDate), 'MMMM d, yyyy')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-500 font-medium">Method</dt>
                    <dd className="font-semibold text-gray-900 mt-0.5 capitalize inline-flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {payment.paymentMethod?.replace('_', ' ')}
                    </dd>
                  </div>
                  {payment.transactionId && (
                    <div>
                      <dt className="text-gray-500 font-medium">Reference</dt>
                      <dd className="font-mono text-sm text-gray-900 mt-0.5 border border-dashed border-gray-200 rounded px-2 py-1 inline-block">
                        {payment.transactionId}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Charges</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="py-3 text-left text-xs font-semibold text-gray-500 uppercase">Item</th>
                    <th className="py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total due</th>
                    <th className="py-3 text-right text-xs font-semibold text-gray-500 uppercase">Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  <tr>
                    <td className="py-4">
                      <p className="font-semibold text-gray-900">{fee?.feeStructureId?.feeCategoryId?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">Session: {fee?.academicYearId?.name || '—'}</p>
                    </td>
                    <td className="py-4 text-right font-semibold text-gray-900">
                      Rs. {fee?.totalAmount?.toLocaleString()}
                    </td>
                    <td className="py-4 text-right font-semibold text-gray-900">
                      Rs. {payment.amount.toLocaleString()}
                    </td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={2} className="pt-6 pb-2 text-right text-xs font-medium text-gray-500">
                      Total received
                    </td>
                    <td className="pt-6 pb-2 text-right text-2xl font-bold text-gray-900">
                      Rs. {payment.amount.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row justify-between gap-6 text-xs text-gray-500">
              <p>
                Computer-generated receipt. Valid without signature unless your institution requires otherwise.
              </p>
              <div className="text-center sm:text-right sm:min-w-[140px]">
                <div className="border-b border-gray-300 pb-8 mb-1 min-h-[2rem]" />
                <p className="font-medium text-gray-700">{receivedBy?.profile?.name || 'Authorized signatory'}</p>
                <p className="text-gray-400 mt-1">Received by</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-center text-xs text-gray-500 print:hidden">
            Printed {format(new Date(), 'MMM d, yyyy h:mm a')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentReceipt;
