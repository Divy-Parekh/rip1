import mongoose from "mongoose";
import app from "./app.js";
import { PORT, MONGO_URL } from "./config/env.js";

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log("DB connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
};

startServer();
