import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Candidate } from "../types";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  ChevronRight,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  Share2,
  X,
  Users,
  Loader2,
  AlertCircle,
  Megaphone,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../services/apiConfig";

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

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: Candidate["status"] }> = ({ status }) => (
  <span className={clsx(
    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold",
    status === "Approved" && "bg-emerald-100 text-emerald-700",
    status === "Rejected" && "bg-red-100 text-red-700",
    status === "Pending" && "bg-amber-100 text-amber-700",
  )}>
    {status === "Approved" && <CheckCircle2 className="w-3 h-3" />}
    {status === "Rejected" && <XCircle className="w-3 h-3" />}
    {status === "Pending" && <Clock className="w-3 h-3" />}
    {status}
  </span>
);

// ─── Share Modal ──────────────────────────────────────────────────────────────
interface EmployeeUser { id: string; _id?: string; name: string; email: string }
const ShareModal: React.FC<{
  candidateName: string;
  candidateId: string;
  onClose: () => void;
  show: (msg: string, type: ToastType) => void;
}> = ({ candidateName, candidateId, onClose, show }) => {
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("rip_token");
    fetch(`${API_BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: EmployeeUser[]) => setEmployees(data.filter((u) => u.id || u._id)))
      .catch(() => show("Failed to load employees.", "error"))
      .finally(() => setLoading(false));
  }, [show]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleShare = async () => {
    if (selected.size === 0) { show("Select at least one employee.", "error"); return; }
    setSharing(true);
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/candidate/share/${candidateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employeeIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error();
      show(`"${candidateName}" shared with ${selected.size} employee(s).`, "success");
      onClose();
    } catch {
      show("Failed to share candidate.", "error");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" style={{ animation: "fadeSlideUp 0.25s ease both" }}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Share Candidate</h2>
              <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">{candidateName}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
          ) : employees.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No employees found.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {employees.map((emp) => {
                const id = emp.id || emp._id || "";
                const isSelected = selected.has(id);
                return (
                  <label key={id}
                    className={clsx(
                      "flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all",
                      isSelected ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-gray-200 bg-gray-50",
                    )}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggle(id)} className="sr-only" />
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 font-bold text-sm flex-shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{emp.name}</p>
                      <p className="text-xs text-gray-500 truncate">{emp.email}</p>
                    </div>
                    <div className={clsx(
                      "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all",
                      isSelected ? "bg-indigo-600" : "border-2 border-gray-300",
                    )}>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <div className="flex gap-3 mt-5">
            <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button onClick={handleShare} disabled={sharing || selected.size === 0}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-60">
              {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Share2 className="w-4 h-4" />Share with {selected.size || ""} {selected.size === 1 ? "Employee" : "Employees"}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { toasts, show, remove } = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [minExp, setMinExp] = useState(0);
  const [statusFilter, setStatusFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");
  const driveId = searchParams.get("driveId");
  const [shareTarget, setShareTarget] = useState<{ id: string; name: string } | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [sharingToHRId, setSharingToHRId] = useState<string | null>(null);

  const fetchCandidates = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("rip_token");
      let url = `${API_BASE_URL}/api/candidate/all`;
      if (driveId) url += `?driveId=${driveId}`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCandidates(data);
    } catch {
      show("Failed to load candidates.", "error");
    } finally {
      setIsLoading(false);
    }
  }, [show, driveId]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates, driveId]);

  const clearDriveFilter = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("driveId");
    setSearchParams(nextParams);
  };

  const handleStatusUpdate = async (candidateId: string, status: "Approved" | "Rejected") => {
    setUpdatingStatus(candidateId);
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/candidate/status/${candidateId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setCandidates((prev) => prev.map((c) => (c.id === candidateId || c._id === candidateId ? { ...c, status } : c)));
      show(`Candidate ${status.toLowerCase()}.`, status === "Approved" ? "success" : "info");
    } catch {
      show("Failed to update status.", "error");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleShareToHR = async (candidateId: string) => {
    setSharingToHRId(candidateId);
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/candidate/share-hr/${candidateId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setCandidates((prev) => prev.map((c) => (c.id === candidateId || c._id === candidateId ? { ...c, isSharedWithHR: true } : c)));
      show("Candidate shared with HR team.", "success");
    } catch {
      show("Failed to share with HR.", "error");
    } finally {
      setSharingToHRId(null);
    }
  };

  const filteredCandidates = useMemo(() => {
    const queryParts = searchQuery.toLowerCase().split(" ").filter(Boolean);
    return candidates
      .map((c) => {
        const skills = c.currentData.skills.map((s) => s.toLowerCase());
        const matches = queryParts.filter((part) => skills.some((s) => s.includes(part)));
        const expScore = Math.min((c.currentData.totalExperienceYears || 0) * 5, 30);
        const totalScore = queryParts.length > 0 ? (matches.length / queryParts.length) * 50 + expScore + 20 : 0;
        return { ...c, matchScore: totalScore };
      })
      .filter((c) => {
        if (minExp > 0 && (c.currentData.totalExperienceYears || 0) < minExp) return false;
        if (statusFilter !== "All" && c.status !== statusFilter) return false;
        if (queryParts.length === 0) return true;
        return (c.matchScore || 0) > 0;
      })
      .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [candidates, searchQuery, minExp, statusFilter]);

  const isEmployee = user?.role === "Employee";
  const isHRorAdmin = user?.role === "HR" || user?.role === "Admin";

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={remove} />
      {shareTarget && (
        <ShareModal
          candidateName={shareTarget.name}
          candidateId={shareTarget.id}
          onClose={() => setShareTarget(null)}
          show={show}
        />
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
            <p className="text-gray-500 text-sm">
              {isEmployee ? "Candidates shared with you by HR." : "All candidates in the system."}
            </p>
          </div>
          <button onClick={() => navigate("/ingest")}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5">
            <UserPlus className="w-4 h-4" />
            Ingest Resume
          </button>
        </div>

        {/* Drive Filter Badge */}
        {driveId && (
          <div className="mb-6 flex items-center gap-3 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 text-indigo-700">
              <Megaphone className="w-4 h-4" />
              <span className="text-sm font-semibold">Filtering by Recruitment Drive</span>
            </div>
            <button 
              onClick={clearDriveFilter}
              className="ml-auto flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-indigo-200 text-xs font-bold text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"
            >
              <X className="w-3 h-3" />
              Clear Filter
            </button>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="Search by skills..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-white text-gray-900 transition-all text-sm"
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <SlidersHorizontal className="text-gray-400 w-5 h-5" />
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 bg-white text-gray-900"
              value={minExp} onChange={(e) => setMinExp(Number(e.target.value))}>
              <option value="0">Any Experience</option>
              <option value="1">1+ Years</option>
              <option value="3">3+ Years</option>
              <option value="5">5+ Years</option>
            </select>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            {(["All", "Pending", "Approved", "Rejected"] as const).map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={clsx(
                  "px-3 py-2 rounded-lg text-xs font-semibold transition-all border",
                  statusFilter === s
                    ? s === "All" ? "bg-gray-800 text-white border-gray-800"
                      : s === "Approved" ? "bg-emerald-600 text-white border-emerald-600"
                      : s === "Rejected" ? "bg-red-600 text-white border-red-600"
                      : "bg-amber-500 text-white border-amber-500"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300",
                )}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gray-50/80">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Candidate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Top Skills</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Exp.</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                {isEmployee && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>}
                {isHRorAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Share</th>}
                <th className="relative px-6 py-3"><span className="sr-only">Go</span></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
                      <p className="text-sm">Loading candidates…</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">
                      {isEmployee ? "No candidates have been shared with you yet." : "No candidates found."}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const cId = c.id || c._id || "";
                  const isUpdating = updatingStatus === cId;
                  return (
                    <tr key={cId} className="hover:bg-indigo-50/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/candidates/${cId}`)}>
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold group-hover:bg-indigo-200 transition-colors">
                            {c.fullName.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600">{c.fullName}</div>
                            <div className="text-xs text-gray-500">{c.email}</div>
                            {!isEmployee && c.referredBy && (
                              <span className="mt-0.5 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-purple-50 text-purple-600 font-medium">
                                Referred by {c.referredBy.name}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {c.currentData.skills.slice(0, 3).map((s) => (
                            <span key={s} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full border border-gray-200">{s}</span>
                          ))}
                          {c.currentData.skills.length > 3 && (
                            <span className="text-xs text-gray-400">+{c.currentData.skills.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {c.currentData.totalExperienceYears || 0} yrs
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={c.status} />
                      </td>

                      {/* Employee: share with HR OR approve/reject */}
                      {isEmployee && (
                        <td className="px-4 py-4">
                          <div className="flex gap-2">
                            {/* If they are the owner and not shared yet */}
                            {c.userId === (user?.id || (user as any)?._id) && !c.recruitmentDriveId && (
                              !c.isSharedWithHR ? (
                                <button onClick={() => handleShareToHR(cId)}
                                  disabled={sharingToHRId === cId}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50">
                                  {sharingToHRId === cId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
                                  Share with HR
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-100">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Shared with HR
                                </span>
                              )
                            )}

                            {/* Standard shared candidates actions */}
                            {c.userId !== (user?.id || (user as any)?._id) && (
                              <>
                                <button onClick={() => handleStatusUpdate(cId, "Approved")}
                                  disabled={isUpdating || c.status === "Approved"}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 transition-all disabled:opacity-40">
                                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                  Approve
                                </button>
                                <button onClick={() => handleStatusUpdate(cId, "Rejected")}
                                  disabled={isUpdating || c.status === "Rejected"}
                                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 transition-all disabled:opacity-40">
                                  {isUpdating ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}

                      {/* HR/Admin: share button */}
                      {isHRorAdmin && (
                        <td className="px-4 py-4">
                          <button onClick={() => setShareTarget({ id: cId, name: c.fullName })}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-100 transition-all">
                            <Share2 className="w-3.5 h-3.5" />
                            Share
                          </button>
                        </td>
                      )}

                      <td className="px-6 py-4 text-right" onClick={() => navigate(`/candidates/${cId}`)}>
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 ml-auto cursor-pointer" />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity:0; transform: translateX(40px); } to { opacity:1; transform: translateX(0); } }
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(20px) scale(0.97); } to { opacity:1; transform: translateY(0) scale(1); } }
      `}</style>
    </>
  );
};

export default CandidateList;
