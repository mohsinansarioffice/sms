import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  BookOpen,
  Heart,
  MapPin,
  Users,
  Calendar,
  AlertCircle,
  Loader2,
  CalendarCheck,
  FileText,
  CreditCard,
  UserPlus,
  KeyRound,
  Unlink,
} from "lucide-react";
import toast from "react-hot-toast";
import useStudentStore from "../../store/studentStore";
import useAttendanceStore from "../../store/attendanceStore";
import useFeeStore from "../../store/feeStore";
import useAuthStore from "../../store/authStore";
import axios from "../../lib/axios";
import LogoutButton from "../../components/common/LogoutButton";

// ── Info row helper ────────────────────────────────────────────────────────────
const InfoRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-center py-2.5 border-b last:border-b-0">
    <span className="text-sm font-medium text-gray-500 sm:w-40 flex-shrink-0">
      {label}
    </span>
    <span className="text-sm text-gray-900 mt-0.5 sm:mt-0">{value || "—"}</span>
  </div>
);

// ── Section card helper ────────────────────────────────────────────────────────
const Section = ({ icon: Icon, title, children }) => (
  <div className="card">
    <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b">
      <Icon className="w-5 h-5 text-primary-600" />
      {title}
    </h3>
    {children}
  </div>
);

// ── Main Component ─────────────────────────────────────────────────────────────
const StudentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    currentStudent: student,
    isLoading,
    error,
    fetchStudent,
    deleteStudent,
    clearError,
    createParentAccount,
    checkEmailAvailability,
    resetParentPassword,
    unlinkParentAccount,
  } = useStudentStore();
  const { studentAttendance, fetchStudentAttendance } = useAttendanceStore();
  const { currentStudentFee, fetchStudentFees } = useFeeStore();
  const [showParentModal, setShowParentModal] = useState(false);
  const [isParentSubmitting, setIsParentSubmitting] = useState(false);
  const [parentForm, setParentForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [parentErrors, setParentErrors] = useState({});
  const [emailAvailability, setEmailAvailability] = useState({
    status: "idle", // idle | checking | available | taken | error
    message: "",
    canRelink: false,
    canLinkExistingActiveParent: false,
  });
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isUnlinkingParent, setIsUnlinkingParent] = useState(false);
  const [showStudentLoginModal, setShowStudentLoginModal] = useState(false);
  const [showStudentResetModal, setShowStudentResetModal] = useState(false);
  const [studentLoginForm, setStudentLoginForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [studentResetPassword, setStudentResetPassword] = useState("");
  const [isStudentLoginSubmitting, setIsStudentLoginSubmitting] = useState(false);
  const [isStudentResetting, setIsStudentResetting] = useState(false);
  const [isStudentUnlinking, setIsStudentUnlinking] = useState(false);

  useEffect(() => {
    if (id) {
      fetchStudent(id);
      fetchStudentAttendance(id);
      if (user?.role === "admin") {
        fetchStudentFees(id);
      }
    }
    return () => clearError();
  }, [id, user?.role]);

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this student?"))
      return;
    const result = await deleteStudent(id);
    if (result.success) {
      toast.success("Student deleted successfully");
      navigate("/students");
    } else {
      toast.error(result.error || "Failed to delete student");
    }
  };

  const openParentModal = () => {
    setParentErrors({});
    setParentForm({
      name: student?.guardianInfo?.name || "",
      email: "",
      phone: student?.guardianInfo?.phone || "",
      password: "",
    });
    setShowParentModal(true);
    setEmailAvailability({
      status: "idle",
      message: "",
      canRelink: false,
      canLinkExistingActiveParent: false,
    });
  };

  const closeParentModal = () => {
    if (isParentSubmitting) return;
    setShowParentModal(false);
  };

  const submitParentAccount = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!parentForm.name.trim()) nextErrors.name = "Parent name is required";
    const email = parentForm.email.trim().toLowerCase();
    if (!email) nextErrors.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(email)) nextErrors.email = "Enter a valid email";

    let emailResult = null;
    if (!nextErrors.email) {
      emailResult = await checkEmailAvailability(email);
      if (!emailResult.success) {
        nextErrors.email = emailResult.error || "Unable to validate email";
      } else if (!emailResult.available) {
        nextErrors.email = "This email is already registered";
      }
    }

    const linkExistingActiveParent =
      !!emailResult?.success && !!emailResult.canLinkExistingActiveParent;
    const needsPassword = !linkExistingActiveParent;
    if (needsPassword) {
      if (!parentForm.password) nextErrors.password = "Password is required";
      else if (parentForm.password.length < 6) {
        nextErrors.password = "Password must be at least 6 characters";
      }
    }

    setParentErrors(nextErrors);

    if (emailResult?.success) {
      if (emailResult.canRelink) {
        setEmailAvailability({
          status: "available",
          message: "Inactive parent found. Account will be re-linked on submit.",
          canRelink: true,
          canLinkExistingActiveParent: false,
        });
      } else if (emailResult.canLinkExistingActiveParent) {
        setEmailAvailability({
          status: "available",
          message:
            "Parent account exists — submitting will link this student (no new account).",
          canRelink: false,
          canLinkExistingActiveParent: true,
        });
      } else if (emailResult.available) {
        setEmailAvailability({
          status: "available",
          message: "Email is available",
          canRelink: false,
          canLinkExistingActiveParent: false,
        });
      } else {
        setEmailAvailability({
          status: "taken",
          message: "Email already exists",
          canRelink: false,
          canLinkExistingActiveParent: false,
        });
      }
    }

    if (Object.keys(nextErrors).length > 0) return;

    if (linkExistingActiveParent) {
      setParentForm((prev) => ({ ...prev, password: "" }));
    }

    setIsParentSubmitting(true);
    const payload = {
      studentId: id,
      name: parentForm.name.trim(),
      email,
      phone: parentForm.phone.trim(),
    };
    if (needsPassword) payload.password = parentForm.password;
    const result = await createParentAccount(payload);
    setIsParentSubmitting(false);

    if (result.success) {
      toast.success(
        result.message || "Parent account created successfully",
      );
      setShowParentModal(false);
      await fetchStudent(id);
      return;
    }
    toast.error(result.error || "Failed to create parent account");
  };

  const handleEmailBlur = async () => {
    const email = parentForm.email.trim().toLowerCase();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailAvailability({
        status: "idle",
        message: "",
        canRelink: false,
        canLinkExistingActiveParent: false,
      });
      return;
    }

    setEmailAvailability({
      status: "checking",
      message: "Checking email...",
      canRelink: false,
      canLinkExistingActiveParent: false,
    });
    const result = await checkEmailAvailability(email);
    if (!result.success) {
      setEmailAvailability({
        status: "error",
        message: result.error || "Unable to validate email",
        canRelink: false,
        canLinkExistingActiveParent: false,
      });
      return;
    }
    if (result.canRelink) {
      setEmailAvailability({
        status: "available",
        message: "Inactive parent found. Account will be re-linked on submit.",
        canRelink: true,
        canLinkExistingActiveParent: false,
      });
      return;
    }
    if (result.canLinkExistingActiveParent) {
      setParentForm((prev) => ({ ...prev, password: "" }));
      setEmailAvailability({
        status: "available",
        message:
          "Parent account exists — submitting will link this student (no new account).",
        canRelink: false,
        canLinkExistingActiveParent: true,
      });
      return;
    }
    if (result.available) {
      setEmailAvailability({
        status: "available",
        message: "Email is available",
        canRelink: false,
        canLinkExistingActiveParent: false,
      });
    } else {
      setEmailAvailability({
        status: "taken",
        message: "Email already exists",
        canRelink: false,
        canLinkExistingActiveParent: false,
      });
    }
  };

  const openResetPasswordModal = () => {
    setResetPasswordValue("");
    setShowResetPasswordModal(true);
  };

  const closeResetPasswordModal = () => {
    if (isResettingPassword) return;
    setShowResetPasswordModal(false);
    setResetPasswordValue("");
  };

  const submitResetPassword = async (event) => {
    event.preventDefault();
    if (!resetPasswordValue || resetPasswordValue.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsResettingPassword(true);
    const result = await resetParentPassword(id, resetPasswordValue);
    setIsResettingPassword(false);
    if (result.success) {
      toast.success("Parent password reset successfully");
      setShowResetPasswordModal(false);
      setResetPasswordValue("");
      return;
    }
    toast.error(result.error || "Failed to reset password");
  };

  const handleUnlinkParent = async () => {
    if (
      !window.confirm(
        "Unlink this student from the parent account? If this parent has other linked children, their login will stay active.",
      )
    )
      return;
    setIsUnlinkingParent(true);
    const result = await unlinkParentAccount(id);
    setIsUnlinkingParent(false);
    if (result.success) {
      toast.success(
        result?.message || "Parent unlinked from this student successfully",
      );
      await fetchStudent(id);
      return;
    }
    toast.error(result.error || "Failed to unlink parent account");
  };

  const openStudentLoginModal = () => {
    setStudentLoginForm({
      name: fullName || "",
      email: student?.contactInfo?.email || "",
      phone: student?.contactInfo?.phone || "",
      password: "",
    });
    setShowStudentLoginModal(true);
  };

  const submitStudentLogin = async (event) => {
    event.preventDefault();
    if (!studentLoginForm.email || !/^\S+@\S+\.\S+$/.test(studentLoginForm.email)) {
      toast.error("Please enter a valid email");
      return;
    }
    if (!studentLoginForm.password || studentLoginForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsStudentLoginSubmitting(true);
    try {
      await axios.post("/auth/create-student-account", {
        studentId: id,
        name: studentLoginForm.name.trim(),
        email: studentLoginForm.email.trim().toLowerCase(),
        phone: studentLoginForm.phone.trim(),
        password: studentLoginForm.password,
      });
      toast.success("Student login account created successfully");
      setShowStudentLoginModal(false);
      await fetchStudent(id);
    } catch (err) {
      toast.error(err.message || "Failed to create student login");
    } finally {
      setIsStudentLoginSubmitting(false);
    }
  };

  const submitStudentResetPassword = async (event) => {
    event.preventDefault();
    if (!studentResetPassword || studentResetPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setIsStudentResetting(true);
    try {
      await axios.put(`/auth/students/${id}/password`, {
        newPassword: studentResetPassword,
      });
      toast.success("Student password reset successfully");
      setShowStudentResetModal(false);
      setStudentResetPassword("");
    } catch (err) {
      toast.error(err.message || "Failed to reset student password");
    } finally {
      setIsStudentResetting(false);
    }
  };

  const unlinkStudentLogin = async () => {
    if (!window.confirm("Unlink this student login? The account will be deactivated.")) return;
    setIsStudentUnlinking(true);
    try {
      const response = await axios.delete(`/auth/students/${id}`);
      toast.success(response?.message || "Student login unlinked successfully");
      await fetchStudent(id);
    } catch (err) {
      toast.error(err.message || "Failed to unlink student login");
    } finally {
      setIsStudentUnlinking(false);
    }
  };

  // ── Loading ──
  if (isLoading && !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
          <p className="mt-3 text-gray-500">Loading student details...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error || !student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Student Not Found
          </h2>
          <p className="text-gray-500 mb-6">
            {error || "The student record could not be loaded."}
          </p>
          <Link to="/students" className="btn-primary">
            ← Back to Students
          </Link>
        </div>
      </div>
    );
  }

  const fullName =
    `${student.personalInfo?.firstName || ""} ${student.personalInfo?.lastName || ""}`.trim();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Nav ── */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              ← Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {user?.schoolName}
              </h1>
              <p className="text-xs text-gray-500">Student Profile</p>
            </div>
          </div>
          <LogoutButton className="btn-secondary flex items-center gap-2" />
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* ── Page header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              to="/students"
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{fullName}</h2>
              <p className="text-gray-500 text-sm font-mono mt-0.5">
                #{student.admissionNumber}
              </p>
            </div>
          </div>
          {user?.role === "admin" && (
            <div className="flex gap-2 self-start sm:self-auto">
              <Link
                to={`/students/${id}/edit`}
                className="btn-secondary flex items-center gap-2"
              >
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

        {/* ── Status badge ── */}
        <div className="flex items-center gap-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              student.isActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {student.isActive ? "Active" : "Inactive"}
          </span>
          {(student.academicInfo?.classId?.name ||
            student.academicInfo?.class) && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800">
              {student.academicInfo.classId?.name || student.academicInfo.class}
              {(student.academicInfo.sectionId?.name ||
                student.academicInfo.section) &&
                ` - ${student.academicInfo.sectionId?.name || student.academicInfo.section}`}
            </span>
          )}
          {user?.role === "admin" && (
            <div className="flex items-center gap-2">
              {!student.parentId ? (
                <button
                  onClick={openParentModal}
                  className="btn-secondary inline-flex items-center gap-2 text-xs"
                >
                  <UserPlus className="w-4 h-4" />
                  Link parent account
                </button>
              ) : (
                <>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                    Parent Linked
                  </span>
                  {Array.isArray(student.siblingStudents) &&
                    student.siblingStudents.length > 0 && (
                      <span className="text-xs text-gray-600 max-w-md">
                        Also linked (siblings):{" "}
                        {student.siblingStudents.map((s, i) => (
                          <span key={s._id}>
                            {i > 0 ? ", " : ""}
                            <Link
                              to={`/students/${s._id}`}
                              className="text-primary-600 font-medium hover:underline"
                            >
                              {s.name}
                            </Link>
                            {s.admissionNumber
                              ? ` (${s.admissionNumber})`
                              : ""}
                          </span>
                        ))}
                      </span>
                    )}
                  <button
                    onClick={openResetPasswordModal}
                    className="btn-secondary inline-flex items-center gap-2 text-xs"
                  >
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </button>
                  <button
                    onClick={handleUnlinkParent}
                    disabled={isUnlinkingParent}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-2 text-xs disabled:opacity-60"
                  >
                    {isUnlinkingParent ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Unlink className="w-4 h-4" />
                    )}
                    Unlink Parent
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {user?.role === "admin" && (
          <div className="card">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b">
              <User className="w-5 h-5 text-primary-600" />
              Student Login Access
            </h3>
            {!student.userId ? (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600">
                  This student does not have a login account yet.
                </p>
                <button
                  type="button"
                  onClick={openStudentLoginModal}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Create Student Login
                </button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 w-fit">
                  Student Login Linked
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStudentResetModal(true)}
                    className="btn-secondary inline-flex items-center gap-2 text-sm"
                  >
                    <KeyRound className="w-4 h-4" />
                    Reset Password
                  </button>
                  <button
                    type="button"
                    onClick={unlinkStudentLogin}
                    disabled={isStudentUnlinking}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 inline-flex items-center gap-2 text-sm disabled:opacity-60"
                  >
                    {isStudentUnlinking ? (
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

        {/* ── Grid of info sections ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Info */}
          <Section icon={User} title="Personal Information">
            <InfoRow
              label="First Name"
              value={student.personalInfo?.firstName}
            />
            <InfoRow label="Last Name" value={student.personalInfo?.lastName} />
            <InfoRow
              label="Date of Birth"
              value={
                student.personalInfo?.dateOfBirth
                  ? new Date(
                      student.personalInfo.dateOfBirth,
                    ).toLocaleDateString()
                  : null
              }
            />
            <InfoRow label="Gender" value={student.personalInfo?.gender} />
            <InfoRow
              label="Blood Group"
              value={student.personalInfo?.bloodGroup}
            />
          </Section>

          {/* Academic Info */}
          <Section icon={BookOpen} title="Academic Information">
            <InfoRow label="Admission No." value={student.admissionNumber} />
            <InfoRow
              label="Class"
              value={
                student.academicInfo?.classId?.name ||
                student.academicInfo?.class
              }
            />
            <InfoRow
              label="Section"
              value={
                student.academicInfo?.sectionId?.name ||
                student.academicInfo?.section
              }
            />
            <InfoRow
              label="Roll Number"
              value={student.academicInfo?.rollNumber}
            />
            <InfoRow
              label="Admission Date"
              value={
                student.academicInfo?.admissionDate
                  ? new Date(
                      student.academicInfo.admissionDate,
                    ).toLocaleDateString()
                  : null
              }
            />
          </Section>

          {/* Contact Info */}
          <Section icon={Phone} title="Contact Information">
            <InfoRow label="Phone" value={student.contactInfo?.phone} />
            <InfoRow label="Email" value={student.contactInfo?.email} />
            <InfoRow label="Address" value={student.contactInfo?.address} />
          </Section>

          {/* Guardian Info */}
          <Section icon={Users} title="Guardian Information">
            <InfoRow label="Name" value={student.guardianInfo?.name} />
            <InfoRow
              label="Relationship"
              value={student.guardianInfo?.relationship}
            />
            <InfoRow label="Phone" value={student.guardianInfo?.phone} />
            <InfoRow label="Email" value={student.guardianInfo?.email} />
          </Section>
        </div>

        {/* ── Attendance Summary ── */}
        <div className="card">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-primary-600" />
              Attendance Summary
            </h3>
            <Link
              to={`/attendance/list`}
              className="text-sm font-medium text-primary-600 hover:text-primary-800"
            >
              View All →
            </Link>
          </div>
          {studentAttendance?.stats ? (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Percentage
                </p>
                <p
                  className={`text-xl font-bold ${
                    studentAttendance.stats.percentage >= 90
                      ? "text-green-600"
                      : studentAttendance.stats.percentage >= 75
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}
                >
                  {studentAttendance.stats.percentage}%
                </p>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
                  Total
                </p>
                <p className="text-xl font-bold text-gray-900">
                  {studentAttendance.stats.totalDays}
                </p>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-xs text-green-700 uppercase tracking-wider mb-1">
                  Present
                </p>
                <p className="text-xl font-bold text-green-700">
                  {studentAttendance.stats.present}
                </p>
              </div>
              <div className="bg-red-50 p-3 rounded-lg">
                <p className="text-xs text-red-700 uppercase tracking-wider mb-1">
                  Absent
                </p>
                <p className="text-xl font-bold text-red-700">
                  {studentAttendance.stats.absent}
                </p>
              </div>
              <div className="bg-yellow-50 p-3 rounded-lg">
                <p className="text-xs text-yellow-700 uppercase tracking-wider mb-1">
                  Late
                </p>
                <p className="text-xl font-bold text-yellow-700">
                  {studentAttendance.stats.late}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm text-center py-4">
              No attendance data available.
            </p>
          )}
        </div>

        {/* ── Exam Results Summary ── */}
        <div className="card">
          <div className="flex justify-between items-center mb-4 pb-3 border-b">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              Exam Results
            </h3>
            <div className="flex items-center gap-4">
              <Link
                to={`/students/${id}/results`}
                className="text-sm font-medium text-primary-600 hover:text-primary-800"
              >
                View Full Report →
              </Link>
              <Link
                to={`/students/${id}/report-card`}
                className="text-sm font-medium text-green-600 hover:text-green-800"
              >
                Report Card →
              </Link>
            </div>
          </div>
          <p className="text-gray-500 text-sm">
            Click 'View Full Report' to see individual subject marks, overall
            percentages, and rank for this student.
          </p>
        </div>

        {/* ── Fee Summary — school administrators only ── */}
        {user?.role === "admin" && (
          <div className="card">
            <div className="flex justify-between items-center mb-6 pb-3 border-b">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Financial Status
              </h3>
              <Link
                to={`/fees/student/${id}`}
                className="text-sm font-medium text-green-600 hover:text-green-800"
              >
                Billing Details →
              </Link>
            </div>

            {currentStudentFee?.summary ? (
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex-1 space-y-1">
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Outstanding Balance
                  </p>
                  <p
                    className={`text-4xl font-bold ${currentStudentFee.summary.totalOutstanding > 0 ? "text-red-600" : "text-green-600"}`}
                  >
                    Rs.{" "}
                    {currentStudentFee.summary.totalOutstanding.toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-12 border-l border-gray-100 pl-8">
                  <div>
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest mb-1">
                      Total Fee
                    </p>
                    <p className="text-xl font-bold text-gray-900 tracking-tight">
                      Rs. {currentStudentFee.summary.totalFees.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-widest mb-1 text-green-600">
                      Paid Amount
                    </p>
                    <p className="text-xl font-bold text-green-700 tracking-tight">
                      Rs. {currentStudentFee.summary.totalPaid.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm italic font-medium">
                No financial records found for the current session.
              </p>
            )}
          </div>
        )}

        {/* ── Timestamps ── */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4 pb-3 border-b">
            <Calendar className="w-5 h-5 text-primary-600" />
            Record Information
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InfoRow
              label="Created At"
              value={
                student.createdAt
                  ? new Date(student.createdAt).toLocaleString()
                  : null
              }
            />
            <InfoRow
              label="Last Updated"
              value={
                student.updatedAt
                  ? new Date(student.updatedAt).toLocaleString()
                  : null
              }
            />
          </div>
        </div>
      </div>

      {showParentModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Create / link parent login
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Create a new parent account or link an existing one (e.g. siblings)
                to {fullName}.
              </p>
            </div>

            <form onSubmit={submitParentAccount} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Parent Name *
                </label>
                <input
                  type="text"
                  className={`input-field ${parentErrors.name ? "border-red-500" : ""}`}
                  value={parentForm.name}
                  onChange={(e) =>
                    setParentForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                {parentErrors.name && (
                  <p className="text-xs text-red-500 mt-1">
                    {parentErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Parent Email *
                </label>
                <input
                  type="email"
                  className={`input-field ${parentErrors.email ? "border-red-500" : ""}`}
                  value={parentForm.email}
                  onChange={(e) => {
                    setParentForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }));
                    setEmailAvailability({
                      status: "idle",
                      message: "",
                      canRelink: false,
                      canLinkExistingActiveParent: false,
                    });
                  }}
                  onBlur={handleEmailBlur}
                />
                {parentErrors.email && (
                  <p className="text-xs text-red-500 mt-1">
                    {parentErrors.email}
                  </p>
                )}
                {!parentErrors.email && emailAvailability.status !== "idle" && (
                  <p
                    className={`text-xs mt-1 ${
                      emailAvailability.status === "available"
                        ? "text-green-600"
                        : emailAvailability.status === "checking"
                          ? "text-gray-500"
                          : "text-red-500"
                    }`}
                  >
                    {emailAvailability.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Parent Phone
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={parentForm.phone}
                  onChange={(e) =>
                    setParentForm((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password {emailAvailability.canLinkExistingActiveParent ? "" : "*"}
                </label>
                {emailAvailability.canLinkExistingActiveParent ? (
                  <p className="text-xs text-gray-500 mb-1.5">
                    Not required — an account with this email already exists; submit will
                    only link this student.
                  </p>
                ) : null}
                <input
                  type="password"
                  className={`input-field ${parentErrors.password ? "border-red-500" : ""} ${emailAvailability.canLinkExistingActiveParent ? "opacity-60 bg-gray-50 cursor-not-allowed" : ""}`}
                  value={parentForm.password}
                  onChange={(e) =>
                    setParentForm((prev) => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  disabled={emailAvailability.canLinkExistingActiveParent}
                  autoComplete="new-password"
                />
                {parentErrors.password && (
                  <p className="text-xs text-red-500 mt-1">
                    {parentErrors.password}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="submit"
                  disabled={isParentSubmitting}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {isParentSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {emailAvailability.canLinkExistingActiveParent
                    ? "Link parent to student"
                    : "Create parent account"}
                </button>
                <button
                  type="button"
                  onClick={closeParentModal}
                  className="btn-secondary"
                >
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
              <h3 className="text-lg font-semibold text-gray-900">
                Reset Parent Password
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Set a new password for the linked parent account.
              </p>
            </div>
            <form onSubmit={submitResetPassword} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password *
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="submit"
                  disabled={isResettingPassword}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {isResettingPassword ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={closeResetPasswordModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStudentLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Create Student Login
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Create a login account linked to this student profile.
              </p>
            </div>
            <form onSubmit={submitStudentLogin} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={studentLoginForm.name}
                  onChange={(e) =>
                    setStudentLoginForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  className="input-field"
                  value={studentLoginForm.email}
                  onChange={(e) =>
                    setStudentLoginForm((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Phone
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={studentLoginForm.phone}
                  onChange={(e) =>
                    setStudentLoginForm((prev) => ({ ...prev, phone: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={studentLoginForm.password}
                  onChange={(e) =>
                    setStudentLoginForm((prev) => ({ ...prev, password: e.target.value }))
                  }
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="submit"
                  disabled={isStudentLoginSubmitting}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {isStudentLoginSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Create Login
                </button>
                <button
                  type="button"
                  onClick={() => setShowStudentLoginModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStudentResetModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">
                Reset Student Password
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Set a new password for this student account.
              </p>
            </div>
            <form onSubmit={submitStudentResetPassword} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  New Password *
                </label>
                <input
                  type="password"
                  className="input-field"
                  value={studentResetPassword}
                  onChange={(e) => setStudentResetPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                />
              </div>
              <div className="pt-3 border-t border-gray-100 flex gap-3">
                <button
                  type="submit"
                  disabled={isStudentResetting}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  {isStudentResetting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Reset Password
                </button>
                <button
                  type="button"
                  onClick={() => setShowStudentResetModal(false)}
                  className="btn-secondary"
                >
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

export default StudentDetail;
