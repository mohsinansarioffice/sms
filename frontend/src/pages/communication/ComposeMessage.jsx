import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import useCommunicationStore from '../../store/communicationStore';
import useAuthStore from '../../store/authStore';

const ComposeMessage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isParent = user?.role === 'parent';
  const isStudent = user?.role === 'student';
  const messagesHome = '/messages';
  const [searchParams] = useSearchParams();
  const presetTo = searchParams.get('to');

  const { users, isLoading, error, fetchUsers, sendMessage, clearError } = useCommunicationStore();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      recipientId: '',
      subject: '',
      content: ''
    }
  });

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (presetTo) {
      reset((prev) => ({ ...prev, recipientId: presetTo }));
    }
  }, [presetTo, reset]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const onSubmit = async (data) => {
    const res = await sendMessage({
      recipientId: data.recipientId,
      subject: data.subject?.trim() || undefined,
      content: data.content.trim()
    });
    if (res.success) {
      toast.success('Message sent');
      navigate(messagesHome);
    } else {
      toast.error(res.error || 'Failed to send');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <button
            type="button"
            onClick={() => navigate(messagesHome)}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Compose message</h1>

        {isParent && (
          <p className="text-sm text-gray-600 mb-4">
            You can send messages only to your school&apos;s administrator(s).
          </p>
        )}

        {isParent && !isLoading && users.length === 0 && (
          <div className="card mb-4 text-sm text-amber-800 bg-amber-50 border border-amber-200">
            No school administrator account is available to message. Please contact the school office.
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            {isParent && (
              <p className="text-xs text-gray-500 mb-1.5">
                School administrators and teachers of your children (from the class timetable) appear here.
              </p>
            )}
            {isStudent && (
              <p className="text-xs text-gray-500 mb-1.5">
                You can message staff (admin) and, when set up, your own parent and class teachers.
              </p>
            )}
            <select
              className="input-field"
              {...register('recipientId', { required: 'Choose a recipient' })}
            >
              <option value="">Select recipient…</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.profile?.name || u.email}
                  {!isParent ? ` (${u.role})` : ''}
                </option>
              ))}
            </select>
            {errors.recipientId && (
              <p className="text-red-600 text-sm mt-1">{errors.recipientId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject (optional)</label>
            <input className="input-field" {...register('subject')} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              rows={8}
              className="input-field"
              {...register('content', { required: 'Message is required' })}
            />
            {errors.content && <p className="text-red-600 text-sm mt-1">{errors.content.message}</p>}
          </div>

          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              Send
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate(messagesHome)}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeMessage;
