import { ResumeData, InterviewQuestion, JobRole, Candidate } from "../types";
import { apiClient } from "./apiClient";

const AI_BASE_URL = "http://localhost:5000/api/ai";

// Parse raw resume text via server → structured ResumeData
export const parseResumeText = async (
  input: string | { base64: string; mimeType: string },
): Promise<ResumeData> => {
  const rawText =
    typeof input === "string"
      ? input
      : `[PDF content encoded in base64 — extract resume data]\n${input.base64.slice(0, 200)}...`;

  const res = await apiClient(`${AI_BASE_URL}/parse-resume`, {
    method: "POST",
    body: JSON.stringify({ rawText }),
  });

  return await res.json();
};

// Parse a PDF file directly via server
export const parseResumePdf = async (base64: string): Promise<ResumeData> => {
  const res = await apiClient(`${AI_BASE_URL}/parse-resume`, {
    method: "POST",
    body: JSON.stringify({ rawText: `[PDF base64 input]\n${base64}` }),
  });

  return await res.json();
};

// Analyze how well a candidate matches a job role
export const analyzeCandidateMatch = async (
  candidate: Candidate,
  jobRole: JobRole,
): Promise<{
  score: number;
  analysis: string;
  matchedSkills: string[];
  missingSkills: string[];
}> => {
  try {
    const res = await apiClient(`${AI_BASE_URL}/match-role`, {
      method: "POST",
      body: JSON.stringify({
        candidateData: candidate.currentData,
        jobRole,
      }),
    });

    const data = await res.json();

    return {
      score: data.matchScore ?? data.score ?? 0,
      analysis: data.summary ?? data.analysis ?? "Could not analyze.",
      matchedSkills: data.matchedSkills ?? [],
      missingSkills: data.missingSkills ?? [],
    };
  } catch (e) {
    console.error("analyzeCandidateMatch error:", e);
    return { score: 0, analysis: "Could not analyze.", matchedSkills: [], missingSkills: [] };
  }
};

// Generate tailored interview questions for a candidate (+ optional job context)
export const generateInterviewQuestions = async (
  candidate: Candidate,
  jobDescription?: string,
): Promise<InterviewQuestion[]> => {
  try {
    const jobRole: JobRole = {
      title: jobDescription ?? "General Interview",
      requiredSkills: candidate.currentData.skills.slice(0, 5),
      minExperience: candidate.currentData.totalExperienceYears ?? 0,
      description: jobDescription ?? "",
    };

    const res = await apiClient(`${AI_BASE_URL}/generate-questions`, {
      method: "POST",
      body: JSON.stringify({
        candidateData: candidate.currentData,
        jobRole,
      }),
    });

    return await res.json();
  } catch (e) {
    console.error("generateInterviewQuestions error:", e);
    return [];
  }
};
