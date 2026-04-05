import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.route.js";
import candidateRoutes from "./routes/candidate.route.js";
import cors from "cors";
import { MONGO_URL } from "./config/env.js";
import jobRoutes from "./routes/job.route.js";
import aiRoutes from "./routes/ai.route.js";
import userRoutes from "./routes/user.route.js";
import driveRoutes from "./routes/drive.route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "OK" });
});

// routes
app.use("/api/auth", authRoutes);
app.use("/api/candidate", candidateRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api/users", userRoutes);
app.use("/api/drives", driveRoutes);

// DB connection removed here to be managed by server.ts cleanup
export default app;
