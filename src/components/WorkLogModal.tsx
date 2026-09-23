"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import {
  X,
  FileText,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  CheckSquare,
  Undo,
  Redo,
  Save,
  Lock,
  MessageSquare,
  CheckCircle2,
  Eye,
  Edit3,
} from "lucide-react";
import { apiGetWorkLog, apiSaveWorkLog } from "@/lib/api";

interface WorkLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  currentUserRole: string; // "admin" | "intern" | "user"
  currentUserId?: string;
  onSaved?: () => void;
}

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export const WorkLogModal: React.FC<WorkLogModalProps> = ({
  isOpen,
  onClose,
  userId,
  userName,
  date,
  currentUserRole,
  currentUserId,
  onSaved,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");
  const [adminRemark, setAdminRemark] = useState<string>("");
  const [editorContentHtml, setEditorContentHtml] = useState<string>("");

  const todayIso = getTodayIso();
  const isAdmin = currentUserRole === "admin";
  const isToday = date === todayIso;
  const canEditContent = isAdmin || isToday;

  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: "",
    editable: canEditContent,
    onUpdate: ({ editor }) => {
      setEditorContentHtml(editor.getHTML());
    },
  });

  // Synchronize editor editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(canEditContent);
    }
  }, [editor, canEditContent]);

  // Load Work Log on modal open or date change
  useEffect(() => {
    if (!isOpen || !userId || !date) return;

    let isMounted = true;
    setLoading(true);
    setError("");
    setSuccessMsg("");

    apiGetWorkLog(userId, date)
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.workLog) {
          const html = res.workLog.content || "";
          setEditorContentHtml(html);
          if (editor) {
            editor.commands.setContent(html);
          }
          setAdminRemark(res.workLog.adminRemark || "");
        } else {
          setEditorContentHtml("");
          if (editor) {
            editor.commands.setContent("");
          }
          setAdminRemark("");
        }
      })
      .catch((err: any) => {
        if (isMounted) setError(err.message || "Failed to load work log.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, userId, date, editor]);

  // Calculate line numbers dynamically based on plain text lines or paragraph breaks
  const lineNumbers = useMemo(() => {
    if (!editorContentHtml) return [1];
    // Strip HTML tags roughly to count text lines or paragraph breaks
    const text = editorContentHtml
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<[^>]+>/g, "");
    const lines = text.split("\n").filter((l, idx, arr) => idx === 0 || l.length > 0 || idx < arr.length - 1);
    const count = Math.max(1, lines.length);
    return Array.from({ length: count }, (_, i) => i + 1);
  }, [editorContentHtml]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!editor) return;
    setError("");
    setSuccessMsg("");
    setSaving(true);

    try {
      const htmlContent = editor.getHTML();
      await apiSaveWorkLog({
        userId,
        date,
        content: htmlContent,
        adminRemark: isAdmin ? adminRemark.trim() : undefined,
        requesterRole: currentUserRole,
        requesterId: currentUserId,
      });

      setSuccessMsg("Work log saved successfully!");
      if (onSaved) onSaved();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save work log.");
    } finally {
      setSaving(false);
    }
  };

  const formattedDateString = (() => {
    try {
      const dateObj = new Date(`${date}T12:00:00`);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return date;
    }
  })();

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in"
    >
      <div
        className="relative w-full max-w-6xl max-h-[94vh] flex flex-col rounded-3xl shadow-2xl border overflow-hidden transition-all"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-medium)",
          color: "var(--text-primary)",
        }}
      >
        {/* Top Header */}
        <div
          className="flex flex-wrap items-center justify-between p-4 sm:p-5 border-b gap-3 shrink-0"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border shadow-sm shrink-0"
              style={{
                backgroundColor: "var(--bg-surface-subtle)",
                borderColor: "var(--border-medium)",
                color: "var(--text-primary)",
              }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight" style={{ color: "var(--text-primary)" }}>
                  Work Log — {userName}
                </h2>
                {isToday ? (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                    style={{
                      backgroundColor: "var(--status-working-bg)",
                      borderColor: "var(--status-working-border)",
                      color: "var(--status-working-text)",
                    }}
                  >
                    <CheckCircle2 className="w-3 h-3" /> Today&apos;s Work Log
                  </span>
                ) : (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1"
                    style={{
                      backgroundColor: canEditContent ? "var(--bg-surface-subtle)" : "var(--status-ooo-bg)",
                      borderColor: canEditContent ? "var(--border-medium)" : "var(--status-ooo-border)",
                      color: canEditContent ? "var(--text-secondary)" : "var(--status-ooo-text)",
                    }}
                  >
                    {canEditContent ? <Edit3 className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {canEditContent ? "Admin Edit Override" : "Locked Date"}
                  </span>
                )}
              </div>
              <p className="text-xs mt-0.5 font-mono" style={{ color: "var(--text-secondary)" }}>
                Date: {formattedDateString} ({date})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl border transition-all hover:brightness-125"
            style={{
              backgroundColor: "var(--bg-surface-subtle)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lock Banner Warning for Non-Admin on Past/Future Dates */}
        {!canEditContent && (
          <div
            className="px-4 py-2.5 text-xs font-semibold flex items-center justify-between border-b shrink-0"
            style={{
              backgroundColor: "var(--status-ooo-bg)",
              borderColor: "var(--status-ooo-border)",
              color: "var(--status-ooo-text)",
            }}
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                <strong>Locked:</strong> Employees and interns can only create or edit work logs for <strong>Today ({todayIso})</strong>. Past and future logs are read-only.
              </span>
            </div>
          </div>
        )}

        {/* Status Messages */}
        {error && (
          <div
            className="m-4 mb-0 p-3 rounded-xl border text-xs font-semibold"
            style={{
              backgroundColor: "var(--status-ooo-bg)",
              borderColor: "var(--status-ooo-border)",
              color: "var(--status-ooo-text)",
            }}
          >
            {error}
          </div>
        )}

        {successMsg && (
          <div
            className="m-4 mb-0 p-3 rounded-xl border text-xs font-semibold flex items-center gap-2"
            style={{
              backgroundColor: "var(--status-working-bg)",
              borderColor: "var(--status-working-border)",
              color: "var(--status-working-text)",
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Main Content Body - Split View (Editor on Left, Preview on Right) */}
        {loading ? (
          <div className="p-12 text-center text-sm font-semibold animate-pulse" style={{ color: "var(--text-muted)" }}>
            Loading work log...
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-2 gap-5 min-h-[420px]">
            {/* LEFT PANEL: WRITE / EDITOR */}
            <div className="flex flex-col rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border-medium)" }}>
              <div
                className="flex items-center justify-between px-3.5 py-2.5 border-b text-xs font-bold"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-primary)",
                }}
              >
                <div className="flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" style={{ color: "var(--accent-primary)" }} />
                  <span>Work Log Writer (TipTap Editor)</span>
                </div>
                {!canEditContent && (
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded border" style={{ color: "var(--text-muted)", borderColor: "var(--border-subtle)" }}>
                    Read Only
                  </span>
                )}
              </div>

              {/* TipTap Formatting Toolbar */}
              {editor && canEditContent && (
                <div
                  className="flex flex-wrap items-center gap-1 p-2 border-b text-xs"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  {/* Bold */}
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-1.5 rounded-lg border transition-all ${
                      editor.isActive("bold") ? "ring-1" : "hover:brightness-125"
                    }`}
                    style={{
                      backgroundColor: editor.isActive("bold") ? "var(--accent-subtle)" : "var(--bg-surface-elevated)",
                      borderColor: editor.isActive("bold") ? "var(--border-focus)" : "var(--border-subtle)",
                      color: editor.isActive("bold") ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                    title="Bold (Ctrl+B)"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>

                  {/* Italic */}
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-1.5 rounded-lg border transition-all ${
                      editor.isActive("italic") ? "ring-1" : "hover:brightness-125"
                    }`}
                    style={{
                      backgroundColor: editor.isActive("italic") ? "var(--accent-subtle)" : "var(--bg-surface-elevated)",
                      borderColor: editor.isActive("italic") ? "var(--border-focus)" : "var(--border-subtle)",
                      color: editor.isActive("italic") ? "var(--text-primary)" : "var(--text-secondary)",
                    }}
                    title="Italic (Ctrl+I)"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 mx-0.5 bg-gray-700/40" />

                  {/* Headings */}
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                    className={`p-1.5 rounded-lg border transition-all ${
                      editor.isActive("heading", { level: 1 }) ? "ring-1" : "hover:brightness-125"
                    }`}
                    style={{
                      backgroundColor: editor.isActive("heading", { level: 1 }) ? "var(--accent-subtle)" : "var(--bg-surface-elevated)",
                      borderColor: editor.isActive("heading", { level: 1 }) ? "var(--border-focus)" : "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                    title="Heading 1"
                  >
                    <Heading1 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-1.5 rounded-lg border transition-all ${
                      editor.isActive("heading", { level: 2 }) ? "ring-1" : "hover:brightness-125"
                    }`}
                    style={{
                      backgroundColor: editor.isActive("heading", { level: 2 }) ? "var(--accent-subtle)" : "var(--bg-surface-elevated)",
                      borderColor: editor.isActive("heading", { level: 2 }) ? "var(--border-focus)" : "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                    title="Heading 2"
                  >
                    <Heading2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-1.5 rounded-lg border transition-all ${
                      editor.isActive("heading", { level: 3 }) ? "ring-1" : "hover:brightness-125"
                    }`}
                    style={{
                      backgroundColor: editor.isActive("heading", { level: 3 }) ? "var(--accent-subtle)" : "var(--bg-surface-elevated)",
                      borderColor: editor.isActive("heading", { level: 3 }) ? "var(--border-focus)" : "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                    title="Heading 3"
                  >
                    <Heading3 className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 mx-0.5 bg-gray-700/40" />

                  {/* Bullet List */}
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-1.5 rounded-lg border transition-all ${
                      editor.isActive("bulletList") ? "ring-1" : "hover:brightness-125"
                    }`}
                    style={{
                      backgroundColor: editor.isActive("bulletList") ? "var(--accent-subtle)" : "var(--bg-surface-elevated)",
                      borderColor: editor.isActive("bulletList") ? "var(--border-focus)" : "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                    title="Bullet List"
                  >
                    <List className="w-3.5 h-3.5" />
                  </button>

                  {/* Task / Checkbox List */}
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleTaskList().run()}
                    className={`p-1.5 rounded-lg border transition-all ${
                      editor.isActive("taskList") ? "ring-1" : "hover:brightness-125"
                    }`}
                    style={{
                      backgroundColor: editor.isActive("taskList") ? "var(--accent-subtle)" : "var(--bg-surface-elevated)",
                      borderColor: editor.isActive("taskList") ? "var(--border-focus)" : "var(--border-subtle)",
                      color: "var(--text-primary)",
                    }}
                    title="Task Checklist"
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </button>

                  <div className="w-[1px] h-4 mx-0.5 bg-gray-700/40" />

                  {/* Undo / Redo */}
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    disabled={!editor.can().undo()}
                    className="p-1.5 rounded-lg border transition-all hover:brightness-125 disabled:opacity-40"
                    style={{
                      backgroundColor: "var(--bg-surface-elevated)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                    title="Undo"
                  >
                    <Undo className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    disabled={!editor.can().redo()}
                    className="p-1.5 rounded-lg border transition-all hover:brightness-125 disabled:opacity-40"
                    style={{
                      backgroundColor: "var(--bg-surface-elevated)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                    title="Redo"
                  >
                    <Redo className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Editor Workspace with Line Number Gutter */}
              <div className="flex-1 flex overflow-hidden min-h-[300px]" style={{ backgroundColor: "var(--bg-surface-subtle)" }}>
                {/* Line Numbers Column */}
                <div
                  className="w-10 select-none py-3 px-1 text-right font-mono text-xs border-r shrink-0 opacity-60 leading-relaxed"
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  {lineNumbers.map((num) => (
                    <div key={num}>{num}</div>
                  ))}
                </div>

                {/* Editor Content Box */}
                <div className="flex-1 p-3 overflow-y-auto font-sans text-sm leading-relaxed worklog-tiptap-container">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>

            {/* RIGHT PANEL: LIVE PREVIEW & ADMIN REMARK */}
            <div className="flex flex-col gap-4">
              <div
                className="flex-1 flex flex-col rounded-2xl border overflow-hidden min-h-[300px]"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                }}
              >
                <div
                  className="flex items-center justify-between px-3.5 py-2.5 border-b text-xs font-bold"
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-primary)",
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <Eye className="w-4 h-4" style={{ color: "var(--status-working-text)" }} />
                    <span>Live Preview Panel</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">Real-time output</span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto">
                  {editorContentHtml ? (
                    <div
                      className="prose prose-invert max-w-none text-sm leading-relaxed worklog-preview-content space-y-2"
                      dangerouslySetInnerHTML={{ __html: editorContentHtml }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-center p-8 text-xs italic" style={{ color: "var(--text-muted)" }}>
                      Start typing in the writer panel to see live formatted preview...
                    </div>
                  )}
                </div>
              </div>

              {/* ADMIN REMARK SECTION */}
              <div
                className="p-3.5 rounded-2xl border space-y-2"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-medium)",
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    Admin Remark / Feedback
                  </span>
                  {isAdmin && <span className="text-[10px] font-mono text-indigo-400 font-bold">Admin Editable</span>}
                </div>

                {isAdmin ? (
                  <textarea
                    rows={2}
                    value={adminRemark}
                    onChange={(e) => setAdminRemark(e.target.value)}
                    placeholder="Add feedback, task evaluation, or notes for this work log..."
                    className="w-full rounded-xl px-3 py-2 text-xs border transition-colors resize-none font-sans"
                    style={{
                      backgroundColor: "var(--bg-surface-subtle)",
                      borderColor: "var(--border-medium)",
                      color: "var(--text-primary)",
                    }}
                  />
                ) : (
                  <div
                    className="p-3 rounded-xl border text-xs"
                    style={{
                      backgroundColor: adminRemark ? "var(--bg-surface-subtle)" : "transparent",
                      borderColor: adminRemark ? "var(--border-subtle)" : "transparent",
                      color: adminRemark ? "var(--text-secondary)" : "var(--text-muted)",
                    }}
                  >
                    {adminRemark ? (
                      <p className="italic leading-relaxed">&ldquo;{adminRemark}&rdquo;</p>
                    ) : (
                      <span className="italic text-[11px]">No admin remarks given yet.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions Bar */}
        <div
          className="flex items-center justify-between p-4 border-t gap-3 shrink-0"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border text-xs font-semibold transition-all hover:brightness-110"
            style={{
              backgroundColor: "var(--bg-surface-subtle)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-secondary)",
            }}
          >
            Close
          </button>

          {canEditContent && (
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all shadow-md hover:brightness-110 disabled:opacity-50"
              style={{
                backgroundColor: "var(--accent-primary)",
                borderColor: "var(--border-medium)",
                color: "var(--accent-text)",
                boxShadow: "0 4px 14px var(--accent-glow)",
              }}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Saving Work Log..." : "Save Work Log"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
