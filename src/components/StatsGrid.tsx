"use client";

import React from "react";
import { SummaryStats } from "@/types";
import { CalendarCheck, CalendarDays, Clock, Percent, Hourglass, CheckCircle2 } from "lucide-react";

interface StatsGridProps {
  stats: SummaryStats;
  totalDays?: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  stats,
  totalDays = 45,
}) => {
  const completed = stats.completedDays || 0;
  const remaining = Math.max(0, totalDays - completed);
  const percent = stats.attendancePercentage || 0;
  const totalHours = (stats.totalWorkingHours || 0).toFixed(1);
  const avgHours = (stats.averageWorkingHours || 0).toFixed(1);

  const progressPercent = Math.min(100, Math.round((completed / totalDays) * 100));

  return (
    <div className="mb-8 space-y-4">
      {/* 6 Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4">
        {/* Card 1: Total Goal */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Total Goal
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: "var(--accent-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--accent-primary)",
              }}
            >
              <CalendarDays className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
              {totalDays}
            </span>
            <span className="text-[11px] block mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Working Days
            </span>
          </div>
        </div>

        {/* Card 2: Completed Days */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--status-working-border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Completed
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: "var(--status-working-bg)",
                borderColor: "var(--status-working-border)",
                color: "var(--status-working-text)",
              }}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--status-working-text)" }}>
              {completed}
            </span>
            <span className="text-[11px] block mt-0.5" style={{ color: "var(--status-working-text)", opacity: 0.85 }}>
              Days Finished
            </span>
          </div>
        </div>

        {/* Card 3: Remaining Days */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--status-break-border)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Remaining
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: "var(--status-break-bg)",
                borderColor: "var(--status-break-border)",
                color: "var(--status-break-text)",
              }}
            >
              <Hourglass className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--status-break-text)" }}>
              {remaining}
            </span>
            <span className="text-[11px] block mt-0.5" style={{ color: "var(--status-break-text)", opacity: 0.85 }}>
              Days to Finish
            </span>
          </div>
        </div>

        {/* Card 4: Attendance Rate */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Rate
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: "var(--accent-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--accent-primary)",
              }}
            >
              <Percent className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--accent-primary)" }}>
              {percent}%
            </span>
            <span className="text-[11px] block mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Attendance Rate
            </span>
          </div>
        </div>

        {/* Card 5: Total Hours */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Total Time
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
              {totalHours}
            </span>
            <span className="text-[11px] block mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Total Hours
            </span>
          </div>
        </div>

        {/* Card 6: Average Hours */}
        <div
          className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all hover:scale-[1.02]"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
              Avg / Day
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center border"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-primary)",
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
              {avgHours}
            </span>
            <span className="text-[11px] block mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Hrs / Workday
            </span>
          </div>
        </div>
      </div>

      {/* Internship Progress Roadmap Bar */}
      <div
        className="rounded-2xl p-4 sm:p-5 border shadow-md transition-all"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold mb-2.5">
          <span style={{ color: "var(--text-primary)" }}>Working Days & Milestone Progress</span>
          <span
            className="font-mono font-bold px-2 py-0.5 rounded-md border"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
              color: "var(--accent-primary)",
            }}
          >
            {completed} of {totalDays} Days ({progressPercent}%)
          </span>
        </div>
        <div
          className="w-full h-3 rounded-full overflow-hidden p-0.5 border"
          style={{
            backgroundColor: "var(--bg-surface-subtle)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 shadow-sm"
            style={{
              width: `${Math.max(2, progressPercent)}%`,
              background: "linear-gradient(90deg, var(--accent-primary) 0%, #10b981 100%)",
            }}
          />
        </div>
      </div>
    </div>
  );
};
