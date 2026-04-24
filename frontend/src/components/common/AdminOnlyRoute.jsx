import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

function redirectForNonAdminRole(role) {
  if (role === "teacher") return "/dashboard";
  if (role === "parent") return "/parent/dashboard";
  if (role === "student") return "/student/dashboard";
  if (role === "superadmin") return "/superadmin/dashboard";
  return "/dashboard";
}

const AdminOnlyRoute = ({ children }) => {
  const { user } = useAuthStore();
  if (user?.role === "admin") {
    return children;
  }
  return <Navigate to={redirectForNonAdminRole(user?.role)} replace />;
};

export default AdminOnlyRoute;
