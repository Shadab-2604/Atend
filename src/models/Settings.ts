import mongoose, { Schema, Document } from "mongoose";

export interface ISettings extends Document {
  title: string;
  totalWorkingDays: number;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  workingHoursPerDay: number;
}

const SettingsSchema: Schema = new Schema(
  {
    title: { type: String, default: "Internship Attendance Tracker" },
    totalWorkingDays: { type: Number, default: 45 },
    startDate: { type: String, default: "2026-09-15" },
    endDate: { type: String, default: "2026-11-05" },
    workingHoursPerDay: { type: Number, default: 8 }
  },
  { timestamps: true }
);

export const Settings = mongoose.models.Settings || mongoose.model<ISettings>("Settings", SettingsSchema);
