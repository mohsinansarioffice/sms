import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Clock3, Loader2, Plus, Edit2, Trash2, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import useTimetableStore from '../../store/timetableStore';
import useAuthStore from '../../store/authStore';

const defaultFormValues = {
  name: '',
  startTime: '',
  endTime: '',
  displayOrder: 0,
  isBreak: false,
};

const TimeSlotSettings = () => {
  const { user } = useAuthStore();
  const { timeSlots, isLoading, isFetching, fetchTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } =
    useTimetableStore();

  const [showForm, setShowForm] = useState(false);
  const [editingSlot, setEditingSlot] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultFormValues,
  });

  useEffect(() => {
    fetchTimeSlots();
  }, []);

  const openCreate = () => {
    setEditingSlot(null);
    setShowForm(true);
    reset(defaultFormValues);
  };

  const openEdit = (slot) => {
    setEditingSlot(slot);
    setShowForm(true);
    reset({
      name: slot.name,
      startTime: slot.startTime,
      endTime: slot.endTime,
      displayOrder: slot.displayOrder ?? 0,
      isBreak: Boolean(slot.isBreak),
    });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingSlot(null);
    reset(defaultFormValues);
  };

  const onSubmit = async (data) => {
    const payload = {
      ...data,
      displayOrder: Number(data.displayOrder || 0),
      isBreak: Boolean(data.isBreak),
    };

    const result = editingSlot
      ? await updateTimeSlot(editingSlot._id, payload)
      : await createTimeSlot(payload);

    if (result?.success) {
      toast.success(editingSlot ? 'Time slot updated successfully' : 'Time slot created successfully');
      closeForm();
      return;
    }

    toast.error(result?.error || 'Unable to save time slot');
  };

  const handleDelete = async (slot) => {
    if (!window.confirm(`Delete "${slot.name}"?`)) return;
    const result = await deleteTimeSlot(slot._id);
    if (result?.success) {
      toast.success('Time slot deleted successfully');
      return;
    }
    toast.error(result?.error || 'Unable to delete time slot');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
            <p className="text-xs text-gray-500">Timetable - Time Slots</p>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Time Slot Settings</h2>
            <p className="text-gray-500 text-sm mt-1">Define school periods and breaks</p>
          </div>
          {!showForm && (
            <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Time Slot
            </button>
          )}
        </div>

        {showForm && (
          <div className="card mb-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingSlot ? 'Edit Time Slot' : 'Create Time Slot'}
              </h3>
              <button onClick={closeForm} className="p-1 text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name *</label>
                  <input
                    type="text"
                    className={`input-field ${errors.name ? 'border-red-500' : ''}`}
                    placeholder="e.g., Period 1, Lunch Break"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Order *</label>
                  <input
                    type="number"
                    className={`input-field ${errors.displayOrder ? 'border-red-500' : ''}`}
                    min="0"
                    {...register('displayOrder', { required: 'Display order is required' })}
                  />
                  {errors.displayOrder && (
                    <p className="text-red-500 text-xs mt-1">{errors.displayOrder.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Time *</label>
                  <input
                    type="time"
                    className={`input-field ${errors.startTime ? 'border-red-500' : ''}`}
                    {...register('startTime', { required: 'Start time is required' })}
                  />
                  {errors.startTime && <p className="text-red-500 text-xs mt-1">{errors.startTime.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">End Time *</label>
                  <input
                    type="time"
                    className={`input-field ${errors.endTime ? 'border-red-500' : ''}`}
                    {...register('endTime', { required: 'End time is required' })}
                  />
                  {errors.endTime && <p className="text-red-500 text-xs mt-1">{errors.endTime.message}</p>}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" {...register('isBreak')} />
                Mark as break/lunch period
              </label>

              <div className="pt-3 border-t flex gap-3">
                <button type="submit" disabled={isLoading} className="btn-primary inline-flex items-center gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {editingSlot ? 'Update Slot' : 'Create Slot'}
                </button>
                <button type="button" onClick={closeForm} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-semibold text-gray-900 inline-flex items-center gap-2">
              <Clock3 className="w-5 h-5 text-primary-600" />
              Existing Time Slots
            </h3>
            {isFetching && (
              <span className="text-sm text-primary-600 inline-flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </span>
            )}
          </div>

          {!timeSlots.length ? (
            <div className="py-14 text-center text-gray-500">No time slots found. Create your first one.</div>
          ) : (
            <div className="space-y-3">
              {timeSlots.map((slot) => (
                <div
                  key={slot._id}
                  className={`border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    slot.isBreak ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {slot.name}{' '}
                      {slot.isBreak && (
                        <span className="ml-2 text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-800">Break</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {slot.startTime} - {slot.endTime}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Order: {slot.displayOrder}</p>
                  </div>

                  <div className="flex gap-2">
                    <button onClick={() => openEdit(slot)} className="btn-secondary inline-flex items-center gap-1">
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(slot)}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 border border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
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

export default TimeSlotSettings;
