import mongoose, { Schema, Document, Types } from "mongoose";

export interface IWorkLog extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  title?: string; // Auto-extracted or custom title
  content: string; // HTML formatted text from TipTap editor
  adminRemark?: string; // Feedback/remark given by admin
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkLogSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "",
    },
    content: {
      type: String,
      default: "",
    },
    adminRemark: {
      type: String,
      default: "",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one work log entry per user per date
WorkLogSchema.index({ userId: 1, date: 1 }, { unique: true });

if (mongoose.models.WorkLog) {
  delete mongoose.models.WorkLog;
}

export const WorkLog = mongoose.model<IWorkLog>("WorkLog", WorkLogSchema);
