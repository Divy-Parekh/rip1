import type { Request, Response } from "express";
import RecruitmentDrive from "../models/drive.model.js";
import Candidate from "../models/candidate.model.js";
import Job from "../models/job.model.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { v4 as uuidv4 } from "uuid";
import { getGfs } from "../config/gridfs.js";
import { Readable } from "stream";
import { extractPdfData } from "../services/pdf.service.js";
import { parseResumeTextHelper } from "./ai.controller.js";

// Slugify helper
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// POST /api/drives — HR / Admin
export const createDrive = async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, availableRoles } = req.body;
    if (!title) return res.status(400).json({ message: "Title is required" });

    const baseSlug = slugify(title);
    const slug = `${baseSlug}-${uuidv4().slice(0, 6)}`;

    const drive = await RecruitmentDrive.create({
      title,
      description,
      slug,
      availableRoles: availableRoles || [],
      createdBy: req.userId,
    });

    res.status(201).json(drive);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/drives — HR / Admin
export const listDrives = async (req: AuthRequest, res: Response) => {
  try {
    const drives = await RecruitmentDrive.find()
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });
    res.json(drives);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// PATCH /api/drives/:slug/toggle — HR / Admin
export const toggleDrive = async (req: AuthRequest, res: Response) => {
  try {
    const slug = req.params["slug"] as string;
    const drive = await RecruitmentDrive.findOne({ slug });
    if (!drive) return res.status(404).json({ message: "Drive not found" });
    drive.isActive = !drive.isActive;
    await drive.save();
    res.json(drive);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/drives/:slug — HR / Admin
export const deleteDrive = async (req: AuthRequest, res: Response) => {
  try {
    const slug = req.params["slug"] as string;
    const deleted = await RecruitmentDrive.findOneAndDelete({ slug });
    if (!deleted) return res.status(404).json({ message: "Drive not found" });
    res.json({ message: "Drive deleted" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// GET /api/drives/public/:slug — no auth (public)
export const getDriveBySlug = async (req: Request, res: Response) => {
  try {
    const slug = req.params["slug"] as string;
    const drive = await RecruitmentDrive.findOne({
      slug,
      isActive: true,
    }).populate("createdBy", "name").lean();
    
    if (!drive) return res.status(404).json({ message: "Drive not found or inactive" });

    // Auto-populate with all user jobs if none specific were chosen
    if (!drive.availableRoles || drive.availableRoles.length === 0) {
      const creatorId = drive.createdBy as any;
      const jobs = await Job.find({ userId: creatorId._id || creatorId });
      drive.availableRoles = jobs.map((j) => j.title);
    }

    res.json(drive);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/drives/public/:slug/submit — no auth (public)
export const submitToDrive = async (req: Request, res: Response) => {
  try {
    const slug = req.params["slug"] as string;
    const drive = await RecruitmentDrive.findOne({
      slug,
      isActive: true,
    });
    if (!drive) return res.status(404).json({ message: "Drive not found or inactive" });

    const { roleApplying } = req.body;
    const fullName = req.body.fullName || ""; 
    const email = req.body.email || "";
    const phone = req.body.phone || "";

    if (!req.file) {
      return res.status(400).json({ message: "Resume file is required" });
    }

    const currentData = {
      fullName,
      email,
      phone: phone || "",
      location: "",
      summary: `Applied via Recruitment Drive: ${drive.title}. Role: ${roleApplying || "Not specified"}`,
      socialLinks: [],
      skills: [],
      experience: [],
      projects: [],
      education: [],
      totalExperienceYears: 0,
    };

    let fileId: any = null;
    let extractedText = "";
    let aiData: any = null;

    if (req.file) {
      if (req.file.mimetype === "application/pdf") {
        try {
          const { text, links } = await extractPdfData(req.file.buffer);
          extractedText = text;
          
          if (links && links.length > 0) {
            extractedText += "\n\nEmbedded Links Found in PDF:\n" + links.join("\n");
          }

          if (extractedText.trim()) {
            console.log(`[Drive Submission] Successfully extracted ${extractedText.length} characters from PDF.`);
            aiData = await parseResumeTextHelper(extractedText);
          } else {
            console.warn("[Drive Submission] PDF extraction returned empty text.");
          }
        } catch (aiErr) {
          console.error("[Drive Submission] AI/PDF Processing failed:", aiErr);
        }
      }

      const gfs = getGfs();
      const filename = `${Date.now()}-${req.file.originalname}`;
      
      const uploadStream = gfs.openUploadStream(filename, {
        metadata: { contentType: req.file.mimetype },
      });

      const stream = Readable.from(req.file.buffer);
      stream.pipe(uploadStream);
      
      await new Promise((resolve, reject) => {
        uploadStream.on("error", reject);
        uploadStream.on("finish", () => {
          fileId = uploadStream.id;
          resolve(true);
        });
      });
    }

    const finalData = {
      ...currentData,
      ...(aiData || {}),
      fullName: fullName || aiData?.fullName || "Extracted Candidate",
      email: email || aiData?.email || "no-email-found@example.com",
      phone: phone || aiData?.phone || "",
    };

    const versions = fileId ? [{
      versionId: uuidv4(),
      uploadedAt: new Date().toISOString(),
      uploadedBy: "Candidate",
      rawText: extractedText || "Resume file uploaded via Recruitment Drive (Text Extraction Empty).",
      fileId,
      data: finalData
    }] : [];

    const candidate = await Candidate.create({
      id: uuidv4(),
      userId: drive.createdBy,
      fullName: finalData.fullName,
      email: finalData.email,
      phone: finalData.phone,
      versions,
      currentData: finalData,
      status: "Pending",
      recruitmentDriveId: drive._id,
      sharedWith: [],
    });

    console.log(`[Drive Submission] Successfully processed candidate: ${candidate.fullName} (${candidate.email})`);
    res.status(201).json({ message: "Application submitted successfully", candidateId: candidate.id });
  } catch (err) {
    console.error(`[Drive Submission] Global error:`, err);
    res.status(500).json({ message: "Server error" });
  }
};
