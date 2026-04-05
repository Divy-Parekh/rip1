import React from "react";
import { Link } from "react-router-dom";
import { ShieldOff, ArrowLeft, Home } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Unauthorized: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-red-50 border-2 border-red-100 flex items-center justify-center">
            <ShieldOff className="w-12 h-12 text-red-400" />
          </div>
        </div>

        {/* Code */}
        <p className="text-8xl font-black text-gray-100 select-none mb-2">403</p>

        {/* Message */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Access Denied</h1>
        <p className="text-gray-500 mb-2">
          You don't have permission to view this page.
        </p>
        {user && (
          <p className="text-sm text-gray-400 mb-8">
            Your current role is{" "}
            <span className="font-semibold text-indigo-600">{user.role}</span>.
            Contact your Admin if you need access.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
          <Link
            to="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
