import express from "express";
import { login, signup, createUser } from "../controllers/auth.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { requireRole } from "../middlewares/role.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/create-user", verifyToken, requireRole("Admin", "HR") as any, createUser as any);

export default router;
