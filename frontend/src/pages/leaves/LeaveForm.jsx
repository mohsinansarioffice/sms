import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useLeaveStore from '../../store/leaveStore';
import useAuthStore from '../../store/authStore';
import useTeacherStore from '../../store/teacherStore';
import useStudentStore from '../../store/studentStore';

const LeaveForm = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { teachers, fetchTeachers } = useTeacherStore();
  const { students, fetchStudents } = useStudentStore();
  const { createLeave, isLoading } = useLeaveStore();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      applicantType: 'student',
      leaveType: 'casual',
    },
  });

  const applicantType = watch('applicantType');

  useEffect(() => {
    fetchTeachers(1);
    fetchStudents(1);
  }, []);

  const onSubmit = async (data) => {
    const result = await createLeave(data);
    if (result.success) {
      toast.success('Leave request submitted');
      navigate('/leaves');
      return;
    }
    toast.error(result.error || 'Failed to submit leave');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/leaves" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-5 h-5" />
            Back
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Apply Leave</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Applicant Type</label>
                <select className="input-field" {...register('applicantType', { required: true })}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Applicant</label>
                <select className="input-field" {...register('applicantId', { required: 'Applicant is required' })}>
                  <option value="">Select Applicant</option>
                  {applicantType === 'teacher'
                    ? teachers.map((teacher) => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.personalInfo?.firstName} {teacher.personalInfo?.lastName}
                        </option>
                      ))
                    : students.map((student) => (
                        <option key={student._id} value={student._id}>
                          {student.personalInfo?.firstName} {student.personalInfo?.lastName}
                        </option>
                      ))}
                </select>
                {errors.applicantId && <p className="text-xs text-red-500 mt-1">{errors.applicantId.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Leave Type</label>
                <select className="input-field" {...register('leaveType', { required: true })}>
                  <option value="sick">Sick</option>
                  <option value="casual">Casual</option>
                  <option value="medical">Medical</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">From Date</label>
                <input type="date" className="input-field" {...register('fromDate', { required: true })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">To Date</label>
                <input type="date" className="input-field" {...register('toDate', { required: true })} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason</label>
              <textarea
                rows="3"
                className="input-field resize-none"
                placeholder="Write reason for leave"
                {...register('reason', { required: 'Reason is required' })}
              />
              {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason.message}</p>}
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary">
              Submit Request
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LeaveForm;
