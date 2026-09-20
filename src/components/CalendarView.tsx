"use client";

import React, { useState, useMemo, useRef } from "react";
import { AttendanceRecord, AttendanceStatus } from "@/types";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  FileText,
  Filter,
  CheckCircle2,
  Sliders,
  LayoutGrid,
  List,
} from "lucide-react";
import { DayDetailsModal } from "./DayDetailsModal";
import { formatTo12Hour } from "@/lib/formatters";

interface CalendarViewProps {
  attendanceRecords: AttendanceRecord[];
  workingDaysMap: Record<string, number>;
  onOpenRegularizeForDate?: (date: string) => void;
  onAdminOverrideStatus?: (date: string, status: AttendanceStatus) => Promise<void>;
  isAdmin?: boolean;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const AVAILABLE_YEARS = [2024, 2025, 2026, 2027];

type CalendarDayCell =
  | { empty: true; key: string }
  | {
      empty: false;
      key: string;
      dateIso: string;
      dayOfMonth: number;
      isSunday: boolean;
      isSaturday: boolean;
      isWorkingDay: boolean;
      dayNumber: number | null;
      record?: AttendanceRecord;
      isToday: boolean;
    };

export const CalendarView: React.FC<CalendarViewProps> = ({
  attendanceRecords,
  workingDaysMap,
  onOpenRegularizeForDate,
  onAdminOverrideStatus,
  isAdmin = false,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8);
  const [selectedDateForDetails, setSelectedDateForDetails] = useState<string | null>(null);
  const [mobileViewMode, setMobileViewMode] = useState<"grid" | "list">("grid");
  const [scrollProgress, setScrollProgress] = useState<number>(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    if (maxScroll > 0) {
      setScrollProgress(Math.round((scrollLeft / maxScroll) * 100));
    }
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setScrollProgress(val);
    if (!scrollContainerRef.current) return;
    const { scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    scrollContainerRef.current.scrollLeft = (val / 100) * maxScroll;
  };

  const jumpToPercent = (pct: number) => {
    setScrollProgress(pct);
    if (!scrollContainerRef.current) return;
    const { scrollWidth, clientWidth } = scrollContainerRef.current;
    const maxScroll = scrollWidth - clientWidth;
    scrollContainerRef.current.scrollTo({
      left: (pct / 100) * maxScroll,
      behavior: "smooth",
    });
  };

  const visibleDayRangeLabel = useMemo(() => {
    if (scrollProgress <= 25) return "Mon — Wed";
    if (scrollProgress <= 65) return "Wed — Fri";
    return "Fri — Sun";
  }, [scrollProgress]);

  const recordsByDate = useMemo(() => {
    const map = new Map<string, AttendanceRecord>();
    attendanceRecords.forEach((rec) => {
      map.set(rec.date, rec);
    });
    return map;
  }, [attendanceRecords]);

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const calendarDays = useMemo<CalendarDayCell[]>(() => {
    const firstDay = new Date(selectedYear, selectedMonth, 1);
    const lastDay = new Date(selectedYear, selectedMonth + 1, 0);

    let startDayOfWeek = firstDay.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: CalendarDayCell[] = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ empty: true, key: `empty-pre-${i}` });
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateObj = new Date(selectedYear, selectedMonth, d);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dayStr = String(dateObj.getDate()).padStart(2, "0");
      const dateIso = `${y}-${m}-${dayStr}`;

      const dayOfWeek = dateObj.getDay();
      const isSunday = dayOfWeek === 0;
      const isSaturday = dayOfWeek === 6;
      const dayNumber = workingDaysMap[dateIso] || null;
      const isWorkingDay = dayNumber !== null;

      const record = recordsByDate.get(dateIso);
      const isToday =
        dateIso === "2026-09-15" ||
        dateIso === new Date().toISOString().split("T")[0];

      days.push({
        empty: false,
        key: dateIso,
        dateIso,
        dayOfMonth: d,
        isSunday,
        isSaturday,
        isWorkingDay,
        dayNumber,
        record,
        isToday,
      });
    }

    return days;
  }, [selectedYear, selectedMonth, workingDaysMap, recordsByDate]);

  const weekHeaders = [
    { label: "Mon", type: "weekday" },
    { label: "Tue", type: "weekday" },
    { label: "Wed", type: "weekday" },
    { label: "Thu", type: "weekday" },
    { label: "Fri", type: "weekday" },
    { label: "Sat (Work)", type: "saturday" },
    { label: "Sun (Off)", type: "sunday" },
  ];

  const monthStats = useMemo(() => {
    let presents = 0;
    let pendings = 0;
    let absents = 0;

    calendarDays.forEach((cell) => {
      if (!cell.empty && cell.record) {
        if (cell.record.status === "present" || cell.record.status === "working") {
          presents++;
        } else if (cell.record.status === "pending") {
          pendings++;
        } else if (cell.record.status === "absent") {
          absents++;
        }
      }
    });

    return { presents, pendings, absents };
  }, [calendarDays]);

  return (
    <div
      className="w-full max-w-full overflow-hidden rounded-2xl p-3.5 sm:p-7 border shadow-xl mb-8 transition-all animate-fade-in"
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
          <h2
            className="text-lg sm:text-xl font-black flex items-center gap-2.5"
            style={{ color: "var(--text-primary)" }}
          >
            <CalendarIcon className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
            Attendance Calendar & History
          </h2>
          <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
            Verified shift logs, working presence, and official attendance records.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Filter by month"
              className="px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold appearance-none pr-8 cursor-pointer transition-colors shadow-sm"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            >
              {MONTH_NAMES.map((name, idx) => (
                <option
                  key={name}
                  value={idx}
                  style={{ backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)" }}
                >
                  {name}
                </option>
              ))}
            </select>
            <ChevronRight className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none opacity-60" />
          </div>

          <div className="relative">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Filter by year"
              className="px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-bold appearance-none pr-8 cursor-pointer transition-colors shadow-sm"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            >
              {AVAILABLE_YEARS.map((y) => (
                <option
                  key={y}
                  value={y}
                  style={{ backgroundColor: "var(--bg-surface-elevated)", color: "var(--text-primary)" }}
                >
                  {y}
                </option>
              ))}
            </select>
            <ChevronRight className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 rotate-90 pointer-events-none opacity-60" />
          </div>

          <div
            className="flex items-center gap-1 p-1 rounded-xl border shadow-inner"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg transition-all hover:brightness-125"
              style={{ color: "var(--text-secondary)" }}
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg transition-all hover:brightness-125"
              style={{ color: "var(--text-secondary)" }}
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div
        className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border mb-5 text-xs"
        style={{
          backgroundColor: "var(--bg-surface-subtle)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Status Legend:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--status-working-text)" }} />
            <span className="font-semibold" style={{ color: "var(--status-working-text)" }}>
              Present (Green)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--status-break-text)" }} />
            <span className="font-semibold" style={{ color: "var(--status-break-text)" }}>
              Pending / Half Day
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "var(--status-ooo-text)" }} />
            <span className="font-semibold" style={{ color: "var(--status-ooo-text)" }}>
              Absent (Red)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#f59e0b" }} />
            <span className="font-semibold" style={{ color: "#f59e0b" }}>
              UL (Unplanned)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#a855f7" }} />
            <span className="font-semibold" style={{ color: "#a855f7" }}>
              PL (Planned)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
          <span>Month Total:</span>
          <span style={{ color: "var(--status-working-text)" }}>{monthStats.presents} Present</span>
          <span>•</span>
          <span style={{ color: "var(--status-break-text)" }}>{monthStats.pendings} Pending</span>
          <span>•</span>
          <span style={{ color: "var(--status-ooo-text)" }}>{monthStats.absents} Absent</span>
        </div>
      </div>

      <div
        className="sm:hidden mb-4 p-3 rounded-xl border flex flex-col gap-2.5"
        style={{
          backgroundColor: "var(--bg-surface-subtle)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" style={{ color: "var(--accent-primary)" }} />
            <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
              {mobileViewMode === "grid" ? `Calendar Slider: ${visibleDayRangeLabel}` : "Monthly Agenda Feed"}
            </span>
          </div>

          <div
            className="flex items-center p-0.5 rounded-lg border text-[10px] font-bold"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <button
              type="button"
              onClick={() => setMobileViewMode("grid")}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                mobileViewMode === "grid" ? "shadow-xs" : "opacity-60"
              }`}
              style={{
                backgroundColor: mobileViewMode === "grid" ? "var(--bg-surface-subtle)" : "transparent",
                color: mobileViewMode === "grid" ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <LayoutGrid className="w-3 h-3" />
              Grid
            </button>
            <button
              type="button"
              onClick={() => setMobileViewMode("list")}
              className={`px-2 py-1 rounded-md transition-all flex items-center gap-1 ${
                mobileViewMode === "list" ? "shadow-xs" : "opacity-60"
              }`}
              style={{
                backgroundColor: mobileViewMode === "list" ? "var(--bg-surface-subtle)" : "transparent",
                color: mobileViewMode === "list" ? "var(--text-primary)" : "var(--text-secondary)",
              }}
            >
              <List className="w-3 h-3" />
              Agenda
            </button>
          </div>
        </div>

        {mobileViewMode === "grid" && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold" style={{ color: "var(--text-muted)" }}>
                Mon
              </span>
              <input
                type="range"
                min="0"
                max="100"
                value={scrollProgress}
                onChange={handleSliderChange}
                aria-label="Slide to navigate calendar week columns"
                className="w-full h-1.5 rounded-lg appearance-none cursor-pointer transition-all"
                style={{
                  backgroundColor: "var(--border-medium)",
                  accentColor: "var(--status-working-text)",
                }}
              />
              <span className="text-[10px] font-mono font-bold" style={{ color: "var(--status-ooo-text)" }}>
                Sun
              </span>
            </div>

            <div className="flex items-center justify-between gap-1 text-[10px]">
              <button
                type="button"
                onClick={() => jumpToPercent(0)}
                className="flex-1 py-1 rounded-lg border font-bold text-center transition-all hover:brightness-125"
                style={{
                  backgroundColor: scrollProgress <= 25 ? "var(--bg-surface-elevated)" : "transparent",
                  borderColor: scrollProgress <= 25 ? "var(--border-focus)" : "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                Mon - Wed
              </button>
              <button
                type="button"
                onClick={() => jumpToPercent(50)}
                className="flex-1 py-1 rounded-lg border font-bold text-center transition-all hover:brightness-125"
                style={{
                  backgroundColor: scrollProgress > 25 && scrollProgress <= 75 ? "var(--bg-surface-elevated)" : "transparent",
                  borderColor: scrollProgress > 25 && scrollProgress <= 75 ? "var(--border-focus)" : "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                Thu - Sat
              </button>
              <button
                type="button"
                onClick={() => jumpToPercent(100)}
                className="flex-1 py-1 rounded-lg border font-bold text-center transition-all hover:brightness-125"
                style={{
                  backgroundColor: scrollProgress > 75 ? "var(--bg-surface-elevated)" : "transparent",
                  borderColor: scrollProgress > 75 ? "var(--border-focus)" : "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                Sun (Off)
              </button>
            </div>
          </div>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`w-full max-w-full overflow-x-auto pb-2 -mx-1 px-1 touch-pan-x ${
          mobileViewMode === "list" ? "hidden sm:block" : "block"
        }`}
      >
        <div className="min-w-[700px] sm:min-w-0">
          <div className="grid grid-cols-7 gap-2 text-center text-[11px] font-bold uppercase tracking-wider mb-2.5">
            {weekHeaders.map((col) => {
              let colStyle = {
                backgroundColor: "var(--bg-surface-elevated)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              };
              if (col.type === "sunday") {
                colStyle = {
                  backgroundColor: "rgba(239, 68, 68, 0.06)",
                  color: "#ef4444",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                };
              } else if (col.type === "saturday") {
                colStyle = {
                  backgroundColor: "var(--bg-surface-elevated)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border-medium)",
                };
              }

              return (
                <div key={col.label} className="py-2 px-1 rounded-xl shadow-xs" style={colStyle}>
                  {col.label}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {calendarDays.map((cell) => {
              if (cell.empty) {
                return (
                  <div
                    key={cell.key}
                    className="min-h-[135px] sm:min-h-[145px] rounded-xl border border-transparent opacity-0 pointer-events-none"
                  />
                );
              }

              const { dateIso, dayOfMonth, isSunday, isSaturday, isWorkingDay, dayNumber, record, isToday } = cell;

              const status: AttendanceStatus =
                record?.status || (isSunday ? "holiday" : isWorkingDay ? "upcoming" : "holiday");

              let cellBg = "var(--bg-surface-subtle)";
              let cellBorder = "var(--border-subtle)";
              let badgeBg = "var(--bg-surface-elevated)";
              let badgeColor = "var(--text-muted)";
              let badgeBorder = "var(--border-subtle)";
              let badgeText = "Upcoming";

              if (isSunday) {
                cellBg = "rgba(239, 68, 68, 0.02)";
                cellBorder = "rgba(239, 68, 68, 0.12)";
                badgeBg = "rgba(239, 68, 68, 0.08)";
                badgeColor = "#ef4444";
                badgeBorder = "rgba(239, 68, 68, 0.2)";
                badgeText = "Sunday Off";
              } else if (status === "present" || status === "working") {
                cellBg = "var(--status-working-bg)";
                cellBorder = "var(--status-working-border)";
                badgeBg = "var(--status-working-bg)";
                badgeColor = "var(--status-working-text)";
                badgeBorder = "var(--status-working-border)";
                badgeText = status === "working" ? "Working Now" : "Present";
              } else if (status === "pending") {
                cellBg = "var(--status-break-bg)";
                cellBorder = "var(--status-break-border)";
                badgeBg = "var(--status-break-bg)";
                badgeColor = "var(--status-break-text)";
                badgeBorder = "var(--status-break-border)";
                badgeText = "Pending Approval";
              } else if (status === "absent") {
                cellBg = "var(--status-ooo-bg)";
                cellBorder = "var(--status-ooo-border)";
                badgeBg = "var(--status-ooo-bg)";
                badgeColor = "var(--status-ooo-text)";
                badgeBorder = "var(--status-ooo-border)";
                badgeText = "Absent";
              } else if (status === "half-day") {
                cellBg = "var(--status-break-bg)";
                cellBorder = "var(--status-break-border)";
                badgeBg = "var(--status-break-bg)";
                badgeColor = "var(--status-break-text)";
                badgeBorder = "var(--status-break-border)";
                badgeText = "Half-Day";
              } else if (status === "ul") {
                cellBg = "rgba(245, 158, 11, 0.06)";
                cellBorder = "rgba(245, 158, 11, 0.25)";
                badgeBg = "rgba(245, 158, 11, 0.15)";
                badgeColor = "#f59e0b";
                badgeBorder = "rgba(245, 158, 11, 0.35)";
                badgeText = "UL (Unplanned)";
              } else if (status === "pl") {
                cellBg = "rgba(168, 85, 247, 0.06)";
                cellBorder = "rgba(168, 85, 247, 0.25)";
                badgeBg = "rgba(168, 85, 247, 0.15)";
                badgeColor = "#a855f7";
                badgeBorder = "rgba(168, 85, 247, 0.35)";
                badgeText = "PL (Planned)";
              }

              const hasRejectionReason =
                record?.adminRejectionReason && record.adminRejectionReason.trim().length > 0;

              return (
                <div
                  key={dateIso}
                  onClick={() => setSelectedDateForDetails(dateIso)}
                  className="min-h-[135px] sm:min-h-[145px] p-2 sm:p-2.5 rounded-2xl border flex flex-col justify-between transition-all duration-200 shadow-sm cursor-pointer hover:brightness-105 active:scale-[0.99] group select-none"
                  style={{
                    backgroundColor: cellBg,
                    borderColor: isToday ? "var(--text-primary)" : cellBorder,
                    boxShadow: isToday ? "0 0 0 2px var(--text-primary)" : undefined,
                  }}
                  title="Click to view full shift details"
                >
                  <div className="flex items-start justify-between gap-1">
                    <span
                      className="text-base sm:text-lg font-black"
                      style={{
                        color: isToday ? "var(--text-primary)" : "var(--text-primary)",
                      }}
                    >
                      {dayOfMonth}
                    </span>

                    <div className="flex items-center gap-1">
                      {dayNumber && (
                        <span
                          className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border"
                          style={{
                            backgroundColor: "var(--bg-surface-elevated)",
                            borderColor: "var(--border-subtle)",
                            color: "var(--text-secondary)",
                          }}
                        >
                          D{dayNumber}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1">
                      <span
                        className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block border"
                        style={{
                          backgroundColor: badgeBg,
                          borderColor: badgeBorder,
                          color: badgeColor,
                        }}
                      >
                        {badgeText}
                      </span>

                      {record?.isAutoPunchOut && (
                        <span
                          className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full inline-block border"
                          style={{
                            backgroundColor: "rgba(245, 158, 11, 0.12)",
                            borderColor: "rgba(245, 158, 11, 0.35)",
                            color: "#f59e0b",
                          }}
                          title="System Auto Punch-Out at 11:59 PM (Day Rollover)"
                        >
                          Auto Out
                        </span>
                      )}
                    </div>

                    {status === "absent" ? (
                      record?.regularizationStatus === "rejected" ? (
                        <div
                          className="flex items-center gap-1 text-[9px] font-mono text-red-400 font-semibold truncate"
                          title="Regularization request was rejected"
                        >
                          <AlertTriangle className="w-3 h-3 shrink-0 text-red-400" />
                          <span className="truncate">Req: {formatTo12Hour(record.login?.time, true)} (Rej)</span>
                        </div>
                      ) : (
                        <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                          0h 0m logged
                        </div>
                      )
                    ) : (
                      record?.login && (
                        <div className="space-y-0.5">
                          <div
                            className="flex items-center gap-1 text-[10px] font-mono"
                            style={{ color: "var(--text-secondary)" }}
                          >
                            <Clock className="w-3 h-3 shrink-0" style={{ color: "var(--status-working-text)" }} />
                            <span>{formatTo12Hour(record.login.time, true)}</span>
                            {record.logout?.time && (
                              <>
                                <span>-</span>
                                <span>{formatTo12Hour(record.logout.time, true)}</span>
                              </>
                            )}
                          </div>

                          {record.logout?.time && record.duration && (record.duration.hours > 0 || record.duration.minutes > 0) && (
                            <div
                              className="text-[10px] font-mono font-semibold"
                              style={{
                                color: record.isAutoPunchOut ? "var(--status-break-text)" : "var(--text-muted)"
                              }}
                              title={`Net Work Time: ${record.duration.hours}h ${record.duration.minutes}m`}
                            >
                              {record.duration.hours}h {record.duration.minutes}m logged
                            </div>
                          )}
                        </div>
                      )
                    )}

                    {record?.workMode && (
                      <span
                        className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border inline-block"
                        style={{
                          backgroundColor: "var(--bg-surface-elevated)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-muted)",
                        }}
                      >
                        {record.workMode}
                      </span>
                    )}

                    {hasRejectionReason && (
                      <div
                        className="p-1 rounded-md border text-[9px] mt-0.5 leading-tight"
                        style={{
                          backgroundColor: "var(--status-ooo-bg)",
                          borderColor: "var(--status-ooo-border)",
                          color: "var(--status-ooo-text)",
                        }}
                        title={`Admin Note: ${record.adminRejectionReason}`}
                      >
                        <span className="font-bold block text-[8px] uppercase tracking-wider">Note:</span>
                        <p className="line-clamp-2 break-words">{record.adminRejectionReason}</p>
                      </div>
                    )}
                  </div>

                  {((status === "absent" || status === "half-day") && !isSunday) && onOpenRegularizeForDate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRegularizeForDate(dateIso);
                      }}
                      className="w-full text-center py-1 px-1 mt-1 rounded-lg text-[9px] font-bold border transition-colors hover:brightness-125 shadow-xs whitespace-nowrap truncate"
                      style={{
                        backgroundColor: "var(--bg-surface-elevated)",
                        borderColor: "var(--border-subtle)",
                        color: "var(--text-primary)",
                      }}
                      title="Request Regularization"
                    >
                      Regularize
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {mobileViewMode === "list" && (
        <div className="block sm:hidden space-y-2 mt-2">
          {calendarDays
            .filter((cell) => !cell.empty)
            .map((cell) => {
              if (cell.empty) return null;
              const { dateIso, dayOfMonth, isSunday, isWorkingDay, dayNumber, record, isToday } = cell;
              const status: AttendanceStatus =
                record?.status || (isSunday ? "holiday" : isWorkingDay ? "upcoming" : "holiday");

              let badgeBg = "var(--bg-surface-elevated)";
              let badgeColor = "var(--text-muted)";
              let badgeBorder = "var(--border-subtle)";
              let badgeText = "Upcoming";

              if (isSunday) {
                badgeBg = "rgba(239, 68, 68, 0.08)";
                badgeColor = "#ef4444";
                badgeBorder = "rgba(239, 68, 68, 0.2)";
                badgeText = "Sunday Off";
              } else if (status === "present" || status === "working") {
                badgeBg = "var(--status-working-bg)";
                badgeColor = "var(--status-working-text)";
                badgeBorder = "var(--status-working-border)";
                badgeText = status === "working" ? "Working Now" : "Present";
              } else if (status === "pending") {
                badgeBg = "var(--status-break-bg)";
                badgeColor = "var(--status-break-text)";
                badgeBorder = "var(--status-break-border)";
                badgeText = "Pending Approval";
              } else if (status === "absent") {
                badgeBg = "var(--status-ooo-bg)";
                badgeColor = "var(--status-ooo-text)";
                badgeBorder = "var(--status-ooo-border)";
                badgeText = "Absent";
              } else if (status === "half-day") {
                badgeBg = "var(--status-break-bg)";
                badgeColor = "var(--status-break-text)";
                badgeBorder = "var(--status-break-border)";
                badgeText = "Half-Day";
              }

              const dateObj = new Date(`${dateIso}T12:00:00`);
              const weekdayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });

              return (
                <div
                  key={`list-${dateIso}`}
                  onClick={() => setSelectedDateForDetails(dateIso)}
                  className="p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.99]"
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    borderColor: isToday ? "var(--text-primary)" : "var(--border-subtle)",
                    boxShadow: isToday ? "0 0 0 1px var(--text-primary)" : undefined,
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-lg flex flex-col items-center justify-center border font-mono shrink-0"
                      style={{
                        backgroundColor: "var(--bg-surface-subtle)",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      <span className="text-[10px] uppercase font-bold" style={{ color: "var(--text-muted)" }}>
                        {weekdayName}
                      </span>
                      <span className="text-sm font-black" style={{ color: "var(--text-primary)" }}>
                        {dayOfMonth}
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: badgeBg,
                            borderColor: badgeBorder,
                            color: badgeColor,
                          }}
                        >
                          {badgeText}
                        </span>
                        {record?.isAutoPunchOut && (
                          <span
                            className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border"
                            style={{
                              backgroundColor: "rgba(245, 158, 11, 0.12)",
                              borderColor: "rgba(245, 158, 11, 0.35)",
                              color: "#f59e0b",
                            }}
                            title="System Auto Punch-Out at 11:59 PM (Day Rollover)"
                          >
                            Auto Out
                          </span>
                        )}
                        {dayNumber && (
                          <span
                            className="text-[9px] font-mono px-1 py-0.5 rounded border"
                            style={{
                              backgroundColor: "var(--bg-surface-subtle)",
                              borderColor: "var(--border-subtle)",
                              color: "var(--text-secondary)",
                            }}
                          >
                            D{dayNumber}
                          </span>
                        )}
                        {record?.workMode && (
                          <span className="text-[9px] font-mono" style={{ color: "var(--text-muted)" }}>
                            • {record.workMode}
                          </span>
                        )}
                      </div>

                      <div className="mt-1 text-xs font-mono">
                        {status === "absent" ? (
                          record?.regularizationStatus === "rejected" ? (
                            <span className="text-red-400 font-semibold flex items-center gap-1 text-[11px]">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Req: {formatTo12Hour(record.login?.time, true)} - {formatTo12Hour(record.logout?.time, true)} (Rejected)
                            </span>
                          ) : (
                            <span style={{ color: "var(--text-muted)" }}>0h 0m logged</span>
                          )
                        ) : record?.login ? (
                          <span style={{ color: "var(--status-working-text)" }} className="flex items-center gap-1.5 font-semibold flex-wrap">
                            <Clock className="w-3 h-3 shrink-0" />
                            <span>
                              {formatTo12Hour(record.login.time, true)}
                              {record.logout?.time && ` - ${formatTo12Hour(record.logout.time, true)}`}
                            </span>
                            {record.logout?.time && record.duration && (record.duration.hours > 0 || record.duration.minutes > 0) && (
                              <span
                                className="font-normal text-[11px]"
                                style={{ color: record.isAutoPunchOut ? "var(--status-break-text)" : "var(--text-muted)" }}
                              >
                                • {record.duration.hours}h {record.duration.minutes}m
                              </span>
                            )}
                          </span>
                        ) : (
                          <span style={{ color: "var(--text-muted)" }}>--</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {((status === "absent" || status === "half-day") && !isSunday) && onOpenRegularizeForDate && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenRegularizeForDate(dateIso);
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold border shrink-0 transition-colors"
                      style={{
                        backgroundColor: "var(--bg-surface-subtle)",
                        borderColor: "var(--border-medium)",
                        color: "var(--text-primary)",
                      }}
                    >
                      Regularize
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {selectedDateForDetails && (
        <DayDetailsModal
          isOpen={Boolean(selectedDateForDetails)}
          onClose={() => setSelectedDateForDetails(null)}
          date={selectedDateForDetails}
          record={recordsByDate.get(selectedDateForDetails)}
          dayNumber={workingDaysMap[selectedDateForDetails] || null}
          isWorkingDay={workingDaysMap[selectedDateForDetails] !== undefined}
          isSunday={new Date(`${selectedDateForDetails}T12:00:00`).getDay() === 0}
          isSaturday={new Date(`${selectedDateForDetails}T12:00:00`).getDay() === 6}
          onOpenRegularize={onOpenRegularizeForDate}
          onAdminOverrideStatus={onAdminOverrideStatus}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
};
