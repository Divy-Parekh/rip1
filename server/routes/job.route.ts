import express from "express";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
} from "../controllers/job.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.post("/", createJob as any);
router.get("/all", getJobs as any);
router.get("/:id", getJobById as any);
router.put("/:id", updateJob as any);
router.delete("/:id", deleteJob as any);

export default router;
