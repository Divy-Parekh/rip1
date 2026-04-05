import express from "express";
import { listUsers, createUser, deleteUser } from "../controllers/user.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", requireRole("Admin", "HR") as any, listUsers as any);
router.post("/", requireRole("Admin", "HR") as any, createUser as any);
router.delete("/:id", requireRole("Admin") as any, deleteUser as any);

export default router;
