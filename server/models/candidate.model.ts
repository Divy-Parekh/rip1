import mongoose, { Document, Schema } from "mongoose";

export interface ISocialLink {
  platform: string;
  url: string;
}

export interface IWorkExperience {
  company: string;
  role: string;
  duration: string;
  description: string;
}

export interface IProject {
  name: string;
  description: string;
  technologies: string[];
  url?: string;
}

export interface IEducation {
  institution: string;
  degree: string;
  year: string;
}

export interface IResumeData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  socialLinks: ISocialLink[];
  skills: string[];
  experience: IWorkExperience[];
  projects: IProject[];
  education: IEducation[];
  totalExperienceYears: number;
}

export interface IResumeVersion {
  versionId: string;
  uploadedAt: Date;
  uploadedBy: string;
  rawText: string;
  fileId?: string; // GridFS file ID
  data: IResumeData;
}

export interface ICandidate extends Document {
  id: string; // client-generated uuid
  userId: mongoose.Types.ObjectId;
  fullName: string;
  email: string;
  phone: string;
  versions: IResumeVersion[];
  currentData: IResumeData;
  createdAt: Date;
  updatedAt: Date;
}

const SocialLinkSchema = new Schema<ISocialLink>(
  {
    platform: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false },
);

const WorkExperienceSchema = new Schema<IWorkExperience>(
  {
    company: { type: String },
    role: { type: String },
    duration: { type: String },
    description: { type: String },
  },
  { _id: false },
);

const ProjectSchema = new Schema<IProject>(
  {
    name: { type: String },
    description: { type: String },
    technologies: [{ type: String }],
    url: { type: String },
  },
  { _id: false },
);

const EducationSchema = new Schema<IEducation>(
  {
    institution: { type: String },
    degree: { type: String },
    year: { type: String },
  },
  { _id: false },
);

const ResumeDataSchema = new Schema<IResumeData>(
  {
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    summary: { type: String, default: "" },
    socialLinks: [SocialLinkSchema],
    skills: [{ type: String }],
    experience: [WorkExperienceSchema],
    projects: [ProjectSchema],
    education: [EducationSchema],
    totalExperienceYears: { type: Number, default: 0 },
  },
  { _id: false },
);

const ResumeVersionSchema = new Schema<IResumeVersion>(
  {
    versionId: { type: String, required: true },
    uploadedAt: { type: Date, required: true, default: Date.now },
    uploadedBy: { type: String, required: true },
    rawText: { type: String, required: true },
    fileId: { type: String },
    data: { type: ResumeDataSchema, required: true },
  },
  { _id: false },
);

const CandidateSchema = new Schema<ICandidate>({
  id: { type: String, unique: true, sparse: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fullName: { type: String, required: true },
  email: { type: String, default: "" },
  phone: { type: String, default: "" },
  versions: [ResumeVersionSchema],
  currentData: { type: ResumeDataSchema, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model<ICandidate>("Candidate", CandidateSchema);
