"use client";

import React, { useState } from "react";
import { X, AlertTriangle, FileText, Ban } from "lucide-react";
import { RegularizationRequest } from "@/types";

interface RejectionReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: RegularizationRequest | null;
  onConfirmReject: (requestId: string, adminReason: string) => Promise<void>;
}

export const RejectionReasonModal: React.FC<RejectionReasonModalProps> = ({
  isOpen,
  onClose,
  request,
  onConfirmReject,
}) => {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("Please provide a reason for rejecting this regularization request.");
      return;
    }

    setSubmitting(true);
    try {
      const reqId = request._id || request.id || "";
      await onConfirmReject(reqId, reason.trim());
      setReason("");
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to reject request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-5 sm:p-6 border transition-all"
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
              className="w-10 h-10 rounded-xl flex items-center justify-center border"
              style={{
                backgroundColor: "var(--status-ooo-bg)",
                borderColor: "var(--status-ooo-border)",
                color: "var(--status-ooo-text)",
              }}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                Reject Attendance Request
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                State reason for rejection (visible to employee)
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

        {/* Request Brief */}
        <div
          className="p-3.5 rounded-xl border mb-4 space-y-1.5 text-xs"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-muted)" }}>Employee:</span>
            <span className="font-bold" style={{ color: "var(--text-primary)" }}>
              {request.userName}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-muted)" }}>Date:</span>
            <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
              {request.date}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span style={{ color: "var(--text-muted)" }}>Claimed Work:</span>
            <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
              {request.workMode} • {request.hours} Hours
            </span>
          </div>
          <div className="pt-1.5 border-t" style={{ borderColor: "var(--border-subtle)" }}>
            <span className="block text-[11px]" style={{ color: "var(--text-muted)" }}>
              Employee&apos;s reason:
            </span>
            <p className="italic text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              &ldquo;{request.reason}&rdquo;
            </p>
          </div>
        </div>

        {error && (
          <div
            className="mb-4 p-2.5 rounded-xl border text-xs font-semibold"
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
          <div>
            <label
              className="block text-xs font-bold uppercase tracking-wider mb-1.5"
              style={{ color: "var(--text-muted)" }}
            >
              Rejection Reason (Required)
            </label>
            <div className="relative">
              <FileText
                className="absolute left-3 top-3 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Work hours not approved by supervisor, no deliverables found..."
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
            className="flex items-center justify-end gap-2.5 pt-3 border-t"
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
              className="px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all shadow-sm hover:brightness-110 disabled:opacity-50"
              style={{
                backgroundColor: "var(--status-ooo-bg)",
                borderColor: "var(--status-ooo-border)",
                color: "var(--status-ooo-text)",
              }}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>{submitting ? "Rejecting..." : "Confirm Rejection"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
