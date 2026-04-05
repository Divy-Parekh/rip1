import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getCandidateById,
  deleteCandidate,
  updateCandidate,
} from "../services/storageService";
import { generateInterviewQuestions } from "../services/aiService";
import { apiClient } from "../services/apiClient";
import { Candidate, InterviewQuestion, ResumeData } from "../types";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Clock,
  FileText,
  Briefcase,
  GraduationCap,
  BrainCircuit,
  Layers,
  Trash2,
  Edit2,
  Save,
  X,
  Globe,
  History,
  ExternalLink,
  Loader2,
  AlertCircle,
} from "lucide-react";

import clsx from "clsx";
import { useNavigate } from "react-router-dom";
import DiffViewer from "../components/DiffViewer";

const Github = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
);

const Linkedin = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Twitter = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

type Experience = {
  role: string;
  company: string;
  duration: string;
  description: string;
};

type Project = {
  name: string;
  description: string;
  technologies: string[];
};

const tabs = [
  { id: "profile", label: "Profile View", icon: FileText },
  { id: "raw", label: "Raw Resume", icon: FileText },
  { id: "interview", label: "AI Interview", icon: BrainCircuit },
  { id: "compare", label: "Version Compare", icon: History },
] as const;
type TabId = (typeof tabs)[number]["id"];

import { API_BASE_URL } from "../services/apiConfig";

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | undefined>(undefined);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(
    null,
  );
  const [compareVersionId, setCompareVersionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<ResumeData | null>(null);

  const currentVersion =
    candidate?.versions.find((v) => v.versionId === selectedVersionId) ||
    candidate?.versions[0];
  const compareVersion = candidate?.versions.find(
    (v) => v.versionId === compareVersionId,
  );

  useEffect(() => {
    if (id) {
      setIsLoading(true);
      getCandidateById(id).then((c) => {
        setCandidate(c || undefined);
        if (c) {
          if (c.versions.length > 0) {
            setSelectedVersionId(c.versions[0].versionId);
          }
          if (c.versions.length > 1) {
            setCompareVersionId(c.versions[1].versionId);
          }
        }
      }).finally(() => {
        setIsLoading(false);
      });
    }
  }, [id]);

  useEffect(() => {
    // Cleanup preview URL on change/unmount
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  useEffect(() => {
    const fetchPreview = async () => {
      if (activeTab === "raw" && currentVersion?.fileId && !previewUrl) {
        setIsPreviewLoading(true);
        try {
          const res = await apiClient(`${API_BASE_URL}/api/candidate/download/${currentVersion.fileId}`);
          if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            setPreviewUrl(url);
          }
        } catch (err) {
          console.error("Preview fetch failed", err);
        } finally {
          setIsPreviewLoading(false);
        }
      }
    };

    fetchPreview();
  }, [activeTab, currentVersion?.fileId]);

  // Reset preview when version changes
  useEffect(() => {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }, [selectedVersionId]);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this candidate?")) {
      if (id) {
        await deleteCandidate(id);
        navigate("/candidates");
      }
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      setIsEditing(false);
      setEditData(null);
    } else if (candidate) {
      setEditData({ ...candidate.currentData });
      setIsEditing(true);
      setActiveTab("profile");
    }
  };

  const handleSave = async () => {
    if (candidate && editData) {
      const updatedCandidate: Candidate = {
        ...candidate,
        fullName: editData.fullName,
        email: editData.email,
        phone: editData.phone,
        updatedAt: new Date().toISOString(),
        currentData: editData,
      };
      await updateCandidate(updatedCandidate);
      setCandidate(updatedCandidate);
      setIsEditing(false);
      setEditData(null);
    }
  };

  const handleGenerateQuestions = async () => {
    if (!candidate) return;
    setLoadingQuestions(true);
    const qs = await generateInterviewQuestions(candidate);
    setQuestions(qs);
    setLoadingQuestions(false);
  };


  // Helper to format data for diff
  const formatList = (items: string[]) => items.map((i) => `• ${i}`).join("\n");
  const formatExperience = (exps: Experience[]) =>
    exps
      .map(
        (e: Experience) =>
          `${e.role} at ${e.company} (${e.duration})\n${e.description}`,
      )
      .join("\n\n-------------------\n\n");
  const formatProjects = (projs: Project[]) =>
    projs
      .map(
        (p: Project) =>
          `${p.name}\n${p.description}\nTech: ${p.technologies.join(", ")}`,
      )
      .join("\n\n-------------------\n\n");

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );

  if (!candidate)
    return <div className="p-8 text-center text-gray-500">Candidate not found</div>;

  const displayData = (isEditing && editData ? editData : currentVersion?.data) as ResumeData;
  const isViewingLatest =
    currentVersion?.versionId === candidate?.versions[0].versionId;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <Link
            to="/candidates"
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={displayData.fullName}
                onChange={(e) =>
                  setEditData((prev) =>
                    prev ? { ...prev, fullName: e.target.value } : null,
                  )
                }
                className="text-2xl font-bold text-gray-900 border border-gray-300 rounded p-1 w-full bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Full Name"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">
                {candidate.fullName}
              </h1>
            )}

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mt-1">
              <div className="flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {isEditing ? (
                  <input
                    value={displayData.email}
                    onChange={(e) =>
                      setEditData((prev) =>
                        prev ? { ...prev, email: e.target.value } : null,
                      )
                    }
                    className="border rounded px-2 py-0.5 bg-white text-gray-900 focus:border-indigo-500 outline-none"
                    placeholder="Email"
                  />
                ) : (
                  displayData.email
                )}
              </div>
              <div className="flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {isEditing ? (
                  <input
                    value={displayData.phone}
                    onChange={(e) =>
                      setEditData((prev) =>
                        prev ? { ...prev, phone: e.target.value } : null,
                      )
                    }
                    className="border rounded px-2 py-0.5 bg-white text-gray-900 focus:border-indigo-500 outline-none"
                    placeholder="Phone"
                  />
                ) : (
                  displayData.phone
                )}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {isEditing ? (
                  <input
                    value={displayData.location}
                    onChange={(e) =>
                      setEditData((prev) =>
                        prev ? { ...prev, location: e.target.value } : null,
                      )
                    }
                    className="border rounded px-2 py-0.5 bg-white text-gray-900 focus:border-indigo-500 outline-none"
                    placeholder="Location"
                  />
                ) : (
                  displayData.location
                )}
              </div>
            </div>

            {/* Social Links */}
            {!isEditing &&
              displayData.socialLinks &&
              displayData.socialLinks.length > 0 && (
                <div className="flex gap-3 mt-2">
                  {displayData.socialLinks.map((link, idx) => {
                    const platformStr = (link.platform || "").toLowerCase();
                    const urlStr = (link.url || "").toLowerCase();
                    let Icon: React.ElementType = Globe;
                    
                    if (platformStr.includes("github") || urlStr.includes("github")) Icon = Github;
                    else if (platformStr.includes("linkedin") || urlStr.includes("linkedin")) Icon = Linkedin;
                    else if (platformStr.includes("twitter") || platformStr === "x" || urlStr.includes("twitter") || urlStr.includes("x.com")) Icon = Twitter;
                    
                    return (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 transition-colors"
                        title={link.platform}
                      >
                        <Icon className="w-4 h-4" />
                      </a>
                    );
                  })}
                </div>
              )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-4 hidden sm:block">
            <span className="text-xs text-gray-500 block">Version History</span>
            <select
              className="text-sm border border-gray-200 rounded p-1 bg-white text-gray-900 outline-none focus:border-indigo-500"
              value={selectedVersionId || ""}
              onChange={(e) => setSelectedVersionId(e.target.value)}
              disabled={isEditing}
            >
              {candidate.versions.map((v, idx) => (
                <option key={v.versionId} value={v.versionId}>
                  v{candidate.versions.length - idx} -{" "}
                  {new Date(v.uploadedAt).toLocaleDateString()} ({v.uploadedBy})
                </option>
              ))}
            </select>
          </div>

          {isViewingLatest &&
            (isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg flex items-center gap-1 font-medium transition-colors"
                >
                  <Save className="w-5 h-5" /> Save
                </button>
                <button
                  onClick={handleEditToggle}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </>
            ) : (
              <button
                onClick={handleEditToggle}
                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Edit Info"
              >
                <Edit2 className="w-5 h-5" />
              </button>
            ))}

          <button
            onClick={handleDelete}
            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete Candidate"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !isEditing && setActiveTab(tab.id)}
              disabled={isEditing}
              className={clsx(
                "whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors flex items-center gap-2",
                activeTab === tab.id
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300",
                isEditing && "opacity-50 cursor-not-allowed",
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left / Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "profile" && (
            <>
              {/* Summary */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-400" /> Summary
                </h2>
                {isEditing ? (
                  <textarea
                    value={displayData.summary}
                    onChange={(e) =>
                      setEditData((prev) =>
                        prev ? { ...prev, summary: e.target.value } : null,
                      )
                    }
                    className="w-full h-32 border border-gray-300 rounded p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                ) : (
                  <p className="text-gray-600 leading-relaxed">
                    {displayData.summary || "No summary available."}
                  </p>
                )}
              </div>

              {/* Experience */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-gray-400" /> Work
                  Experience
                </h2>
                {isEditing && (
                  <p className="text-xs text-amber-600 mb-4 bg-amber-50 p-2 rounded">
                    Advanced editing (Experience/Projects) not available in
                    quick edit.
                  </p>
                )}

                <div className="relative border-l-2 border-gray-200 ml-3 space-y-8 pb-2">
                  {displayData.experience?.map((exp, idx) => (
                    <div key={idx} className="relative pl-8 group">
                      {/* Timeline Node */}
                      <div className="absolute -left-[17px] top-0 flex items-center justify-center w-9 h-9 rounded-full bg-white border-2 border-indigo-100 text-indigo-600 shadow-sm group-hover:border-indigo-500 group-hover:scale-110 transition-all">
                        <Clock className="w-4 h-4" />
                      </div>

                      {/* Content Card */}
                      <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                          <div>
                            <div className="font-bold text-gray-900 text-lg leading-tight">
                              {exp.role}
                            </div>
                            <div className="text-indigo-600 font-medium text-sm">
                              {exp.company}
                            </div>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 whitespace-nowrap">
                            {exp.duration}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                          {exp.description}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!displayData.experience ||
                    displayData.experience.length === 0) && (
                    <p className="pl-8 text-gray-500 italic">
                      No experience listed.
                    </p>
                  )}
                </div>
              </div>

              {/* Projects */}
              {displayData.projects && displayData.projects.length > 0 && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-gray-400" /> Projects
                  </h2>
                  <div className="grid gap-4">
                    {displayData.projects.map((proj, idx) => (
                      <div
                        key={idx}
                        className="border border-gray-100 rounded-lg p-4 hover:shadow-md transition-shadow bg-gray-50"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-indigo-700">
                            {proj.name}
                          </h3>
                          {proj.url && (
                            <a
                              href={proj.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-400 hover:text-indigo-600"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {proj.description}
                        </p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {proj.technologies?.map((t) => (
                            <span
                              key={t}
                              className="text-xs bg-white border border-gray-200 px-2 py-1 rounded text-gray-600"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "raw" && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[700px]">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30 rounded-t-xl">
                <h2 className="text-lg font-semibold text-gray-900">
                  {currentVersion?.fileId ? "Resume Preview" : "Raw Resume Text"}
                </h2>
              </div>
              
              <div className="flex-1 w-full bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden rounded-b-xl">
                {currentVersion.fileId ? (
                   previewUrl ? (
                    <iframe 
                      src={previewUrl} 
                      className="w-full h-full border-none"
                      title="PDF Preview"
                    />
                   ) : isPreviewLoading ? (
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-sm">Loading PDF Preview...</p>
                    </div>
                   ) : (
                    <div className="text-gray-400 text-center p-8">
                       <AlertCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                       <p>Failed to load PDF preview.</p>
                    </div>
                   )
                ) : (
                  <pre className="w-full h-full p-6 whitespace-pre-wrap text-sm text-gray-700 font-mono bg-white overflow-y-auto">
                    {currentVersion.rawText || "No raw text available."}
                  </pre>
                )}
              </div>
            </div>
          )}

          {activeTab === "compare" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Compare Versions
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    Comparing Current (v
                    {candidate.versions.findIndex(
                      (v) => v.versionId === selectedVersionId,
                    ) === -1
                      ? candidate.versions.length
                      : candidate.versions.length -
                        candidate.versions.findIndex(
                          (v) => v.versionId === selectedVersionId,
                        )}
                    ) against:
                  </span>
                  <select
                    className="text-sm border border-gray-300 rounded p-1.5 bg-white text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={compareVersionId || ""}
                    onChange={(e) => setCompareVersionId(e.target.value)}
                  >
                    <option value="" disabled>
                      Select version
                    </option>
                    {candidate.versions
                      .filter((v) => v.versionId !== selectedVersionId)
                      .map((v) => (
                        <option key={v.versionId} value={v.versionId}>
                          v
                          {candidate.versions.length -
                            candidate.versions.findIndex(
                              (x) => x.versionId === v.versionId,
                            )}{" "}
                          - {new Date(v.uploadedAt).toLocaleDateString()}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {compareVersion ? (
                <div className="space-y-6">
                  <DiffViewer
                    title="Skills Changes"
                    oldText={formatList(compareVersion.data.skills || [])}
                    newText={formatList(currentVersion.data.skills || [])}
                  />
                  <DiffViewer
                    title="Experience Changes"
                    oldText={formatExperience(
                      compareVersion.data.experience || [],
                    )}
                    newText={formatExperience(
                      currentVersion.data.experience || [],
                    )}
                  />
                  <DiffViewer
                    title="Projects Changes"
                    oldText={formatProjects(compareVersion.data.projects || [])}
                    newText={formatProjects(currentVersion.data.projects || [])}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                  <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select a version to compare changes.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "interview" && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-600" /> AI
                  Interview Generator
                </h2>
                <button
                  onClick={handleGenerateQuestions}
                  disabled={loadingQuestions}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {loadingQuestions ? "Generating..." : "Generate Questions"}
                </button>
              </div>

              {questions.length === 0 && !loadingQuestions && (
                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-100 rounded-xl">
                  <p>
                    Click generate to create tailored interview questions based
                    on this profile.
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {Array.isArray(questions) && questions.map((q, i) => (
                  <div
                    key={i}
                    className="border-l-4 border-indigo-500 pl-4 py-1 bg-indigo-50/30 p-4 rounded-r-lg"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                        {q.type}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 text-lg">
                      {q.question}
                    </h3>
                    <p className="text-sm text-gray-500 mt-2 italic flex gap-1">
                      <span className="font-semibold">Context:</span>{" "}
                      {q.context}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Skills */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Skills</h3>
            {isEditing ? (
              <textarea
                value={displayData.skills.join(", ")}
                onChange={(e) =>
                  setEditData((prev) =>
                    prev
                      ? {
                          ...prev,
                          skills: e.target.value
                            .split(",")
                            .map((s) => s.trim())
                            .filter(Boolean),
                        }
                      : null,
                  )
                }
                className="w-full h-32 border border-gray-300 rounded p-3 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                placeholder="Java, Python, React..."
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {displayData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Education
            </h3>
            <div className="space-y-4">
              {displayData.education?.map((edu, idx) => (
                <div
                  key={idx}
                  className="text-sm border-l-2 border-gray-100 pl-3"
                >
                  <div className="font-medium text-gray-900">
                    {edu.institution}
                  </div>
                  <div className="text-gray-600">{edu.degree}</div>
                  <div className="text-gray-400 text-xs">{edu.year}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-sm space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Total Experience</span>
              <span className="font-medium text-gray-900">
                {displayData.totalExperienceYears || 0} Years
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Last Updated</span>
              <span className="font-medium text-gray-900">
                {new Date(candidate.updatedAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="text-gray-500">Profile ID</span>
              <span className="font-mono text-xs text-gray-400">
                {candidate.id.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;
