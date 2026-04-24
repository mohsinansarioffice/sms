import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { Loader2, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useCommunicationStore from '../../store/communicationStore';
import useAcademicStore from '../../store/academicStore';
import useAuthStore from '../../store/authStore';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

const AnnouncementForm = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const homePath =
    user?.role === 'parent'
      ? '/parent/dashboard'
      : user?.role === 'student'
        ? '/student/dashboard'
        : '/dashboard';
  const isEdit = Boolean(id) && location.pathname.includes('/edit');

  const { classes, fetchClasses } = useAcademicStore();
  const {
    currentAnnouncement,
    isLoading,
    error,
    fetchAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    clearError
  } = useCommunicationStore();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors }
  } = useForm({
    defaultValues: {
      title: '',
      content: '',
      priority: 'normal',
      targetAudience: 'all',
      targetClasses: [],
      isPinned: false,
      expiryDate: '',
      attachments: []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'attachments' });

  const targetAudience = watch('targetAudience');

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (isEdit && id) fetchAnnouncement(id);
  }, [isEdit, id, fetchAnnouncement]);

  useEffect(() => {
    if (isEdit && currentAnnouncement && String(currentAnnouncement._id) === String(id)) {
      const atts = currentAnnouncement.attachments?.length
        ? currentAnnouncement.attachments.map((a) => ({
            name: a.name || '',
            url: a.url || '',
            size: a.size,
            type: a.type
          }))
        : [];
      reset({
        title: currentAnnouncement.title || '',
        content: currentAnnouncement.content || '',
        priority: currentAnnouncement.priority || 'normal',
        targetAudience: currentAnnouncement.targetAudience || 'all',
        targetClasses: (currentAnnouncement.targetClasses || []).map((c) =>
          typeof c === 'object' ? c._id : c
        ),
        isPinned: !!currentAnnouncement.isPinned,
        expiryDate: currentAnnouncement.expiryDate
          ? String(currentAnnouncement.expiryDate).slice(0, 10)
          : '',
        attachments: atts
      });
    }
  }, [isEdit, id, currentAnnouncement, reset]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  const classOptions = useMemo(
    () => (classes || []).filter((c) => c.isActive !== false),
    [classes]
  );

  const onSubmit = async (data) => {
    const attachments = (data.attachments || [])
      .map((a) => ({
        name: (a.name || '').trim() || 'Attachment',
        url: (a.url || '').trim(),
        size: a.size ? Number(a.size) : undefined,
        type: (a.type || '').trim() || undefined
      }))
      .filter((a) => a.url);

    const payload = {
      title: data.title.trim(),
      content: data.content.trim(),
      priority: data.priority,
      targetAudience: data.targetAudience,
      isPinned: !!data.isPinned,
      targetClasses:
        data.targetAudience === 'specific_class' ? data.targetClasses || [] : [],
      expiryDate: data.expiryDate ? new Date(data.expiryDate).toISOString() : undefined,
      attachments
    };

    if (payload.targetAudience === 'specific_class' && payload.targetClasses.length === 0) {
      toast.error('Select at least one class');
      return;
    }

    let res;
    if (isEdit) {
      res = await updateAnnouncement(id, payload);
    } else {
      res = await createAnnouncement(payload);
    }

    if (res.success) {
      toast.success(isEdit ? 'Announcement updated' : 'Announcement posted');
      const newId = res.data?.announcement?._id;
      if (isEdit) navigate(`/announcements/${id}`);
      else if (newId) navigate(`/announcements/${newId}`);
      else navigate('/announcements');
    } else {
      toast.error(res.error || 'Save failed');
    }
  };

  const toggleClass = (classId, current, onChange) => {
    const set = new Set((current || []).map((x) => String(x)));
    const key = String(classId);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    onChange(Array.from(set));
  };

  if (isEdit && id && !currentAnnouncement && isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader logoHref={homePath}>
        <AppPageHeaderContext
          backTo="/announcements"
          backLabel="Back to announcements"
          title={user?.schoolName || 'School'}
          subtitle={isEdit ? 'Edit announcement' : 'New announcement'}
        />
      </AppHeader>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          {isEdit ? 'Edit announcement' : 'New announcement'}
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="card space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input className="input-field" {...register('title', { required: 'Title is required' })} />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              rows={8}
              className="input-field"
              {...register('content', { required: 'Content is required' })}
            />
            {errors.content && <p className="text-red-600 text-sm mt-1">{errors.content.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select className="input-field" {...register('priority')}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Audience</label>
              <select className="input-field" {...register('targetAudience')}>
                <option value="all">Everyone</option>
                <option value="teachers">Teachers</option>
                <option value="students">Students</option>
                <option value="parents">Parents</option>
                <option value="specific_class">Specific class</option>
              </select>
            </div>
          </div>

          {targetAudience === 'specific_class' && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Classes</p>
              <Controller
                name="targetClasses"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                    {classOptions.length === 0 ? (
                      <p className="text-sm text-gray-500">Add classes in Academic settings.</p>
                    ) : (
                      classOptions.map((c) => (
                        <label key={c._id} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(field.value || []).map(String).includes(String(c._id))}
                            onChange={() => toggleClass(c._id, field.value, field.onChange)}
                          />
                          {c.name}
                        </label>
                      ))
                    )}
                  </div>
                )}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" {...register('isPinned')} />
              Pin to top
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry date (optional)</label>
            <input type="date" className="input-field max-w-xs" {...register('expiryDate')} />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Attachments (URL)</label>
              <button
                type="button"
                className="text-sm text-primary-600 flex items-center gap-1"
                onClick={() => append({ name: '', url: '', size: '', type: '' })}
              >
                <Plus className="w-4 h-4" /> Add link
              </button>
            </div>
            {fields.length === 0 && (
              <p className="text-sm text-gray-500">Optional file links (name + URL).</p>
            )}
            <ul className="space-y-3">
              {fields.map((field, index) => (
                <li key={field.id} className="flex flex-col sm:flex-row gap-2 items-start">
                  <input
                    className="input-field flex-1"
                    placeholder="Label"
                    {...register(`attachments.${index}.name`)}
                  />
                  <input
                    className="input-field flex-[2]"
                    placeholder="https://..."
                    {...register(`attachments.${index}.url`)}
                  />
                  <button
                    type="button"
                    className="btn-secondary p-2"
                    onClick={() => remove(index)}
                    aria-label="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex items-center gap-2" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEdit ? 'Save changes' : 'Publish'}
            </button>
            <button type="button" className="btn-secondary" onClick={() => navigate('/announcements')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnnouncementForm;
