import type { Response } from "express";
import { v4 as uuidv4 } from "uuid";
import Job from "../models/job.model.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";

// @route   GET /api/jobs/all
export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const jobs = await Job.find({ userId: userId as any }).sort({ createdAt: -1 });
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ success: false, message: "Server error fetching jobs" });
  }
};

// @route   GET /api/jobs/:id
export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const userId = req.userId;
    const job = await Job.findOne({ id, userId: userId as any });
    if (!job) return res.status(404).json({ message: "Job role not found" });
    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching job by id:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @route   POST /api/jobs
export const createJob = async (req: AuthRequest, res: Response) => {
  try {
    const { title, requiredSkills, minExperience, description } = req.body;
    const userId = req.userId;

    if (!title) {
      return res.status(400).json({ success: false, message: "Title is required" });
    }

    const newJob = new Job({
      id: uuidv4(),
      userId: userId as any,
      title,
      requiredSkills: requiredSkills || [],
      minExperience: minExperience ?? 0,
      description: description || "",
      createdAt: new Date(),
    });

    const saved = await newJob.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ success: false, message: "Server error creating job" });
  }
};

// @route   PUT /api/jobs/:id
export const updateJob = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const userId = req.userId;
    const updateData = req.body;

    const updated = await Job.findOneAndUpdate(
      { id, userId: userId as any },
      { ...updateData },
      { new: true },
    );
    if (!updated) return res.status(404).json({ message: "Job role not found" });

    res.status(200).json(updated);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// @route   DELETE /api/jobs/:id
export const deleteJob = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params["id"] as string;
    const userId = req.userId;

    const deleted = await Job.findOneAndDelete({ id, userId: userId as any });
    if (!deleted) return res.status(404).json({ message: "Job role not found" });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
