import React, { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getCandidates,
  getJobRoleById,
  getJobRoles,
} from "../services/storageService";
import { SavedJobRole, Candidate } from "../types";
import { Search, X, Plus, Briefcase, ChevronDown, Check } from "lucide-react";
import clsx from "clsx";

const Compare: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allCandidates, setAllCandidates] = useState<Candidate[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Role Context
  const [jobRole, setJobRole] = useState<SavedJobRole | null>(null);
  const [availableRoles, setAvailableRoles] = useState<SavedJobRole[]>([]);

  // Load candidates and init from URL
  useEffect(() => {
    const init = async () => {
      const [candidates, roles] = await Promise.all([
        getCandidates(),
        getJobRoles(),
      ]);
      setAllCandidates(candidates);
      setAvailableRoles(roles);

      const idsParam = searchParams.get("ids");
      const roleId = searchParams.get("roleId");

      if (idsParam) {
        const ids = idsParam
          .split(",")
          .filter((id) => candidates.some((c) => c.id === id));
        setSelectedIds([...new Set(ids)].slice(0, 3));
      }

      if (roleId) {
        const role = await getJobRoleById(roleId);
        if (role) setJobRole(role);
      }
    };
    init();
  }, [searchParams]);

  const updateUrlParams = (newIds: string[], roleId: string | undefined) => {
    const newParams = new URLSearchParams();
    if (newIds.length > 0) newParams.set("ids", newIds.join(","));
    if (roleId) newParams.set("roleId", roleId);
    setSearchParams(newParams);
  };

  const handleRoleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = e.target.value;
    if (roleId) {
      const role = availableRoles.find((r) => r.id === roleId);
      setJobRole(role || null);
      updateUrlParams(selectedIds, roleId);
    } else {
      setJobRole(null);
      updateUrlParams(selectedIds, undefined);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const removeCandidate = (id: string) => {
    const newIds = selectedIds.filter((i) => i !== id);
    setSelectedIds(newIds);
    updateUrlParams(newIds, jobRole?.id);
  };

  const addCandidate = (id: string) => {
    if (!selectedIds.includes(id) && selectedIds.length < 3) {
      const newIds = [...selectedIds, id];
      setSelectedIds(newIds);
      updateUrlParams(newIds, jobRole?.id);
      setSearchQuery("");
      setIsDropdownOpen(false);
    }
  };

  const selectedCandidates = allCandidates.filter((c) =>
    selectedIds.includes(c.id),
  );

  // Filter for search autocomplete
  const searchResults = allCandidates.filter((c) => {
    if (selectedIds.includes(c.id)) return false; // Don't show already selected
    if (!searchQuery) return false;
    return (
      c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.currentData.skills.some((s) =>
        s.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    );
  });

  return (
    <div className="space-y-6 h-full flex flex-col pb-10">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-end gap-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Candidate Comparison
          </h1>
          <div className="mt-2 flex items-center gap-2">
            <div className="relative">
              <select
                className={clsx(
                  "appearance-none pl-9 pr-10 py-2 rounded-lg border text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer transition-all",
                  jobRole
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-white border-gray-300 text-gray-700",
                )}
                value={jobRole?.id || ""}
                onChange={handleRoleChange}
              >
                <option value="">Select Role to Compare Against</option>
                {availableRoles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.title}
                  </option>
                ))}
              </select>
              <Briefcase
                className={clsx(
                  "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4",
                  jobRole ? "text-indigo-500" : "text-gray-500",
                )}
              />
              <ChevronDown
                className={clsx(
                  "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4",
                  jobRole ? "text-indigo-500" : "text-gray-500",
                )}
              />
            </div>
          </div>
        </div>

        {/* Search Box for Adding Candidates */}
        <div className="relative w-full lg:w-96" ref={dropdownRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={
                selectedIds.length >= 3
                  ? "Max candidates selected"
                  : "Search to add candidate..."
              }
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsDropdownOpen(true);
              }}
              onFocus={() => setIsDropdownOpen(true)}
              disabled={selectedIds.length >= 3}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-gray-900 shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
            />
          </div>

          {/* Dropdown Results */}
          {isDropdownOpen && searchQuery && (
            <div className="absolute z-10 top-full mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
              {searchResults.length > 0 ? (
                searchResults.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => addCandidate(c.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs flex-shrink-0">
                      {c.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {c.fullName}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {c.currentData.experience?.[0]?.role ||
                          c.currentData.skills[0] ||
                          "No Title"}
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No matches found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Context Banner */}
      {jobRole && (
        <div className="bg-white border-l-4 border-indigo-500 shadow-sm rounded-r-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in flex-shrink-0">
          <div>
            <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
              Comparison Context
            </div>
            <h3 className="text-gray-900 font-bold">{jobRole.title}</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-3xl line-clamp-1">
              {jobRole.description ||
                "Comparing based on skill overlap and experience requirements."}
            </p>
          </div>
          <div className="flex gap-6 text-sm flex-shrink-0">
            <div>
              <span className="text-gray-400 text-xs block">Min Exp</span>
              <span className="font-semibold text-gray-900">
                {jobRole.minExperience} Yrs
              </span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block">Target Skills</span>
              <span className="font-medium text-indigo-600">
                {jobRole.requiredSkills.length} Defined
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Table Container - Changed to allow overflow scrolling */}
      {selectedCandidates.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr>
                <th className="p-4 border-b border-gray-200 w-48 bg-gray-50 text-gray-500 font-medium text-sm sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Metric
                </th>
                {selectedCandidates.map((c) => (
                  <th
                    key={c.id}
                    className="p-4 border-b border-gray-200 w-1/3 relative group bg-white"
                  >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => removeCandidate(c.id)}
                        className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg">
                        {c.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-lg font-bold text-gray-900 truncate">
                          {c.fullName}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {c.email}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium text-indigo-600 bg-indigo-50 inline-block px-2 py-0.5 rounded">
                      {c.currentData.experience?.[0]?.role || "Unknown Role"}
                    </div>
                  </th>
                ))}
                {/* Empty slots placeholders */}
                {[...Array(3 - selectedCandidates.length)].map((_, i) => (
                  <th
                    key={`empty-${i}`}
                    className="p-4 border-b border-gray-200 w-1/3 bg-gray-50/30"
                  >
                    <div className="flex flex-col items-center justify-center text-gray-400 h-full opacity-50">
                      <div className="border-2 border-dashed border-gray-300 rounded-full h-12 w-12 flex items-center justify-center mb-2">
                        <Plus className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-medium">Add Candidate</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {/* Experience Row */}
              <tr>
                <td className="p-4 bg-gray-50 text-sm font-medium text-gray-700 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Experience
                </td>
                {selectedCandidates.map((c) => {
                  const exp = c.currentData.totalExperienceYears || 0;
                  const meetsExp = jobRole
                    ? exp >= jobRole.minExperience
                    : true;
                  return (
                    <td key={c.id} className="p-4 align-top bg-white">
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "font-semibold text-lg",
                            meetsExp ? "text-green-600" : "text-red-500",
                          )}
                        >
                          {exp}
                        </span>
                        <span className="text-gray-600">Years</span>
                        {jobRole &&
                          (meetsExp ? (
                            <Check className="w-4 h-4 text-green-500" />
                          ) : (
                            <span className="text-xs text-red-400">
                              (Req: {jobRole.minExperience}+)
                            </span>
                          ))}
                      </div>
                    </td>
                  );
                })}
                {[...Array(3 - selectedCandidates.length)].map((_, i) => (
                  <td key={`e-${i}`} className="bg-gray-50/30"></td>
                ))}
              </tr>

              {/* Skills Row */}
              <tr>
                <td className="p-4 bg-gray-50 text-sm font-medium text-gray-700 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  <div>Skills</div>
                  {jobRole && (
                    <div className="text-xs text-gray-400 font-normal mt-1">
                      {jobRole.requiredSkills.length} Required
                    </div>
                  )}
                </td>
                {selectedCandidates.map((c) => (
                  <td key={c.id} className="p-4 align-top bg-white">
                    <div className="flex flex-wrap gap-1">
                      {c.currentData.skills.map((s) => {
                        // Highlight skills if they match job role requirements
                        const isMatch = jobRole?.requiredSkills.some((req) =>
                          s.toLowerCase().includes(req.toLowerCase()),
                        );
                        return (
                          <span
                            key={s}
                            className={clsx(
                              "px-2 py-0.5 rounded text-xs border",
                              isMatch
                                ? "bg-green-100 text-green-800 border-green-200 font-bold ring-1 ring-green-200"
                                : "bg-gray-100 text-gray-700 border-gray-200",
                            )}
                          >
                            {s}
                          </span>
                        );
                      })}
                    </div>
                    {jobRole && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs font-semibold text-red-400 mb-1">
                          Missing Required:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {jobRole.requiredSkills
                            .filter(
                              (req) =>
                                !c.currentData.skills.some((s) =>
                                  s.toLowerCase().includes(req.toLowerCase()),
                                ),
                            )
                            .map((missing) => (
                              <span
                                key={missing}
                                className="px-1.5 py-0.5 bg-red-50 text-red-600 text-xs rounded border border-red-100 opacity-75"
                              >
                                {missing}
                              </span>
                            ))}
                          {jobRole.requiredSkills.every((req) =>
                            c.currentData.skills.some((s) =>
                              s.toLowerCase().includes(req.toLowerCase()),
                            ),
                          ) && (
                            <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                              <Check className="w-3 h-3" /> All matched
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </td>
                ))}
                {[...Array(3 - selectedCandidates.length)].map((_, i) => (
                  <td key={`s-${i}`} className="bg-gray-50/30"></td>
                ))}
              </tr>

              {/* Company Row */}
              <tr>
                <td className="p-4 bg-gray-50 text-sm font-medium text-gray-700 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Recent Company
                </td>
                {selectedCandidates.map((c) => (
                  <td
                    key={c.id}
                    className="p-4 align-top text-sm text-gray-800 bg-white"
                  >
                    <div className="font-medium">
                      {c.currentData.experience?.[0]?.company || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.currentData.experience?.[0]?.duration}
                    </div>
                  </td>
                ))}
                {[...Array(3 - selectedCandidates.length)].map((_, i) => (
                  <td key={`c-${i}`} className="bg-gray-50/30"></td>
                ))}
              </tr>

              {/* Education Row */}
              <tr>
                <td className="p-4 bg-gray-50 text-sm font-medium text-gray-700 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Education
                </td>
                {selectedCandidates.map((c) => (
                  <td
                    key={c.id}
                    className="p-4 align-top text-sm text-gray-600 bg-white"
                  >
                    <div className="font-medium text-gray-900">
                      {c.currentData.education?.[0]?.degree || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {c.currentData.education?.[0]?.institution}
                    </div>
                  </td>
                ))}
                {[...Array(3 - selectedCandidates.length)].map((_, i) => (
                  <td key={`ed-${i}`} className="bg-gray-50/30"></td>
                ))}
              </tr>

              {/* Project Row */}
              <tr>
                <td className="p-4 bg-gray-50 text-sm font-medium text-gray-700 sticky left-0 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                  Key Project
                </td>
                {selectedCandidates.map((c) => (
                  <td
                    key={c.id}
                    className="p-4 align-top text-sm text-gray-600 bg-white"
                  >
                    {c.currentData.projects?.[0]?.name ? (
                      <>
                        <div className="font-medium text-indigo-700">
                          {c.currentData.projects[0].name}
                        </div>
                        <div className="text-xs mt-1 line-clamp-3">
                          {c.currentData.projects[0].description}
                        </div>
                      </>
                    ) : (
                      "N/A"
                    )}
                  </td>
                ))}
                {[...Array(3 - selectedCandidates.length)].map((_, i) => (
                  <td key={`p-${i}`} className="bg-gray-50/30"></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <div className="p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              No candidates selected
            </h3>
            <p className="text-gray-500 mt-1 max-w-sm mx-auto">
              Use the search bar above to add candidates or select from the Role
              Match page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Compare;
