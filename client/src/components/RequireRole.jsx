import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function RequireRole({ role, children }) {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (role && currentUser.role !== role) {
    return <Navigate to={currentUser.role === "admin" ? "/admin" : "/learn"} replace />;
  }
  return children;
}

export default RequireRole;
