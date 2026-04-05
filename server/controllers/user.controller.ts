import type { Response } from "express";
import User from "../models/user.model.js";
import type { AuthRequest } from "../middlewares/auth.middleware.js";
import bcrypt from "bcrypt";

// GET /api/users — Admin gets all; HR gets employees only
export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { userRole } = req;
    let query = {};
    if (userRole === "HR") {
      query = { role: "Employee" };
    }
    const users = await User.find(query)
      .select("-password")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// POST /api/users — Admin creates HR or Employee; HR creates Employee only
export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    const creatorRole = req.userRole;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // HR cannot create HR or Admin accounts
    if (creatorRole === "HR" && role !== "Employee") {
      return res.status(403).json({ message: "HR can only create Employee accounts" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      name,
      email,
      password: hashed,
      role,
      createdBy: req.userId,
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        createdAt: newUser.createdAt,
      },
    });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /api/users/:id — Admin only
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User deleted successfully" });
  } catch {
    res.status(500).json({ message: "Server error" });
  }
};
