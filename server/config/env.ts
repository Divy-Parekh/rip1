import dotenv from "dotenv";

dotenv.config();

export const PORT = process.env.PORT || 5000;
export const MONGO_USER = process.env.MONGO_USER || "dipanshuchoksi";
export const MONGO_PASSWORD =
  process.env.MONGO_PASSWORD || "mongo_password@123";
export const JWT_SECRET = process.env.JWT_SECRET || "jwt_secret";
