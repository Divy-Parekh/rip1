import React, { useState, useEffect, useCallback } from "react";
import {
  Shield,
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  Mail,
  Lock,
  User,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronDown,
  Search,
  RefreshCw,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/apiConfig";
import type { UserRole } from "../types";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ManagedUser {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
interface Toast { id: number; message: string; type: ToastType }
let _toastId = 0;

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({
  toasts,
  onRemove,
}) => (
  <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
    {toasts.map((t) => (
      <div
        key={t.id}
        style={{ animation: "slideInRight 0.3s ease both" }}
        className={clsx(
          "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border min-w-[280px] max-w-[360px]",
          t.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-800",
          t.type === "error" && "bg-red-50 border-red-200 text-red-800",
          t.type === "info" && "bg-blue-50 border-blue-200 text-blue-800",
        )}
      >
        <div className="flex-shrink-0 mt-0.5">
          {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
          {t.type === "error" && <XCircle className="w-5 h-5 text-red-500" />}
          {t.type === "info" && <AlertCircle className="w-5 h-5 text-blue-500" />}
        </div>
        <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
        <button
          onClick={() => onRemove(t.id)}
          className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const show = useCallback(
    (message: string, type: ToastType = "info") => {
      const id = ++_toastId;
      setToasts((p) => [...p, { id, message, type }]);
      setTimeout(() => remove(id), 4500);
    },
    [remove],
  );
  return { toasts, show, remove };
};

// ─── Role Badge ───────────────────────────────────────────────────────────────
const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => (
  <span
    className={clsx(
      "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
      role === "Admin" && "bg-purple-100 text-purple-700",
      role === "HR" && "bg-indigo-100 text-indigo-700",
      role === "Employee" && "bg-sky-100 text-sky-700",
    )}
  >
    {role === "Admin" && <Shield className="w-3 h-3" />}
    {role === "HR" && <Users className="w-3 h-3" />}
    {role === "Employee" && <UserCheck className="w-3 h-3" />}
    {role}
  </span>
);

// ─── Create User Modal ────────────────────────────────────────────────────────
const CreateUserModal: React.FC<{
  creatorRole: UserRole;
  onClose: () => void;
  onCreated: (user: ManagedUser) => void;
  show: (msg: string, type: ToastType) => void;
}> = ({ creatorRole, onClose, onCreated, show }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(creatorRole === "Admin" ? "HR" : "Employee");
  const [submitting, setSubmitting] = useState(false);

  const allowedRoles: UserRole[] =
    creatorRole === "Admin" ? ["HR", "Employee"] : ["Employee"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      show("All fields are required.", "error");
      return;
    }
    if (password.length < 6) {
      show("Password must be at least 6 characters.", "error");
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create user");
      onCreated({ ...data.user, id: data.user.id || data.user._id });
      show(`${role} account for ${name} created successfully!`, "success");
      onClose();
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : "Error creating user", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "fadeSlideUp 0.25s ease both" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Create New Account</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {creatorRole === "Admin"
                  ? "Add an HR or Employee to the system"
                  : "Add an Employee to the system"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Role selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Account Role
            </label>
            <div className="flex gap-2">
              {allowedRoles.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={clsx(
                    "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border-2 text-sm font-semibold transition-all",
                    role === r
                      ? r === "HR"
                        ? "border-indigo-400 bg-indigo-50 text-indigo-700"
                        : "border-sky-400 bg-sky-50 text-sky-700"
                      : "border-gray-200 bg-gray-50 text-gray-500 hover:border-gray-300",
                  )}
                >
                  {r === "HR" ? <Users className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Temporary Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create Account
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { toasts, show, remove } = useToast();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<UserRole | "All">("All");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch users");
      const data: ManagedUser[] = await res.json();
      setUsers(data.map((u) => ({ ...u, id: u.id || (u._id as string) })));
    } catch {
      show("Failed to load users.", "error");
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}'s account? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Delete failed");
      setUsers((prev) => prev.filter((u) => u.id !== id));
      show(`${name}'s account has been deleted.`, "success");
    } catch {
      show("Failed to delete user.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "All" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    Admin: users.filter((u) => u.role === "Admin").length,
    HR: users.filter((u) => u.role === "HR").length,
    Employee: users.filter((u) => u.role === "Employee").length,
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />
      {showModal && user && (
        <CreateUserModal
          creatorRole={user.role}
          onClose={() => setShowModal(false)}
          onCreated={(u) => setUsers((prev) => [u, ...prev])}
          show={show}
        />
      )}

      <div className="max-w-5xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-600" />
              User Management
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {user?.role === "Admin"
                ? "Create and manage HR and Employee accounts."
                : "Create and manage Employee accounts."}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {(
            [
              { label: "Admins", key: "Admin", icon: Shield, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
              { label: "HR Members", key: "HR", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100" },
              { label: "Employees", key: "Employee", icon: UserCheck, color: "text-sky-600", bg: "bg-sky-50", border: "border-sky-100" },
            ] as const
          ).map(({ label, key, icon: Icon, color, bg, border }) => (
            <div
              key={key}
              className={clsx(
                "rounded-2xl border p-5 flex items-center gap-4",
                bg,
                border,
              )}
            >
              <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center bg-white shadow-sm", color)}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <div className={clsx("text-2xl font-extrabold", color)}>
                  {counts[key]}
                </div>
                <div className="text-xs font-medium text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | "All")}
              className="appearance-none pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="HR">HR</option>
              <option value="Employee">Employee</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>

          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <p className="text-sm text-gray-500">Loading users…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
              <Users className="w-10 h-10" />
              <p className="text-sm font-medium">
                {search || roleFilter !== "All"
                  ? "No users match your filters."
                  : "No users found. Add one to get started."}
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th className="text-left px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-4 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    Joined
                  </th>
                  {user?.role === "Admin" && (
                    <th className="text-right px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-gray-50/60 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={clsx(
                            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0",
                            u.role === "Admin" && "bg-purple-100 text-purple-700",
                            u.role === "HR" && "bg-indigo-100 text-indigo-700",
                            u.role === "Employee" && "bg-sky-100 text-sky-700",
                          )}
                        >
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{u.name}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-4 hidden sm:table-cell">
                      <span className="text-xs text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                    {user?.role === "Admin" && (
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDelete(u.id, u.name)}
                          disabled={deletingId === u.id || u.role === "Admin"}
                          title={
                            u.role === "Admin"
                              ? "Cannot delete admin accounts"
                              : "Delete user"
                          }
                          className={clsx(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                            u.role === "Admin"
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100",
                          )}
                        >
                          {deletingId === u.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          {deletingId === u.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <p className="text-xs text-gray-400 mt-4 text-center">
          Showing {filtered.length} of {users.length} users
        </p>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
};

export default AdminPanel;
