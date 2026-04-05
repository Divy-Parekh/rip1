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
} from "../controllers/candidate.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
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

export default router;
