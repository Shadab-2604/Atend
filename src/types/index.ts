export type UserRole = "intern" | "admin" | string;
export type PresenceStatus = "working" | "break" | "ooo" | "logged_out";
export type AttendanceStatus = "present" | "working" | "absent" | "pending" | "half-day" | "holiday" | "upcoming";
export type WorkMode = "WFO" | "WFH";
export type RegularizationStatus = "pending" | "approved" | "rejected";

export interface User {
  id: string;
  _id?: string;
  username: string;
  name: string;
  email?: string;
  role: UserRole;
  currentStatus: PresenceStatus;
  loginTime: string | null;
  loginTimestamp: string | null;
  logoutTime: string | null;
  breakStartTime: string | null;
  totalBreakMinutes: number;
  oooStartTime: string | null;
  totalOooMinutes?: number;
  todayWorkingMinutes: number;
  lastStatusChangeTimestamp?: string | Date | null;
  accumulatedWorkSeconds?: number;
  accumulatedBreakSeconds?: number;
  accumulatedOooSeconds?: number;
}

export interface AttendanceRecord {
  _id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  dayNumber: number;
  status: AttendanceStatus;
  workMode?: WorkMode;
  login: {
    time: string;
    timestamp: string;
  } | null;
  logout: {
    time: string;
    timestamp: string;
  } | null;
  duration: {
    totalMinutes: number;
    hours: number;
    minutes: number;
  };
  notes?: string;
  breakMinutes?: number;
  oooMinutes?: number;
  regularizationStatus?: RegularizationStatus;
  regularizationReason?: string;
  adminRejectionReason?: string;
  isAutoPunchOut?: boolean;
}

export interface RegularizationRequest {
  _id?: string;
  id?: string;
  userId: string;
  userName: string;
  date: string;
  workMode: WorkMode;
  hours: number;
  reason: string;
  status: RegularizationStatus;
  adminReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SummaryStats {
  completedDays: number;
  remainingDays: number;
  attendancePercentage: number;
  totalWorkingHours: number;
  averageWorkingHours: number;
  totalWorkingMinutes: number;
  averageWorkingMinutes: number;
}

export interface SettingsData {
  title: string;
  totalWorkingDays: number;
  startDate: string;
  endDate: string;
  workingHoursPerDay: number;
}

export interface AdminMetrics {
  total: number;
  working: number;
  break: number;
  ooo: number;
  loggedOut: number;
}
