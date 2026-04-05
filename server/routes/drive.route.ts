import express from "express";
import {
  createDrive,
  listDrives,
  toggleDrive,
  deleteDrive,
  getDriveBySlug,
  submitToDrive,
} from "../controllers/drive.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";
import { upload } from "../config/gridfs.js";

const router = express.Router();

// Public routes (no auth)
router.get("/public/:slug", getDriveBySlug as any);
router.post("/public/:slug/submit", upload.single("resume"), submitToDrive as any);

// Protected routes
router.use(verifyToken);
router.get("/", requireRole("Admin", "HR") as any, listDrives as any);
router.post("/", requireRole("Admin", "HR") as any, createDrive as any);
router.patch("/:slug/toggle", requireRole("Admin", "HR") as any, toggleDrive as any);
router.delete("/:slug", requireRole("Admin", "HR") as any, deleteDrive as any);

export default router;
