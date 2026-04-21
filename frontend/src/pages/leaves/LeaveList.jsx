import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useLeaveStore from '../../store/leaveStore';
import useAuthStore from '../../store/authStore';

const LeaveList = () => {
  const { user } = useAuthStore();
  const { leaves, fetchLeaves, updateLeaveStatus, isLoading } = useLeaveStore();
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchLeaves({ status: statusFilter });
  }, [statusFilter]);

  const handleStatus = async (id, status) => {
    const result = await updateLeaveStatus(id, { status });
    if (result.success) {
      toast.success(`Leave ${status}`);
      return;
    }
    toast.error(result.error || 'Failed to update leave');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/dashboard" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
          <Link to="/leaves/new" className="btn-primary">
            Apply Leave
          </Link>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Leave Requests</h2>
            <select className="input-field max-w-[200px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {!leaves.length ? (
            <p className="text-sm text-gray-500 py-8 text-center">No leave requests found.</p>
          ) : (
            <div className="space-y-3">
              {leaves.map((leave) => (
                <div key={leave._id} className="border rounded-xl p-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-gray-900">{leave.applicantName}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(leave.fromDate).toLocaleDateString()} - {new Date(leave.toDate).toLocaleDateString()} |{' '}
                        {leave.leaveType}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{leave.reason}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">{leave.status}</span>
                      {user?.role === 'admin' && leave.status === 'pending' && (
                        <>
                          <button disabled={isLoading} className="btn-secondary" onClick={() => handleStatus(leave._id, 'approved')}>
                            Approve
                          </button>
                          <button
                            disabled={isLoading}
                            className="px-3 py-2 text-sm rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => handleStatus(leave._id, 'rejected')}
                          >
                            Reject
                          </button>
                        </>
                      )}
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

export default LeaveList;
