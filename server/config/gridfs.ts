import mongoose from "mongoose";
import multer from "multer";

// Initialize GridFS bucket
let gfs: mongoose.mongo.GridFSBucket;

mongoose.connection.once("open", () => {
  gfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db!, {
    bucketName: "resumes",
  });
});

// Use memory storage for reliable streaming
const storage = multer.memoryStorage();

export const upload = multer({ storage });

export const getGfs = () => {
    if (!gfs) {
        return new mongoose.mongo.GridFSBucket(mongoose.connection.db!, {
            bucketName: "resumes",
        });
    }
    return gfs;
};
