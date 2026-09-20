"use client";

import React from "react";
import { AttendanceRecord, PresenceStatus, User } from "@/types";
import { Calendar, Clock, Edit3, ArrowRight, ShieldCheck } from "lucide-react";
import { formatTo12Hour } from "@/lib/formatters";

interface TodayHeroCardProps {
  user: User;
  todayRecord: AttendanceRecord | null;
  dayNumber: number;
  isWorkingDay: boolean;
  onOpenModal: () => void;
  onUpdateStatus: (status: PresenceStatus) => void;
}

export const TodayHeroCard: React.FC<TodayHeroCardProps> = ({
  user,
  todayRecord,
  dayNumber,
  isWorkingDay,
  onOpenModal,
  onUpdateStatus,
}) => {
  const todayStr = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const isClockedIn =
    user.currentStatus === "working" ||
    user.currentStatus === "break" ||
    user.currentStatus === "ooo";

  const rawLoginTime = todayRecord?.login?.time || user.loginTime;
  const rawLogoutTime = todayRecord?.logout?.time || user.logoutTime;
  const loginTime = rawLoginTime ? formatTo12Hour(rawLoginTime) : "--:--";
  const logoutTime = rawLogoutTime ? formatTo12Hour(rawLogoutTime) : "--:--";

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 sm:p-7 border mb-6 shadow-xl transition-all"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      <div
        className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors"
        style={{ backgroundColor: "var(--accent-glow)" }}
      />
      <div
        className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-25 transition-colors"
        style={{ backgroundColor: "var(--status-working-glow)" }}
      />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2.5">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-sm"
              style={{
                backgroundColor: "var(--accent-subtle)",
                borderColor: "var(--accent-primary)",
                color: "var(--accent-primary)",
              }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {todayStr}
            </span>

            {isWorkingDay ? (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-sm"
                style={{
                  backgroundColor: "var(--status-working-bg)",
                  borderColor: "var(--status-working-border)",
                  color: "var(--status-working-text)",
                }}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                Internship Day #{dayNumber}
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-muted)",
                }}
              >
                Sunday (Scheduled Off)
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
            Welcome back,{" "}
            <span
              className="font-extrabold"
              style={{
                background: "linear-gradient(135deg, var(--accent-primary) 0%, #38bdf8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {user.name}
            </span>
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>
            Track daily attendance, shift logs, and monitor 45 working days towards completion.
          </p>
        </div>

        <div
          className="flex flex-wrap items-center gap-4 rounded-xl p-4 border shadow-md"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-medium)",
          }}
        >
          <div
            className="flex items-center gap-5 sm:gap-6 border-r pr-5 sm:pr-6"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: "var(--text-muted)" }}>
                Clock In
              </span>
              <div
                className="flex items-center gap-1.5 mt-0.5 text-base font-mono font-black"
                style={{ color: "var(--status-working-text)" }}
              >
                <Clock className="w-4 h-4" />
                {loginTime}
              </div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider block" style={{ color: "var(--text-muted)" }}>
                Clock Out
              </span>
              <div
                className="flex items-center gap-1.5 mt-0.5 text-base font-mono font-bold"
                style={{ color: "var(--text-secondary)" }}
              >
                <Clock className="w-4 h-4" />
                {logoutTime}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isClockedIn ? (
              <button
                type="button"
                onClick={() => onUpdateStatus("working")}
                className="px-4 py-2.5 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center gap-2 hover:opacity-95"
                style={{
                  backgroundColor: "#10b981",
                  boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                }}
              >
                <span>Clock In Now</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onUpdateStatus("logged_out")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shadow-sm"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              >
                <span>Clock Out</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenModal}
              title="Edit today details or notes"
              className="p-2.5 rounded-xl border transition-all hover:brightness-125"
              style={{
                backgroundColor: "var(--bg-surface-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
