import { Route, Routes, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import RequireRole from "./components/RequireRole";

import Login from "./pages/Login";
import AdminHome from "./pages/AdminHome";
import AdminUsers from "./pages/AdminUsers";
import AdminAttempts from "./pages/AdminAttempts";
import AdminInfographics from "./pages/AdminInfographics";
import AdminPresentations from "./pages/AdminPresentations";
import Cards from "./pages/Cards";
import TestQuestions from "./pages/TestQuestions";

import LearnDashboard from "./pages/LearnDashboard";
import ChangePassword from "./pages/ChangePassword";
import LearnCards from "./pages/LearnCards";
import LearnTest from "./pages/LearnTest";
import LearnInfographics from "./pages/LearnInfographics";
import LearnPresentation from "./pages/LearnPresentation";

function Root() {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Navigate to={currentUser.role === "admin" ? "/admin" : "/learn"} replace />;
}

function Routing() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/admin"
        element={
          <RequireRole role="admin">
            <AdminHome />
          </RequireRole>
        }
      />
      <Route
        path="/admin/users"
        element={
          <RequireRole role="admin">
            <AdminUsers />
          </RequireRole>
        }
      />
      <Route
        path="/admin/attempts"
        element={
          <RequireRole role="admin">
            <AdminAttempts />
          </RequireRole>
        }
      />
      <Route
        path="/admin/cards"
        element={
          <RequireRole role="admin">
            <Cards />
          </RequireRole>
        }
      />
      <Route
        path="/admin/test-questions"
        element={
          <RequireRole role="admin">
            <TestQuestions />
          </RequireRole>
        }
      />
      <Route
        path="/admin/infographics"
        element={
          <RequireRole role="admin">
            <AdminInfographics />
          </RequireRole>
        }
      />
      <Route
        path="/admin/presentations"
        element={
          <RequireRole role="admin">
            <AdminPresentations />
          </RequireRole>
        }
      />

      <Route
        path="/learn"
        element={
          <RequireRole role="user">
            <LearnDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/learn/password"
        element={
          <RequireRole role="user">
            <ChangePassword />
          </RequireRole>
        }
      />
      <Route
        path="/learn/cards"
        element={
          <RequireRole role="user">
            <LearnCards />
          </RequireRole>
        }
      />
      <Route
        path="/learn/test"
        element={
          <RequireRole role="user">
            <LearnTest />
          </RequireRole>
        }
      />
      <Route
        path="/learn/infographics"
        element={
          <RequireRole role="user">
            <LearnInfographics />
          </RequireRole>
        }
      />
      <Route
        path="/learn/presentation"
        element={
          <RequireRole role="user">
            <LearnPresentation />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default Routing;
