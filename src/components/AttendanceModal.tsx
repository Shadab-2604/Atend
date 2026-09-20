"use client";

import React, { useState, useEffect } from "react";
import { AttendanceRecord, AttendanceStatus } from "@/types";
import { X, Clock, CheckCircle, Trash2, Calendar, FileText } from "lucide-react";

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  dayNumber: number | null;
  initialRecord: AttendanceRecord | null;
  onSave: (recordData: any) => Promise<void>;
  onReset: (date: string) => Promise<void>;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  date,
  dayNumber,
  initialRecord,
  onSave,
  onReset,
}) => {
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [loginTime, setLoginTime] = useState("09:00");
  const [logoutTime, setLogoutTime] = useState("17:30");
  const [notes, setNotes] = useState("");
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initialRecord) {
      setStatus(initialRecord.status || "present");
      setLoginTime(initialRecord.login?.time || "09:00");
      setLogoutTime(initialRecord.logout?.time || "17:30");
      setNotes(initialRecord.notes || "");
      setBreakMinutes(initialRecord.breakMinutes ?? 30);
    } else {
      setStatus("present");
      setLoginTime("09:00");
      setLogoutTime("17:30");
      setNotes("");
      setBreakMinutes(30);
    }
  }, [initialRecord, date]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        date,
        dayNumber: dayNumber || 1,
        status,
        login: {
          time: loginTime,
          timestamp: `${date}T${loginTime}:00`,
        },
        logout: {
          time: logoutTime,
          timestamp: `${date}T${logoutTime}:00`,
        },
        breakMinutes: Number(breakMinutes),
        notes,
      });
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(`Are you sure you want to reset attendance for ${date}?`)) return;
    setSaving(true);
    try {
      await onReset(date);
      onClose();
    } catch (err) {
      console.error("Reset error:", err);
    } finally {
      setSaving(false);
    }
  };

  const statuses: { id: AttendanceStatus; label: string; color: string }[] = [
    { id: "present", label: "Present (Full Shift)", color: "var(--status-working-text)" },
    { id: "working", label: "Working Now", color: "var(--status-working-text)" },
    { id: "half-day", label: "Half-Day", color: "var(--status-break-text)" },
    { id: "absent", label: "Absent", color: "var(--status-ooo-text)" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg rounded-2xl shadow-2xl p-6 overflow-hidden border transition-all"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-medium)",
          color: "var(--text-primary)",
        }}
      >
        <div
          className="flex items-center justify-between pb-4 border-b mb-5"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
              style={{
                backgroundColor: "var(--accent-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--accent-primary)",
              }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black" style={{ color: "var(--text-primary)" }}>
                Attendance Entry & Shift Log
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {date} {dayNumber ? `• Internship Day #${dayNumber}` : ""}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border transition-all hover:brightness-125"
            style={{
              backgroundColor: "var(--bg-surface-elevated)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Shift Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {statuses.map((s) => {
                const selected = status === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setStatus(s.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      selected ? "ring-1 shadow-sm" : "hover:brightness-110"
                    }`}
                    style={{
                      backgroundColor: selected ? "var(--bg-surface-elevated)" : "var(--bg-surface-subtle)",
                      borderColor: selected ? s.color : "var(--border-subtle)",
                      color: selected ? s.color : "var(--text-secondary)",
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Clock In Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="time"
                  value={loginTime}
                  onChange={(e) => setLoginTime(e.target.value)}
                  required
                  className="w-full rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold border transition-colors"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
                Clock Out Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-muted)" }} />
                <input
                  type="time"
                  value={logoutTime}
                  onChange={(e) => setLogoutTime(e.target.value)}
                  required
                  className="w-full rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold border transition-colors"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Break Duration (Minutes)
            </label>
            <input
              type="number"
              min={0}
              max={240}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value))}
              className="w-full rounded-xl px-3 py-2 text-sm font-mono font-bold border transition-colors"
              style={{
                backgroundColor: "var(--bg-surface-subtle)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-muted)" }}>
              Work Accomplishments / Notes
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tasks completed, PRs submitted, or blockers encountered..."
                className="w-full rounded-xl pl-9 pr-3 py-2 text-xs border transition-colors resize-none"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          <div
            className="flex items-center justify-between pt-3 border-t mt-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            {initialRecord ? (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all hover:opacity-90"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold border transition-all hover:brightness-110"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition-all hover:opacity-95"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "var(--accent-text)",
                  boxShadow: "0 4px 14px var(--accent-glow)",
                }}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{saving ? "Saving..." : "Save Record"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
