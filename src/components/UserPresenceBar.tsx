"use client";

import React, { useEffect, useState } from "react";
import { PresenceStatus, User } from "@/types";
import { Play, Pause, AlertCircle, LogOut } from "lucide-react";

interface UserPresenceBarProps {
  user: User;
  onUpdateStatus: (newStatus: PresenceStatus) => void;
  loading?: boolean;
}

export const UserPresenceBar: React.FC<UserPresenceBarProps> = ({
  user,
  onUpdateStatus,
  loading = false,
}) => {
  const [elapsedWorkSec, setElapsedWorkSec] = useState(0);
  const [elapsedBreakSec, setElapsedBreakSec] = useState(0);

  useEffect(() => {
    const updateTimers = () => {
      const now = Date.now();

      if (user.currentStatus === "working" && user.loginTimestamp) {
        const startMs = new Date(user.loginTimestamp).getTime();
        const breakSec = (user.totalBreakMinutes || 0) * 60;
        const netSec = Math.max(0, Math.floor((now - startMs) / 1000) - breakSec);
        setElapsedWorkSec(netSec);
      } else if (user.todayWorkingMinutes) {
        setElapsedWorkSec(user.todayWorkingMinutes * 60);
      } else {
        setElapsedWorkSec(0);
      }

      if (user.currentStatus === "break" && user.breakStartTime) {
        const breakStartMs = new Date(user.breakStartTime).getTime();
        const priorSec = (user.totalBreakMinutes || 0) * 60;
        const currBreakSec = priorSec + Math.max(0, Math.floor((now - breakStartMs) / 1000));
        setElapsedBreakSec(currBreakSec);
      } else if (user.totalBreakMinutes) {
        setElapsedBreakSec(user.totalBreakMinutes * 60);
      } else {
        setElapsedBreakSec(0);
      }
    };

    updateTimers();
    const interval = setInterval(updateTimers, 1000);
    return () => clearInterval(interval);
  }, [user.currentStatus, user.loginTimestamp, user.breakStartTime, user.totalBreakMinutes, user.todayWorkingMinutes]);

  const formatTimer = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const status = user.currentStatus || "logged_out";

  return (
    <section
      className="w-full rounded-2xl p-5 sm:p-6 border shadow-xl mb-6 transition-all"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b mb-5"
        style={{ borderColor: "var(--border-subtle)" }}
      >
        <div>
          <span className="text-[11px] font-bold uppercase tracking-widest block" style={{ color: "var(--text-muted)" }}>
            Real-Time Presence Status
          </span>
          <div className="flex items-center gap-3 mt-1.5">
            {status === "working" && (
              <span
                className="flex items-center gap-2 text-base sm:text-lg font-black"
                style={{ color: "var(--status-working-text)" }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
                  style={{ backgroundColor: "var(--status-working-text)" }}
                />
                🟢 Active / Working
              </span>
            )}
            {status === "break" && (
              <span
                className="flex items-center gap-2 text-base sm:text-lg font-black"
                style={{ color: "var(--status-break-text)" }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
                  style={{ backgroundColor: "var(--status-break-text)" }}
                />
                🟡 On Break
              </span>
            )}
            {status === "ooo" && (
              <span
                className="flex items-center gap-2 text-base sm:text-lg font-black"
                style={{ color: "var(--status-ooo-text)" }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
                  style={{ backgroundColor: "var(--status-ooo-text)" }}
                />
                🔴 Out of Office
              </span>
            )}
            {status === "logged_out" && (
              <span
                className="flex items-center gap-2 text-base sm:text-lg font-black"
                style={{ color: "var(--status-logout-text)" }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "var(--status-logout-text)" }}
                />
                ⚪ Logged Out / Inactive
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div
            className="text-right px-3 py-1.5 rounded-xl border"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: "var(--text-muted)" }}>
              Active Work Elapsed
            </span>
            <span className="text-lg sm:text-xl font-mono font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
              {formatTimer(elapsedWorkSec)}
            </span>
          </div>

          <div
            className="text-right px-3 py-1.5 rounded-xl border"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: "var(--text-muted)" }}>
              Break Elapsed
            </span>
            <span
              className="text-lg sm:text-xl font-mono font-black tracking-tight"
              style={{ color: "var(--status-break-text)" }}
            >
              {formatTimer(elapsedBreakSec)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          disabled={loading}
          onClick={() => onUpdateStatus("working")}
          className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-sm ${
            status === "working" ? "ring-2" : "hover:brightness-110"
          }`}
          style={{
            backgroundColor: status === "working" ? "var(--status-working-bg)" : "var(--bg-surface-elevated)",
            borderColor: status === "working" ? "var(--status-working-text)" : "var(--border-subtle)",
            color: status === "working" ? "var(--status-working-text)" : "var(--text-primary)",
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: "var(--status-working-bg)",
              borderColor: "var(--status-working-border)",
              color: "var(--status-working-text)",
            }}
          >
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-sm font-bold block leading-snug">Start / Login</span>
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ opacity: 0.8 }}>
              Active Working
            </span>
          </div>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => onUpdateStatus("break")}
          className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-sm ${
            status === "break" ? "ring-2" : "hover:brightness-110"
          }`}
          style={{
            backgroundColor: status === "break" ? "var(--status-break-bg)" : "var(--bg-surface-elevated)",
            borderColor: status === "break" ? "var(--status-break-text)" : "var(--border-subtle)",
            color: status === "break" ? "var(--status-break-text)" : "var(--text-primary)",
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: "var(--status-break-bg)",
              borderColor: "var(--status-break-border)",
              color: "var(--status-break-text)",
            }}
          >
            <Pause className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-sm font-bold block leading-snug">Take Break</span>
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ opacity: 0.8 }}>
              Pause Timer
            </span>
          </div>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => onUpdateStatus("ooo")}
          className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-sm ${
            status === "ooo" ? "ring-2" : "hover:brightness-110"
          }`}
          style={{
            backgroundColor: status === "ooo" ? "var(--status-ooo-bg)" : "var(--bg-surface-elevated)",
            borderColor: status === "ooo" ? "var(--status-ooo-text)" : "var(--border-subtle)",
            color: status === "ooo" ? "var(--status-ooo-text)" : "var(--text-primary)",
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: "var(--status-ooo-bg)",
              borderColor: "var(--status-ooo-border)",
              color: "var(--status-ooo-text)",
            }}
          >
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold block leading-snug">Out of Office</span>
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ opacity: 0.8 }}>
              Away from Desk
            </span>
          </div>
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => onUpdateStatus("logged_out")}
          className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-sm ${
            status === "logged_out" ? "ring-2" : "hover:brightness-110"
          }`}
          style={{
            backgroundColor: status === "logged_out" ? "var(--status-logout-bg)" : "var(--bg-surface-elevated)",
            borderColor: status === "logged_out" ? "var(--status-logout-text)" : "var(--border-subtle)",
            color: status === "logged_out" ? "var(--status-logout-text)" : "var(--text-primary)",
          }}
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: "var(--status-logout-bg)",
              borderColor: "var(--status-logout-border)",
              color: "var(--status-logout-text)",
            }}
          >
            <LogOut className="w-5 h-5" />
          </div>
          <div>
            <span className="text-sm font-bold block leading-snug">Log Out Shift</span>
            <span className="text-[10px] uppercase font-bold tracking-wider" style={{ opacity: 0.8 }}>
              End Today&apos;s Shift
            </span>
          </div>
        </button>
      </div>
    </section>
  );
};
