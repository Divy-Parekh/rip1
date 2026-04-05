import express from "express";
import {
  parseResume,
  matchRole,
  generateQuestions,
} from "../controllers/ai.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

// POST /api/ai/parse-resume  — parse raw resume text → structured JSON
router.post("/parse-resume", parseResume as any);

// POST /api/ai/match-role    — match candidate data vs job role
router.post("/match-role", matchRole as any);

// POST /api/ai/generate-questions — final step after selection
router.post("/generate-questions", generateQuestions as any);

export default router;
