"use client";

import React, { useEffect, useRef } from "react";
import { AttendanceRecord, AttendanceStatus } from "@/types";
import {
  Calendar,
  Clock,
  Coffee,
  AlertCircle,
  CheckCircle2,
  X,
  FileCheck,
  FileText,
  Building2,
  AlertTriangle,
  Timer,
  Check,
} from "lucide-react";
import { formatTo12Hour } from "@/lib/formatters";

interface DayDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  record?: AttendanceRecord;
  dayNumber?: number | null;
  isWorkingDay?: boolean;
  isSunday?: boolean;
  isSaturday?: boolean;
  onOpenRegularize?: (date: string) => void;
  onOpenWorkLog?: (date: string) => void;
  onAdminOverrideStatus?: (date: string, status: AttendanceStatus) => Promise<void>;
  isAdmin?: boolean;
}

export const DayDetailsModal: React.FC<DayDetailsModalProps> = ({
  isOpen,
  onClose,
  date,
  record,
  dayNumber,
  isWorkingDay = true,
  isSunday = false,
  isSaturday = false,
  onOpenRegularize,
  onOpenWorkLog,
  onAdminOverrideStatus,
  isAdmin = false,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [updatingStatus, setUpdatingStatus] = React.useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const dateObj = new Date(`${date}T12:00:00`);
  const formattedFullDate = !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : date;

  const status: AttendanceStatus =
    record?.status || (isSunday ? "holiday" : isWorkingDay ? "upcoming" : "holiday");

  const isAbsent = status === "absent" || status === "ul" || status === "pl";
  const totalWorkingMins = isAbsent ? 0 : (record?.duration?.totalMinutes || 0);
  const breakMins = isAbsent ? 0 : (record?.breakMinutes || 0);
  const oooMins = isAbsent ? 0 : (record?.oooMinutes || 0);
  const totalShiftMins = isAbsent ? 0 : (totalWorkingMins + breakMins + oooMins);

  const isFullDayGoal = totalWorkingMins >= 555;
  const canRegularize = (status === "half-day" || status === "absent") && !isSunday;

  const handleAdminStatusClick = async (newStatus: AttendanceStatus) => {
    if (!onAdminOverrideStatus) return;
    setUpdatingStatus(true);
    try {
      await onAdminOverrideStatus(date, newStatus);
    } catch (err) {
      console.error("Admin status override error:", err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md animate-fade-in"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl p-5 sm:p-7 border transition-all"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-medium)",
          color: "var(--text-primary)",
        }}
      >
        <div
          className="flex items-start justify-between pb-4 border-b mb-5"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                  {formattedFullDate}
                </h2>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                {dayNumber ? (
                  <span
                    className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: "var(--bg-surface-elevated)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Official Day #{dayNumber}
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: "var(--bg-surface-elevated)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-muted)",
                    }}
                  >
                    {isSunday ? "Sunday Off" : "Weekend / Scheduled Rest"}
                  </span>
                )}
                <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                  {date}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border transition-all hover:brightness-125"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="p-4 rounded-2xl border mb-5 flex items-center justify-between gap-3"
          style={{
            backgroundColor:
              status === "present"
                ? "var(--status-working-bg)"
                : status === "half-day"
                ? "var(--status-break-bg)"
                : status === "absent"
                ? "var(--status-ooo-bg)"
                : status === "ul"
                ? "rgba(245, 158, 11, 0.12)"
                : status === "pl"
                ? "rgba(168, 85, 247, 0.12)"
                : "var(--bg-surface-elevated)",
            borderColor:
              status === "present"
                ? "var(--status-working-border)"
                : status === "half-day"
                ? "var(--status-break-border)"
                : status === "absent"
                ? "var(--status-ooo-border)"
                : status === "ul"
                ? "rgba(245, 158, 11, 0.35)"
                : status === "pl"
                ? "rgba(168, 85, 247, 0.35)"
                : "var(--border-subtle)",
          }}
        >
          <div>
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{
                color:
                  status === "present"
                    ? "var(--status-working-text)"
                    : status === "half-day"
                    ? "var(--status-break-text)"
                    : status === "absent"
                    ? "var(--status-ooo-text)"
                    : status === "ul"
                    ? "#f59e0b"
                    : status === "pl"
                    ? "#a855f7"
                    : "var(--text-secondary)",
              }}
            >
              Verified Status
            </span>
            <h3
              className="text-base sm:text-lg font-black capitalize mt-0.5 flex items-center gap-2"
              style={{
                color:
                  status === "present"
                    ? "var(--status-working-text)"
                    : status === "half-day"
                    ? "var(--status-break-text)"
                    : status === "absent"
                    ? "var(--status-ooo-text)"
                    : status === "ul"
                    ? "#f59e0b"
                    : status === "pl"
                    ? "#a855f7"
                    : "var(--text-primary)",
              }}
            >
              {status === "present"
                ? (record?.isAutoPunchOut ? "Full Day Present (Auto Punch-Out)" : "Full Day Present")
                : status === "half-day"
                ? (record?.isAutoPunchOut ? "Half-Day Recorded (Auto Punch-Out)" : "Half-Day Recorded")
                : status === "absent"
                ? "Absent"
                : status === "ul"
                ? "UL (Unplanned Leave)"
                : status === "pl"
                ? "PL (Planned Leave)"
                : status === "working"
                ? "Active Working Shift"
                : status === "pending"
                ? "Regularization Pending Review"
                : isSunday
                ? "Sunday Off"
                : "Scheduled Upcoming"}
            </h3>
          </div>

          <div className="shrink-0">
            {status === "present" && (
              <CheckCircle2 className="w-6 h-6" style={{ color: "var(--status-working-text)" }} />
            )}
            {status === "half-day" && (
              <Timer className="w-6 h-6" style={{ color: "var(--status-break-text)" }} />
            )}
            {(status === "absent" || status === "ul") && (
              <AlertCircle className="w-6 h-6" style={{ color: status === "ul" ? "#f59e0b" : "var(--status-ooo-text)" }} />
            )}
            {status === "pl" && (
              <FileCheck className="w-6 h-6" style={{ color: "#a855f7" }} />
            )}
          </div>
        </div>

        {/* ADMIN OVERRIDE BUTTONS BAR */}
        {onAdminOverrideStatus && (
          <div
            className="p-3.5 rounded-2xl border mb-5 space-y-2"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-medium)",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Admin Control: Mark Attendance
              </span>
              {updatingStatus && <span className="text-[10px] font-mono animate-pulse">Updating...</span>}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleAdminStatusClick("present")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  status === "present" ? "ring-2 ring-emerald-400" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: "var(--status-working-bg)",
                  borderColor: "var(--status-working-border)",
                  color: "var(--status-working-text)",
                }}
              >
                Present
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleAdminStatusClick("absent")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  status === "absent" ? "ring-2 ring-rose-400" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: "var(--status-ooo-bg)",
                  borderColor: "var(--status-ooo-border)",
                  color: "var(--status-ooo-text)",
                }}
              >
                Absent
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleAdminStatusClick("half-day")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  status === "half-day" ? "ring-2 ring-amber-400" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: "var(--status-break-bg)",
                  borderColor: "var(--status-break-border)",
                  color: "var(--status-break-text)",
                }}
              >
                Half Day
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleAdminStatusClick("ul")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  status === "ul" ? "ring-2 ring-amber-500" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: "rgba(245, 158, 11, 0.15)",
                  borderColor: "rgba(245, 158, 11, 0.4)",
                  color: "#f59e0b",
                }}
              >
                UL (Unplanned)
              </button>
              <button
                type="button"
                disabled={updatingStatus}
                onClick={() => handleAdminStatusClick("pl")}
                className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  status === "pl" ? "ring-2 ring-purple-500" : "opacity-80 hover:opacity-100"
                }`}
                style={{
                  backgroundColor: "rgba(168, 85, 247, 0.15)",
                  borderColor: "rgba(168, 85, 247, 0.4)",
                  color: "#a855f7",
                }}
              >
                PL (Planned)
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 mb-5">
          <div
            className="p-3 rounded-xl border flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Working Time
            </span>
            <div className="text-base sm:text-lg font-mono font-black mt-1" style={{ color: isAbsent ? "var(--status-ooo-text)" : "var(--status-working-text)" }}>
              {isAbsent ? "0h 0m" : totalWorkingMins > 0
                ? `${Math.floor(totalWorkingMins / 60)}h ${totalWorkingMins % 60}m`
                : "--"}
            </div>
            <span className="text-[9px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {isAbsent ? "Absent (No Hours)" : totalWorkingMins >= 555 ? "9.15h+ Full Day" : totalWorkingMins > 0 ? "< 9.15h Half Day" : "--"}
            </span>
          </div>

          <div
            className="p-3 rounded-xl border flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Break Time
            </span>
            <div className="text-base sm:text-lg font-mono font-black mt-1" style={{ color: "var(--status-break-text)" }}>
              {breakMins > 0 ? `${breakMins}m` : "--"}
            </div>
            <span className="text-[9px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {breakMins > 0 ? "Cumulative" : "No breaks"}
            </span>
          </div>

          <div
            className="p-3 rounded-xl border flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              OOO Time
            </span>
            <div className="text-base sm:text-lg font-mono font-black mt-1" style={{ color: "var(--status-ooo-text)" }}>
              {oooMins > 0 ? `${oooMins}m` : "--"}
            </div>
            <span className="text-[9px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {oooMins > 0 ? "Out of Office" : "None"}
            </span>
          </div>

          <div
            className="p-3 rounded-xl border flex flex-col justify-between"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Total Shift
            </span>
            <div className="text-base sm:text-lg font-mono font-black mt-1" style={{ color: "var(--text-primary)" }}>
              {isAbsent ? "0h 0m" : totalShiftMins > 0
                ? `${Math.floor(totalShiftMins / 60)}h ${totalShiftMins % 60}m`
                : "--"}
            </div>
            <span className="text-[9px] mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {isAbsent ? "Absent (0h)" : "Gross Elapsed"}
            </span>
          </div>
        </div>

        <div
          className="p-4 rounded-2xl border mb-5 space-y-2.5 text-xs font-mono"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <span style={{ color: "var(--text-muted)" }}>Punch In Time:</span>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>
              {isAbsent
                ? (record?.login?.time ? `Requested: ${formatTo12Hour(record.login.time)} (Rejected)` : "Absent / Not Clocked In")
                : (formatTo12Hour(record?.login?.time))}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <span style={{ color: "var(--text-muted)" }}>Punch Out Time:</span>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>
              {isAbsent
                ? (record?.logout?.time ? `Requested: ${formatTo12Hour(record.logout.time)} (Rejected)` : "--:--")
                : (status === "working"
                    ? "Currently Clocked In"
                    : `${formatTo12Hour(record?.logout?.time)}${record?.isAutoPunchOut ? " (Auto Punch-Out)" : ""}`)}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <span style={{ color: "var(--text-muted)" }}>Work Mode:</span>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>
              {record?.workMode || "WFO (Office)"}
            </span>
          </div>

          {record?.notes && (
            <div className="flex items-start justify-between gap-2 pt-1 font-sans">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>Notes:</span>
              <span className="text-xs font-medium text-right" style={{ color: "var(--text-secondary)" }}>
                {record.notes}
              </span>
            </div>
          )}
        </div>

        {record?.isAutoPunchOut && (
          <div
            className="p-3.5 rounded-xl border mb-5 text-xs flex items-start gap-2.5"
            style={{
              backgroundColor: "rgba(245, 158, 11, 0.08)",
              borderColor: "rgba(245, 158, 11, 0.3)",
              color: "#f59e0b",
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
            <div>
              <span className="font-bold block text-xs">System Auto Punch-Out:</span>
              <p className="mt-0.5 leading-relaxed text-amber-200/90">
                You did not punch out before midnight. The system automatically recorded your clock-out at 11:59 PM to close your daily shift and compute your total logged time. You can submit a regularization request below if you need to adjust this day&apos;s shift hours.
              </p>
            </div>
          </div>
        )}

        {record?.adminRejectionReason && (
          <div
            className="p-3.5 rounded-xl border mb-5 text-xs flex items-start gap-2.5"
            style={{
              backgroundColor: "var(--status-ooo-bg)",
              borderColor: "var(--status-ooo-border)",
              color: "var(--status-ooo-text)",
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-xs">Supervisor Admin Feedback:</span>
              <p className="mt-0.5 leading-relaxed">&ldquo;{record.adminRejectionReason}&rdquo;</p>
            </div>
          </div>
        )}

        {record?.regularizationStatus === "pending" && (
          <div
            className="p-3.5 rounded-xl border mb-5 text-xs flex items-center gap-2.5"
            style={{
              backgroundColor: "var(--status-break-bg)",
              borderColor: "var(--status-break-border)",
              color: "var(--status-break-text)",
            }}
          >
            <Timer className="w-4 h-4 shrink-0" />
            <span>A regularization request for this date is currently pending supervisor review.</span>
          </div>
        )}

        {record?.regularizationStatus === "approved" && (
          <div
            className="p-3 rounded-xl border mb-5 text-xs flex items-center gap-2"
            style={{
              backgroundColor: "var(--status-working-bg)",
              borderColor: "var(--status-working-border)",
              color: "var(--status-working-text)",
            }}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span className="font-bold">Attendance Regularization Approved by Admin</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
          {onOpenWorkLog && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenWorkLog(date);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all hover:brightness-110 shadow-sm"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              <span>View / Edit Work Log</span>
            </button>
          )}

          {canRegularize && onOpenRegularize && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRegularize(date);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md hover:brightness-110"
              style={{
                backgroundColor: "var(--accent-primary)",
                color: "var(--accent-text)",
                boxShadow: "0 4px 14px var(--accent-glow)",
              }}
            >
              <FileCheck className="w-4 h-4" />
              <span>Request Regularization</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border text-xs font-bold transition-all hover:brightness-110"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
