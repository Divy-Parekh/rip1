import React, { useState, useEffect } from "react";
import { Share2, X, Users, CheckCircle2, Loader2 } from "lucide-react";
import clsx from "clsx";
import { API_BASE_URL } from "../services/apiConfig";

interface EmployeeUser { id: string; _id?: string; name: string; email: string; }

interface ShareModalProps {
  candidateName: string;
  candidateId: string;
  onClose: () => void;
  showToast: (msg: string, type: "success" | "error" | "info") => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ candidateName, candidateId, onClose, showToast }) => {
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("rip_token");
    fetch(`${API_BASE_URL}/api/users`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: EmployeeUser[]) => setEmployees(data.filter((u) => u.id || u._id)))
      .catch(() => showToast("Failed to load employees.", "error"))
      .finally(() => setLoading(false));
  }, [showToast]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleShare = async () => {
    if (selected.size === 0) { showToast("Select at least one employee.", "error"); return; }
    setSharing(true);
    try {
      const token = localStorage.getItem("rip_token");
      const res = await fetch(`${API_BASE_URL}/api/candidate/share/${candidateId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ employeeIds: Array.from(selected) }),
      });
      if (!res.ok) throw new Error();
      showToast(`"${candidateName}" shared with ${selected.size} employee(s).`, "success");
      onClose();
    } catch {
      showToast("Failed to share candidate.", "error");
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
