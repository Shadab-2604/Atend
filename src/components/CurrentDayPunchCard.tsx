"use client";

import React, { useEffect, useState, useRef } from "react";
import { User, PresenceStatus, AttendanceRecord } from "@/types";
import { formatTo12Hour, formatSecondsToHMS } from "@/lib/formatters";
import {
  Clock,
  ChevronDown,
  Play,
  Pause,
  AlertCircle,
  LogOut,
  Calendar,
  CheckCircle2,
  Coffee,
  Sparkles,
  ArrowRight,
} from "lucide-react";

interface CurrentDayPunchCardProps {
  user: User;
  todayRecord: AttendanceRecord | null;
  dayNumber: number | null;
  isWorkingDay: boolean;
  onUpdateStatus: (newStatus: PresenceStatus) => void;
  onOpenRegularizeModal?: () => void;
  loading?: boolean;
}

export const CurrentDayPunchCard: React.FC<CurrentDayPunchCardProps> = ({
  user,
  todayRecord,
  dayNumber,
  isWorkingDay,
  onUpdateStatus,
  onOpenRegularizeModal,
  loading = false,
}) => {
  const [sessionWorkSec, setSessionWorkSec] = useState(0);
  const [totalWorkSec, setTotalWorkSec] = useState(0);
  const [sessionBreakSec, setSessionBreakSec] = useState(0);
  const [totalBreakSec, setTotalBreakSec] = useState(0);
  const [sessionOooSec, setSessionOooSec] = useState(0);
  const [totalOooSec, setTotalOooSec] = useState(0);
  const [elapsedTotalSec, setElapsedTotalSec] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    const updateTimers = () => {
      const now = Date.now();
      const lastChangeMs = user.lastStatusChangeTimestamp
        ? new Date(user.lastStatusChangeTimestamp).getTime()
        : (user.loginTimestamp ? new Date(user.loginTimestamp).getTime() : now);

      const activeSessionSec = Math.max(0, Math.floor((now - lastChangeMs) / 1000));

      let curSessionWork = 0;
      let curTotalWork = user.accumulatedWorkSeconds || ((user.todayWorkingMinutes || 0) * 60);
      if (user.currentStatus === "working") {
        curSessionWork = activeSessionSec;
        curTotalWork += activeSessionSec;
      }
      setSessionWorkSec(curSessionWork);
      setTotalWorkSec(curTotalWork);

      let curSessionBreak = 0;
      let curTotalBreak = user.accumulatedBreakSeconds !== undefined
        ? user.accumulatedBreakSeconds
        : ((user.totalBreakMinutes || 0) * 60);
      if (user.currentStatus === "break") {
        const breakStart = user.breakStartTime ? new Date(user.breakStartTime).getTime() : lastChangeMs;
        curSessionBreak = Math.max(0, Math.floor((now - breakStart) / 1000));
        curTotalBreak += curSessionBreak;
      }
      setSessionBreakSec(curSessionBreak);
      setTotalBreakSec(curTotalBreak);

      let curSessionOoo = 0;
      let curTotalOoo = user.accumulatedOooSeconds !== undefined
        ? user.accumulatedOooSeconds
        : ((user.totalOooMinutes || 0) * 60);
      if (user.currentStatus === "ooo") {
        const oooStart = user.oooStartTime ? new Date(user.oooStartTime).getTime() : lastChangeMs;
        curSessionOoo = Math.max(0, Math.floor((now - oooStart) / 1000));
        curTotalOoo += curSessionOoo;
      }
      setSessionOooSec(curSessionOoo);
      setTotalOooSec(curTotalOoo);

      if (user.loginTimestamp) {
        const startMs = new Date(user.loginTimestamp).getTime();
        if (user.logoutTime && user.currentStatus === "logged_out") {
          setElapsedTotalSec(curTotalWork + curTotalBreak + curTotalOoo);
        } else {
          setElapsedTotalSec(Math.max(0, Math.floor((now - startMs) / 1000)));
        }
      } else {
        setElapsedTotalSec(0);
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [
    user.currentStatus,
    user.loginTimestamp,
    user.logoutTime,
    user.breakStartTime,
    user.totalBreakMinutes,
    user.accumulatedBreakSeconds,
    user.oooStartTime,
    user.totalOooMinutes,
    user.accumulatedOooSeconds,
    user.todayWorkingMinutes,
    user.lastStatusChangeTimestamp,
    user.accumulatedWorkSeconds,
  ]);

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const status = user.currentStatus || "logged_out";

  const statusOptions: {
    id: PresenceStatus;
    label: string;
    description: string;
    dotColor: string;
    icon: React.ElementType;
  }[] = [
    {
      id: "working",
      label: "Punch In / Active Working",
      description: "Resume live work timer & active presence",
      dotColor: "var(--status-working-text)",
      icon: Play,
    },
    {
      id: "break",
      label: "Take Break",
      description: "Pause work timer & start break tracker",
      dotColor: "var(--status-break-text)",
      icon: Pause,
    },
    {
      id: "ooo",
      label: "Out of Office (OOO)",
      description: "Stepping away or temporary unavailable",
      dotColor: "var(--status-ooo-text)",
      icon: AlertCircle,
    },
    {
      id: "logged_out",
      label: "Punch Out / End Shift",
      description: "Clock out and compute final day duration",
      dotColor: "var(--status-logout-text)",
      icon: LogOut,
    },
  ];

  const currentOption =
    statusOptions.find((opt) => opt.id === status) || statusOptions[3];
  const CurrentIcon = currentOption.icon;

  const todayDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <section
        className="w-full rounded-2xl p-5 sm:p-7 border shadow-xl transition-all"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div
          className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b mb-6"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[11px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                Today&apos;s Workstation
              </span>
              {dayNumber && (
                <span
                  className="text-[11px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded border"
                  style={{
                    backgroundColor: "var(--accent-subtle)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                >
                  Day #{dayNumber}
                </span>
              )}
            </div>
            <h2
              className="text-lg sm:text-2xl font-black tracking-tight"
              style={{ color: "var(--text-primary)" }}
            >
              {todayDateFormatted}
            </h2>
          </div>

          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              disabled={loading}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="px-4 py-2.5 rounded-xl border flex items-center gap-3 transition-all text-xs sm:text-sm font-bold shadow-sm hover:brightness-110 disabled:opacity-50"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
              aria-expanded={dropdownOpen}
              aria-haspopup="listbox"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: currentOption.dotColor,
                  boxShadow: `0 0 8px ${currentOption.dotColor}`,
                }}
              />
              <span className="font-bold">{currentOption.label}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ml-1 ${
                  dropdownOpen ? "rotate-180" : ""
                }`}
                style={{ color: "var(--text-muted)" }}
              />
            </button>

            {dropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-[calc(100vw-2.5rem)] max-w-xs sm:w-80 rounded-2xl border p-2 z-50 shadow-2xl backdrop-blur-xl animate-fade-in"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-medium)",
                }}
                role="listbox"
              >
                <div
                  className="px-3 py-2 border-b mb-1 flex items-center justify-between"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Select Punch Action
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                    style={{
                      backgroundColor: "var(--bg-surface-elevated)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Live Sync
                  </span>
                </div>

                <div className="space-y-1">
                  {statusOptions.map((opt) => {
                    const isCurrent = opt.id === status;
                    const OptIcon = opt.icon;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onUpdateStatus(opt.id);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group ${
                          isCurrent ? "ring-1" : "hover:brightness-110"
                        }`}
                        style={{
                          backgroundColor: isCurrent
                            ? "var(--bg-surface-elevated)"
                            : "transparent",
                          borderColor: isCurrent
                            ? "var(--border-focus)"
                            : "transparent",
                        }}
                        role="option"
                        aria-selected={isCurrent}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center border shrink-0"
                            style={{
                              backgroundColor: "var(--bg-surface-subtle)",
                              borderColor: "var(--border-subtle)",
                              color: opt.dotColor,
                            }}
                          >
                            <OptIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <span
                              className="text-xs font-bold block"
                              style={{ color: "var(--text-primary)" }}
                            >
                              {opt.label}
                            </span>
                            <span
                              className="text-[10px] block"
                              style={{ color: "var(--text-muted)" }}
                            >
                              {opt.description}
                            </span>
                          </div>
                        </div>

                        {isCurrent && (
                          <span
                            className="w-2 h-2 rounded-full shrink-0 mr-1"
                            style={{ backgroundColor: opt.dotColor }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div
            className="p-4 rounded-xl border flex flex-col justify-between transition-all"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: status === "working" ? "var(--status-working-border)" : "var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Working Time
              </span>
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  backgroundColor: "var(--status-working-text)",
                  boxShadow: status === "working" ? "0 0 8px var(--status-working-text)" : "none",
                }}
              />
            </div>
            <div
              className="text-xl sm:text-2xl font-mono font-black tracking-tight mt-1"
              style={{ color: "var(--status-working-text)" }}
            >
              {formatTimer(status === "working" ? sessionWorkSec : totalWorkSec)}
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1.5" style={{ color: "var(--text-secondary)" }}>
              <span>{status === "working" ? "Session Live" : "Total Logged"}</span>
              <span className="font-mono">
                {status === "working" ? `Total: ${formatTimer(totalWorkSec)}` : `${((totalWorkSec / 3600)).toFixed(1)}h Total`}
              </span>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border flex flex-col justify-between transition-all"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: status === "break" ? "var(--status-break-border)" : "var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Break Time
              </span>
              <Coffee className="w-3.5 h-3.5" style={{ color: "var(--status-break-text)" }} />
            </div>
            <div
              className="text-xl sm:text-2xl font-mono font-black tracking-tight mt-1"
              style={{ color: "var(--status-break-text)" }}
            >
              {formatTimer(status === "break" ? sessionBreakSec : totalBreakSec)}
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1.5" style={{ color: "var(--text-secondary)" }}>
              <span>{status === "break" ? "Break Live" : "Cumulative Break"}</span>
              <span className="font-mono">
                {status === "break" ? `Total: ${formatTimer(totalBreakSec)}` : `${Math.round(totalBreakSec / 60)}m Total`}
              </span>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border flex flex-col justify-between transition-all"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: status === "ooo" ? "var(--status-ooo-border)" : "var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                OOO Time
              </span>
              <AlertCircle className="w-3.5 h-3.5" style={{ color: "var(--status-ooo-text)" }} />
            </div>
            <div
              className="text-xl sm:text-2xl font-mono font-black tracking-tight mt-1"
              style={{ color: "var(--status-ooo-text)" }}
            >
              {formatTimer(status === "ooo" ? sessionOooSec : totalOooSec)}
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1.5" style={{ color: "var(--text-secondary)" }}>
              <span>{status === "ooo" ? "OOO Live" : "Cumulative OOO"}</span>
              <span className="font-mono">
                {status === "ooo" ? `Total: ${formatTimer(totalOooSec)}` : `${Math.round(totalOooSec / 60)}m Total`}
              </span>
            </div>
          </div>

          <div
            className="p-4 rounded-xl border flex flex-col justify-between transition-all"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <span
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Total Shift Time
              </span>
              <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-primary)" }} />
            </div>
            <div
              className="text-xl sm:text-2xl font-mono font-black tracking-tight mt-1"
              style={{ color: "var(--text-primary)" }}
            >
              {formatTimer(elapsedTotalSec)}
            </div>
            <div className="flex items-center justify-between text-[10px] mt-1.5" style={{ color: "var(--text-secondary)" }}>
              <span>{status === "logged_out" ? "Shift Ended" : "Session Elapsed"}</span>
              <span className="font-mono">{((elapsedTotalSec / 3600)).toFixed(1)}h Total</span>
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-xl border mb-6 space-y-3"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                Daily Shift Target: 9.5 Hours <span className="text-[11px] font-normal" style={{ color: "var(--text-muted)" }}>(15m Login Buffer)</span>
              </span>
              {totalWorkSec >= 33300 ? (
                <span
                  className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1"
                  style={{
                    backgroundColor: "var(--status-working-bg)",
                    borderColor: "var(--status-working-border)",
                    color: "var(--status-working-text)",
                  }}
                >
                  <CheckCircle2 className="w-3 h-3" /> Full Day Achieved
                </span>
              ) : onOpenRegularizeModal ? (
                <button
                  type="button"
                  onClick={onOpenRegularizeModal}
                  title="Click to request attendance regularization for this shift"
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition-all hover:scale-105 hover:brightness-125 cursor-pointer shadow-md animate-pulse"
                  style={{
                    backgroundColor: "var(--status-break-bg)",
                    borderColor: "var(--status-break-border)",
                    color: "var(--status-break-text)",
                  }}
                >
                  <span>{status === "logged_out" ? "Recorded as Half-Day" : "Under 9.15h (Half-Day threshold)"}</span>
                  <span className="font-normal underline underline-offset-2">Regularize Day ➔</span>
                </button>
              ) : (
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: "var(--status-break-bg)",
                    borderColor: "var(--status-break-border)",
                    color: "var(--status-break-text)",
                  }}
                >
                  {status === "logged_out" ? "Recorded as Half-Day" : "Under 9.15h (Half-Day threshold)"}
                </span>
              )}
            </div>

            <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
              {((totalWorkSec / 3600)).toFixed(2)}h / 9.50h (
              {Math.min(100, Math.round((totalWorkSec / 33300) * 100))}%)
            </span>
          </div>

          <div
            className="w-full h-2 rounded-full overflow-hidden border shadow-inner"
            style={{
              backgroundColor: "var(--bg-surface-subtle)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div
              className="h-full transition-all duration-500 rounded-full"
              style={{
                width: `${Math.min(100, Math.round((totalWorkSec / 33300) * 100))}%`,
                backgroundColor:
                  totalWorkSec >= 33300
                    ? "var(--status-working-text)"
                    : "var(--status-break-text)",
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-1" style={{ color: "var(--text-secondary)" }}>
            <div className="flex items-center gap-3 font-mono">
              <span>Punch In: <strong style={{ color: "var(--text-primary)" }}>{formatTo12Hour(user.loginTime)}</strong></span>
              <span>•</span>
              <span>Punch Out: <strong style={{ color: "var(--text-primary)" }}>{status === "logged_out" ? formatTo12Hour(user.logoutTime) : "In Progress"}</strong></span>
              <span>•</span>
              <span>Status: <strong className="uppercase" style={{ color: currentOption.dotColor }}>{status.replace("_", " ")}</strong></span>
            </div>
            <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
              Completed shift under 9h 15m (9.5h target with 15m login buffer) is recorded as Half-Day.
            </p>
          </div>
        </div>

        <div
          className="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
          style={{
            backgroundColor: "var(--bg-surface-subtle)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
            <span style={{ color: "var(--text-secondary)" }}>
              Need to regularize an absent day? Switch to{" "}
              <strong style={{ color: "var(--text-primary)" }}>Attendance History</strong> or use the{" "}
              <strong style={{ color: "var(--text-primary)" }}>Regularize Missed Days</strong> button above.
            </span>
          </div>

          {onOpenRegularizeModal && (
            <button
              type="button"
              onClick={onOpenRegularizeModal}
              className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:brightness-110 flex items-center gap-1.5"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            >
              <span>Regularize Day</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </section>
    </div>
  );
};
