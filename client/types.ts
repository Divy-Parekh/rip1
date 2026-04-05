export interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface Project {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface Education {
  institution: string;
  degree: string;
  year: string;
}

export interface SocialLink {
  platform: string;
  url: string;
}

export interface ResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  socialLinks: SocialLink[];
  skills: string[];
  experience: WorkExperience[];
  projects: Project[];
  education: Education[];
  totalExperienceYears: number;
}

export interface ResumeVersion {
  versionId: string;
  uploadedAt: string;
  uploadedBy: string;
  rawText: string;
  fileId?: string;
  data: ResumeData;
}

export interface Candidate {
  id: string;
  _id?: string;
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  versions: ResumeVersion[];
  currentData: ResumeData;
  status: "Pending" | "Approved" | "Rejected";
  referredBy?: { userId: string; name: string };
  isSharedWithHR?: boolean;
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
  matchScore?: number;
  missingSkills?: string[];
  recruitmentDriveId?: string;
}

export interface RecruitmentDrive {
  _id: string;
  title: string;
  description?: string;
  slug: string;
  createdBy: { _id: string; name: string; email?: string } | string;
  isActive: boolean;
  availableRoles: string[];
  createdAt: string;
}

export interface JobRole {
  title: string;
  requiredSkills: string[];
  minExperience: number;
  description: string;
}

export interface SavedJobRole extends JobRole {
  id: string;
  createdAt: string;
}

export interface InterviewQuestion {
  question: string;
  type: "technical" | "scenario" | "project" | "behavioral";
  context: string;
  answerGuide?: string; // Brief on what a good answer looks like
}

export type UserRole = "Admin" | "HR" | "Employee";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  token?: string;
}

