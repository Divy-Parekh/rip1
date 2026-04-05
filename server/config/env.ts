import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_URL =
  process.env.MONGO_URL || ""
export const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret";
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
