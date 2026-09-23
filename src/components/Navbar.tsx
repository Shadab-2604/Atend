"use client";

import React from "react";
import { User } from "@/types";
import { Calendar, Clock, LogOut, Settings as SettingsIcon, ShieldCheck, FileCheck } from "lucide-react";
import { ThemeSelector } from "./ThemeSelector";

interface NavbarProps {
  user: User | null;
  role: "intern" | "admin" | string;
  onLogout: () => void;
  onOpenSettings?: () => void;
  onJumpToday?: () => void;
  onOpenRegularize?: () => void;
  absentCount?: number;
  dateRangeText?: string;
  totalDays?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  role,
  onLogout,
  onOpenSettings,
  onJumpToday,
  onOpenRegularize,
  absentCount = 0,
  dateRangeText = "Sep 15, 2026 – Nov 5, 2026",
  totalDays = 45,
}) => {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header
      className="w-full backdrop-blur-xl border-b px-3 sm:px-6 md:px-8 py-2.5 sm:py-3 sticky top-0 z-40 flex items-center justify-between gap-2 sm:gap-4 transition-colors max-w-full overflow-hidden"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Brand & Internship Info */}
      <div className="flex items-center gap-2 sm:gap-3.5 min-w-0 shrink">
        <div
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center border shadow-sm shrink-0 transition-transform hover:scale-105"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-medium)",
            color: "var(--text-primary)",
          }}
        >
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
        </div>
        <div className="min-w-0">
          <h1
            className="text-sm sm:text-lg font-black tracking-tight flex items-center gap-1.5 sm:gap-2 truncate"
            style={{ color: "var(--text-primary)" }}
          >
            <span className="truncate">AttendFlow</span>
            <span
              className="text-[9px] sm:text-[10px] font-mono px-1.5 sm:px-2 py-0.5 rounded-full border shrink-0 hidden xs:inline-block"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              {role === "admin" ? "Admin Console" : "Attendance"}
            </span>
            {role === "admin" && (
              <span
                className="text-[9px] sm:text-[10px] uppercase font-bold px-1.5 sm:px-2 py-0.5 rounded-full border flex items-center gap-1 shrink-0"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              >
                <ShieldCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /> Admin
              </span>
            )}
          </h1>
          <p className="text-[10px] sm:text-xs flex items-center gap-1.5 sm:gap-2 mt-0.5 truncate" style={{ color: "var(--text-secondary)" }}>
            <span className="font-bold shrink-0" style={{ color: "var(--text-primary)" }}>
              {totalDays} Days
            </span>
            <span className="opacity-40 hidden sm:inline">•</span>
            <span className="truncate hidden sm:inline">{dateRangeText}</span>
          </p>
        </div>
      </div>

      {/* Action Controls, Theme Selector & Profile */}
      <div className="flex items-center gap-1 sm:gap-3 shrink-0">
        {/* Quick Mark Attendance Button on Nav */}
        {role !== "admin" && onOpenRegularize && (
          <button
            type="button"
            onClick={onOpenRegularize}
            className="px-2.5 sm:px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-sm hover:brightness-110"
            style={{
              backgroundColor: absentCount > 0 ? "var(--status-ooo-bg)" : "var(--bg-surface-elevated)",
              borderColor: absentCount > 0 ? "var(--status-ooo-border)" : "var(--border-medium)",
              color: absentCount > 0 ? "var(--status-ooo-text)" : "var(--text-primary)",
            }}
            title="Submit attendance regularization request to Admin"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Regularize Missed Days</span>
            <span className="md:hidden text-[10px]">Req</span>
            {absentCount > 0 && (
              <span
                className="text-[10px] font-mono px-1.5 py-0.2 rounded-full font-black border"
                style={{
                  backgroundColor: "var(--status-ooo-bg)",
                  borderColor: "var(--status-ooo-border)",
                  color: "var(--status-ooo-text)",
                }}
              >
                {absentCount}
              </span>
            )}
          </button>
        )}

        {/* Quick Today Jump Button */}
        {role !== "admin" && onJumpToday && (
          <button
            type="button"
            onClick={onJumpToday}
            className="hidden md:flex px-3 py-1.5 rounded-lg border text-xs font-semibold items-center gap-1.5 transition-all hover:brightness-110 shadow-sm"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-primary)",
            }}
          >
            <Clock className="w-3.5 h-3.5" style={{ color: "var(--text-primary)" }} />
            Today
          </button>
        )}

        {/* Theme Switcher */}
        <ThemeSelector />

        {/* User Badge */}
        <div
          className="flex items-center gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-sm"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div
            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-black shadow-sm border shrink-0"
            style={{
              backgroundColor: "var(--accent-primary)",
              color: "var(--accent-text)",
              borderColor: "var(--border-medium)",
            }}
          >
            {initial}
          </div>
          <div className="flex flex-col text-left leading-tight hidden lg:flex">
            <span className="text-xs font-bold truncate max-w-[90px] sm:max-w-[120px]" style={{ color: "var(--text-primary)" }}>
              {user?.name || "User"}
            </span>
            <span className="text-[10px] uppercase font-semibold" style={{ color: "var(--text-muted)" }}>
              {role === "admin" ? "Admin" : user?.role ? user.role : "Employee"}
            </span>
          </div>
        </div>

        {/* Sign Out */}
        <button
          type="button"
          onClick={onLogout}
          className="px-2 sm:px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-subtle)",
            color: "var(--status-ooo-text)",
          }}
          title="Sign out of your session"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Log Out</span>
        </button>
      </div>
    </header>
  );
};
