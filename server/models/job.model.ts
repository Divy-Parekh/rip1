import mongoose, { Document, Schema } from "mongoose";

export interface IJob extends Document {
  id: string; // client-generated uuid
  userId: mongoose.Types.ObjectId;
  title: string;
  requiredSkills: string[];
  minExperience: number;
  description: string;
  createdAt: Date;
}

const JobSchema = new Schema<IJob>({
  id: { type: String, required: true, unique: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  requiredSkills: [{ type: String }],
  minExperience: { type: Number, default: 0 },
  description: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IJob>("Job", JobSchema);
