import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  BarChart2,
  Loader2,
  Lock,
  Mail,
  User,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Users,
  UserCheck,
  LogIn,
  UserPlus,
  X,
} from "lucide-react";
import clsx from "clsx";
import type { UserRole } from "../types";

// ─── Toast System ────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

let toastIdCounter = 0;

const ToastContainer: React.FC<{
  toasts: Toast[];
  onRemove: (id: number) => void;
}> = ({ toasts, onRemove }) => (
  <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
    {toasts.map((toast) => (
      <div
        key={toast.id}
        className={clsx(
          "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border backdrop-blur-sm",
          "min-w-[280px] max-w-[360px] animate-slide-in-right",
          toast.type === "success" &&
            "bg-emerald-50 border-emerald-200 text-emerald-800",
          toast.type === "error" && "bg-red-50 border-red-200 text-red-800",
          toast.type === "info" && "bg-blue-50 border-blue-200 text-blue-800",
        )}
      >
        <div className="flex-shrink-0 mt-0.5">
          {toast.type === "success" && (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          )}
          {toast.type === "error" && (
            <XCircle className="w-5 h-5 text-red-500" />
          )}
          {toast.type === "info" && (
            <AlertCircle className="w-5 h-5 text-blue-500" />
          )}
        </div>
        <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

// ─── Role Selector ────────────────────────────────────────────────────────────
const ROLES: { value: UserRole; label: string; icon: React.FC<{ className?: string }>; color: string; bg: string; border: string }[] = [
  {
    value: "Admin",
    label: "Admin",
    icon: Shield,
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-400",
  },
  {
    value: "HR",
    label: "HR",
    icon: Users,
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-400",
  },
  {
    value: "Employee",
    label: "Employee",
    icon: UserCheck,
    color: "text-sky-700",
    bg: "bg-sky-50",
    border: "border-sky-400",
  },
];

// ─── Main Login Page ──────────────────────────────────────────────────────────
const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState<UserRole>("HR");
  const [mode, setMode] = useState<"login" | "signup">("login");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toast state
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++toastIdCounter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => removeToast(id), 4500);
    },
    [removeToast],
  );

  // When role changes away from Admin, lock to login mode
  useEffect(() => {
    if (selectedRole !== "Admin" && mode === "signup") {
      setMode("login");
    }
  }, [selectedRole, mode]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setName("");
    setEmail("");
    setPassword("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup" && !name.trim()) {
      showToast("Please enter your full name.", "error");
      return;
    }
    if (!email.trim() || !password.trim()) {
      showToast("Please fill in all fields.", "error");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      showToast("Password must be at least 6 characters.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "signup") {
        await register(name, email, password, selectedRole);
        showToast(`Welcome, ${name}! Admin account created.`, "success");
      } else {
        await login(email, password, selectedRole);
        showToast(`Welcome back! Signed in as ${selectedRole}.`, "success");
      }
      setTimeout(() => navigate("/dashboard"), 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      showToast(msg, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRole = ROLES.find((r) => r.value === selectedRole)!;

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      <div className="min-h-screen flex bg-white font-sans">
        {/* ── Left / Form Panel ───────────────────────────────────── */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white z-10">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2 text-indigo-600 mb-10">
              <BarChart2 className="w-8 h-8" />
              <span className="font-bold text-xl tracking-tight">RIP AI</span>
            </div>

            <div className="mb-8">
              <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                {mode === "login" ? "Welcome back" : "Create Admin Account"}
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {mode === "login"
                  ? "Select your role and sign in to continue."
                  : "Set up the first Administrator account."}
              </p>
            </div>

            {/* ── Role Selector Pill ─────────────────────────────── */}
            <div className="mb-7">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
                I am logging in as
              </p>
              <div className="flex gap-2">
                {ROLES.map((role) => {
                  const Icon = role.icon;
                  const isActive = selectedRole === role.value;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleRoleSelect(role.value)}
                      className={clsx(
                        "flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all duration-200",
                        isActive
                          ? `${role.bg} ${role.border} ${role.color} shadow-sm scale-[1.02]`
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-100",
                      )}
                    >
                      <Icon
                        className={clsx(
                          "w-5 h-5",
                          isActive ? role.color : "text-gray-400",
                        )}
                      />
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Login / Signup Tab (Admin only) ───────────────── */}
            {selectedRole === "Admin" && (
              <div className="flex gap-1 p-1 bg-gray-100 rounded-lg mb-7">
                {(["login", "signup"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMode(m)}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-md transition-all duration-200",
                      mode === m
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700",
                    )}
                  >
                    {m === "login" ? (
                      <LogIn className="w-4 h-4" />
                    ) : (
                      <UserPlus className="w-4 h-4" />
                    )}
                    {m === "login" ? "Sign In" : "Register"}
                  </button>
                ))}
              </div>
            )}

            {/* ── Form ──────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name field (signup mode only) */}
              {mode === "signup" && (
                <div className="animate-fade-in">
                  <label
                    htmlFor="name"
                    className="block text-sm font-semibold text-gray-700 mb-1"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="name"
                      type="text"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-700 mb-1"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-sm"
                    placeholder={
                      mode === "signup"
                        ? "Create a strong password"
                        : "Enter your password"
                    }
                  />
                </div>
              </div>

              {/* Role context hint */}
              <div
                className={clsx(
                  "flex items-center gap-2 text-xs rounded-lg px-3 py-2 border",
                  activeRole.bg,
                  activeRole.border.replace("border-", "border-"),
                  activeRole.color,
                )}
              >
                <activeRole.icon className="w-4 h-4 flex-shrink-0" />
                <span>
                  {selectedRole === "Admin" && mode === "signup"
                    ? "Creating the Administrator account. Full system access will be granted."
                    : selectedRole === "Admin"
                    ? "Admin access — full system control."
                    : selectedRole === "HR"
                    ? "HR access — manage candidates, drives, and employees."
                    : "Employee access — view shared candidates and refer new ones."}
                </span>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className={clsx(
                  "w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white transition-all",
                  isSubmitting
                    ? "bg-indigo-400 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
                )}
              >
                {isSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : mode === "signup" ? (
                  <>
                    <UserPlus className="w-4 h-4" />
                    Create Admin Account
                  </>
                ) : (
                  <>
                    Sign in as {selectedRole}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ── Right / Branding Panel ──────────────────────────────────── */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden justify-center items-center p-12">
          {/* Dynamic gradient based on role */}
          <div
            className={clsx(
              "absolute inset-0 transition-all duration-700",
              selectedRole === "Admin" && "bg-gradient-to-br from-purple-700 via-indigo-700 to-blue-800",
              selectedRole === "HR" && "bg-gradient-to-br from-indigo-700 via-blue-700 to-cyan-800",
              selectedRole === "Employee" && "bg-gradient-to-br from-sky-700 via-cyan-700 to-teal-800",
            )}
          >
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 bg-white -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-3xl opacity-20 bg-white translate-y-1/2 -translate-x-1/2" />
          </div>

          <div className="relative z-10 w-full max-w-md space-y-8">
            {/* Glassmorphism card */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 shadow-2xl text-white">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/20 rounded-lg">
                  <BarChart2 className="w-6 h-6 text-white" />
                </div>
                <span className="font-bold text-xl tracking-wide">RIP AI</span>
              </div>

              <h2 className="text-3xl font-bold leading-tight mb-3">
                {selectedRole === "Admin" && "System Control Panel"}
                {selectedRole === "HR" && "Recruitment Hub"}
                {selectedRole === "Employee" && "Your Candidate Portal"}
              </h2>
              <p className="text-white/80 text-sm leading-relaxed mb-8">
                {selectedRole === "Admin" &&
                  "Full access to manage users, drives, and all recruitment data across the platform."}
                {selectedRole === "HR" &&
                  "Create drives, manage candidates, share profiles, and collaborate with employees."}
                {selectedRole === "Employee" &&
                  "View candidates shared with you, refer new candidates, and approve or reject profiles."}
              </p>

              {/* Role permissions card */}
              <div className="bg-white/10 rounded-xl p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-white/60 mb-4">
                  {selectedRole} Permissions
                </p>
                {selectedRole === "Admin" &&
                  [
                    "Manage HR & Employee accounts",
                    "Full access to all features",
                    "View & edit all data",
                    "Recruitment drive management",
                  ].map((p) => (
                    <div key={p} className="flex items-center gap-2 text-sm text-white/90">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {p}
                    </div>
                  ))}
                {selectedRole === "HR" &&
                  [
                    "Create & manage employee accounts",
                    "Full candidate management",
                    "Share candidates with employees",
                    "Create recruitment drives",
                  ].map((p) => (
                    <div key={p} className="flex items-center gap-2 text-sm text-white/90">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {p}
                    </div>
                  ))}
                {selectedRole === "Employee" &&
                  [
                    "View shared candidates",
                    "Add & refer new candidates",
                    "Approve or reject profiles",
                    "Collaborate with HR",
                  ].map((p) => (
                    <div key={p} className="flex items-center gap-2 text-sm text-white/90">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      {p}
                    </div>
                  ))}
              </div>
            </div>

            {/* Pill badge */}
            <div className="flex justify-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-xs text-white/80 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Trusted by Modern HR Teams</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Keyframe animations (injected once) ──────────────────────── */}
      <style>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-right { animation: slide-in-right 0.3s ease both; }
        .animate-fade-in        { animation: fade-in 0.25s ease both; }
      `}</style>
    </>
  );
};

export default Login;
