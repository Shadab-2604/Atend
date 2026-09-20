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
      className="w-full backdrop-blur-xl border-b px-4 md:px-8 py-3 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4 transition-colors"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-subtle)",
      }}
    >
      {/* Brand & Internship Info */}
      <div className="flex items-center gap-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm transition-transform hover:scale-105"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-medium)",
            color: "var(--text-primary)",
          }}
        >
          <Calendar className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div>
          <h1
            className="text-base sm:text-lg font-black tracking-tight flex flex-wrap items-center gap-1.5 sm:gap-2"
            style={{ color: "var(--text-primary)" }}
          >
            <span>AttendFlow</span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              {role === "admin" ? "Admin Console" : "Attendance Portal"}
            </span>
            {role === "admin" && (
              <span
                className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              >
                <ShieldCheck className="w-3 h-3" /> Admin
              </span>
            )}
          </h1>
          <p className="text-[11px] sm:text-xs flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5" style={{ color: "var(--text-secondary)" }}>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>
              {totalDays} Working Days
            </span>
            <span className="opacity-40">•</span>
            <span>{dateRangeText}</span>
          </p>
        </div>
      </div>

      {/* Action Controls, Theme Selector & Profile */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
        {/* Quick Mark Attendance Button on Nav */}
        {role !== "admin" && onOpenRegularize && (
          <button
            type="button"
            onClick={onOpenRegularize}
            className="px-3 sm:px-3.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all shadow-sm hover:brightness-110"
            style={{
              backgroundColor: absentCount > 0 ? "var(--status-ooo-bg)" : "var(--bg-surface-elevated)",
              borderColor: absentCount > 0 ? "var(--status-ooo-border)" : "var(--border-medium)",
              color: absentCount > 0 ? "var(--status-ooo-text)" : "var(--text-primary)",
            }}
            title="Submit attendance regularization request to Admin"
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Regularize Missed Days</span>
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
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-full border shadow-sm"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shadow-sm border shrink-0"
            style={{
              backgroundColor: "var(--accent-primary)",
              color: "var(--accent-text)",
              borderColor: "var(--border-medium)",
            }}
          >
            {initial}
          </div>
          <div className="flex flex-col text-left leading-tight hidden sm:flex">
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
          className="px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm hover:opacity-90"
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
