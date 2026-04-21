import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import {
  User, Phone, BookOpen, Users, ArrowLeft,
  Loader2, AlertCircle, Save, LogOut
} from 'lucide-react';
import toast from 'react-hot-toast';
import useStudentStore from '../../store/studentStore';
import useAuthStore from '../../store/authStore';
import useAcademicStore from '../../store/academicStore';

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'personal',  label: 'Personal',  icon: User },
  { id: 'academic',  label: 'Academic',  icon: BookOpen },
  { id: 'contact',   label: 'Contact',   icon: Phone },
  { id: 'guardian',  label: 'Guardian',  icon: Users },
];

// ── Reusable field wrapper ─────────────────────────────────────────────────────
const Field = ({ label, error, children, required }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const StudentForm = () => {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { createStudent, updateStudent, fetchStudent, currentStudent, isLoading, clearError } = useStudentStore();

  const [activeTab, setActiveTab] = useState('personal');
  const [submitError, setSubmitError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    defaultValues: {
      status: 'active',
      gender: '',
      bloodGroup: '',
      relationship: ''
    }
  });

  // Load existing student data when editing
  useEffect(() => {
    if (isEditing) fetchStudent(id);
    return () => clearError();
  }, [id]);

  // Fetch academic data (classes, sections)
  const { classes: academicClasses, sections: academicSections, fetchClasses, fetchSections } = useAcademicStore();

  useEffect(() => {
    fetchClasses();
    fetchSections();
  }, []);

  // Watch selected class for cascading section dropdown
  const selectedClassId = watch('classId');

  // Populate form when currentStudent loads
  useEffect(() => {
    if (isEditing && currentStudent) {
      reset({
        firstName:      currentStudent.personalInfo?.firstName || '',
        lastName:       currentStudent.personalInfo?.lastName || '',
        dateOfBirth:    currentStudent.personalInfo?.dateOfBirth?.split('T')[0] || '',
        gender:         currentStudent.personalInfo?.gender || '',
        bloodGroup:     currentStudent.personalInfo?.bloodGroup || '',
        class:          currentStudent.academicInfo?.class || '',
        classId:        currentStudent.academicInfo?.classId?._id || currentStudent.academicInfo?.classId || '',
        sectionId:      currentStudent.academicInfo?.sectionId?._id || currentStudent.academicInfo?.sectionId || '',
        section:        currentStudent.academicInfo?.section || '',
        rollNumber:     currentStudent.academicInfo?.rollNumber || '',
        admissionDate:  currentStudent.academicInfo?.admissionDate?.split('T')[0] || '',
        phone:          currentStudent.contactInfo?.phone || '',
        email:          currentStudent.contactInfo?.email || '',
        address:        currentStudent.contactInfo?.address || '',
        guardianName:   currentStudent.guardianInfo?.name || '',
        relationship:   currentStudent.guardianInfo?.relationship || '',
        guardianPhone:  currentStudent.guardianInfo?.phone || '',
        guardianEmail:  currentStudent.guardianInfo?.email || '',
      });
    }
  }, [currentStudent, isEditing]);

  const onSubmit = async (data) => {
    setSubmitError('');

    const payload = {
      personalInfo: {
        firstName:   data.firstName,
        lastName:    data.lastName,
        dateOfBirth: data.dateOfBirth || undefined,
        gender:      data.gender || undefined,
        bloodGroup:  data.bloodGroup || undefined,
      },
      academicInfo: {
        class:         data.class || undefined,
        classId:       data.classId || undefined,
        section:       data.section || undefined,
        sectionId:     data.sectionId || undefined,
        rollNumber:    data.rollNumber || undefined,
        admissionDate: data.admissionDate || undefined,
      },
      contactInfo: {
        phone:   data.phone || undefined,
        email:   data.email || undefined,
        address: data.address || undefined,
      },
      guardianInfo: {
        name:         data.guardianName,
        relationship: data.relationship || undefined,
        phone:        data.guardianPhone,
        email:        data.guardianEmail || undefined,
      },
    };

    const result = isEditing
      ? await updateStudent(id, payload)
      : await createStudent(payload);

    if (result.success) {
      toast.success(isEditing ? 'Student updated successfully!' : 'Student added successfully!');
      navigate('/students');
    } else {
      setSubmitError(result.error || 'Something went wrong. Please try again.');
      toast.error(result.error || 'Failed to save student');
    }
  };

  const bloodGroups = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
  const relationships = ['Father','Mother','Guardian','Uncle','Aunt','Grandfather','Grandmother','Other'];

  // Filtered sections based on selected class
  const filteredSections = academicSections.filter(
    sec => (sec.classId?._id || sec.classId) === selectedClassId
  );

  // ── Loading skeleton when fetching student for edit ──
  if (isEditing && isLoading && !currentStudent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-3 text-gray-500">Loading student data...</p>
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
            <Link to="/students" className="text-gray-500 hover:text-gray-700 text-sm font-medium">
              ← Students
            </Link>
            <span className="text-gray-300">|</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{user?.schoolName}</h1>
              <p className="text-xs text-gray-500">{isEditing ? 'Edit Student' : 'Add New Student'}</p>
            </div>
          </div>
          <button onClick={logout} className="btn-secondary flex items-center gap-2">
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ── Page header ── */}
        <div className="flex items-center gap-4 mb-6">
          <Link to="/students" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? 'Edit Student' : 'Add New Student'}
            </h2>
            <p className="text-gray-500 text-sm mt-0.5">
              {isEditing ? 'Update student information' : 'Fill in the details to register a new student'}
            </p>
          </div>
        </div>

        {/* ── Global error ── */}
        {submitError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{submitError}</span>
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
                        ? 'border-primary-600 text-primary-600 bg-white'
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

              {/* Personal Info */}
              {activeTab === 'personal' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <Field label="First Name" required error={errors.firstName?.message}>
                      <input
                        type="text"
                        className={`input-field ${errors.firstName ? 'border-red-500' : ''}`}
                        placeholder="e.g. John"
                        {...register('firstName', { required: 'First name is required' })}
                      />
                    </Field>
                    <Field label="Last Name" required error={errors.lastName?.message}>
                      <input
                        type="text"
                        className={`input-field ${errors.lastName ? 'border-red-500' : ''}`}
                        placeholder="e.g. Doe"
                        {...register('lastName', { required: 'Last name is required' })}
                      />
                    </Field>
                    <Field label="Date of Birth" error={errors.dateOfBirth?.message}>
                      <input
                        type="date"
                        className={`input-field ${errors.dateOfBirth ? 'border-red-500' : ''}`}
                        {...register('dateOfBirth')}
                      />
                    </Field>
                    <Field label="Gender">
                      <select className="input-field" {...register('gender')}>
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>
                    <Field label="Blood Group">
                      <select className="input-field" {...register('bloodGroup')}>
                        <option value="">Select blood group</option>
                        {bloodGroups.map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </>
              )}

              {/* Academic Info */}
              {activeTab === 'academic' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Class" required error={errors.classId?.message}>
                    <select
                      className={`input-field ${errors.classId ? 'border-red-500' : ''}`}
                      {...register('classId', { required: 'Class is required' })}
                    >
                      <option value="">Select class</option>
                      {academicClasses.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Section">
                    <select className="input-field" {...register('sectionId')}>
                      <option value="">Select section</option>
                      {filteredSections.map(s => (
                        <option key={s._id} value={s._id}>{s.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Roll Number">
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. 42"
                      {...register('rollNumber')}
                    />
                  </Field>
                  <Field label="Admission Date">
                    <input
                      type="date"
                      className="input-field"
                      {...register('admissionDate')}
                    />
                  </Field>
                </div>
              )}

              {/* Contact Info */}
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
                      placeholder="student@email.com"
                      {...register('email', {
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                  </Field>
                  <Field label="Address" error={errors.address?.message}>
                    <textarea
                      rows={3}
                      className="input-field resize-none sm:col-span-2"
                      placeholder="Full address..."
                      {...register('address')}
                    />
                  </Field>
                </div>
              )}

              {/* Guardian Info */}
              {activeTab === 'guardian' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Guardian Name" required error={errors.guardianName?.message}>
                    <input
                      type="text"
                      className={`input-field ${errors.guardianName ? 'border-red-500' : ''}`}
                      placeholder="e.g. Muhammad Ali"
                      {...register('guardianName', { required: 'Guardian name is required' })}
                    />
                  </Field>
                  <Field label="Relationship">
                    <select className="input-field" {...register('relationship')}>
                      <option value="">Select relationship</option>
                      {relationships.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Guardian Phone" required error={errors.guardianPhone?.message}>
                    <input
                      type="tel"
                      className={`input-field ${errors.guardianPhone ? 'border-red-500' : ''}`}
                      placeholder="+92-300-1234567"
                      {...register('guardianPhone', { required: 'Guardian phone is required' })}
                    />
                  </Field>
                  <Field label="Guardian Email" error={errors.guardianEmail?.message}>
                    <input
                      type="email"
                      className={`input-field ${errors.guardianEmail ? 'border-red-500' : ''}`}
                      placeholder="guardian@email.com"
                      {...register('guardianEmail', {
                        pattern: {
                          value: /^\S+@\S+\.\S+$/,
                          message: 'Invalid email address'
                        }
                      })}
                    />
                  </Field>
                </div>
              )}
            </div>

            {/* ── Tab navigation + submit ── */}
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
                <Link to="/students" className="btn-secondary flex-1 sm:flex-none text-center">
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="btn-primary flex-1 sm:flex-none flex items-center justify-center gap-2"
                >
                  {(isSubmitting || isLoading) ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {isEditing ? 'Update Student' : 'Add Student'}
                    </>
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

export default StudentForm;
