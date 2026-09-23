"use client";

import React, { useState, useEffect } from "react";
import { X, MessageSquare, Check, Save } from "lucide-react";
import { apiSaveWorkLog } from "@/lib/api";

interface AdminRemarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  date: string;
  currentRemark?: string;
  workLogContent?: string;
  onSaved?: () => void;
}

export const AdminRemarkModal: React.FC<AdminRemarkModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  date,
  currentRemark = "",
  workLogContent = "",
  onSaved,
}) => {
  const [remark, setRemark] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setRemark(currentRemark);
      setError("");
      setSuccess(false);
    }
  }, [isOpen, currentRemark]);

  if (!isOpen) return null;

  const handleSaveRemark = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      await apiSaveWorkLog({
        userId,
        date,
        content: workLogContent,
        adminRemark: remark.trim(),
        requesterRole: "admin",
      });

      setSuccess(true);
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 800);
    } catch (err: any) {
      setError(err.message || "Failed to update remark.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        className="relative w-full max-w-lg rounded-3xl shadow-2xl p-5 sm:p-6 border transition-all"
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
              className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            >
              <MessageSquare className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                Supervisor Remark — {userName}
              </h3>
              <p className="text-xs font-mono mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Date: {date}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border transition-all hover:brightness-125"
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

        <form onSubmit={handleSaveRemark} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-muted)" }}>
              Admin Remark / Feedback Note:
            </label>
            <textarea
              rows={4}
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Type feedback, task evaluation, or supervisor notes for this work log..."
              className="w-full rounded-2xl p-3.5 text-xs border transition-colors resize-none font-sans"
              style={{
                backgroundColor: "var(--bg-surface-subtle)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
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
              className="px-5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all shadow-md hover:brightness-110 disabled:opacity-50"
              style={{
                backgroundColor: success ? "var(--status-working-bg)" : "var(--accent-primary)",
                borderColor: success ? "var(--status-working-border)" : "var(--border-medium)",
                color: success ? "var(--status-working-text)" : "var(--accent-text)",
              }}
            >
              {success ? <Check className="w-4 h-4 stroke-[3]" /> : <Save className="w-4 h-4" />}
              <span>{success ? "Remark Saved!" : saving ? "Saving Remark..." : "Save Remark"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
