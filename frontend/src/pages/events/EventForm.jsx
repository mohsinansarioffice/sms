import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import useEventStore from '../../store/eventStore';
import useAuthStore from '../../store/authStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

const EventForm = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createEvent, isLoading } = useEventStore();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      type: 'event',
      targetAudience: 'all',
    },
  });

  const onSubmit = async (data) => {
    const result = await createEvent(data);
    if (result.success) {
      toast.success('Event created successfully');
      navigate('/events');
      return;
    }
    toast.error(result.error || 'Failed to create event');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/events"
          backLabel="Back to calendar"
          title="Create event"
          subtitle={user?.schoolName || undefined}
        />
      </AppHeader>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Create Event</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Title</label>
              <input className="input-field" {...register('title', { required: 'Title is required' })} />
              {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
                <input className="input-field" type="date" {...register('eventDate', { required: true })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                <select className="input-field" {...register('type')}>
                  <option value="event">Event</option>
                  <option value="holiday">Holiday</option>
                  <option value="exam">Exam</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Audience</label>
                <select className="input-field" {...register('targetAudience')}>
                  <option value="all">All</option>
                  <option value="teachers">Teachers</option>
                  <option value="students">Students</option>
                  <option value="parents">Parents</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea className="input-field resize-none" rows="4" {...register('description')} />
            </div>
            <button type="submit" className="btn-primary" disabled={isLoading}>
              Create Event
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EventForm;
