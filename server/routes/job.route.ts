import express from "express";
import type { Request, Response } from "express";

const router = express.Router();

router.get("/", (req: Request, res: Response) => {
  res.status(200).json({ message: "Hello world" });
});

export default router;
