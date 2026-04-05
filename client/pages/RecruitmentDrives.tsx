import React, { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Link as LinkIcon,
  Copy,
  Check,
  Loader2,
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Megaphone,
  Calendar,
  Users,
  Power,
  PowerOff,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/apiConfig";
import type { RecruitmentDrive } from "../types";

// ─── Toast ────────────────────────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
interface Toast { id: number; message: string; type: ToastType }
let _tid = 0;

const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: number) => void }> = ({ toasts, onRemove }) => (
  <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 pointer-events-none">
    {toasts.map((t) => (
      <div key={t.id} style={{ animation: "slideInRight 0.3s ease both" }}
        className={clsx(
          "pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl shadow-2xl border min-w-[280px] max-w-[360px]",
          t.type === "success" && "bg-emerald-50 border-emerald-200 text-emerald-800",
          t.type === "error" && "bg-red-50 border-red-200 text-red-800",
          t.type === "info" && "bg-blue-50 border-blue-200 text-blue-800",
        )}>
        {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />}
        {t.type === "error" && <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />}
        {t.type === "info" && <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />}
        <p className="flex-1 text-sm font-medium leading-snug">{t.message}</p>
        <button onClick={() => onRemove(t.id)} className="flex-shrink-0 opacity-50 hover:opacity-100"><X className="w-4 h-4" /></button>
      </div>
    ))}
  </div>
);

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: number) => setToasts((p) => p.filter((t) => t.id !== id)), []);
  const show = useCallback((message: string, type: ToastType = "info") => {
    const id = ++_tid;
    setToasts((p) => [...p, { id, message, type }]);
    setTimeout(() => remove(id), 4500);
  }, [remove]);
  return { toasts, show, remove };
};

// ─── Create Drive Modal ───────────────────────────────────────────────────────
const CreateDriveModal: React.FC<{
  onClose: () => void;
  onCreated: (drive: RecruitmentDrive) => void;
  show: (msg: string, type: ToastType) => void;
}> = ({ onClose, onCreated, show }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("rip_token");
    fetch(`${API_BASE_URL}/api/jobs/all`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setJobs(data))
      .catch(() => console.error("Failed to fetch jobs"));
  }, []);

  const toggleRole = (roleTitle: string) => {
    setSelectedRoles(prev => {
      const next = new Set(prev);
      next.has(roleTitle) ? next.delete(roleTitle) : next.add(roleTitle);
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { show("Title is required.", "error"); return; }
    setSubmitting(true);
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/drives`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title, description, availableRoles: Array.from(selectedRoles) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onCreated(data);
      show(`Drive "${title}" created!`, "success");
      onClose();
    } catch (err: unknown) {
      show(err instanceof Error ? err.message : "Failed to create drive", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: "fadeSlideUp 0.25s ease both" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Megaphone className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">New Recruitment Drive</h2>
              <p className="text-xs text-gray-500 mt-0.5">A unique shareable link will be generated</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Drive Title *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Software Engineer Hiring 2025"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description <span className="font-normal text-gray-400">(optional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description about this drive..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Available Roles</label>
            {jobs.length === 0 ? (
              <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                No roles defined in Role Match yet. Candidates will have to type roles manually.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {jobs.map((job) => {
                  const isSelected = selectedRoles.has(job.title);
                  return (
                    <button
                      key={job.id || job.title}
                      type="button"
                      onClick={() => toggleRole(job.title)}
                      className={clsx(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border",
                        isSelected
                          ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                          : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                      )}
                    >
                      {job.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" />Create Drive</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Drive Card ───────────────────────────────────────────────────────────────
const DriveCard: React.FC<{
  drive: RecruitmentDrive;
  onToggle: (slug: string) => void;
  onDelete: (slug: string, title: string) => void;
  show: (msg: string, type: ToastType) => void;
  deletingSlug: string | null;
}> = ({ drive, onToggle, onDelete, show, deletingSlug }) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const link = `${window.location.origin}${window.location.pathname.split("#")[0]}#/apply/${drive.slug}`;

  const copyLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      show("Link copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const creatorName = typeof drive.createdBy === "object" ? (drive.createdBy as any).name : "—";

  return (
    <div 
      onClick={() => navigate(`/candidates?driveId=${drive._id}`)}
      className={clsx(
        "bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all overflow-hidden cursor-pointer group",
        drive.isActive ? "border-gray-200" : "border-gray-100 opacity-70",
      )}
    >
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
              drive.isActive ? "bg-indigo-50" : "bg-gray-100",
            )}>
              <Megaphone className={clsx("w-5 h-5", drive.isActive ? "text-indigo-600" : "text-gray-400")} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{drive.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">By {creatorName}</p>
            </div>
          </div>
          <span className={clsx(
            "flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold",
            drive.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500",
          )}>
            {drive.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        {drive.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{drive.description}</p>
        )}

        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Calendar className="w-3.5 h-3.5" />
          {new Date(drive.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
        </div>
      </div>

      {/* Link Row */}
      <div className="px-5 pb-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5">
          <LinkIcon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
          <span className="flex-1 text-xs text-gray-500 truncate font-mono">/apply/{drive.slug}</span>
          <button
            onClick={copyLink}
            className="p-1.5 hover:bg-white rounded-lg transition-colors text-indigo-600"
            title="Copy Public Link"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Actions */}
      <div 
        className="px-5 py-4 bg-gray-50/50 border-t flex items-center justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => onToggle(drive.slug)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
               drive.isActive ? "bg-amber-50 text-amber-600 hover:bg-amber-100" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
            )}
          >
            {drive.isActive ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
            {drive.isActive ? "Deactivate" : "Activate"}
          </button>

          <button
            onClick={() => navigate(`/candidates?driveId=${drive._id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition-all"
          >
            <Users className="w-3.5 h-3.5" />
            View Candidates
          </button>
        </div>

        <button
          onClick={() => onDelete(drive.slug, drive.title)}
          disabled={deletingSlug === drive.slug}
          className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
          title="Delete Drive"
        >
          {deletingSlug === drive.slug ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const RecruitmentDrives: React.FC = () => {
  const { user } = useAuth();
  const { toasts, show, remove } = useToast();
  const [drives, setDrives] = useState<RecruitmentDrive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);

  const fetchDrives = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/drives`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDrives(data);
    } catch {
      show("Failed to load drives.", "error");
    } finally {
      setLoading(false);
    }
  }, [show]);

  useEffect(() => { fetchDrives(); }, [fetchDrives]);

  const handleToggle = async (slug: string) => {
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/drives/${slug}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const updated: RecruitmentDrive = await res.json();
      setDrives((prev) => prev.map((d) => (d.slug === slug ? updated : d)));
      show(`Drive ${updated.isActive ? "activated" : "deactivated"}.`, "info");
    } catch {
      show("Failed to toggle drive.", "error");
    }
  };

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`Delete drive "${title}"? This cannot be undone.`)) return;
    setDeletingSlug(slug);
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/drives/${slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setDrives((prev) => prev.filter((d) => d.slug !== slug));
      show(`Drive "${title}" deleted.`, "success");
    } catch {
      show("Failed to delete drive.", "error");
    } finally {
      setDeletingSlug(null);
    }
  };

  if (user?.role === "Employee") {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Megaphone className="w-10 h-10 mb-3 opacity-30" />
        <p className="font-medium">Recruitment drives are managed by HR.</p>
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />
      {showModal && (
        <CreateDriveModal
          onClose={() => setShowModal(false)}
          onCreated={(d) => setDrives((prev) => [d, ...prev])}
          show={show}
        />
      )}

      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
              <Megaphone className="w-6 h-6 text-indigo-600" />
              Recruitment Drives
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Create drives and share unique application links with candidates.
            </p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <Plus className="w-4 h-4" />
            New Drive
          </button>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
            <p className="text-3xl font-extrabold text-indigo-700">{drives.length}</p>
            <p className="text-sm text-indigo-500 font-medium">Total Drives</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <p className="text-3xl font-extrabold text-emerald-700">{drives.filter((d) => d.isActive).length}</p>
            <p className="text-sm text-emerald-500 font-medium">Active Drives</p>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm text-gray-500">Loading drives…</p>
          </div>
        ) : drives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200">
            <Megaphone className="w-12 h-12 opacity-30" />
            <div className="text-center">
              <p className="font-semibold text-gray-600">No drives yet</p>
              <p className="text-sm mt-1">Create your first recruitment drive to get a shareable link.</p>
            </div>
            <button onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
              <Plus className="w-4 h-4" /> Create Drive
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {drives.map((drive) => (
              <DriveCard key={drive._id} drive={drive} onToggle={handleToggle}
                onDelete={handleDelete} show={show} deletingSlug={deletingSlug} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity:0; transform: translateX(40px); } to { opacity:1; transform: translateX(0); } }
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(20px) scale(0.97); } to { opacity:1; transform: translateY(0) scale(1); } }
      `}</style>
    </>
  );
};

export default RecruitmentDrives;
