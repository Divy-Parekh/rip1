import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  BarChart2,
  User,
  Mail,
  Phone,
  Briefcase,
  CheckCircle2,
  Loader2,
  AlertCircle,
  FileText,
  Upload,
} from "lucide-react";
import clsx from "clsx";
import { API_BASE_URL } from "../services/apiConfig";

interface DriveInfo {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  createdBy: { name: string } | string;
  isActive: boolean;
  availableRoles: string[];
}

const PublicSubmissionForm: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [drive, setDrive] = useState<DriveInfo | null>(null);
  const [driveLoading, setDriveLoading] = useState(true);
  const [driveError, setDriveError] = useState("");

  // Form state
  const [roleApplying, setRoleApplying] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!slug) return;
    setDriveLoading(true);
    fetch(`${API_BASE_URL}/api/drives/public/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data._id) {
          setDrive(data);
          if (data.availableRoles && data.availableRoles.length > 0) {
            setRoleApplying(data.availableRoles[0]);
          } else {
            setRoleApplying("General Application");
          }
        }
        else setDriveError(data.message || "Drive not available.");
      })
      .catch(() => setDriveError("Unable to load the application form."))
      .finally(() => setDriveLoading(false));
  }, [slug]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowed = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
      if (!allowed.includes(file.type)) {
        setError("Only PDF or Word documents are allowed.");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be under 5 MB.");
        return;
      }
      setError("");
      setResumeFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) { setError("Please upload your resume to apply."); return; }
    setError("");
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("roleApplying", roleApplying);
      formData.append("resume", resumeFile);

      const res = await fetch(`${API_BASE_URL}/api/drives/public/${slug}/submit`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Submission failed");
      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (driveLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Error / not found
  if (driveError || !drive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-gray-900 mb-2">Drive Not Available</h2>
          <p className="text-gray-500 text-sm">{driveError || "This recruitment drive is inactive or doesn't exist."}</p>
        </div>
      </div>
    );
  }

  // Success
  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-sm w-full text-center" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-500 mb-2">
            Your application for <span className="font-medium text-gray-600">"{drive.title}"</span> has been received.
          </p>
          <p className="text-sm text-gray-400">
            Our AI will now extract your details from your resume, and the HR team will review it shortly.
          </p>
        </div>
      </div>
    );
  }

  const creatorName = typeof drive.createdBy === "object" ? drive.createdBy.name : "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-800 flex items-center justify-center p-4 py-12">
      {/* BG decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative w-full max-w-lg" style={{ animation: "fadeSlideUp 0.4s ease both" }}>
        {/* Brand header */}
        <div className="flex items-center gap-2 text-white mb-6 justify-center">
          <BarChart2 className="w-6 h-6 text-white" />
          <span className="font-bold text-lg tracking-tight">RIP AI</span>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Drive banner */}
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-5 text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-1">
              {creatorName ? `Posted by ${creatorName}` : "Recruitment Drive"}
            </p>
            <h1 className="text-xl font-bold">{drive.title}</h1>
            {drive.description && (
              <p className="text-indigo-100 text-sm mt-2 leading-relaxed">{drive.description}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h2 className="text-base font-bold text-gray-900">Application Details</h2>
              <p className="text-xs text-gray-500 mt-1">We'll automatically extract your name and contact info from your resume.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Role / Position Applying For</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <select
                  value={roleApplying}
                  onChange={(e) => setRoleApplying(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                >
                  {drive.availableRoles && drive.availableRoles.length > 0 ? (
                    drive.availableRoles.map((role: string) => (
                      <option key={role} value={role}>{role}</option>
                    ))
                  ) : (
                    <option value="General Application">General Application</option>
                  )}
                </select>
              </div>
            </div>

            {/* Resume upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Resume / CV</label>
              <label className={clsx(
                "flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-all",
                resumeFile ? "border-indigo-400 bg-indigo-50" : "border-gray-300 hover:border-indigo-300 hover:bg-indigo-50/30",
              )}>
                <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileChange} className="sr-only" />
                {resumeFile ? (
                  <div className="flex items-center gap-2 text-indigo-700">
                    <FileText className="w-5 h-5" />
                    <span className="text-sm font-semibold">{resumeFile.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Upload className="w-6 h-6" />
                    <span className="text-sm">Click to upload PDF or Word document</span>
                    <span className="text-xs">Max 5 MB</span>
                  </div>
                )}
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Submit Application</>}
            </button>
          </form>
        </div>

        <p className="text-center text-indigo-200 text-xs mt-4">
          Powered by RIP AI Â· Resume Intelligence Platform
        </p>
      </div>

      <style>{`
        @keyframes fadeSlideUp { from { opacity:0; transform: translateY(24px); } to { opacity:1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default PublicSubmissionForm;

