import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.route.js";
import candidateRoutes from "./routes/candidate.route.js";
import cors from "cors";
import { MONGO_URL } from "./config/env.js";
import jobRoutes from "./routes/job.route.js";
import aiRoutes from "./routes/ai.route.js";

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

mongoose
  .connect(MONGO_URL)
  .then(() => console.log("DB connected"))
  .catch((err) => console.error(err));

export default app;
