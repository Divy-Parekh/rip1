import express from "express";
import {
  createCandidate,
  getCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidate,
  deleteCandidate
} from "../controllers/candidate.controller.js";

const router = express.Router();

router.get("/all", getAllCandidates);
router.post("/create", createCandidate);
router.get("/", getCandidate);
router.get("/:id", getCandidateById);
router.put("/:id", updateCandidate);
router.delete("/:id", deleteCandidate);

export default router;
