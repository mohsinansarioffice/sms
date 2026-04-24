import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  User, Phone, Briefcase, DollarSign,
  ArrowLeft, Loader2, AlertCircle, Save, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import useTeacherStore from '../../store/teacherStore';
import useAuthStore from '../../store/authStore';
import LogoutButton from '../../components/common/LogoutButton';

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'personal',      label: 'Personal',      icon: User },
  { id: 'contact',       label: 'Contact',        icon: Phone },
  { id: 'professional',  label: 'Professional',   icon: Briefcase },
  { id: 'salary',        label: 'Salary',         icon: DollarSign },
];

// ── Field wrapper ──────────────────────────────────────────────────────────────
const Field = ({ label, error, children, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// ── Tag input (comma-separated to array) ──────────────────────────────────────
const TagInput = ({ value, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const tags = value || [];

  const addTag = (raw) => {
    const trimmed = raw.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    }
  };

  const removeTag = (tag) => onChange(tags.filter(t => t !== tag));

  return (
    <div className="border border-gray-300 rounded-lg p-2 focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent transition-all min-h-[42px] flex flex-wrap gap-1.5">
      {tags.map(tag => (
        <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {tag}
          <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-600">
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        type="text"
        className="flex-1 min-w-[120px] outline-none text-sm px-1 py-0.5"
        placeholder={tags.length === 0 ? placeholder : 'Add more...'}
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKey}
        onBlur={() => { if (input.trim()) addTag(input); }}
      />
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const TeacherForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { createTeacher, updateTeacher, fetchTeacher, currentTeacher, isLoading, clearError } = useTeacherStore();

  const [activeTab, setActiveTab] = useState('personal');
  const [submitError, setSubmitError] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  // Load existing teacher when editing
  useEffect(() => {
    if (isEditing) fetchTeacher(id);
    return () => clearError();
  }, [id]);

  // Populate form when currentTeacher loads
  useEffect(() => {
    if (isEditing && currentTeacher) {
      reset({
        firstName:     currentTeacher.personalInfo?.firstName || '',
        lastName:      currentTeacher.personalInfo?.lastName || '',
        dateOfBirth:   currentTeacher.personalInfo?.dateOfBirth?.split('T')[0] || '',
        gender:        currentTeacher.personalInfo?.gender || '',
        phone:         currentTeacher.contactInfo?.phone || '',
        email:         currentTeacher.contactInfo?.email || '',
        address:       currentTeacher.contactInfo?.address || '',
        designation:   currentTeacher.professionalInfo?.designation || '',
        department:    currentTeacher.professionalInfo?.department || '',
        joiningDate:   currentTeacher.professionalInfo?.joiningDate?.split('T')[0] || '',
        qualification: currentTeacher.professionalInfo?.qualification || '',
        experience:    currentTeacher.professionalInfo?.experience ?? '',
        salary:        currentTeacher.salary ?? '',
      });
      setSubjects(currentTeacher.professionalInfo?.subjects || []);
      setClasses(currentTeacher.professionalInfo?.classes || []);
    }
  }, [currentTeacher, isEditing]);

  const onSubmit = async (data) => {
    setSubmitError('');

    const payload = {
      personalInfo: {
        firstName:   data.firstName,
        lastName:    data.lastName,
        dateOfBirth: data.dateOfBirth || undefined,
        gender:      data.gender || undefined,
      },
      contactInfo: {
        phone:   data.phone || undefined,
        email:   data.email || undefined,
        address: data.address || undefined,
      },
      professionalInfo: {
        designation:   data.designation || undefined,
        department:    data.department || undefined,
        joiningDate:   data.joiningDate || undefined,
        qualification: data.qualification || undefined,
        experience:    data.experience !== '' ? Number(data.experience) : 0,
        subjects,
        classes,
      },
      salary: data.salary !== '' ? Number(data.salary) : 0,
    };

    const result = isEditing
      ? await updateTeacher(id, payload)
      : await createTeacher(payload);

    if (result.success) {
      toast.success(isEditing ? 'Teacher updated successfully!' : 'Teacher added successfully!');
      navigate('/teachers');
    } else {
      setSubmitError(result.error || 'Something went wrong. Please try again.');
      toast.error(result.error || 'Failed to save teacher');
      // Show subscription limit warning prominently
      if (result.error?.toLowerCase().includes('limit')) {
        setActiveTab('personal');
      }
    }
  };

  const departments = ['Science', 'Mathematics', 'English', 'Urdu', 'Social Studies',
    'Islamiat', 'Computer', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'Arts', 'Physical Education'];

  // ── Loading skeleton when fetching for edit ──
  if (isEditing && isLoading && !currentTeacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto" />
          <p className="mt-3 text-gray-500">Loading teacher data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Nav ── */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link to="/teachers" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
              ← Teachers
            </Link>
            <span className="text-gray-300">|</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
              <p className="text-xs text-gray-500">{isEditing ? 'Edit Teacher' : 'Add New Teacher'}</p>
            </div>
          </div>
          <LogoutButton className="btn-secondary flex items-center gap-2" />
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Page header ── */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/teachers" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Teacher' : 'Add New Teacher'}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {isEditing ? 'Update teacher information' : 'Fill in the details to register a new teacher'}
            </p>
          </div>
        </div>

        {/* ── Global error / subscription warning ── */}
        {submitError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">{submitError}</p>
              {submitError.toLowerCase().includes('limit') && (
                <p className="text-sm mt-1">
                  Please upgrade your subscription plan to add more teachers.
                </p>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="card p-0 overflow-hidden">
            {/* ── Tabs ── */}
            <div className="border-b bg-gray-50 px-6 pt-4">
              <div className="flex gap-1 overflow-x-auto">
                {TABS.map(({ id: tabId, label, icon: Icon }) => (
                  <button
                    key={tabId}
                    type="button"
                    onClick={() => setActiveTab(tabId)}
                    className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 whitespace-nowrap transition-colors ${
                      activeTab === tabId
                        ? 'border-green-600 text-green-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Tab Content ── */}
            <div className="p-6 space-y-5">

              {/* Personal Tab */}
              {activeTab === 'personal' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="First Name" required error={errors.firstName?.message}>
                    <input
                      type="text"
                      className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                      placeholder="e.g. Ahmed"
                      {...register('firstName', { required: 'First name is required' })}
                    />
                  </Field>
                  <Field label="Last Name" required error={errors.lastName?.message}>
                    <input
                      type="text"
                      className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                      placeholder="e.g. Khan"
                      {...register('lastName', { required: 'Last name is required' })}
                    />
                  </Field>
                  <Field label="Date of Birth">
                    <input type="date" className="input-field" {...register('dateOfBirth')} />
                  </Field>
                  <Field label="Gender">
                    <select className="input-field" {...register('gender')}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </Field>
                </div>
              )}

              {/* Contact Tab */}
              {activeTab === 'contact' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Phone">
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="+92-300-1234567"
                      {...register('phone')}
                    />
                  </Field>
                  <Field label="Email" error={errors.email?.message}>
                    <input
                      type="email"
                      className={`input-field ${errors.email ? 'border-red-500' : ''}`}
                      placeholder="teacher@school.com"
                      {...register('email', {
                        pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email address' }
                      })}
                    />
                  </Field>
                  <Field label="Address">
                    <textarea
                      rows={3}
                      className="input-field resize-none col-span-2"
                      placeholder="Full address..."
                      {...register('address')}
                    />
                  </Field>
                </div>
              )}

              {/* Professional Tab */}
              {activeTab === 'professional' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Designation">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Senior Teacher"
                      {...register('designation')}
                    />
                  </Field>
                  <Field label="Department">
                    <select className="input-field" {...register('department')}>
                      <option value="">Select department</option>
                      {departments.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Field>
                  <Field label="Qualification">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. M.Sc. Mathematics"
                      {...register('qualification')}
                    />
                  </Field>
                  <Field label="Experience (Years)" error={errors.experience?.message}>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      className={`input-field ${errors.experience ? 'border-red-500' : ''}`}
                      placeholder="0"
                      {...register('experience', {
                        min: { value: 0, message: 'Experience cannot be negative' },
                        max: { value: 50, message: 'Experience seems too high' },
                      })}
                    />
                  </Field>
                  <Field label="Joining Date">
                    <input type="date" className="input-field" {...register('joiningDate')} />
                  </Field>

                  {/* Subjects (tag input) */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Subjects Taught
                      <span className="text-gray-400 font-normal text-xs ml-2">(Press Enter or comma to add)</span>
                    </label>
                    <TagInput
                      value={subjects}
                      onChange={setSubjects}
                      placeholder="Type a subject and press Enter..."
                    />
                  </div>

                  {/* Classes (tag input) */}
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Classes Handled
                      <span className="text-gray-400 font-normal text-xs ml-2">(Press Enter or comma to add)</span>
                    </label>
                    <TagInput
                      value={classes}
                      onChange={setClasses}
                      placeholder="e.g. Class 9, Class 10..."
                    />
                  </div>
                </div>
              )}

              {/* Salary Tab */}
              {activeTab === 'salary' && (
                <div className="max-w-sm">
                  <Field label="Monthly Salary (Rs.)" error={errors.salary?.message}>
                    <input
                      type="number"
                      min="0"
                      className={`input-field ${errors.salary ? 'border-red-500' : ''}`}
                      placeholder="e.g. 45000"
                      {...register('salary', {
                        min: { value: 0, message: 'Salary cannot be negative' },
                      })}
                    />
                  </Field>
                  <p className="text-xs text-gray-400 mt-2">Leave blank or 0 if not applicable.</p>
                </div>
              )}
            </div>

            {/* ── Footer: tab nav + submit ── */}
            <div className="px-6 pb-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t pt-5">
              <div className="flex gap-2 order-2 sm:order-1">
                {TABS.findIndex(t => t.id === activeTab) > 0 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      const idx = TABS.findIndex(t => t.id === activeTab);
                      setActiveTab(TABS[idx - 1].id);
                    }}
                  >
                    ← Previous
                  </button>
                )}
                {TABS.findIndex(t => t.id === activeTab) < TABS.length - 1 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      const idx = TABS.findIndex(t => t.id === activeTab);
                      setActiveTab(TABS[idx + 1].id);
                    }}
                  >
                    Next →
                  </button>
                )}
              </div>
              <div className="flex gap-3 order-1 sm:order-2 w-full sm:w-auto">
                <Link to="/teachers" className="btn-secondary flex-1 sm:flex-none text-center">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
                >
                  {(isSubmitting || isLoading) ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Save className="w-4 h-4" /> {isEditing ? 'Update Teacher' : 'Add Teacher'}</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherForm;
