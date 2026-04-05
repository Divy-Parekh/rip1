import type { Response } from "express";
import Candidate from "../models/candidate.model.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import { getGfs } from "../config/gridfs.js";
import mongoose from "mongoose";
import { Readable } from "stream";

// @route   POST /api/candidate/create
export const createCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const { id, fullName, email, phone, versions, currentData } = req.body;
    const userId = req.userId;

    const newCandidate = new Candidate({
      id: id || undefined,
      userId: userId as any,
      fullName: fullName || currentData?.fullName || "Unknown",
      email: email || currentData?.email || "",
      phone: phone || currentData?.phone || "",
      versions: versions || [],
      currentData: currentData || {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const savedCandidate = await newCandidate.save();
    res.status(201).json(savedCandidate);
  } catch (error) {
    console.error("Error creating candidate:", error);
    res.status(500).json({ success: false, message: "Server error creating candidate" });
  }
};

// @route   GET /api/candidate/all
export const getAllCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const candidates = await Candidate.find({ userId: userId as any }).sort({ updatedAt: -1 });
    res.status(200).json(candidates);
  } catch (error) {
    console.error("Error fetching all candidates:", error);
    res.status(500).json({ success: false, message: "Server error fetching candidates" });
  }
};

// @route   GET /api/candidate/:id
export const getCandidateById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const userId = req.userId;

    // Try by custom id field first (client uuid), then by MongoDB _id
    let candidate = await Candidate.findOne({ id, userId: userId as any });
    if (!candidate) {
      candidate = await Candidate.findOne({ _id: (id.match(/^[0-9a-fA-F]{24}$/) ? id : null), userId: userId as any });
    }

    if (!candidate) return res.status(404).json({ message: "Not found" });
    res.status(200).json(candidate);
  } catch (error) {
    console.error("Error fetching candidate by id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @route   GET /api/candidate?email=...&phone=...
export const getCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    let email = (req.query["email"] as string | undefined)?.toLowerCase().trim() ?? "";
    const phone = ((req.query["phone"] as string | undefined) ?? "").replace(/\D/g, "").trim();

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: "Email or phone is required" });
    }

    let candidate = email ? await Candidate.findOne({ email, userId: userId as any }) : null;
    if (!candidate && phone) {
      candidate = await Candidate.findOne({ phone, userId: userId as any });
    }

    if (!candidate) return res.status(200).json(null);
    res.status(200).json(candidate);
  } catch (error) {
    console.error("Error finding candidate:", error);
    res.status(500).json({ success: false, message: "Server error finding candidate" });
  }
};

// @route   PUT /api/candidate/:id
export const updateCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const userId = req.userId;
    const updateData = req.body;

    // Try by custom id field first, then MongoDB _id
    let updated = await Candidate.findOneAndUpdate(
      { id, userId: userId as any },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      updated = await Candidate.findOneAndUpdate(
        { _id: (id.match(/^[0-9a-fA-F]{24}$/) ? id : null), userId: userId as any },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );
    }

    if (!updated) return res.status(404).json({ message: "Not found" });
    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating candidate:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @route   DELETE /api/candidate/:id
export const deleteCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const userId = req.userId;

    let deleted = await Candidate.findOneAndDelete({ id, userId: userId as any });
    if (!deleted) {
      deleted = await Candidate.findOneAndDelete({ 
        _id: (id.match(/^[0-9a-fA-F]{24}$/) ? id : null), 
        userId: userId as any 
      });
    }

    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @route   POST /api/candidate/upload
export const uploadResume = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const gfs = getGfs();
    const filename = `${Date.now()}-${req.file.originalname}`;
    
    // Create upload stream
    const uploadStream = gfs.openUploadStream(filename, {
        metadata: { contentType: req.file.mimetype }
    });

    // Pipe the buffer to the stream
    const stream = Readable.from(req.file.buffer);
    
    stream.pipe(uploadStream);

    uploadStream.on("error", (err) => {
        console.error("GridFS Upload Stream Error:", err);
        if (!res.headersSent) {
            res.status(500).json({ message: "Upload failed during streaming" });
        }
    });

    uploadStream.on("finish", () => {
        if (!res.headersSent) {
            res.status(201).json({ 
                fileId: uploadStream.id,
                filename: filename 
            });
        }
    });
  } catch (error) {
    console.error("Error uploading to GridFS:", error);
    res.status(500).json({ message: "Upload failed" });
  }
};

// @route   GET /api/candidate/download/:fileId
export const downloadResume = async (req: AuthRequest, res: Response) => {
  try {
    const fileId = req.params["fileId"] as string;
    if (!fileId || fileId === "undefined") {
        return res.status(400).json({ message: "Invalid file ID" });
    }

    const gfs = getGfs();
    const _id = new mongoose.Types.ObjectId(fileId);

    const files = await gfs.find({ _id }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ message: "File not found" });
    }

    const file = files[0] as any;
    const contentType = file.metadata?.contentType || file.contentType || "application/pdf";
    
    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
    });

    const downloadStream = gfs.openDownloadStream(_id);
    downloadStream.pipe(res);
  } catch (error) {
    console.error("Error downloading from GridFS:", error);
    res.status(500).json({ message: "Download failed" });
  }
};
