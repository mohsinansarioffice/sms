import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role === 'superadmin' && !location.pathname.startsWith('/superadmin')) {
    return <Navigate to="/superadmin/dashboard" replace />;
  }

  if (user?.role !== 'superadmin' && location.pathname.startsWith('/superadmin')) {
    const fallback = user?.role === 'parent'
      ? '/parent/dashboard'
      : user?.role === 'student'
        ? '/student/dashboard'
        : '/dashboard';
    return <Navigate to={fallback} replace />;
  }

  // Parents use a slim portal; allow these areas without redirecting to the dashboard.
  const parentAllowedPaths = ['/parent', '/diary', '/messages', '/notifications'];
  if (user?.role === 'parent' && !parentAllowedPaths.some((p) => location.pathname.startsWith(p))) {
    return <Navigate to="/parent/dashboard" replace />;
  }

  const studentAllowedPaths = ['/student', '/diary', '/messages', '/notifications', '/announcements', '/timetable'];
  if (user?.role === 'student' && !studentAllowedPaths.some((p) => location.pathname.startsWith(p))) {
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
