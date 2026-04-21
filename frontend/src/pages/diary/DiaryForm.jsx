import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ArrowLeft, Loader2, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import useDiaryStore from '../../store/diaryStore';
import useAcademicStore from '../../store/academicStore';

const DiaryForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { currentEntry, isLoading, fetchEntry, createEntry, updateEntry, clearError } = useDiaryStore();
  const { classes, sections, subjects, fetchClasses, fetchSections, fetchSubjects } = useAcademicStore();

  const today = format(new Date(), 'yyyy-MM-dd');

  const [form, setForm] = useState({
    classId: '',
    sectionId: '',
    subjectId: '',
    date: today,
    type: 'homework',
    title: '',
    description: '',
    dueDate: '',
    status: 'published'
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchSubjects();
  }, []);

  useEffect(() => {
    if (form.classId) fetchSections(form.classId);
  }, [form.classId]);

  useEffect(() => {
    if (isEdit && id) {
      fetchEntry(id);
    }
  }, [id, isEdit]);

  useEffect(() => {
    if (isEdit && currentEntry) {
      setForm({
        classId: currentEntry.classId?._id || currentEntry.classId || '',
        sectionId: currentEntry.sectionId?._id || currentEntry.sectionId || '',
        subjectId: currentEntry.subjectId?._id || currentEntry.subjectId || '',
        date: currentEntry.date ? format(new Date(currentEntry.date), 'yyyy-MM-dd') : today,
        type: currentEntry.type || 'homework',
        title: currentEntry.title || '',
        description: currentEntry.description || '',
        dueDate: currentEntry.dueDate ? format(new Date(currentEntry.dueDate), 'yyyy-MM-dd') : '',
        status: currentEntry.status || 'published'
      });
    }
  }, [currentEntry, isEdit]);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'classId' ? { sectionId: '' } : {})
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.classId) return toast.error('Please select a class');
    if (!form.date) return toast.error('Please select a date');
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.description.trim()) return toast.error('Description is required');

    const payload = {
      classId: form.classId,
      sectionId: form.sectionId || undefined,
      subjectId: form.subjectId || undefined,
      date: form.date,
      type: form.type,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status
    };

    if (form.type === 'homework' && form.dueDate) {
      payload.dueDate = form.dueDate;
    }

    setSaving(true);
    const result = isEdit
      ? await updateEntry(id, payload)
      : await createEntry(payload);
    setSaving(false);

    if (result.success) {
      toast.success(isEdit ? 'Diary entry updated' : 'Diary entry created');
      navigate('/diary');
    } else {
      toast.error(result.error || 'Failed to save diary entry');
    }
  };

  if (isEdit && isLoading && !currentEntry) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/diary')} className="btn-secondary flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary-600" />
              {isEdit ? 'Edit Diary Entry' : 'New Diary Entry'}
            </h1>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Class & Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={form.classId}
                onChange={(e) => handleChange('classId', e.target.value)}
                required
              >
                <option value="">Select Class</option>
                {classes.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
              <select
                className="input-field"
                value={form.sectionId}
                onChange={(e) => handleChange('sectionId', e.target.value)}
                disabled={!form.classId}
              >
                <option value="">All Sections</option>
                {sections.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Subject & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                className="input-field"
                value={form.subjectId}
                onChange={(e) => handleChange('subjectId', e.target.value)}
              >
                <option value="">Select Subject (optional)</option>
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                className="input-field"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Type & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Entry Type <span className="text-red-500">*</span>
              </label>
              <select
                className="input-field"
                value={form.type}
                onChange={(e) => handleChange('type', e.target.value)}
              >
                <option value="homework">Homework</option>
                <option value="classwork">Classwork</option>
                <option value="notice">Notice</option>
                <option value="remark">Remark</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="input-field"
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                <option value="published">Published (visible to parents)</option>
                <option value="draft">Draft (hidden)</option>
              </select>
            </div>
          </div>

          {/* Due Date (homework only) */}
          {form.type === 'homework' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
                <span className="text-gray-400 font-normal ml-1">(optional)</span>
              </label>
              <input
                type="date"
                className="input-field"
                value={form.dueDate}
                onChange={(e) => handleChange('dueDate', e.target.value)}
                min={form.date || today}
              />
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Mathematics — Chapter 5 Exercise 3"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              maxLength={200}
              required
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{form.title.length}/200</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input-field"
              rows={4}
              placeholder={
                form.type === 'homework'
                  ? 'Describe the homework assignment in detail...'
                  : form.type === 'classwork'
                  ? 'Topics covered in class today...'
                  : form.type === 'notice'
                  ? 'Notice details...'
                  : 'Teacher remark...'
              }
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              required
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => navigate('/diary')}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex items-center gap-2"
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : isEdit ? 'Update Entry' : 'Create Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiaryForm;
