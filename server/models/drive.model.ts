import mongoose, { Document, Schema } from "mongoose";

export interface IRecruitmentDrive extends Document {
  title: string;
  description?: string;
  slug: string;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  availableRoles: string[];
  createdAt: Date;
}

const DriveSchema = new Schema<IRecruitmentDrive>({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  slug: { type: String, required: true, unique: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isActive: { type: Boolean, default: true },
  availableRoles: [{ type: String }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IRecruitmentDrive>("RecruitmentDrive", DriveSchema);
