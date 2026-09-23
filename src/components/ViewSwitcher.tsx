"use client";

import React from "react";
import { Clock, Calendar, FileText } from "lucide-react";

export type EmployeeViewMode = "current" | "history" | "worklog";

interface ViewSwitcherProps {
  currentMode: EmployeeViewMode;
  onModeChange: (mode: EmployeeViewMode) => void;
  absentCount?: number;
  todayStatus?: string;
  hasSubmittedWorkLogToday?: boolean;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentMode,
  onModeChange,
  absentCount = 0,
  todayStatus = "logged_out",
  hasSubmittedWorkLogToday = false,
}) => {
  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-6">
      {/* 3-Option Navigation Bar */}
      <div
        className="w-full flex items-center gap-1.5 p-1.5 rounded-2xl border shadow-sm backdrop-blur-md overflow-x-auto no-scrollbar touch-scroll max-w-full"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        {/* Option 1: Current Day */}
        <button
          type="button"
          onClick={() => onModeChange("current")}
          className={`flex-1 sm:flex-initial justify-center px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap shrink-0 ${
            currentMode === "current"
              ? "shadow-sm"
              : "opacity-75 hover:opacity-100 hover:brightness-110"
          }`}
          style={{
            backgroundColor:
              currentMode === "current" ? "var(--bg-surface-elevated)" : "transparent",
            color: "var(--text-primary)",
            border: currentMode === "current" ? "1px solid var(--border-medium)" : "1px solid transparent",
          }}
        >
          <Clock className="w-4 h-4 shrink-0" style={{ color: "var(--text-primary)" }} />
          <span>Current Day</span>
          <span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full border hidden sm:inline-block"
            style={{
              backgroundColor: "var(--bg-surface-subtle)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            Today
          </span>
        </button>

        {/* Option 2: Attendance History & Calendar */}
        <button
          type="button"
          onClick={() => onModeChange("history")}
          className={`flex-1 sm:flex-initial justify-center px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap shrink-0 ${
            currentMode === "history"
              ? "shadow-sm"
              : "opacity-75 hover:opacity-100 hover:brightness-110"
          }`}
          style={{
            backgroundColor:
              currentMode === "history" ? "var(--bg-surface-elevated)" : "transparent",
            color: "var(--text-primary)",
            border: currentMode === "history" ? "1px solid var(--border-medium)" : "1px solid transparent",
          }}
        >
          <Calendar className="w-4 h-4 shrink-0" style={{ color: "var(--text-primary)" }} />
          <span>Attendance History</span>
          {absentCount > 0 ? (
            <span
              className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: "var(--status-ooo-bg)",
                borderColor: "var(--status-ooo-border)",
                color: "var(--status-ooo-text)",
              }}
            >
              {absentCount} Absent
            </span>
          ) : (
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border hidden sm:inline-block"
              style={{
                backgroundColor: "var(--bg-surface-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              Calendar
            </span>
          )}
        </button>

        {/* Option 3: Daily Work Logs */}
        <button
          type="button"
          onClick={() => onModeChange("worklog")}
          className={`flex-1 sm:flex-initial justify-center px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all whitespace-nowrap shrink-0 ${
            currentMode === "worklog"
              ? "shadow-sm"
              : "opacity-75 hover:opacity-100 hover:brightness-110"
          }`}
          style={{
            backgroundColor:
              currentMode === "worklog" ? "var(--bg-surface-elevated)" : "transparent",
            color: "var(--text-primary)",
            border: currentMode === "worklog" ? "1px solid var(--border-medium)" : "1px solid transparent",
          }}
        >
          <FileText className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Daily Work Logs</span>
          {hasSubmittedWorkLogToday ? (
            <span
              className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: "var(--status-working-bg)",
                borderColor: "var(--status-working-border)",
                color: "var(--status-working-text)",
              }}
            >
              Submitted
            </span>
          ) : (
            <span
              className="text-[10px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: "var(--status-break-bg)",
                borderColor: "var(--status-break-border)",
                color: "var(--status-break-text)",
              }}
            >
              Pending
            </span>
          )}
        </button>
      </div>

      {/* Mode Sub-indicator */}
      <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
        <span>
          {currentMode === "current"
            ? "Showing daily shift clock, timers & punch status"
            : currentMode === "history"
            ? "Showing past attendance records, status overview & calendar"
            : "Showing today's work log, TipTap editor & supervisor remarks"}
        </span>
      </div>
    </div>
  );
};
