import type { Request, Response } from "express";
import Candidate from "../models/candidate.model.js";

// @route   POST /api/candidate/create
export const createCandidate = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, versions, currentData } = req.body;

    const newCandidate = new Candidate({
      fullName: fullName || currentData?.fullName || "Unknown",
      email: email || currentData?.email || "",
      phone: phone || currentData?.phone || "",
      versions: versions || [],
      currentData: currentData || {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const savedCandidate = await newCandidate.save();

    res.status(201).json(savedCandidate);
  } catch (error) {
    console.error("Error creating candidate:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error creating candidate" });
  }
};

// @route   GET /api/candidate/all
export const getAllCandidates = async (req: Request, res: Response) => {
  try {
    const candidates = await Candidate.find();
    res.status(200).json(candidates);
  } catch (error) {
    console.error("Error fetching all candidates:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error fetching candidates" });
  }
};

// @route   GET /api/candidate/:id
export const getCandidateById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Assuming 'id' is standard string, might need to map to _id if using default mongoose IDs, 
    // but Wait, the frontend passes `candidate.id` which might be a custom string from uuid. 
    // Let's check candidate model if 'id' is a custom field or if it relies on _id.
    // In storageService.ts, frontend creates `id: uuidv4()`. So we should search by `id` if there is an `id` field.
    let candidate = await Candidate.findOne({ id });
    if (!candidate) {
        // Fallback to _id if needed
        candidate = await Candidate.findById(id).catch(() => null);
    }
    
    if (!candidate) return res.status(404).json({ message: "Not found "});

    res.status(200).json(candidate);
  } catch (error) {
    console.error("Error fetching candidate by id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @route   GET /api/candidate
export const getCandidate = async (req: Request, res: Response) => {
  try {
    let email = req.query.email as string;
    let phone = req.query.phone as string;
    
    email = email?.toLowerCase().trim();
    phone = phone?.replace(/\D/g, "").trim() || "";

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: "Email or phone is required",
      });
    }

    let candidate = await Candidate.findOne({ email });
    if (!candidate && phone) {
      candidate = await Candidate.findOne({ phone });
    }

    if (!candidate) {
      return res.status(404).json(null);
    }

    res.status(200).json(candidate);
  } catch (error) {
    console.error("Error finding candidate:", error);
    res
      .status(500)
      .json({ success: false, message: "Server error finding candidate" });
  }
};

// @route   PUT /api/candidate/:id
export const updateCandidate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Attempt update by 'id' field first, then by _id
    let updated = await Candidate.findOneAndUpdate({ id }, updateData, { new: true });
    if (!updated) {
       updated = await Candidate.findByIdAndUpdate(id, updateData, { new: true });
    }

    if (!updated) return res.status(404).json({ message: "Not found" });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating candidate:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @route   DELETE /api/candidate/:id
export const deleteCandidate = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    let deleted = await Candidate.findOneAndDelete({ id });
    if (!deleted) {
       deleted = await Candidate.findByIdAndDelete(id);
    }

    if (!deleted) return res.status(404).json({ message: "Not found" });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
