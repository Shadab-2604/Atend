import mongoose, { Schema, Document } from "mongoose";

export type UserRole = "intern" | "admin" | string;
export type PresenceStatus = "working" | "break" | "ooo" | "logged_out";

export interface IUser extends Document {
  username: string;
  password: string;
  name: string;
  email?: string;
  role: UserRole;
  currentStatus: PresenceStatus;
  loginTime: string | null;
  loginTimestamp: Date | null;
  logoutTime: string | null;
  breakStartTime: Date | null;
  totalBreakMinutes: number;
  oooStartTime: Date | null;
  totalOooMinutes: number;
  todayWorkingMinutes: number;
  lastStatusChangeTimestamp: Date | null;
  accumulatedWorkSeconds: number;
  accumulatedBreakSeconds: number;
  accumulatedOooSeconds: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    password: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: ""
    },
    role: {
      type: String,
      default: "intern",
      trim: true
    },
    currentStatus: {
      type: String,
      enum: ["working", "break", "ooo", "logged_out"],
      default: "logged_out"
    },
    loginTime: {
      type: String,
      default: null
    },
    loginTimestamp: {
      type: Date,
      default: null
    },
    logoutTime: {
      type: String,
      default: null
    },
    breakStartTime: {
      type: Date,
      default: null
    },
    totalBreakMinutes: {
      type: Number,
      default: 0
    },
    oooStartTime: {
      type: Date,
      default: null
    },
    totalOooMinutes: {
      type: Number,
      default: 0
    },
    todayWorkingMinutes: {
      type: Number,
      default: 0
    },
    lastStatusChangeTimestamp: {
      type: Date,
      default: null
    },
    accumulatedWorkSeconds: {
      type: Number,
      default: 0
    },
    accumulatedBreakSeconds: {
      type: Number,
      default: 0
    },
    accumulatedOooSeconds: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
