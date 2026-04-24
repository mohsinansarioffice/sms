import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, User, Phone, BookOpen,
  Briefcase, MapPin, Calendar, AlertCircle, Loader2,
  DollarSign, Award, UserPlus, KeyRound, Unlink
} from 'lucide-react';
import toast from 'react-hot-toast';
import useTeacherStore from '../../store/teacherStore';
import useAuthStore from '../../store/authStore';
import axios from '../../lib/axios';
import AppHeader, {
  AppPageHeaderContext,
} from '../../components/layout/AppHeader';

// ── Info row helper ────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b last:border-b-0">
    <span className="text-sm font-medium text-gray-500 sm:w-44 flex-shrink-0">{label}</span>
    <span className="text-sm text-gray-900 mt-0.5 sm:mt-0">{value || '—'}</span>
  </div>
);

// ── Section card helper ────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, children, iconColor = 'text-green-600' }) => (
  <div className="card">
    <h3 className={`font-semibold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
      {title}
    </h3>
    {children}
  </div>
);

// ── Tag list helper ────────────────────────────────────────────────────────────
const TagList = ({ items }) => {
  if (!items || items.length === 0) return <span className="text-sm text-gray-400">—</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {item}
        </span>
      ))}
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const TeacherDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { currentTeacher: teacher, isLoading, error, fetchTeacher, deleteTeacher, clearError } = useTeacherStore();
  const [showCreateLoginModal, setShowCreateLoginModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isUnlinkingLogin, setIsUnlinkingLogin] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [loginForm, setLoginForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    if (id) fetchTeacher(id);
    return () => clearError();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this teacher?')) return;
    const result = await deleteTeacher(id);
    if (result.success) {
      toast.success('Teacher deleted successfully');
      navigate('/teachers');
    } else {
      toast.error(result.error || 'Failed to delete teacher');
    }
  };

  const openCreateLoginModal = () => {
    setLoginForm({
      name: fullName || '',
      email: teacher?.contactInfo?.email || '',
      phone: teacher?.contactInfo?.phone || '',
      password: '',
    });
    setShowCreateLoginModal(true);
  };

  const submitCreateLogin = async (event) => {
    event.preventDefault();
    if (!loginForm.email || !/^\S+@\S+\.\S+$/.test(loginForm.email)) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!loginForm.password || loginForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsSubmittingLogin(true);
    try {
      await axios.post('/auth/create-teacher-account', {
        teacherId: id,
        name: loginForm.name.trim(),
        email: loginForm.email.trim().toLowerCase(),
        phone: loginForm.phone.trim(),
        password: loginForm.password,
      });
      toast.success('Teacher login account created successfully');
      setShowCreateLoginModal(false);
      await fetchTeacher(id);
    } catch (err) {
      toast.error(err.message || 'Failed to create teacher login');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const submitResetPassword = async (event) => {
    event.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setIsResettingPassword(true);
    try {
      await axios.put(`/auth/teachers/${id}/password`, { newPassword });
      toast.success('Teacher password reset successfully');
      setShowResetPasswordModal(false);
      setNewPassword('');
    } catch (err) {
      toast.error(err.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const unlinkTeacherLogin = async () => {
    if (!window.confirm('Unlink this teacher login? The account will be deactivated.')) return;
    setIsUnlinkingLogin(true);
    try {
      const response = await axios.delete(`/auth/teachers/${id}`);
      toast.success(response?.message || 'Teacher login unlinked successfully');
      await fetchTeacher(id);
    } catch (err) {
      toast.error(err.message || 'Failed to unlink teacher login');
    } finally {
      setIsUnlinkingLogin(false);
    }
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-green-600 mx-auto" />
          <p className="mt-3 text-gray-500">Loading teacher details...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !teacher) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Teacher Not Found</h2>
          <p className="text-gray-500 mb-6">{error || 'The teacher record could not be loaded.'}</p>
          <Link to="/teachers" className="btn-primary">← Back to Teachers</Link>
        </div>
      </div>
    );
  }

  const fullName = `${teacher.personalInfo?.firstName || ''} ${teacher.personalInfo?.lastName || ''}`.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader logoHref="/dashboard">
        <AppPageHeaderContext
          backTo="/teachers"
          backLabel="Back to teachers"
          title={user?.schoolName || 'School'}
          subtitle="Teacher profile"
        />
      </AppHeader>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link to="/teachers" className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
              <p className="text-gray-500 text-sm font-mono mt-0.5">#{teacher.employeeId}</p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <div className="flex gap-2 self-start sm:self-auto">
              <Link to={`/teachers/${id}/edit`} className="btn-secondary flex items-center gap-2">
                <Edit className="w-4 h-4" /> Edit
              </Link>
              <button
                onClick={handleDelete}
                className="bg-red-50 hover:bg-red-100 text-red-700 font-medium py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          )}
        </div>

        {/* ── Badges ── */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {teacher.isActive ? 'Active' : 'Inactive'}
          </span>
          {teacher.professionalInfo?.department && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {teacher.professionalInfo.department}
            </span>
          )}
          {teacher.professionalInfo?.designation && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
              {teacher.professionalInfo.designation}
            </span>
          )}
        </div>

        {user?.role === 'admin' && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b">
              <User className="w-5 h-5 text-primary-600" />
              Account Access
            </h3>
            {!teacher.userId ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600">
                  This teacher does not have a login account yet.
                </p>
                <button
                  type="button"
                  onClick={openCreateLoginModal}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Login Account
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 w-fit">
                  Teacher Login Linked
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowResetPasswordModal(true)}
                    className="btn-secondary inline-flex items-center gap-2 text-sm"
                  >
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </button>
                  <button
                    type="button"
                    onClick={unlinkTeacherLogin}
                    disabled={isUnlinkingLogin}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-2 text-sm disabled:opacity-60"
                  >
                    {isUnlinkingLogin ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4" />
                    )}
                    Unlink Login
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Info grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal */}
          <Section icon={User} title="Personal Information">
            <InfoRow label="First Name" value={teacher.personalInfo?.firstName} />
            <InfoRow label="Last Name" value={teacher.personalInfo?.lastName} />
            <InfoRow label="Date of Birth" value={
              teacher.personalInfo?.dateOfBirth
                ? new Date(teacher.personalInfo.dateOfBirth).toLocaleDateString()
                : null
            } />
            <InfoRow label="Gender" value={teacher.personalInfo?.gender} />
          </Section>

          {/* Contact */}
          <Section icon={Phone} title="Contact Information" iconColor="text-blue-600">
            <InfoRow label="Phone" value={teacher.contactInfo?.phone} />
            <InfoRow label="Email" value={teacher.contactInfo?.email} />
            <InfoRow label="Address" value={teacher.contactInfo?.address} />
          </Section>

          {/* Professional */}
          <Section icon={Briefcase} title="Professional Information" iconColor="text-purple-600">
            <InfoRow label="Employee ID" value={teacher.employeeId} />
            <InfoRow label="Designation" value={teacher.professionalInfo?.designation} />
            <InfoRow label="Department" value={teacher.professionalInfo?.department} />
            <InfoRow label="Qualification" value={teacher.professionalInfo?.qualification} />
            <InfoRow label="Experience" value={
              teacher.professionalInfo?.experience != null
                ? `${teacher.professionalInfo.experience} year(s)`
                : null
            } />
            <InfoRow label="Joining Date" value={
              teacher.professionalInfo?.joiningDate
                ? new Date(teacher.professionalInfo.joiningDate).toLocaleDateString()
                : null
            } />
          </Section>

          {/* Salary */}
          <Section icon={DollarSign} title="Salary Information" iconColor="text-yellow-600">
            <InfoRow
              label="Monthly Salary"
              value={teacher.salary != null && teacher.salary > 0
                ? `Rs. ${teacher.salary.toLocaleString()}`
                : null}
            />
          </Section>
        </div>

        {/* ── Subjects & Classes ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b">
              <BookOpen className="w-5 h-5 text-green-600" /> Subjects Taught
            </h3>
            <TagList items={teacher.professionalInfo?.subjects} />
          </div>
          <div className="card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b">
              <Award className="w-5 h-5 text-green-600" /> Classes Handled
            </h3>
            <TagList items={teacher.professionalInfo?.classes} />
          </div>
        </div>

        {/* ── Timestamps ── */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b">
            <Calendar className="w-5 h-5 text-green-600" /> Record Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow label="Created At" value={teacher.createdAt ? new Date(teacher.createdAt).toLocaleString() : null} />
            <InfoRow label="Last Updated" value={teacher.updatedAt ? new Date(teacher.updatedAt).toLocaleString() : null} />
          </div>
        </div>
      </div>

      {showCreateLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Create Teacher Login</h3>
              <p className="text-xs text-gray-500 mt-1">
                Create a login account linked to this teacher profile.
              </p>
            </div>
            <form onSubmit={submitCreateLogin} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Display Name</label>
                <input
                  type="text"
                  className="input-field"
                  value={loginForm.name}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email *</label>
                <input
                  type="email"
                  className="input-field"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                <input
                  type="text"
                  className="input-field"
                  value={loginForm.phone}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password *</label>
                <input
                  type="password"
                  className="input-field"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button type="submit" disabled={isSubmittingLogin} className="btn-primary inline-flex items-center gap-2">
                  {isSubmittingLogin ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Create Login
                </button>
                <button type="button" onClick={() => setShowCreateLoginModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Reset Teacher Password</h3>
              <p className="text-xs text-gray-500 mt-1">
                Set a new password for this teacher account.
              </p>
            </div>
            <form onSubmit={submitResetPassword} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password *</label>
                <input
                  type="password"
                  className="input-field"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button type="submit" disabled={isResettingPassword} className="btn-primary inline-flex items-center gap-2">
                  {isResettingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Reset Password
                </button>
                <button type="button" onClick={() => setShowResetPasswordModal(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDetail;
