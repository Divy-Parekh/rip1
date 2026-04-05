import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export interface AuthRequest extends Request {
  userId: string;
}

export const verifyToken = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Invalid token format" });
    }
    const decoded = jwt.verify(token, JWT_SECRET as string) as unknown as { userId: string };

    (req as AuthRequest).userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};
