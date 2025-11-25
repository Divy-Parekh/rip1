
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
  uploadedAt: number;
  uploadedBy: string;
  rawText: string;
  data: ResumeData;
}

export interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  versions: ResumeVersion[];
  // Aggregated/Latest data
  currentData: ResumeData;
  createdAt: number;
  updatedAt: number;
  matchScore?: number; // Transient field for search
  missingSkills?: string[]; // Transient
}

export interface JobRole {
  title: string;
  requiredSkills: string[];
  minExperience: number;
  description: string;
}

export interface SavedJobRole extends JobRole {
  id: string;
  createdAt: number;
}

export interface InterviewQuestion {
  question: string;
  type: 'technical' | 'scenario' | 'project' | 'behavioral';
  context: string;
  answerGuide?: string; // Brief on what a good answer looks like
}

export interface User {
  id: string;
  name: string;
  email: string;
  token?: string;
}