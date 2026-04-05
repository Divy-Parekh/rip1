import mongoose, { Document, Schema } from "mongoose";

export type UserRole = "Admin" | "HR" | "Employee";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Admin", "HR", "Employee"], default: "Employee" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUser>("User", UserSchema);
