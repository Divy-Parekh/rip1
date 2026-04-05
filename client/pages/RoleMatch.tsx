import React, { useState, useEffect } from "react";
import {
  getCandidates,
  getJobRoles,
  addJobRole,
  deleteJobRole,
  updateJobRole,
} from "../services/storageService";
import { analyzeCandidateMatch, generateInterviewQuestions } from "../services/aiService";
import { Candidate, SavedJobRole, InterviewQuestion } from "../types";
import {
  Briefcase,
  CheckCircle,
  XCircle,
  Loader2,
  Check,
  X,
  ArrowRight,
  Plus,
  Trash2,
  ChevronLeft,
  Save,
  AlertCircle,
  Mail,
  BrainCircuit,
  Edit2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";

type ViewState = "list" | "create" | "analyze";

interface FormErrors {
  title?: string;
  skills?: string;
  experience?: string;
  description?: string;
}

const RoleMatch: React.FC = () => {
  const navigate = useNavigate();

  // State
  const [view, setView] = useState<ViewState>("list");
  const [savedRoles, setSavedRoles] = useState<SavedJobRole[]>([]);
  const [selectedRole, setSelectedRole] = useState<SavedJobRole | null>(null);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<
    Array<{
      candidate: Candidate;
      score: number;
      analysis: string;
      matchedSkills: string[];
      missingSkills: string[];
    }>
  >([]);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Interview Generation State
  const [activeInterviewCandidate, setActiveInterviewCandidate] =
    useState<Candidate | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<
    InterviewQuestion[]
  >([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    skills: "",
    minExperience: 2,
    description: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  // Load Roles
  useEffect(() => {
    getJobRoles().then(setSavedRoles);
  }, []);

  // Auto-run analysis when entering analyze view
  useEffect(() => {
    if (view === "analyze" && selectedRole) {
      handleAnalyze(selectedRole);
    }
  }, [view, selectedRole]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.title.trim()) newErrors.title = "Job title is required";
    if (!formData.skills.trim())
      newErrors.skills = "At least one skill is required";
    if (formData.minExperience < 0)
      newErrors.experience = "Experience cannot be negative";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveRole = async () => {
    if (!validateForm()) return;

    const skillsList = formData.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingRoleId) {
      const roleToUpdate = savedRoles.find((r) => r.id === editingRoleId);
      if (roleToUpdate) {
        const updatedRole: SavedJobRole = {
          ...roleToUpdate,
          title: formData.title,
          requiredSkills: skillsList,
          minExperience: formData.minExperience,
          description: formData.description,
        };
        await updateJobRole(updatedRole);
      }
    } else {
      await addJobRole({
        title: formData.title,
        requiredSkills: skillsList,
        minExperience: formData.minExperience,
        description: formData.description,
      });
    }

    setSavedRoles(await getJobRoles());
    setView("list");
    setEditingRoleId(null);
    setFormData({ title: "", skills: "", minExperience: 2, description: "" });
  };

  const handleEditRole = (e: React.MouseEvent, role: SavedJobRole) => {
    e.stopPropagation();
    setEditingRoleId(role.id);
    setFormData({
      title: role.title,
      skills: role.requiredSkills.join(", "),
      minExperience: role.minExperience,
      description: role.description,
    });
    setView("create");
  };

  const handleDeleteRole = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Delete this job role?")) {
      await deleteJobRole(id);
      setSavedRoles(await getJobRoles());
      if (selectedRole?.id === id) {
        setView("list");
        setSelectedRole(null);
      }
    }
  };

  const handleCardClick = (role: SavedJobRole) => {
    setSelectedRole(role);
    setResults([]); // Clear previous results
    setSelectedForCompare([]);
    setView("analyze");
  };

  const handleAnalyze = async (role: SavedJobRole) => {
    setIsAnalyzing(true);

    const allCandidates = await getCandidates();
    const skillsList = role.requiredSkills.map((s) => s.toLowerCase());

    // 1. Preliminary Filter
    const potentialMatches = allCandidates.filter((c) => {
      const cSkills = c.currentData.skills.map((s) => s.toLowerCase());
      const hasSkill = skillsList.some((req) =>
        cSkills.some((cs) => cs.includes(req)),
      );
      // Relaxed exp check for broad matching
      return (
        hasSkill ||
        (c.currentData.totalExperienceYears || 0) >= role.minExperience - 2
      );
    });

    // 2. AI Deep Analysis
    // Process in chunks to avoid hitting rate limits if many candidates, limiting to top 10 for demo
    const candidatesToAnalyze = potentialMatches.slice(0, 10);

    const analysisResults = await Promise.all(
      candidatesToAnalyze.map(async (c) => {
        const result = await analyzeCandidateMatch(c, {
          title: role.title,
          requiredSkills: role.requiredSkills,
          minExperience: role.minExperience,
          description: role.description,
        });
        return {
          candidate: c,
          score: result.score,
          analysis: result.analysis,
          matchedSkills: result.matchedSkills,
          missingSkills: result.missingSkills,
        };
      }),
    );

    setResults(analysisResults.sort((a, b) => b.score - a.score));
    setIsAnalyzing(false);
  };

  const toggleSelection = (id: string) => {
    if (selectedForCompare.includes(id)) {
      setSelectedForCompare((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedForCompare.length < 3) {
        setSelectedForCompare((prev) => [...prev, id]);
      }
    }
  };

  const handleCompareRedirect = () => {
    if (selectedForCompare.length > 0) {
      const queryParams = new URLSearchParams();
      queryParams.set("ids", selectedForCompare.join(","));
      if (selectedRole) {
        queryParams.set("roleId", selectedRole.id);
      }
      navigate(`/compare?${queryParams.toString()}`);
    }
  };

  const handleEmailCandidate = (e: React.MouseEvent, candidate: Candidate) => {
    e.stopPropagation();
    if (!selectedRole) return;

    const subject = encodeURIComponent(
      `Interview Invitation: ${selectedRole.title}`,
    );
    const body = encodeURIComponent(
      `Dear ${candidate.fullName},

We were impressed by your profile and experience, which seems like a great fit for our ${selectedRole.title} position.
We would like to invite you for an interview to discuss your background further.

Please let us know your availability for the coming week.

Best regards,
Hiring Team`,
    );
    window.location.href = `mailto:${candidate.email}?subject=${subject}&body=${body}`;
  };

  const handleGenerateInterview = async (
    e: React.MouseEvent,
    candidate: Candidate,
  ) => {
    e.stopPropagation();
    setActiveInterviewCandidate(candidate);
    setLoadingQuestions(true);
    setInterviewQuestions([]); // Clear previous

    try {
      const qs = await generateInterviewQuestions(
        candidate,
        selectedRole?.description
          ? `${selectedRole.title}: ${selectedRole.description}`
          : selectedRole?.title,
      );
      setInterviewQuestions(qs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingQuestions(false);
    }
  };

  // --- VIEW: CREATE FORM ---
  if (view === "create") {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-20">
        <button
          onClick={() => {
            setView("list");
            setEditingRoleId(null);
          }}
          className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Roles
        </button>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-800">
              {editingRoleId ? "Edit Job Role" : "Define New Job Role"}
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  setFormData({ ...formData, title: e.target.value });
                  if (errors.title) setErrors({ ...errors, title: undefined });
                }}
                placeholder="e.g. Senior Frontend Engineer"
                className={clsx(
                  "w-full rounded-lg border p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                  errors.title
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300",
                )}
              />
              {errors.title && (
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.title}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Required Skills <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.skills}
                onChange={(e) => {
                  setFormData({ ...formData, skills: e.target.value });
                  if (errors.skills)
                    setErrors({ ...errors, skills: undefined });
                }}
                placeholder="React, TypeScript, Node.js (comma separated)"
                className={clsx(
                  "w-full rounded-lg border p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all",
                  errors.skills
                    ? "border-red-300 focus:border-red-500"
                    : "border-gray-300",
                )}
              />
              {errors.skills && (
                <p className="text-xs text-red-500 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.skills}
                </p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Separate multiple skills with commas.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Min Experience (Years)
              </label>
              <input
                type="number"
                min="0"
                value={formData.minExperience}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    minExperience: Number(e.target.value),
                  })
                }
                className="w-full md:w-1/3 rounded-lg border border-gray-300 p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description / Context (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                placeholder="Brief description of the role responsibilities..."
                className="w-full rounded-lg border border-gray-300 p-3 bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
            <button
              onClick={() => {
                setView("list");
                setEditingRoleId(null);
              }}
              className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveRole}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />{" "}
              {editingRoleId ? "Update Role" : "Save Role"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- VIEW: LIST ROLES ---
  if (view === "list") {
    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-20">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Role Match Simulator
            </h1>
            <p className="text-gray-500">
              Manage job roles and find matching candidates.
            </p>
          </div>
          <button
            onClick={() => {
              setEditingRoleId(null);
              setFormData({
                title: "",
                skills: "",
                minExperience: 2,
                description: "",
              });
              setView("create");
            }}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 font-medium shadow-sm transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Job Role
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedRoles.map((role) => (
            <div
              key={role.id}
              onClick={() => handleCardClick(role)}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:border-indigo-400 hover:shadow-md transition-all cursor-pointer group relative flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleEditRole(e, role)}
                      className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-full transition-colors"
                      title="Edit Role"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteRole(e, role.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Delete Role"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">
                  {role.title}
                </h3>
                <div className="text-sm text-gray-500 mb-4 line-clamp-2 min-h-[2.5rem]">
                  {role.requiredSkills.join(", ")}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-sm">
                <span className="text-gray-600 font-medium">
                  {role.minExperience}+ Years Exp
                </span>
                <span className="text-gray-400 text-xs">
                  Created {new Date(role.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}

          {/* Add New Card Placeholder */}
          <button
            onClick={() => {
              setEditingRoleId(null);
              setFormData({
                title: "",
                skills: "",
                minExperience: 2,
                description: "",
              });
              setView("create");
            }}
            className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50/30 transition-all min-h-[200px]"
          >
            <Plus className="w-10 h-10 mb-3" />
            <span className="font-medium">Create New Role</span>
          </button>
        </div>
      </div>
    );
  }

  // --- VIEW: ANALYZE ---
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 relative">
      {/* Header / Back */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView("list")}
          className="flex items-center text-gray-500 hover:text-indigo-600 transition-colors font-medium"
        >
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Roles
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => selectedRole && handleAnalyze(selectedRole)}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium disabled:opacity-50"
          >
            {isAnalyzing && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
            Refresh Matches
          </button>
        </div>
      </div>

      {/* Role Summary Card */}
      {selectedRole && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {selectedRole.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-3">
                {selectedRole.requiredSkills.map((skill) => (
                  <span
                    key={skill}
                    className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 rounded text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <p className="text-gray-600 text-sm max-w-3xl">
                {selectedRole.description ||
                  "No additional description provided."}
              </p>
            </div>
            <div className="flex flex-col items-end min-w-[120px]">
              <span className="text-sm text-gray-500 uppercase tracking-wider font-semibold mb-1">
                Required Exp
              </span>
              <span className="text-xl font-bold text-gray-900">
                {selectedRole.minExperience} Years
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Results Area */}
      <div className="space-y-4">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
            <p className="font-medium">
              AI is analyzing candidates for this role...
            </p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            <div className="flex justify-between items-center px-2">
              <span className="text-sm text-gray-500 font-medium">
                {results.length} Candidates Found
              </span>
              <span className="text-xs text-gray-400">
                Select up to 3 to compare
              </span>
            </div>

            {results.map(
              ({
                candidate,
                score,
                analysis,
                matchedSkills,
                missingSkills,
              }) => {
                const isSelected = selectedForCompare.includes(candidate.id);
                return (
                  <div
                    key={candidate.id}
                    onClick={() => toggleSelection(candidate.id)}
                    className={clsx(
                      "bg-white p-6 rounded-xl shadow-sm border transition-all cursor-pointer relative group hover:shadow-md",
                      isSelected
                        ? "border-indigo-600 ring-1 ring-indigo-600"
                        : "border-gray-200 hover:border-indigo-300",
                    )}
                  >
                    {/* Checkbox overlay */}
                    <div className="absolute top-6 right-6">
                      <div
                        className={clsx(
                          "w-6 h-6 rounded-full border flex items-center justify-center transition-colors",
                          isSelected
                            ? "bg-indigo-600 border-indigo-600"
                            : "bg-white border-gray-300 group-hover:border-indigo-400",
                        )}
                      >
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start pr-12 gap-4">
                      <div className="flex items-start gap-4">
                        <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg flex-shrink-0">
                          {candidate.fullName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {candidate.fullName}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                            <span>
                              {candidate.currentData.totalExperienceYears || 0}{" "}
                              Yrs Exp
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                            <span className="truncate max-w-[200px]">
                              {candidate.currentData.experience?.[0]?.role ||
                                "N/A"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div
                            className={clsx(
                              "text-2xl font-bold",
                              score >= 80
                                ? "text-green-600"
                                : score >= 60
                                  ? "text-yellow-600"
                                  : "text-red-500",
                            )}
                          >
                            {score}%
                          </div>
                          <div className="text-xs text-gray-400">
                            Match Score
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        <span className="font-semibold text-indigo-600">
                          AI Analysis:{" "}
                        </span>
                        {analysis}
                      </p>
                    </div>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-green-500" />{" "}
                          Matched Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {matchedSkills && matchedSkills.length > 0 ? (
                            matchedSkills.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs border border-green-100"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              None matched
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-red-500" /> Missing
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {missingSkills && missingSkills.length > 0 ? (
                            missingSkills.map((s) => (
                              <span
                                key={s}
                                className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs border border-red-100"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-gray-400 italic">
                              None missing
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                      <button
                        onClick={(e) => handleEmailCandidate(e, candidate)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:text-indigo-600 transition-colors"
                      >
                        <Mail className="w-4 h-4" /> Email Candidate
                      </button>
                      <button
                        onClick={(e) => handleGenerateInterview(e, candidate)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                      >
                        <BrainCircuit className="w-4 h-4" /> Generate Interview
                        Guide
                      </button>
                    </div>
                  </div>
                );
              },
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
            <Briefcase className="w-12 h-12 mb-3 opacity-20" />
            <p className="font-medium">
              No candidates found matching this profile.
            </p>
            <p className="text-sm">
              Try adjusting the role requirements or adding more candidates.
            </p>
          </div>
        )}
      </div>

      {/* Floating Compare Button */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-8 right-8 animate-fade-in z-40">
          <button
            onClick={handleCompareRedirect}
            className="bg-gray-900 text-white px-6 py-3 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all flex items-center gap-3 font-medium border border-gray-700"
          >
            <span>Compare ({selectedForCompare.length})</span>
            <div className="bg-white text-gray-900 rounded-full p-1">
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Interview Guide Modal */}
      {activeInterviewCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl animate-scale-up">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  Interview Guide
                </h3>
                <p className="text-gray-500 text-sm mt-1">
                  For {activeInterviewCandidate.fullName} •{" "}
                  {selectedRole?.title}
                </p>
              </div>
              <button
                onClick={() => setActiveInterviewCandidate(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingQuestions ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
                  <p>Generating tailored questions & answer guides...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {interviewQuestions.map((q, i) => (
                    <div
                      key={i}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gray-50 p-4 border-b border-gray-100 flex gap-3">
                        <div className="mt-0.5">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
                            {i + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {q.question}
                          </h4>
                          <div className="flex gap-2 mt-2">
                            <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs font-medium text-gray-600 uppercase tracking-wide">
                              {q.type}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-white space-y-4">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium text-gray-900 block mb-1">
                            Context:
                          </span>
                          {q.context}
                        </div>
                        {q.answerGuide && (
                          <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="flex items-start gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div className="text-sm text-green-800">
                                <span className="font-bold block text-green-900 mb-1">
                                  Good Answer Guide:
                                </span>
                                {q.answerGuide}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-xl flex justify-end">
              <button
                onClick={() => setActiveInterviewCandidate(null)}
                className="px-5 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleMatch;
