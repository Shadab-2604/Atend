"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, CheckCircle, FileText, Building2, Home } from "lucide-react";
import { WorkMode } from "@/types";

interface RegularizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    userId: string;
    date: string;
    workMode: WorkMode;
    hours: number;
    reason: string;
  }) => Promise<void>;
  userId: string;
  defaultDate?: string;
  absentDates?: string[];
}

export const RegularizeModal: React.FC<RegularizeModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  userId,
  defaultDate,
  absentDates = [],
}) => {
  const [workMode, setWorkMode] = useState<WorkMode>("WFO");
  const [date, setDate] = useState<string>("");
  const [hours, setHours] = useState<number>(8);
  const [reason, setReason] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (defaultDate) {
      setDate(defaultDate);
    } else if (absentDates.length > 0) {
      setDate(absentDates[0]);
    } else {
      // Default to yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const y = yesterday.getFullYear();
      const m = String(yesterday.getMonth() + 1).padStart(2, "0");
      const d = String(yesterday.getDate()).padStart(2, "0");
      setDate(`${y}-${m}-${d}`);
    }
    setWorkMode("WFO");
    setHours(8);
    setReason("");
    setError("");
  }, [isOpen, defaultDate, absentDates]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!date) {
      setError("Please select a date to regularize.");
      return;
    }
    if (!hours || hours <= 0 || hours > 24) {
      setError("Please specify working hours between 1 and 24.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason or justification for regularization.");
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        userId,
        date,
        workMode,
        hours: Number(hours),
        reason: reason.trim(),
      });
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-5 sm:p-6 border transition-all"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-medium)",
          color: "var(--text-primary)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between pb-4 border-b mb-5"
          style={{ borderColor: "var(--border-subtle)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            >
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black" style={{ color: "var(--text-primary)" }}>
                Mark / Regularize Attendance
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Send attendance request to Admin for approval
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

        {error && (
          <div
            className="mb-4 p-3 rounded-xl border text-xs font-semibold"
            style={{
              backgroundColor: "var(--status-ooo-bg)",
              borderColor: "var(--status-ooo-border)",
              color: "var(--status-ooo-text)",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 1. Work Mode Radio Buttons */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-2"
              style={{ color: "var(--text-muted)" }}
            >
              Work Mode Selection
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* Option WFO */}
              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  workMode === "WFO" ? "ring-1" : "hover:brightness-110"
                }`}
                style={{
                  backgroundColor:
                    workMode === "WFO"
                      ? "var(--bg-surface-elevated)"
                      : "var(--bg-surface-subtle)",
                  borderColor:
                    workMode === "WFO"
                      ? "var(--border-focus)"
                      : "var(--border-subtle)",
                }}
              >
                <input
                  type="radio"
                  name="workMode"
                  value="WFO"
                  checked={workMode === "WFO"}
                  onChange={() => setWorkMode("WFO")}
                  className="accent-white w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  <div>
                    <span className="text-xs font-bold block" style={{ color: "var(--text-primary)" }}>
                      WFO
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      Work From Office
                    </span>
                  </div>
                </div>
              </label>

              {/* Option WFH */}
              <label
                className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                  workMode === "WFH" ? "ring-1" : "hover:brightness-110"
                }`}
                style={{
                  backgroundColor:
                    workMode === "WFH"
                      ? "var(--bg-surface-elevated)"
                      : "var(--bg-surface-subtle)",
                  borderColor:
                    workMode === "WFH"
                      ? "var(--border-focus)"
                      : "var(--border-subtle)",
                }}
              >
                <input
                  type="radio"
                  name="workMode"
                  value="WFH"
                  checked={workMode === "WFH"}
                  onChange={() => setWorkMode("WFH")}
                  className="accent-white w-4 h-4 cursor-pointer"
                />
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4" style={{ color: "var(--text-secondary)" }} />
                  <div>
                    <span className="text-xs font-bold block" style={{ color: "var(--text-primary)" }}>
                      WFH
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      Work From Home
                    </span>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 2. Date Selection */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Attendance Date
            </label>
            <div className="relative">
              <Calendar
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold border transition-colors"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
            {absentDates.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  Absent Days:
                </span>
                {absentDates.slice(0, 4).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full border transition-colors hover:brightness-120"
                    style={{
                      backgroundColor:
                        date === d ? "var(--accent-subtle)" : "var(--bg-surface-elevated)",
                      borderColor:
                        date === d ? "var(--border-focus)" : "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 3. Time in Hours */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: "var(--text-muted)" }}
              >
                Time Worked (Hours)
              </label>
              <div className="flex items-center gap-1">
                {[4, 8, 9].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setHours(h)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded border transition-colors hover:brightness-120"
                    style={{
                      backgroundColor:
                        hours === h ? "var(--bg-surface-elevated)" : "transparent",
                      borderColor: "var(--border-subtle)",
                      color: hours === h ? "var(--text-primary)" : "var(--text-muted)",
                    }}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Clock
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={hours}
                onChange={(e) => setHours(Number(e.target.value))}
                required
                placeholder="e.g. 8"
                className="w-full rounded-xl pl-9 pr-3 py-2 text-sm font-mono font-bold border transition-colors"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* 4. Reason / Justification */}
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Reason / Justification
            </label>
            <div className="relative">
              <FileText
                className="absolute left-3 top-3 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <textarea
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                placeholder="Explain the reason (e.g. forgot to clock in, on-site client meeting, network downtime)..."
                className="w-full rounded-xl pl-9 pr-3 py-2 text-xs border transition-colors resize-none"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Notice info */}
          <div
            className="p-3 rounded-xl border text-[11px] leading-relaxed"
            style={{
              backgroundColor: "var(--bg-surface-subtle)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            Your request will be submitted to the Admin. Upon approval, your status for this date will be regularized to <strong>Present (Green)</strong>.
          </div>

          {/* Actions */}
          <div
            className="flex items-center justify-end gap-2.5 pt-3 border-t mt-4"
            style={{ borderColor: "var(--border-subtle)" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
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
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm hover:brightness-110 disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent-primary)",
                borderColor: "var(--border-medium)",
                color: "var(--accent-text)",
              }}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{submitting ? "Submitting..." : "Submit Request"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
