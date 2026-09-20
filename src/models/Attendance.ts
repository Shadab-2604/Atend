import mongoose, { Schema, Document, Types } from "mongoose";

export type AttendanceStatus = "present" | "working" | "absent" | "pending" | "half-day" | "holiday" | "upcoming" | "ul" | "pl";

export interface IAttendanceRecord extends Document {
  userId: Types.ObjectId;
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1..45
  status: AttendanceStatus;
  workMode?: "WFO" | "WFH";
  login: {
    time: string;
    timestamp: Date;
  } | null;
  logout: {
    time: string;
    timestamp: Date;
  } | null;
  duration: {
    totalMinutes: number;
    hours: number;
    minutes: number;
  };
  notes?: string;
  breakMinutes?: number;
  oooMinutes?: number;
  regularizationStatus?: "pending" | "approved" | "rejected";
  regularizationReason?: string;
  adminRejectionReason?: string;
  isAutoPunchOut?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    date: {
      type: String,
      required: true,
      index: true
    },
    dayNumber: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["present", "working", "absent", "pending", "half-day", "holiday", "upcoming", "ul", "pl"],
      default: "upcoming"
    },
    workMode: {
      type: String,
      enum: ["WFO", "WFH"],
      default: "WFO"
    },
    login: {
      time: { type: String },
      timestamp: { type: Date }
    },
    logout: {
      time: { type: String },
      timestamp: { type: Date }
    },
    duration: {
      totalMinutes: { type: Number, default: 0 },
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 }
    },
    notes: {
      type: String,
      default: ""
    },
    breakMinutes: {
      type: Number,
      default: 0
    },
    oooMinutes: {
      type: Number,
      default: 0
    },
    regularizationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: undefined
    },
    regularizationReason: {
      type: String,
      default: ""
    },
    adminRejectionReason: {
      type: String,
      default: ""
    },
    isAutoPunchOut: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export const Attendance = mongoose.models.Attendance || mongoose.model<IAttendanceRecord>("Attendance", AttendanceSchema);
