import mongoose, { Schema, Document, Types } from "mongoose";

export type RegularizationStatus = "pending" | "approved" | "rejected";
export type WorkMode = "WFO" | "WFH";

export interface IRegularizationRequest extends Document {
  userId: Types.ObjectId;
  userName: string;
  date: string; // YYYY-MM-DD
  workMode: WorkMode;
  hours: number;
  reason: string;
  status: RegularizationStatus;
  adminReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RegularizationRequestSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    userName: {
      type: String,
      required: true,
      trim: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    workMode: {
      type: String,
      enum: ["WFO", "WFH"],
      default: "WFO",
      required: true
    },
    hours: {
      type: Number,
      required: true,
      min: 1,
      max: 24,
      default: 8
    },
    reason: {
      type: String,
      required: true,
      trim: true
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },
    adminReason: {
      type: String,
      default: ""
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

RegularizationRequestSchema.index({ userId: 1, date: 1 });

if (mongoose.models.RegularizationRequest) {
  delete mongoose.models.RegularizationRequest;
}

export const RegularizationRequest = mongoose.model<IRegularizationRequest>("RegularizationRequest", RegularizationRequestSchema);
