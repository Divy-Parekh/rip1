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
import Register from "./pages/Register";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/ingest" element={<ResumeIngest />} />
              <Route path="/candidates" element={<CandidateList />} />
              <Route path="/candidates/:id" element={<CandidateDetail />} />
              <Route path="/role-match" element={<RoleMatch />} />
              <Route path="/compare" element={<Compare />} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
