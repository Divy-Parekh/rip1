import React from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import ResumeIngest from "./pages/ResumeIngest";
import CandidateList from "./pages/CandidateList";
import CandidateDetail from "./pages/CandidateDetail";
import RoleMatch from "./pages/RoleMatch";
import Compare from "./pages/Compare";
import Login from "./pages/Login";
import AdminPanel from "./pages/AdminPanel";
import RecruitmentDrives from "./pages/RecruitmentDrives";
import PublicSubmissionForm from "./pages/PublicSubmissionForm";
import Unauthorized from "./pages/Unauthorized";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { RoleGuard } from "./components/RoleGuard";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/apply/:slug" element={<PublicSubmissionForm />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ingest" element={<ResumeIngest />} />
              <Route path="/candidates" element={<CandidateList />} />
              <Route path="/candidates/:id" element={<CandidateDetail />} />
              {/* Role Restricted Routes */}
              <Route path="/role-match" element={<RoleGuard allowedRoles={["Admin", "HR"]}><RoleMatch /></RoleGuard>} />
              <Route path="/compare" element={<RoleGuard allowedRoles={["Admin", "HR"]}><Compare /></RoleGuard>} />
              <Route path="/admin" element={<RoleGuard allowedRoles={["Admin", "HR"]}><AdminPanel /></RoleGuard>} />
              <Route path="/drives" element={<RoleGuard allowedRoles={["Admin", "HR"]}><RecruitmentDrives /></RoleGuard>} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
