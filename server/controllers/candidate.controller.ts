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

    const referredBy =
      req.userRole === "Employee"
        ? { userId: new mongoose.Types.ObjectId(userId), name: req.body.referredByName || "Employee" }
        : undefined;

    const newCandidate = new Candidate({
      id: id || undefined,
      userId: userId as any,
      fullName: fullName || currentData?.fullName || "Unknown",
      email: email || currentData?.email || "",
      phone: phone || currentData?.phone || "",
      versions: versions || [],
      currentData: currentData || {},
      status: "Pending",
      referredBy,
      sharedWith: [],
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
// Admin/HR → all their candidates; Employee → only sharedWith includes their userId
export const getAllCandidates = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const role = req.userRole;
    const driveId = req.query["driveId"] as string | undefined;

    let candidates;
    const filter: any = {};
    if (driveId) filter.recruitmentDriveId = driveId;

    if (role === "Employee") {
      // Employees see candidates they added OR specifically shared with them
      candidates = await Candidate.find({
        $and: [
          filter,
          {
            $or: [
              { userId: new mongoose.Types.ObjectId(userId) },
              { sharedWith: new mongoose.Types.ObjectId(userId) }
            ]
          }
        ]
      }).sort({ updatedAt: -1 });
    } else {
      // Admin and HR see:
      // 1. Candidates they added
      // 2. Candidates shared with them specifically
      // 3. Candidates marked as isSharedWithHR
      // 4. Candidates from recruitment drives (if no driveId filter is already applied)
      candidates = await Candidate.find({
        $and: [
          filter,
          {
            $or: [
              { userId: new mongoose.Types.ObjectId(userId) },
              { sharedWith: new mongoose.Types.ObjectId(userId) },
              { isSharedWithHR: true },
              { recruitmentDriveId: { $ne: null } }
            ]
          }
        ]
      }).sort({ updatedAt: -1 });
    }

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
    const role = req.userRole;

    let candidate = await Candidate.findOne({ id });
    if (!candidate) {
      candidate = await Candidate.findOne({ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null });
    }

    if (!candidate) return res.status(404).json({ message: "Not found" });

    // Employee can only view if shared with them
    if (role === "Employee") {
      const sharedIds = candidate.sharedWith.map((id) => id.toString());
      if (!sharedIds.includes(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

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

    const isFullManager = req.userRole === "Admin" || req.userRole === "HR";
    const baseQuery = isFullManager ? {} : { userId: req.userId as any };

    let updated = await Candidate.findOneAndUpdate(
      { id, ...baseQuery },
      { ...updateData, updatedAt: new Date() },
      { new: true }
    );
    if (!updated) {
      const oid = id.match(/^[0-9a-fA-F]{24}$/) ? id : null;
      if (oid) {
        updated = await Candidate.findOneAndUpdate(
          { _id: oid, ...baseQuery },
          { ...updateData, updatedAt: new Date() },
          { new: true }
        );
      }
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

    const isFullManager = req.userRole === "Admin" || req.userRole === "HR";
    const baseQuery = isFullManager ? {} : { userId: req.userId as any };

    let deleted = await Candidate.findOneAndDelete({ id, ...baseQuery });
    if (!deleted) {
      const oid = id.match(/^[0-9a-fA-F]{24}$/) ? id : null;
      if (oid) {
        deleted = await Candidate.findOneAndDelete({ _id: oid, ...baseQuery });
      }
    }

    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @route   POST /api/candidate/share/:id  — HR shares with employees
export const shareCandidate = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const { employeeIds } = req.body; // array of user IDs

    if (!employeeIds || !Array.isArray(employeeIds)) {
      return res.status(400).json({ message: "employeeIds array is required" });
    }

    let candidate = await Candidate.findOne({ id });
    if (!candidate) {
      candidate = await Candidate.findById(id.match(/^[0-9a-fA-F]{24}$/) ? id : null);
    }
    if (!candidate) return res.status(404).json({ message: "Not found" });

    const newIds = employeeIds.map((eid: string) => new mongoose.Types.ObjectId(eid));
    const existing = candidate.sharedWith.map((id) => id.toString());
    for (const nid of newIds) {
      if (!existing.includes(nid.toString())) {
        candidate.sharedWith.push(nid);
      }
    }

    await candidate.save();
    res.json({ success: true, sharedWith: candidate.sharedWith });
  } catch (error) {
    console.error("Error sharing candidate:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PATCH /api/candidate/share-hr/:id  — Employee shares with all HR/Admins
export const shareCandidateToHR = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const userId = req.userId;

    let candidate = await Candidate.findOne({ id });
    if (!candidate) {
      candidate = await Candidate.findById(id.match(/^[0-9a-fA-F]{24}$/) ? id : null);
    }
    if (!candidate) return res.status(404).json({ message: "Not found" });

    // Only the owner can share with HR
    if (candidate.userId.toString() !== userId) {
      return res.status(403).json({ message: "Only the owner can share with HR" });
    }

    candidate.isSharedWithHR = true;
    candidate.updatedAt = new Date();
    await candidate.save();

    res.json({ success: true, isSharedWithHR: candidate.isSharedWithHR });
  } catch (error) {
    console.error("Error sharing to HR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @route   PATCH /api/candidate/status/:id  — Employee approves/rejects
export const updateCandidateStatus = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const { status } = req.body;
    const userId = req.userId;
    const role = req.userRole;

    if (!["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    let candidate = await Candidate.findOne({ id });
    if (!candidate) {
      candidate = await Candidate.findById(id.match(/^[0-9a-fA-F]{24}$/) ? id : null);
    }
    if (!candidate) return res.status(404).json({ message: "Not found" });

    // Employee can only update status of candidates shared with them
    if (role === "Employee") {
      const sharedIds = candidate.sharedWith.map((id) => id.toString());
      if (!sharedIds.includes(userId)) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    candidate.status = status;
    candidate.updatedAt = new Date();
    await candidate.save();

    res.json({ success: true, status: candidate.status });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Server error" });
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

    const uploadStream = gfs.openUploadStream(filename, {
      metadata: { contentType: req.file.mimetype },
    });

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
          filename: filename,
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
