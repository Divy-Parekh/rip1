import express from "express";
import {
  createCandidate,
  getCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate,
  uploadResume,
  downloadResume,
  shareCandidate,
  updateCandidateStatus,
  shareCandidateToHR,
} from "../controllers/candidate.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { upload } from "../config/gridfs.js";

const router = express.Router();

router.use(verifyToken);

router.get("/all", getAllCandidates as any);
router.post("/create", createCandidate as any);
router.get("/", getCandidate as any);
router.get("/:id", getCandidateById as any);
router.put("/:id", updateCandidate as any);
router.delete("/:id", deleteCandidate as any);
router.post("/upload", upload.single("file"), uploadResume as any);
router.get("/download/:fileId", downloadResume as any);

// Role-specific routes
router.post("/share/:id", requireRole("Admin", "HR") as any, shareCandidate as any);
router.patch("/status/:id", updateCandidateStatus as any);
router.patch("/share-hr/:id", shareCandidateToHR as any);

export default router;
