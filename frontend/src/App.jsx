import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import StudentList from './pages/students/StudentList';
import StudentForm from './pages/students/StudentForm';
import StudentDetail from './pages/students/StudentDetail';
import TeacherList from './pages/teachers/TeacherList';
import TeacherForm from './pages/teachers/TeacherForm';
import TeacherDetail from './pages/teachers/TeacherDetail';
import MarkAttendance from './pages/attendance/MarkAttendance';
import AttendanceList from './pages/attendance/AttendanceList';
import AttendanceReport from './pages/attendance/AttendanceReport';
import Plans from './pages/settings/Plans';
import Usage from './pages/settings/Usage';
import ChangePassword from './pages/settings/ChangePassword';
import AcademicSettings from './pages/academic/AcademicSettings';
import ExamList from './pages/exams/ExamList';
import ExamForm from './pages/exams/ExamForm';
import ExamResults from './pages/exams/ExamResults';
import ExamAnalytics from './pages/exams/ExamAnalytics';
import StudentResults from './pages/exams/StudentResults';
import FeeSettings from './pages/fees/FeeSettings';
import AssignFees from './pages/fees/AssignFees';
import StudentFeeList from './pages/fees/StudentFeeList';
import StudentFeeDetail from './pages/fees/StudentFeeDetail';
import PaymentReceipt from './pages/fees/PaymentReceipt';
import FeeReports from './pages/fees/FeeReports';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminOnlyRoute from './components/common/AdminOnlyRoute';
import SessionManager from './components/common/SessionManager';
import AnnouncementList from './pages/communication/AnnouncementList';
import AnnouncementDetail from './pages/communication/AnnouncementDetail';
import AnnouncementForm from './pages/communication/AnnouncementForm';
import MessageList from './pages/communication/MessageList';
import MessageDetail from './pages/communication/MessageDetail';
import ComposeMessage from './pages/communication/ComposeMessage';
import NotificationCenter from './pages/communication/NotificationCenter';
import TimeSlotSettings from './pages/timetable/TimeSlotSettings';
import TimetableEditor from './pages/timetable/TimetableEditor';
import TimetableView from './pages/timetable/TimetableView';
import TeacherTimetable from './pages/timetable/TeacherTimetable';
import ReportCard from './pages/reports/ReportCard';
import PromoteStudents from './pages/students/PromoteStudents';
import ParentDashboard from './pages/parent/ParentDashboard';
import StudentDashboard from './pages/student/StudentDashboard';
import LeaveList from './pages/leaves/LeaveList';
import LeaveForm from './pages/leaves/LeaveForm';
import EventCalendar from './pages/events/EventCalendar';
import EventForm from './pages/events/EventForm';
import PayrollList from './pages/payroll/PayrollList';
import SalarySlip from './pages/payroll/SalarySlip';
import DiaryList from './pages/diary/DiaryList';
import DiaryForm from './pages/diary/DiaryForm';
import DiaryView from './pages/diary/DiaryView';
import SuperAdminDashboard from './pages/superadmin/SuperAdminDashboard';
import SchoolList from './pages/superadmin/SchoolList';
import SchoolDetail from './pages/superadmin/SchoolDetail';

function App() {
  return (
    <BrowserRouter>
      <SessionManager />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <StudentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/new"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <StudentForm />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id"
          element={
            <ProtectedRoute>
              <StudentDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:id/edit"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <StudentForm />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/promote"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <PromoteStudents />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers"
          element={
            <ProtectedRoute>
              <TeacherList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers/new"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <TeacherForm />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers/:id"
          element={
            <ProtectedRoute>
              <TeacherDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teachers/:id/edit"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <TeacherForm />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance/mark"
          element={
            <ProtectedRoute>
              <MarkAttendance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance/list"
          element={
            <ProtectedRoute>
              <AttendanceList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance/report"
          element={
            <ProtectedRoute>
              <AttendanceReport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/plans"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <Plans />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/usage"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <Usage />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/password"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <ChangePassword />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/academic"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <AcademicSettings />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams"
          element={
            <ProtectedRoute>
              <ExamList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/new"
          element={
            <ProtectedRoute>
              <ExamForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:id"
          element={
            <ProtectedRoute>
              <ExamAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:id/edit"
          element={
            <ProtectedRoute>
              <ExamForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exams/:id/results"
          element={
            <ProtectedRoute>
              <ExamResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:studentId/results"
          element={
            <ProtectedRoute>
              <StudentResults />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students/:studentId/report-card"
          element={
            <ProtectedRoute>
              <ReportCard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/settings"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <FeeSettings />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/assign"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <AssignFees />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/students"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <StudentFeeList />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/student/:studentId"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <StudentFeeDetail />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/receipt/:paymentId"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <PaymentReceipt />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees/reports"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <FeeReports />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <AnnouncementList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements/new"
          element={
            <ProtectedRoute>
              <AnnouncementForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements/:id"
          element={
            <ProtectedRoute>
              <AnnouncementDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements/:id/edit"
          element={
            <ProtectedRoute>
              <AnnouncementForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <MessageList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/compose"
          element={
            <ProtectedRoute>
              <ComposeMessage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/messages/:id"
          element={
            <ProtectedRoute>
              <MessageDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timetable/slots"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <TimeSlotSettings />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/timetable/editor"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <TimetableEditor />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/timetable/view"
          element={
            <ProtectedRoute>
              <TimetableView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/timetable/teacher/:teacherId"
          element={
            <ProtectedRoute>
              <TeacherTimetable />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/parent/dashboard"
          element={
            <ProtectedRoute>
              <ParentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/dashboard"
          element={
            <ProtectedRoute>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaves"
          element={
            <ProtectedRoute>
              <LeaveList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaves/new"
          element={
            <ProtectedRoute>
              <LeaveForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute>
              <EventCalendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/events/new"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <EventForm />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <PayrollList />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/payroll/slip/:id"
          element={
            <ProtectedRoute>
              <AdminOnlyRoute>
                <SalarySlip />
              </AdminOnlyRoute>
            </ProtectedRoute>
          }
        />
        <Route
          path="/diary"
          element={
            <ProtectedRoute>
              <DiaryList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diary/new"
          element={
            <ProtectedRoute>
              <DiaryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diary/:id/edit"
          element={
            <ProtectedRoute>
              <DiaryForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/diary/view"
          element={
            <ProtectedRoute>
              <DiaryView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/dashboard"
          element={
            <ProtectedRoute>
              <SuperAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/schools"
          element={
            <ProtectedRoute>
              <SchoolList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/schools/:id"
          element={
            <ProtectedRoute>
              <SchoolDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
