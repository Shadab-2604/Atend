"use client";

import React, { useState, useEffect } from "react";
import { AdminMetrics, User, RegularizationRequest } from "@/types";
import {
  Users,
  UserPlus,
  Search,
  RefreshCw,
  Clock,
  Coffee,
  AlertOctagon,
  LogOut,
  CheckCircle,
  X,
  Key,
  FileCheck,
  Check,
  Ban,
  Building2,
  Home,
  Edit2,
  Trash2,
  UserCog,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff,
  FileText,
  MessageSquare,
  Edit3,
} from "lucide-react";
import { RejectionReasonModal } from "./RejectionReasonModal";
import { AdminRemarkModal } from "./AdminRemarkModal";
import { CalendarView } from "./CalendarView";
import { formatTo12Hour } from "@/lib/formatters";
import { apiAdminGetAllAttendance, apiAdminOverrideAttendance, apiGetAttendance, apiAdminGetDailyWorkLogs } from "@/lib/api";
import { Calendar as CalendarIcon } from "lucide-react";

interface AdminDashboardProps {
  users: User[];
  metrics: AdminMetrics;
  onRefresh: () => void;
  onCreateUser: (userData: any) => Promise<void>;
  onUpdateUser?: (userId: string, userData: any) => Promise<void>;
  onDeleteUser?: (userId: string) => Promise<void>;
  currentAdminId?: string;
  regularizationRequests?: RegularizationRequest[];
  onReviewRegularization?: (
    requestId: string,
    action: "approve" | "reject",
    adminReason?: string
  ) => Promise<void>;
  onOpenWorkLogForUserAndDate?: (userId: string, userName: string, date: string) => void;
  loading?: boolean;
  workingDaysMap?: Record<string, number>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  users,
  metrics,
  onRefresh,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  currentAdminId,
  regularizationRequests = [],
  onReviewRegularization,
  onOpenWorkLogForUserAndDate,
  loading = false,
  workingDaysMap = {},
}) => {
  const [activeTab, setActiveTab] = useState<"monitoring" | "regularization" | "manage_users" | "attendance_history" | "member_calendar" | "worklog_audit">("monitoring");
  const [searchQuery, setSearchQuery] = useState("");

  const [historyRecords, setHistoryRecords] = useState<any[]>([]);
  const [historyDate, setHistoryDate] = useState<string>("");
  const [historyUserId, setHistoryUserId] = useState<string>("all");
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Work log audit state
  const [workLogAuditDate, setWorkLogAuditDate] = useState<string>("");
  const [workLogAuditData, setWorkLogAuditData] = useState<any>(null);
  const [loadingWorkLogAudit, setLoadingWorkLogAudit] = useState<boolean>(false);
  const [workLogStatusFilter, setWorkLogStatusFilter] = useState<string>("all");
  const [workLogSearchQuery, setWorkLogSearchQuery] = useState<string>("");

  const [remarkModalData, setRemarkModalData] = useState<{
    isOpen: boolean;
    userId: string;
    userName: string;
    date: string;
    currentRemark: string;
    workLogContent?: string;
  }>({
    isOpen: false,
    userId: "",
    userName: "",
    date: "",
    currentRemark: "",
    workLogContent: "",
  });

  const fetchWorkLogAudit = async (targetDate?: string) => {
    const d = targetDate !== undefined ? targetDate : (workLogAuditDate || new Date().toISOString().split("T")[0]);
    setLoadingWorkLogAudit(true);
    try {
      const res = await apiAdminGetDailyWorkLogs(d);
      setWorkLogAuditData(res);
    } catch (err) {
      console.error("Failed to fetch work log audit:", err);
    } finally {
      setLoadingWorkLogAudit(false);
    }
  };

  useEffect(() => {
    if (activeTab === "worklog_audit") {
      fetchWorkLogAudit();
    }
  }, [activeTab, workLogAuditDate]);

  // Regularization requests state
  const [regFilter, setRegFilter] = useState<string>("all");
  const [regSearch, setRegSearch] = useState<string>("");
  const [selectedRequestForReject, setSelectedRequestForReject] = useState<RegularizationRequest | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  // Member calendar inspection state
  const [selectedCalendarUserId, setSelectedCalendarUserId] = useState<string>("");
  const [userCalendarRecords, setUserCalendarRecords] = useState<any[]>([]);
  const [loadingUserCalendar, setLoadingUserCalendar] = useState<boolean>(false);

  const fetchUserCalendar = async (targetUserId: string) => {
    if (!targetUserId) return;
    setLoadingUserCalendar(true);
    try {
      const res = await apiGetAttendance(targetUserId);
      setUserCalendarRecords(res.records || []);
    } catch (err) {
      console.error("Failed to fetch user calendar:", err);
    } finally {
      setLoadingUserCalendar(false);
    }
  };

  const handleAdminOverrideAttendance = async (date: string, status: any) => {
    if (!selectedCalendarUserId) return;
    await apiAdminOverrideAttendance({
      userId: selectedCalendarUserId,
      date,
      status,
      notes: `Marked ${status} by Admin`,
    });
    await fetchUserCalendar(selectedCalendarUserId);
    onRefresh();
  };

  const handleOpenMemberCalendar = (targetUserId: string) => {
    setSelectedCalendarUserId(targetUserId);
    setActiveTab("member_calendar");
    fetchUserCalendar(targetUserId);
  };

  // New user form state
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    name: "",
    email: "",
    role: "intern",
    startDate: "",
    endDate: "",
  });
  const [addRoleType, setAddRoleType] = useState<string>("intern");
  const [addCustomRole, setAddCustomRole] = useState<string>("");
  const [showAddPassword, setShowAddPassword] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const handleStartDateChange = (val: string) => {
    let computedEndDate = formData.endDate;
    if ((addRoleType === "intern" || formData.role === "intern") && val && !formData.endDate) {
      const sDate = new Date(val);
      if (!isNaN(sDate.getTime())) {
        const eDate = new Date(sDate);
        eDate.setDate(eDate.getDate() + 45);
        computedEndDate = eDate.toISOString().split("T")[0];
      }
    }
    setFormData((prev) => ({ ...prev, startDate: val, endDate: computedEndDate }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    setSubmitting(true);

    try {
      const finalRole = addRoleType === "other" ? (addCustomRole.trim() || "other") : addRoleType;
      await onCreateUser({
        ...formData,
        role: finalRole,
      });
      setFormSuccess(`User '${formData.username}' created successfully!`);
      setFormData({
        username: "",
        password: "",
        name: "",
        email: "",
        role: "intern",
        startDate: "",
        endDate: "",
      });
      setAddRoleType("intern");
      setAddCustomRole("");
      setShowAddPassword(false);
      setTimeout(() => {
        setIsModalOpen(false);
        setFormSuccess("");
      }, 1200);
    } catch (err: any) {
      setFormError(err.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  // Edit user state
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "",
    username: "",
    email: "",
    role: "intern" as string,
    password: "",
    startDate: "",
    endDate: "",
  });
  const [editRoleType, setEditRoleType] = useState<string>("intern");
  const [editCustomRole, setEditCustomRole] = useState<string>("");
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // Delete user state
  const [selectedUserForDelete, setSelectedUserForDelete] = useState<User | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Manage users tab filter
  const [manageRoleFilter, setManageRoleFilter] = useState<string>("all");
  const [manageSearchQuery, setManageSearchQuery] = useState<string>("");

  const handleOpenEdit = (userToEdit: User) => {
    setSelectedUserForEdit(userToEdit);
    const userRole = userToEdit.role || "intern";
    if (userRole === "admin") {
      setEditRoleType("admin");
      setEditCustomRole("");
    } else if (userRole === "intern") {
      setEditRoleType("intern");
      setEditCustomRole("");
    } else {
      setEditRoleType("other");
      setEditCustomRole(userRole);
    }
    setShowEditPassword(false);
    setEditFormData({
      name: userToEdit.name || "",
      username: userToEdit.username || "",
      email: userToEdit.email || "",
      role: userRole,
      password: "",
      startDate: userToEdit.startDate || "",
      endDate: userToEdit.endDate || "",
    });
    setEditError("");
    setEditSuccess("");
    setIsEditModalOpen(true);
  };

  const totalAdmins = users.filter((u) => u.role === "admin").length;

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit || !onUpdateUser) return;

    const finalRole = editRoleType === "other" ? (editCustomRole.trim() || "other") : editRoleType;

    if (
      selectedUserForEdit.role === "admin" &&
      finalRole !== "admin" &&
      totalAdmins <= 1
    ) {
      setEditError("You are the only admin, please make someone else admin then only you can change this role.");
      return;
    }

    setEditSubmitting(true);
    setEditError("");
    setEditSuccess("");

    try {
      const payload: any = {
        name: editFormData.name,
        username: editFormData.username,
        email: editFormData.email,
        role: finalRole,
        startDate: editFormData.startDate,
        endDate: editFormData.endDate,
      };
      if (editFormData.password.trim()) {
        payload.password = editFormData.password.trim();
      }
      const targetId = selectedUserForEdit.id || selectedUserForEdit._id || "";
      await onUpdateUser(targetId, payload);
      setEditSuccess("User updated successfully!");
      setTimeout(() => {
        setIsEditModalOpen(false);
        setSelectedUserForEdit(null);
        setEditSuccess("");
      }, 1000);
    } catch (err: any) {
      setEditError(err.message || "Failed to update user.");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleOpenDelete = (userToDelete: User) => {
    setSelectedUserForDelete(userToDelete);
    setDeleteError("");
    if (userToDelete.role === "admin" && totalAdmins <= 1) {
      setDeleteError("You are the only admin, please make someone else admin then only you can delete it.");
    }
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUserForDelete || !onDeleteUser) return;
    if (selectedUserForDelete.role === "admin" && totalAdmins <= 1) {
      setDeleteError("You are the only admin, please make someone else admin then only you can delete it.");
      return;
    }
    setDeleteSubmitting(true);
    setDeleteError("");

    try {
      const targetId = selectedUserForDelete.id || selectedUserForDelete._id || "";
      await onDeleteUser(targetId);
      setIsDeleteModalOpen(false);
      setSelectedUserForDelete(null);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete user.");
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Filter users for Manage Users tab
  const managedUsersList = users.filter((u) => {
    const q = manageSearchQuery.toLowerCase();
    const matchesSearch =
      (u.name || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (manageRoleFilter === "all") return true;
    if (manageRoleFilter === "intern") return u.role === "intern";
    if (manageRoleFilter === "admin") return u.role === "admin";
    if (manageRoleFilter === "other") return u.role !== "intern" && u.role !== "admin";
    return u.role === manageRoleFilter;
  });

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === "all") return true;
    return u.currentStatus === statusFilter;
  });

  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      setTicker((t) => (t + 1) % 1000000);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const formatSeconds = (totalSeconds: number) => {
    if (!totalSeconds || totalSeconds < 0) return "00:00:00";
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const pendingRequestsCount = regularizationRequests.filter(
    (r) => r.status === "pending"
  ).length;

  const filteredRequests = regularizationRequests.filter((r) => {
    const q = regSearch.toLowerCase();
    const matchesSearch =
      r.userName.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      (r.reason && r.reason.toLowerCase().includes(q));

    if (!matchesSearch) return false;
    if (regFilter === "all") return true;
    return r.status === regFilter;
  });

  const handleApprove = async (requestId: string) => {
    if (!onReviewRegularization) return;
    setReviewingId(requestId);
    try {
      await onReviewRegularization(requestId, "approve");
    } finally {
      setReviewingId(null);
    }
  };

  const handleRejectClick = (req: RegularizationRequest) => {
    setSelectedRequestForReject(req);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (requestId: string, adminReason: string) => {
    if (!onReviewRegularization) return;
    setReviewingId(requestId);
    try {
      await onReviewRegularization(requestId, "reject", adminReason);
      setIsRejectModalOpen(false);
      setSelectedRequestForReject(null);
    } finally {
      setReviewingId(null);
    }
  };

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiAdminGetAllAttendance(historyDate, historyUserId === "all" ? undefined : historyUserId);
      setHistoryRecords(res.records || []);
    } catch (err) {
      console.error("Failed to fetch history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "attendance_history") {
      fetchHistory();
    }
  }, [activeTab, historyDate, historyUserId]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Admin Top Navigation Section Tabs */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl border shadow-sm"
        style={{
          backgroundColor: "var(--bg-surface)",
          borderColor: "var(--border-subtle)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("monitoring")}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "monitoring" ? "shadow-sm" : "opacity-75 hover:opacity-100"
            }`}
            style={{
              backgroundColor:
                activeTab === "monitoring" ? "var(--bg-surface-elevated)" : "transparent",
              color: "var(--text-primary)",
              border: activeTab === "monitoring" ? "1px solid var(--border-medium)" : "1px solid transparent",
            }}
          >
            <Users className="w-4 h-4" />
            <span>Team Directory & Live Status</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("regularization")}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "regularization" ? "shadow-sm" : "opacity-75 hover:opacity-100"
            }`}
            style={{
              backgroundColor:
                activeTab === "regularization" ? "var(--bg-surface-elevated)" : "transparent",
              color: "var(--text-primary)",
              border: activeTab === "regularization" ? "1px solid var(--border-medium)" : "1px solid transparent",
            }}
          >
            <FileCheck className="w-4 h-4" />
            <span>Attendance Regularization Requests</span>
            {pendingRequestsCount > 0 ? (
              <span
                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: "var(--status-break-bg)",
                  borderColor: "var(--status-break-border)",
                  color: "var(--status-break-text)",
                }}
              >
                {pendingRequestsCount} Pending
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("manage_users")}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "manage_users" ? "shadow-sm" : "opacity-75 hover:opacity-100"
            }`}
            style={{
              backgroundColor:
                activeTab === "manage_users" ? "var(--bg-surface-elevated)" : "transparent",
              color: "var(--text-primary)",
              border: activeTab === "manage_users" ? "1px solid var(--border-medium)" : "1px solid transparent",
            }}
          >
            <UserCog className="w-4 h-4" />
            <span>Manage Users</span>
            <span
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
              style={{
                backgroundColor: "var(--accent-subtle)",
                borderColor: "var(--border-subtle)",
                color: "var(--accent-primary)",
              }}
            >
              {users.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("attendance_history")}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "attendance_history" ? "shadow-sm" : "opacity-75 hover:opacity-100"
            }`}
            style={{
              backgroundColor:
                activeTab === "attendance_history" ? "var(--bg-surface-elevated)" : "transparent",
              color: "var(--text-primary)",
              border: activeTab === "attendance_history" ? "1px solid var(--border-medium)" : "1px solid transparent",
            }}
          >
            <Clock className="w-4 h-4" />
            <span>Attendance History</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("member_calendar");
              if (!selectedCalendarUserId && users.length > 0) {
                const firstUser = users.find((u) => u.role !== "admin") || users[0];
                const uid = firstUser.id || firstUser._id || "";
                setSelectedCalendarUserId(uid);
                fetchUserCalendar(uid);
              }
            }}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "member_calendar" ? "shadow-sm" : "opacity-75 hover:opacity-100"
            }`}
            style={{
              backgroundColor:
                activeTab === "member_calendar" ? "var(--bg-surface-elevated)" : "transparent",
              color: "var(--text-primary)",
              border: activeTab === "member_calendar" ? "1px solid var(--border-medium)" : "1px solid transparent",
            }}
          >
            <CalendarIcon className="w-4 h-4" />
            <span>Inspect Member Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("worklog_audit")}
            className={`px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === "worklog_audit" ? "shadow-sm" : "opacity-75 hover:opacity-100"
            }`}
            style={{
              backgroundColor:
                activeTab === "worklog_audit" ? "var(--bg-surface-elevated)" : "transparent",
              color: "var(--text-primary)",
              border: activeTab === "worklog_audit" ? "1px solid var(--border-medium)" : "1px solid transparent",
            }}
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>Work Log Audit</span>
            {workLogAuditData?.metrics?.missedCount > 0 && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: "var(--status-ooo-bg)",
                  borderColor: "var(--status-ooo-border)",
                  color: "var(--status-ooo-text)",
                }}
              >
                {workLogAuditData.metrics.missedCount} Missed
              </span>
            )}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 px-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--text-muted)" }} />
          <span>
            {activeTab === "monitoring"
              ? "Real-time presence monitoring & directory"
              : activeTab === "regularization"
              ? "Review, approve, or reject employee attendance regularizations"
              : "Manage member accounts, edit user profiles, and manage permissions"}
          </span>
        </div>
      </div>

      {activeTab === "monitoring" && (
        <div className="space-y-6">
          {/* Top Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            {/* Total Users */}
            <div
              className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  Total Members
                </span>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center border"
                  style={{
                    backgroundColor: "var(--accent-subtle)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--accent-primary)",
                  }}
                >
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-primary)" }}>
                {metrics.total}
              </span>
            </div>

            {/* 🟢 Working Now */}
            <div
              className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--status-working-border)",
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--status-working-text)" }}>
                  🟢 Active Working
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full animate-pulse shadow-sm"
                  style={{ backgroundColor: "var(--status-working-text)" }}
                />
              </div>
              <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--status-working-text)" }}>
                {metrics.working}
              </span>
            </div>

            {/* 🟡 On Break */}
            <div
              className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--status-break-border)",
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--status-break-text)" }}>
                  🟡 On Break
                </span>
                <Coffee className="w-3.5 h-3.5" style={{ color: "var(--status-break-text)" }} />
              </div>
              <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--status-break-text)" }}>
                {metrics.break}
              </span>
            </div>

            {/* 🔴 Out of Office */}
            <div
              className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--status-ooo-border)",
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--status-ooo-text)" }}>
                  🔴 Out of Office
                </span>
                <AlertOctagon className="w-3.5 h-3.5" style={{ color: "var(--status-ooo-text)" }} />
              </div>
              <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--status-ooo-text)" }}>
                {metrics.ooo}
              </span>
            </div>

            {/* ⚪ Logged Out */}
            <div
              className="rounded-2xl p-4 flex flex-col justify-between border shadow-sm transition-all"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  ⚪ Logged Out
                </span>
                <LogOut className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              </div>
              <span className="text-2xl sm:text-3xl font-black" style={{ color: "var(--text-secondary)" }}>
                {metrics.loggedOut}
              </span>
            </div>
          </div>

          {/* Control Bar: Search, Filters, Add User Button */}
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border shadow-xl transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search member name or username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border transition-colors outline-none"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Status Filter Buttons */}
            <div
              className="flex flex-wrap items-center gap-1 p-1 rounded-xl border w-full sm:w-auto overflow-x-auto shadow-inner"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              {[
                { id: "all", label: "All" },
                { id: "working", label: "🟢 Working" },
                { id: "break", label: "🟡 Break" },
                { id: "ooo", label: "🔴 OOO" },
                { id: "logged_out", label: "⚪ Offline" },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                  style={{
                    backgroundColor: statusFilter === tab.id ? "var(--accent-primary)" : "transparent",
                    color: statusFilter === tab.id ? "var(--accent-text)" : "var(--text-secondary)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                title="Refresh Live Data"
                className="p-2.5 rounded-xl border transition-all hover:brightness-110"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-indigo-400" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("manage_users")}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold border shadow-sm transition-all hover:brightness-110 shrink-0"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
                title="Manage Users Directory"
              >
                <UserCog className="w-4 h-4" />
                <span>Manage Users</span>
              </button>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all hover:opacity-95 shrink-0"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "var(--accent-text)",
                  boxShadow: "0 4px 14px var(--accent-glow)",
                }}
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User Credentials</span>
              </button>
            </div>
          </div>

          {/* Live Presence Table */}
          <div
            className="rounded-2xl border overflow-hidden shadow-2xl transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div
              className="p-4 sm:p-5 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                  Live Team Attendance & Presence Feed
                </h3>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                Showing {filteredUsers.length} user{filteredUsers.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className="uppercase tracking-wider font-bold border-b"
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  <tr>
                    <th className="py-3.5 px-4">Member</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Live Status</th>
                    <th className="py-3.5 px-4">Punch Times</th>
                    <th className="py-3.5 px-4">Working Time</th>
                    <th className="py-3.5 px-4">Break Time</th>
                    <th className="py-3.5 px-4">OOO Time</th>
                    <th className="py-3.5 px-4">Total Shift</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
                        No users match the search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const status = u.currentStatus || "logged_out";
                      const now = Date.now();

                      const lastChangeMs = u.lastStatusChangeTimestamp
                        ? new Date(u.lastStatusChangeTimestamp).getTime()
                        : (u.loginTimestamp ? new Date(u.loginTimestamp).getTime() : now);
                      const sessionSec = Math.max(0, Math.floor((now - lastChangeMs) / 1000));

                      // Live Break calculation (exact seconds)
                      let breakSec = u.accumulatedBreakSeconds !== undefined
                        ? u.accumulatedBreakSeconds
                        : ((u.totalBreakMinutes || 0) * 60);
                      if (status === "break") {
                        const breakStart = u.breakStartTime ? new Date(u.breakStartTime).getTime() : lastChangeMs;
                        breakSec += Math.max(0, Math.floor((now - breakStart) / 1000));
                      }

                      // Live OOO calculation (exact seconds)
                      let oooSec = u.accumulatedOooSeconds !== undefined
                        ? u.accumulatedOooSeconds
                        : ((u.totalOooMinutes || 0) * 60);
                      if (status === "ooo") {
                        const oooStart = u.oooStartTime ? new Date(u.oooStartTime).getTime() : lastChangeMs;
                        oooSec += Math.max(0, Math.floor((now - oooStart) / 1000));
                      }

                      // Live Working calculation (accumulated + active session)
                      let workSec = u.accumulatedWorkSeconds || ((u.todayWorkingMinutes || 0) * 60);
                      if (status === "working") {
                        workSec += sessionSec;
                      }

                      // Live Total Shift calculation
                      let totalShiftSec = 0;
                      if (u.loginTimestamp) {
                        if (status === "logged_out" && u.logoutTime) {
                          totalShiftSec = workSec + breakSec + oooSec;
                        } else {
                          totalShiftSec = Math.max(0, Math.floor((now - new Date(u.loginTimestamp).getTime()) / 1000));
                        }
                      }

                      const isFullDay = workSec >= 33300; // 9.5 hours - 15m login buffer = 33,300s (9h 15m)

                      return (
                        <tr
                          key={u.id || u._id}
                          className="transition-colors hover:brightness-110"
                          style={{ borderBottom: "1px solid var(--border-subtle)" }}
                        >
                          {/* Intern Name & Username */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-black text-xs uppercase shrink-0 shadow-xs"
                                style={{
                                  background: "linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-hover) 100%)",
                                  color: "var(--accent-text)",
                                }}
                              >
                                {u.name.substring(0, 2)}
                              </div>
                              <div>
                                <span className="font-bold block text-sm" style={{ color: "var(--text-primary)" }}>
                                  {u.name}
                                </span>
                                <span className="font-mono text-[11px]" style={{ color: "var(--text-muted)" }}>
                                  @{u.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4">
                            <span
                              className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                              style={{
                                backgroundColor: u.role === "admin" ? "var(--accent-subtle)" : "var(--bg-surface-elevated)",
                                borderColor: u.role === "admin" ? "var(--accent-primary)" : "var(--border-subtle)",
                                color: u.role === "admin" ? "var(--accent-primary)" : "var(--text-secondary)",
                              }}
                            >
                              {u.role}
                            </span>
                          </td>

                          {/* Live Status with 4 Color Coding */}
                          <td className="py-3.5 px-4">
                            {status === "working" && (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                style={{
                                  backgroundColor: "var(--status-working-bg)",
                                  borderColor: "var(--status-working-border)",
                                  color: "var(--status-working-text)",
                                }}
                              >
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                🟢 Working
                              </span>
                            )}
                            {status === "break" && (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                style={{
                                  backgroundColor: "var(--status-break-bg)",
                                  borderColor: "var(--status-break-border)",
                                  color: "var(--status-break-text)",
                                }}
                              >
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                                🟡 On Break
                              </span>
                            )}
                            {status === "ooo" && (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                style={{
                                  backgroundColor: "var(--status-ooo-bg)",
                                  borderColor: "var(--status-ooo-border)",
                                  color: "var(--status-ooo-text)",
                                }}
                              >
                                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                                🔴 Out of Office
                              </span>
                            )}
                            {status === "logged_out" && (
                              <span
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                                style={{
                                  backgroundColor: "var(--status-logout-bg)",
                                  borderColor: "var(--status-logout-border)",
                                  color: "var(--status-logout-text)",
                                }}
                              >
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "var(--status-logout-text)" }} />
                                ⚪ Logged Out
                              </span>
                            )}
                          </td>

                          {/* Punch Times */}
                          <td className="py-3.5 px-4 font-mono text-xs">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1" style={{ color: "var(--status-working-text)" }}>
                                <span className="text-[9px] uppercase font-mono font-bold" style={{ color: "var(--text-muted)" }}>IN:</span>
                                <span className="font-bold">{formatTo12Hour(u.loginTime)}</span>
                              </div>
                              <div className="flex items-center gap-1" style={{ color: "var(--text-secondary)" }}>
                                <span className="text-[9px] uppercase font-mono font-bold" style={{ color: "var(--text-muted)" }}>OUT:</span>
                                <span>{status === "logged_out" ? formatTo12Hour(u.logoutTime) : "In Progress"}</span>
                              </div>
                            </div>
                          </td>

                          {/* Working Time (Live) */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="flex items-center gap-1.5">
                              {status === "working" && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />}
                              <span
                                className="font-bold text-sm"
                                style={{ color: status === "working" ? "var(--status-working-text)" : "var(--text-primary)" }}
                              >
                                {workSec > 0 ? formatSeconds(workSec) : "--:--"}
                              </span>
                            </div>
                            {workSec > 0 && (
                              <div className="mt-1">
                                {isFullDay ? (
                                  <span
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border inline-block"
                                    style={{
                                      backgroundColor: "var(--status-working-bg)",
                                      borderColor: "var(--status-working-border)",
                                      color: "var(--status-working-text)",
                                    }}
                                  >
                                    Full Day (9.15h+)
                                  </span>
                                ) : (
                                  <span
                                    className="text-[9px] font-bold px-1.5 py-0.2 rounded-full border inline-block"
                                    style={{
                                      backgroundColor: "var(--status-break-bg)",
                                      borderColor: "var(--status-break-border)",
                                      color: "var(--status-break-text)",
                                    }}
                                  >
                                    Half-Day (&lt;9.15h)
                                  </span>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Break Time (Live) */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="flex items-center gap-1.5">
                              {status === "break" && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
                              <span
                                className="font-bold"
                                style={{ color: status === "break" ? "var(--status-break-text)" : "var(--text-secondary)" }}
                              >
                                {breakSec > 0 ? formatSeconds(breakSec) : "--"}
                              </span>
                            </div>
                            {status === "break" && (
                              <span className="text-[9px] font-bold uppercase tracking-wider block mt-0.5" style={{ color: "var(--status-break-text)" }}>
                                Break Live
                              </span>
                            )}
                          </td>

                          {/* OOO Time (Live) */}
                          <td className="py-3.5 px-4 font-mono">
                            <div className="flex items-center gap-1.5">
                              {status === "ooo" && <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />}
                              <span
                                className="font-bold"
                                style={{ color: status === "ooo" ? "var(--status-ooo-text)" : "var(--text-secondary)" }}
                              >
                                {oooSec > 0 ? formatSeconds(oooSec) : "--"}
                              </span>
                            </div>
                            {status === "ooo" && (
                              <span className="text-[9px] font-bold uppercase tracking-wider block mt-0.5" style={{ color: "var(--status-ooo-text)" }}>
                                OOO Live
                              </span>
                            )}
                          </td>

                          {/* Total Shift (Live) */}
                          <td className="py-3.5 px-4 font-mono font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                            {totalShiftSec > 0 ? formatSeconds(totalShiftSec) : "--"}
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenMemberCalendar(u.id || u._id || "")}
                                className="p-1.5 rounded-lg border transition-all hover:brightness-125"
                                style={{
                                  backgroundColor: "var(--bg-surface-elevated)",
                                  borderColor: "var(--border-subtle)",
                                  color: "var(--accent-primary)",
                                }}
                                title={`Inspect ${u.name}'s Attendance Calendar`}
                              >
                                <CalendarIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEdit(u)}
                                className="p-1.5 rounded-lg border transition-all hover:brightness-125"
                                style={{
                                  backgroundColor: "var(--bg-surface-elevated)",
                                  borderColor: "var(--border-subtle)",
                                  color: "var(--text-secondary)",
                                }}
                                title={`Edit ${u.name}`}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              {(() => {
                                const isOnlyAdmin = u.role === "admin" && totalAdmins <= 1;
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDelete(u)}
                                    className="p-1.5 rounded-lg border transition-all hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400"
                                    style={{
                                      backgroundColor: "var(--bg-surface-elevated)",
                                      borderColor: "var(--border-subtle)",
                                      color: isOnlyAdmin ? "var(--text-muted)" : "var(--text-secondary)",
                                    }}
                                    title={
                                      isOnlyAdmin
                                        ? "You are the only admin, please make someone else admin then only you can delete it."
                                        : `Delete ${u.name}`
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "regularization" && (
        <div className="space-y-4 animate-fade-in">
          {/* Control Bar */}
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border shadow-xl transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search member name, date, reason..."
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border transition-colors outline-none"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Status Filter Tabs */}
            <div
              className="flex flex-wrap items-center gap-1 p-1 rounded-xl border w-full sm:w-auto overflow-x-auto shadow-inner"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              {[
                { id: "all", label: "All Requests" },
                { id: "pending", label: `🟡 Pending (${pendingRequestsCount})` },
                { id: "approved", label: "🟢 Approved" },
                { id: "rejected", label: "🔴 Rejected" },
              ].map((tab) => (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setRegFilter(tab.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                  style={{
                    backgroundColor:
                      regFilter === tab.id ? "var(--accent-primary)" : "transparent",
                    color: regFilter === tab.id ? "var(--accent-text)" : "var(--text-secondary)",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh Requests"
              className="p-2.5 rounded-xl border transition-all hover:brightness-110"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Requests Table */}
          <div
            className="rounded-2xl border shadow-xl overflow-hidden transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="border-b text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "var(--bg-surface-elevated)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <th className="py-3.5 px-4">Employee / Member</th>
                    <th className="py-3.5 px-4">Target Date</th>
                    <th className="py-3.5 px-4">Work Mode & Hours</th>
                    <th className="py-3.5 px-4">Employee Reason</th>
                    <th className="py-3.5 px-4">Status & Reason Feedback</th>
                    <th className="py-3.5 px-4 text-right">Review Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs" style={{ borderColor: "var(--border-subtle)" }}>
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
                        <div className="flex flex-col items-center justify-center gap-2">
                          <FileCheck className="w-7 h-7 opacity-40" />
                          <span className="font-semibold text-sm">No regularization requests found.</span>
                          <span className="text-xs">
                            {regFilter === "all"
                              ? "No requests have been submitted by employees yet."
                              : `No requests with status '${regFilter}' found.`}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map((req, idx) => {
                      const reqId = req._id || req.id || "";
                      const isPending = req.status === "pending";
                      const isApproved = req.status === "approved";
                      const isRejected = req.status === "rejected";
                      const isBusy = reviewingId === reqId;

                      return (
                        <tr
                          key={`${reqId || "req"}-${idx}`}
                          className="hover:brightness-105 transition-colors"
                          style={{ backgroundColor: "var(--bg-surface)" }}
                        >
                          {/* Intern Name */}
                          <td className="py-4 px-4 font-bold" style={{ color: "var(--text-primary)" }}>
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border"
                                style={{
                                  backgroundColor: "var(--bg-surface-elevated)",
                                  borderColor: "var(--border-subtle)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                {req.userName ? req.userName.charAt(0).toUpperCase() : "U"}
                              </div>
                              <span>{req.userName}</span>
                            </div>
                          </td>

                          {/* Target Date */}
                          <td className="py-4 px-4 font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
                            {req.date}
                          </td>

                          {/* Work Mode & Hours */}
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1"
                                style={{
                                  backgroundColor: "var(--bg-surface-elevated)",
                                  borderColor: "var(--border-subtle)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                {req.workMode === "WFH" ? (
                                  <Home className="w-3 h-3" />
                                ) : (
                                  <Building2 className="w-3 h-3" />
                                )}
                                {req.workMode}
                              </span>
                              <span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                                {req.hours} hrs
                              </span>
                            </div>
                          </td>

                          {/* Reason */}
                          <td className="py-4 px-4 max-w-xs">
                            <p className="line-clamp-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                              &ldquo;{req.reason}&rdquo;
                            </p>
                          </td>

                          {/* Status & Feedback */}
                          <td className="py-4 px-4">
                            <div className="space-y-1">
                              {isPending && (
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block"
                                  style={{
                                    backgroundColor: "var(--status-break-bg)",
                                    borderColor: "var(--status-break-border)",
                                    color: "var(--status-break-text)",
                                  }}
                                >
                                  🟡 Pending Review
                                </span>
                              )}
                              {isApproved && (
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block"
                                  style={{
                                    backgroundColor: "var(--status-working-bg)",
                                    borderColor: "var(--status-working-border)",
                                    color: "var(--status-working-text)",
                                  }}
                                >
                                  🟢 Approved
                                </span>
                              )}
                              {isRejected && (
                                <div>
                                  <span
                                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block"
                                    style={{
                                      backgroundColor: "var(--status-ooo-bg)",
                                      borderColor: "var(--status-ooo-border)",
                                      color: "var(--status-ooo-text)",
                                    }}
                                  >
                                    🔴 Rejected
                                  </span>
                                  {req.adminReason && (
                                    <div
                                      className="p-2 rounded-lg border text-[10px] mt-1.5"
                                      style={{
                                        backgroundColor: "var(--bg-surface-elevated)",
                                        borderColor: "var(--border-subtle)",
                                        color: "var(--status-ooo-text)",
                                      }}
                                    >
                                      <span className="font-bold block">Rejection Reason:</span>
                                      {req.adminReason}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-4 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleApprove(reqId)}
                                  className="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all hover:brightness-120 disabled:opacity-50"
                                  style={{
                                    backgroundColor: "var(--status-working-bg)",
                                    borderColor: "var(--status-working-border)",
                                    color: "var(--status-working-text)",
                                  }}
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approve</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isBusy}
                                  onClick={() => handleRejectClick(req)}
                                  className="px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition-all hover:brightness-120 disabled:opacity-50"
                                  style={{
                                    backgroundColor: "var(--status-ooo-bg)",
                                    borderColor: "var(--status-ooo-border)",
                                    color: "var(--status-ooo-text)",
                                  }}
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Reject</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] font-mono" style={{ color: "var(--text-muted)" }}>
                                {isApproved ? "Regularized" : "Reviewed"}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MANAGE USERS DIRECTORY TAB VIEW */}
      {activeTab === "manage_users" && (
        <div className="space-y-6 animate-fade-in">
          {/* Quick Metrics Bar for Users */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div
              className="rounded-2xl p-4 sm:p-5 border shadow-sm flex items-center justify-between"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                  Total Accounts
                </span>
                <span className="text-2xl sm:text-3xl font-black mt-1 block" style={{ color: "var(--text-primary)" }}>
                  {users.length}
                </span>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: "var(--accent-subtle)", borderColor: "var(--border-subtle)", color: "var(--accent-primary)" }}
              >
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 border shadow-sm flex items-center justify-between"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                  Interns / Employees
                </span>
                <span className="text-2xl sm:text-3xl font-black mt-1 block" style={{ color: "var(--status-working-text)" }}>
                  {users.filter((u) => u.role === "intern").length}
                </span>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: "var(--status-working-bg)", borderColor: "var(--status-working-border)", color: "var(--status-working-text)" }}
              >
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div
              className="rounded-2xl p-4 sm:p-5 border shadow-sm flex items-center justify-between"
              style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-subtle)" }}
            >
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                  Administrators
                </span>
                <span className="text-2xl sm:text-3xl font-black mt-1 block" style={{ color: "var(--accent-primary)" }}>
                  {users.filter((u) => u.role === "admin").length}
                </span>
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border"
                style={{ backgroundColor: "var(--accent-subtle)", borderColor: "var(--border-subtle)", color: "var(--accent-primary)" }}
              >
                <Shield className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Control Bar: Search & Role Filters */}
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4 border shadow-xl transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search
                className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                placeholder="Search by name, username, email..."
                value={manageSearchQuery}
                onChange={(e) => setManageSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border transition-colors outline-none"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Role Filter Tabs & Add Button */}
            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
              <div
                className="flex items-center gap-1 p-1 rounded-xl border shadow-inner"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-subtle)",
                }}
              >
                {[
                  { id: "all", label: "All Accounts" },
                  { id: "intern", label: "Interns" },
                  { id: "admin", label: "Admins" },
                  { id: "other", label: "Other Roles" },
                ].map((tab) => (
                  <button
                    type="button"
                    key={tab.id}
                    onClick={() => setManageRoleFilter(tab.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0"
                    style={{
                      backgroundColor: manageRoleFilter === tab.id ? "var(--accent-primary)" : "transparent",
                      color: manageRoleFilter === tab.id ? "var(--accent-text)" : "var(--text-secondary)",
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all hover:opacity-95 shrink-0"
                style={{
                  backgroundColor: "var(--accent-primary)",
                  color: "var(--accent-text)",
                  boxShadow: "0 4px 14px var(--accent-glow)",
                }}
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User Credentials</span>
              </button>
            </div>
          </div>

          {/* User Management Table */}
          <div
            className="rounded-2xl border overflow-hidden shadow-2xl transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div
              className="p-4 sm:p-5 border-b flex items-center justify-between"
              style={{ borderColor: "var(--border-subtle)" }}
            >
              <div className="flex items-center gap-2.5">
                <UserCog className="w-5 h-5" style={{ color: "var(--accent-primary)" }} />
                <div>
                  <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                    Team User Directory & Management
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Add credentials, update profiles, change roles, or remove accounts
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {managedUsersList.length} User{managedUsersList.length === 1 ? "" : "s"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className="uppercase tracking-wider font-bold border-b"
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                >
                  <tr>
                    <th className="py-3.5 px-4">Member Account</th>
                    <th className="py-3.5 px-4">Email Address</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Live Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {managedUsersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
                        No users match the search or filter criteria.
                      </td>
                    </tr>
                  ) : (
                    managedUsersList.map((u) => {
                      const isSelf = Boolean(currentAdminId && (u.id === currentAdminId || u._id === currentAdminId));
                      const status = u.currentStatus || "logged_out";

                      let statusBadgeBg = "var(--bg-surface-elevated)";
                      let statusBadgeColor = "var(--text-muted)";
                      let statusBadgeBorder = "var(--border-subtle)";
                      let statusText = "Logged Out";

                      if (status === "working") {
                        statusBadgeBg = "var(--status-working-bg)";
                        statusBadgeColor = "var(--status-working-text)";
                        statusBadgeBorder = "var(--status-working-border)";
                        statusText = "🟢 Working";
                      } else if (status === "break") {
                        statusBadgeBg = "var(--status-break-bg)";
                        statusBadgeColor = "var(--status-break-text)";
                        statusBadgeBorder = "var(--status-break-border)";
                        statusText = "🟡 On Break";
                      } else if (status === "ooo") {
                        statusBadgeBg = "var(--status-ooo-bg)";
                        statusBadgeColor = "var(--status-ooo-text)";
                        statusBadgeBorder = "var(--status-ooo-border)";
                        statusText = "🔴 OOO";
                      }

                      return (
                        <tr key={u.id || u._id} className="hover:brightness-105 transition-colors">
                          {/* Member */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase shrink-0 border"
                                style={{
                                  backgroundColor: "var(--bg-surface-elevated)",
                                  borderColor: "var(--border-medium)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                {u.name ? u.name.charAt(0) : "U"}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                                    {u.name}
                                  </span>
                                  {isSelf && (
                                    <span
                                      className="text-[9px] font-mono px-1.5 py-0.2 rounded border font-semibold"
                                      style={{
                                        backgroundColor: "var(--accent-subtle)",
                                        borderColor: "var(--accent-primary)",
                                        color: "var(--accent-primary)",
                                      }}
                                    >
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[11px] block" style={{ color: "var(--text-muted)" }}>
                                  @{u.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-4 font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                            {u.email || <span style={{ color: "var(--text-muted)" }}>--</span>}
                          </td>

                          {/* Role / Designation */}
                          <td className="py-3.5 px-4">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block"
                              style={{
                                backgroundColor: u.role === "admin" ? "var(--accent-subtle)" : "var(--bg-surface-elevated)",
                                borderColor: u.role === "admin" ? "var(--accent-primary)" : "var(--border-subtle)",
                                color: u.role === "admin" ? "var(--accent-primary)" : "var(--text-secondary)",
                              }}
                            >
                              {u.role || "intern"}
                            </span>
                            {u.startDate && (
                              <div className="text-[10px] font-mono mt-0.5" style={{ color: "var(--text-muted)" }}>
                                {u.startDate} {u.endDate ? `→ ${u.endDate}` : ""}
                              </div>
                            )}
                          </td>

                          {/* Presence */}
                          <td className="py-3.5 px-4">
                            <span
                              className="text-[10px] font-bold px-2 py-0.5 rounded-full border inline-block"
                              style={{
                                backgroundColor: statusBadgeBg,
                                borderColor: statusBadgeBorder,
                                color: statusBadgeColor,
                              }}
                            >
                              {statusText}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenMemberCalendar(u.id || u._id || "")}
                                className="px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 transition-all hover:brightness-110 shadow-xs"
                                style={{
                                  backgroundColor: "var(--bg-surface-elevated)",
                                  borderColor: "var(--border-medium)",
                                  color: "var(--accent-primary)",
                                }}
                                title={`Inspect ${u.name}'s Attendance Calendar`}
                              >
                                <CalendarIcon className="w-3.5 h-3.5" />
                                <span>Calendar</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEdit(u)}
                                className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all hover:brightness-110 shadow-xs"
                                style={{
                                  backgroundColor: "var(--bg-surface-elevated)",
                                  borderColor: "var(--border-medium)",
                                  color: "var(--text-primary)",
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              {(() => {
                                const isOnlyAdmin = u.role === "admin" && totalAdmins <= 1;
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDelete(u)}
                                    className="px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 shadow-xs"
                                    style={{
                                      backgroundColor: "var(--bg-surface-elevated)",
                                      borderColor: "var(--border-medium)",
                                      color: isOnlyAdmin ? "var(--text-muted)" : "var(--status-ooo-text)",
                                    }}
                                    title={
                                      isOnlyAdmin
                                        ? "You are the only admin, please make someone else admin then only you can delete it."
                                        : `Delete ${u.name}`
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete</span>
                                  </button>
                                );
                              })()}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MEMBER CALENDAR INSPECTION & OVERRIDE TAB VIEW */}
      {activeTab === "member_calendar" && (
        <div className="space-y-6 animate-fade-in">
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border shadow-xl transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
                style={{
                  backgroundColor: "var(--accent-subtle)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--accent-primary)",
                }}
              >
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                  Member Attendance Calendar Inspection
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Select an employee or intern to view calendar and directly mark Present, Absent, Half Day, UL, or PL.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold uppercase tracking-wider shrink-0" style={{ color: "var(--text-muted)" }}>
                Select Member:
              </label>
              <select
                value={selectedCalendarUserId}
                onChange={(e) => {
                  const uid = e.target.value;
                  setSelectedCalendarUserId(uid);
                  fetchUserCalendar(uid);
                }}
                className="w-full sm:w-64 px-3 py-2 text-xs font-bold rounded-xl border transition-colors cursor-pointer outline-none shadow-sm"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              >
                {users.map((u) => (
                  <option key={u.id || u._id} value={u.id || u._id}>
                    {u.name} (@{u.username}) — {u.role || "intern"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedCalendarUserId ? (
            (() => {
              const targetUser = users.find((u) => (u.id || u._id) === selectedCalendarUserId);
              return (
                <div className="space-y-4">
                  {targetUser && (
                    <div
                      className="p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 text-xs"
                      style={{
                        backgroundColor: "var(--bg-surface-elevated)",
                        borderColor: "var(--border-subtle)",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                          {targetUser.name}
                        </span>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                          style={{
                            backgroundColor: "var(--accent-subtle)",
                            borderColor: "var(--border-subtle)",
                            color: "var(--accent-primary)",
                          }}
                        >
                          {targetUser.role || "intern"}
                        </span>
                        {targetUser.email && (
                          <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
                            {targetUser.email}
                          </span>
                        )}
                      </div>

                      {(targetUser.startDate || targetUser.endDate) && (
                        <div className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>
                          <span className="font-bold" style={{ color: "var(--text-muted)" }}>Duration: </span>
                          <span>{targetUser.startDate || "Not set"} → {targetUser.endDate || "Not set"}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {loadingUserCalendar ? (
                    <div className="p-12 text-center text-xs font-mono font-bold animate-pulse">
                      Loading attendance calendar for selected member...
                    </div>
                  ) : (
                    <CalendarView
                      attendanceRecords={userCalendarRecords}
                      workingDaysMap={workingDaysMap}
                      onAdminOverrideStatus={handleAdminOverrideAttendance}
                      onOpenWorkLogForDate={(d) => {
                        const targetUser = users.find((u) => u.id === selectedCalendarUserId || u._id === selectedCalendarUserId);
                        onOpenWorkLogForUserAndDate?.(selectedCalendarUserId, targetUser?.name || "Member", d);
                      }}
                      isAdmin={true}
                    />
                  )}
                </div>
              );
            })()
          ) : (
            <div className="p-12 text-center text-xs text-muted">
              Select a member from the dropdown above to inspect their attendance calendar.
            </div>
          )}
        </div>
      )}

      {/* 6. WORK LOG AUDIT TAB */}
      {activeTab === "worklog_audit" && (
        <div
          className="rounded-2xl p-4 sm:p-6 border shadow-xl transition-all space-y-6 animate-fade-in"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
            <div>
              <h2 className="text-base sm:text-lg font-black flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <FileText className="w-5 h-5 text-emerald-400" />
                Daily Work Log Audit & Tracking
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
                Track who submitted daily work logs vs who missed them, inspect logs, and leave supervisor remarks.
              </p>
            </div>

            {/* Date Selection */}
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                Audit Date:
              </label>
              <input
                type="date"
                value={workLogAuditDate || new Date().toISOString().split("T")[0]}
                onChange={(e) => {
                  setWorkLogAuditDate(e.target.value);
                  fetchWorkLogAudit(e.target.value);
                }}
                className="px-3 py-1.5 rounded-xl border text-xs font-mono font-bold"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="button"
                onClick={() => fetchWorkLogAudit(workLogAuditDate)}
                className="p-2 rounded-xl border transition-all hover:brightness-125"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
                title="Refresh Audit Data"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingWorkLogAudit ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Daily Metrics Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface-elevated)", borderColor: "var(--border-subtle)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Total Members</span>
              <div className="text-xl font-black mt-1" style={{ color: "var(--text-primary)" }}>
                {workLogAuditData?.metrics?.totalUsers || users.length}
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Active Team Members</span>
            </div>

            <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--status-working-bg)", borderColor: "var(--status-working-border)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--status-working-text)" }}>Submitted 🟢</span>
              <div className="text-xl font-black mt-1" style={{ color: "var(--status-working-text)" }}>
                {workLogAuditData?.metrics?.submittedCount || 0}
              </div>
              <span className="text-[10px]" style={{ color: "var(--status-working-text)" }}>Work Logs Logged</span>
            </div>

            <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--status-ooo-bg)", borderColor: "var(--status-ooo-border)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--status-ooo-text)" }}>Missed / Pending 🔴</span>
              <div className="text-xl font-black mt-1" style={{ color: "var(--status-ooo-text)" }}>
                {workLogAuditData?.metrics?.missedCount || 0}
              </div>
              <span className="text-[10px]" style={{ color: "var(--status-ooo-text)" }}>No Work Log Submitted</span>
            </div>

            <div className="p-3.5 rounded-xl border flex flex-col justify-between" style={{ backgroundColor: "var(--bg-surface-elevated)", borderColor: "var(--border-subtle)" }}>
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Admin Remarks 💬</span>
              <div className="text-xl font-black mt-1 text-indigo-400">
                {workLogAuditData?.metrics?.reviewedCount || 0}
              </div>
              <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>Reviewed by Supervisor</span>
            </div>
          </div>

          {/* Filters & Search Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border text-xs" style={{ backgroundColor: "var(--bg-surface-subtle)", borderColor: "var(--border-subtle)" }}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px]" style={{ color: "var(--text-muted)" }}>Filter:</span>
              <button
                type="button"
                onClick={() => setWorkLogStatusFilter("all")}
                className={`px-3 py-1 rounded-lg border font-bold text-xs transition-all ${workLogStatusFilter === "all" ? "shadow-xs" : "opacity-70"}`}
                style={{
                  backgroundColor: workLogStatusFilter === "all" ? "var(--bg-surface-elevated)" : "transparent",
                  borderColor: workLogStatusFilter === "all" ? "var(--border-medium)" : "transparent",
                  color: "var(--text-primary)",
                }}
              >
                All Members ({workLogAuditData?.items?.length || 0})
              </button>

              <button
                type="button"
                onClick={() => setWorkLogStatusFilter("submitted")}
                className={`px-3 py-1 rounded-lg border font-bold text-xs transition-all ${workLogStatusFilter === "submitted" ? "shadow-xs" : "opacity-70"}`}
                style={{
                  backgroundColor: workLogStatusFilter === "submitted" ? "var(--status-working-bg)" : "transparent",
                  borderColor: workLogStatusFilter === "submitted" ? "var(--status-working-border)" : "transparent",
                  color: workLogStatusFilter === "submitted" ? "var(--status-working-text)" : "var(--text-secondary)",
                }}
              >
                Submitted 🟢 ({workLogAuditData?.metrics?.submittedCount || 0})
              </button>

              <button
                type="button"
                onClick={() => setWorkLogStatusFilter("missed")}
                className={`px-3 py-1 rounded-lg border font-bold text-xs transition-all ${workLogStatusFilter === "missed" ? "shadow-xs" : "opacity-70"}`}
                style={{
                  backgroundColor: workLogStatusFilter === "missed" ? "var(--status-ooo-bg)" : "transparent",
                  borderColor: workLogStatusFilter === "missed" ? "var(--status-ooo-border)" : "transparent",
                  color: workLogStatusFilter === "missed" ? "var(--status-ooo-text)" : "var(--text-secondary)",
                }}
              >
                Missed 🔴 ({workLogAuditData?.metrics?.missedCount || 0})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
              <input
                type="text"
                placeholder="Search member name..."
                value={workLogSearchQuery}
                onChange={(e) => setWorkLogSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs font-semibold"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Audit List Table */}
          {loadingWorkLogAudit ? (
            <div className="p-12 text-center text-xs font-mono font-bold animate-pulse">
              Loading daily work log status records...
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border-subtle)" }}>
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b text-[10px] font-bold uppercase tracking-wider" style={{ backgroundColor: "var(--bg-surface-elevated)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
                    <th className="p-3">Member Name</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Submission Status</th>
                    <th className="p-3">Work Log Snippet</th>
                    <th className="p-3">Admin Remark</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border-subtle)" }}>
                  {(workLogAuditData?.items || [])
                    .filter((item: any) => {
                      if (workLogStatusFilter === "submitted" && !item.hasSubmitted) return false;
                      if (workLogStatusFilter === "missed" && item.hasSubmitted) return false;
                      if (workLogSearchQuery) {
                        const q = workLogSearchQuery.toLowerCase();
                        return item.userName.toLowerCase().includes(q) || item.userUsername.toLowerCase().includes(q);
                      }
                      return true;
                    })
                    .map((item: any) => (
                      <tr key={item.userId} className="hover:bg-white/5 transition-colors">
                        <td className="p-3 font-bold" style={{ color: "var(--text-primary)" }}>
                          {item.userName}
                          <span className="block text-[10px] font-mono font-normal" style={{ color: "var(--text-muted)" }}>
                            @{item.userUsername}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border" style={{ backgroundColor: "var(--bg-surface-elevated)", borderColor: "var(--border-subtle)", color: "var(--text-secondary)" }}>
                            {item.userRole}
                          </span>
                        </td>
                        <td className="p-3">
                          {item.hasSubmitted ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1" style={{ backgroundColor: "var(--status-working-bg)", borderColor: "var(--status-working-border)", color: "var(--status-working-text)" }}>
                              <CheckCircle className="w-3 h-3" /> Submitted
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border inline-flex items-center gap-1" style={{ backgroundColor: "var(--status-ooo-bg)", borderColor: "var(--status-ooo-border)", color: "var(--status-ooo-text)" }}>
                              <X className="w-3 h-3" /> Missed
                            </span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs truncate" style={{ color: "var(--text-secondary)" }}>
                          {item.hasSubmitted ? item.contentSnippet || "(Formatted Rich Text)" : <span className="italic opacity-50">No log submitted for date</span>}
                        </td>
                        <td className="p-3 max-w-xs truncate font-mono text-[11px]">
                          {item.adminRemark ? (
                            <span className="text-indigo-400 font-semibold">&ldquo;{item.adminRemark}&rdquo;</span>
                          ) : (
                            <span className="opacity-40 italic">No remark</span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => onOpenWorkLogForUserAndDate?.(item.userId, item.userName, workLogAuditDate || item.date)}
                            className="px-3 py-1.5 rounded-lg border text-xs font-bold transition-all hover:brightness-120 inline-flex items-center gap-1.5 shadow-xs"
                            style={{
                              backgroundColor: "var(--bg-surface-elevated)",
                              borderColor: "var(--border-medium)",
                              color: "var(--text-primary)",
                            }}
                          >
                            <FileText className="w-3.5 h-3.5 text-emerald-400" />
                            <span>{item.hasSubmitted ? "Inspect Log / Remark" : "Write Log / Override"}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add User Credentials Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-5 sm:p-6 border transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-medium)",
              color: "var(--text-primary)",
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between pb-4 border-b mb-4"
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
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                    Add User Credentials
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Creates record in database & enables login
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
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

            {/* Error or Success notification */}
            {formError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {formError}
              </div>
            )}
            {formSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {formSuccess}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-none"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. johndoe"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono border transition-colors outline-none"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showAddPassword ? "text" : "password"}
                    required
                    placeholder="Set account password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 rounded-xl text-xs font-mono border transition-colors outline-none"
                    style={{
                      backgroundColor: "var(--bg-surface-subtle)",
                      borderColor: "var(--border-medium)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddPassword(!showAddPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-xs hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-muted)" }}
                    title={showAddPassword ? "Hide password" : "Show password"}
                  >
                    {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-none"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Role
                </label>
                <select
                  value={addRoleType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setAddRoleType(val);
                    if (val !== "other") {
                      setAddCustomRole("");
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-none"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="intern">Intern (Attendance & Presence Tracking)</option>
                  <option value="admin">Administrator (Admin Dashboard & Management)</option>
                  <option value="other">Other (Write Custom Role)...</option>
                </select>

                {addRoleType === "other" && (
                  <div className="mt-2.5 animate-fade-in">
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--accent-primary)" }}>
                      Write Custom Role Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer, Designer, HR, Employee"
                      value={addCustomRole}
                      onChange={(e) => setAddCustomRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium border transition-colors outline-none"
                      style={{
                        backgroundColor: "var(--bg-surface-subtle)",
                        borderColor: "var(--border-focus)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono border transition-colors outline-none"
                    style={{
                      backgroundColor: "var(--bg-surface-subtle)",
                      borderColor: "var(--border-medium)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono border transition-colors outline-none"
                    style={{
                      backgroundColor: "var(--bg-surface-subtle)",
                      borderColor: "var(--border-medium)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>
              {addRoleType === "intern" && formData.startDate && formData.endDate && (
                <p className="text-[10px] text-emerald-400 font-semibold">
                  Default end date (+45 days) set automatically for Intern role.
                </p>
              )}

              <div
                className="flex items-center justify-end gap-2 pt-4 border-t mt-4"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border transition-all hover:brightness-110"
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
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all hover:opacity-95"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: "var(--accent-text)",
                    boxShadow: "0 4px 14px var(--accent-glow)",
                  }}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{submitting ? "Creating..." : "Save Credentials"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {isEditModalOpen && selectedUserForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl p-5 sm:p-6 border transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-medium)",
              color: "var(--text-primary)",
            }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between pb-4 border-b mb-4"
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
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black" style={{ color: "var(--text-primary)" }}>
                    Edit User Profile
                  </h3>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    Update member details, role, or reset password
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedUserForEdit(null);
                }}
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

            {/* Error or Success notification */}
            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {editError}
              </div>
            )}
            {editSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {editSuccess}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleEditSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-none"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Username
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. johndoe"
                  value={editFormData.username}
                  onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs font-mono border transition-colors outline-none"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="user@example.com"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-none"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                  System Role
                </label>
                <select
                  value={editRoleType}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEditRoleType(val);
                    if (val !== "other") {
                      setEditCustomRole("");
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl text-xs border transition-colors outline-none"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-medium)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="intern">Intern (Attendance & Presence Tracking)</option>
                  <option value="admin">Administrator (Admin Dashboard & Management)</option>
                  <option value="other">Other (Write Custom Role)...</option>
                </select>

                {editRoleType === "other" && (
                  <div className="mt-2.5 animate-fade-in">
                    <label className="block text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: "var(--accent-primary)" }}>
                      Write Custom Role Title
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software Engineer, Designer, HR, Employee"
                      value={editCustomRole}
                      onChange={(e) => setEditCustomRole(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl text-xs font-medium border transition-colors outline-none"
                      style={{
                        backgroundColor: "var(--bg-surface-subtle)",
                        borderColor: "var(--border-focus)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>
                )}

                {selectedUserForEdit?.role === "admin" && totalAdmins <= 1 && editRoleType !== "admin" && (
                  <p className="text-[10px] mt-1.5 flex items-center gap-1 text-amber-400 font-semibold">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>This is the only admin account. Make another admin before changing this role.</span>
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono border transition-colors outline-none"
                    style={{
                      backgroundColor: "var(--bg-surface-subtle)",
                      borderColor: "var(--border-medium)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: "var(--text-muted)" }}>
                    End Date
                  </label>
                  <input
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs font-mono border transition-colors outline-none"
                    style={{
                      backgroundColor: "var(--bg-surface-subtle)",
                      borderColor: "var(--border-medium)",
                      color: "var(--text-primary)",
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Reset Password (Optional)
                  </label>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                    Leave blank to keep current
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showEditPassword ? "text" : "password"}
                    placeholder="Enter new password to change"
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="w-full pl-3 pr-10 py-2 rounded-xl text-xs font-mono border transition-colors outline-none"
                    style={{
                      backgroundColor: "var(--bg-surface-subtle)",
                      borderColor: "var(--border-medium)",
                      color: "var(--text-primary)",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-xs hover:opacity-80 transition-opacity"
                    style={{ color: "var(--text-muted)" }}
                    title={showEditPassword ? "Hide password" : "Show password"}
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div
                className="flex items-center justify-end gap-2 pt-4 border-t mt-4"
                style={{ borderColor: "var(--border-subtle)" }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedUserForEdit(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border transition-all hover:brightness-110"
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
                  disabled={editSubmitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all hover:opacity-95"
                  style={{
                    backgroundColor: "var(--accent-primary)",
                    color: "var(--accent-text)",
                    boxShadow: "0 4px 14px var(--accent-glow)",
                  }}
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{editSubmitting ? "Saving..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete User Confirmation Modal */}
      {isDeleteModalOpen && selectedUserForDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-md rounded-2xl shadow-2xl p-5 sm:p-6 border transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-medium)",
              color: "var(--text-primary)",
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
                style={{
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  color: "#ef4444",
                }}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-rose-400">
                  Delete User Account
                </h3>
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  Permanent removal confirmation
                </p>
              </div>
            </div>

            {selectedUserForDelete.role === "admin" && totalAdmins <= 1 ? (
              <div className="mb-4 p-3.5 rounded-xl border flex items-start gap-2.5 bg-amber-500/10 border-amber-500/30 text-amber-300 animate-fade-in">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-amber-200">Cannot Delete Only Admin Account</div>
                  <div>You are the only admin, please make someone else admin then only you can delete it.</div>
                </div>
              </div>
            ) : deleteError ? (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold">
                {deleteError}
              </div>
            ) : null}

            <div
              className="p-3.5 rounded-xl border mb-4 space-y-1.5"
              style={{
                backgroundColor: "var(--bg-surface-subtle)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  {selectedUserForDelete.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase font-bold" style={{ backgroundColor: "var(--bg-surface-elevated)", borderColor: "var(--border-subtle)", color: "var(--text-muted)" }}>
                  {selectedUserForDelete.role}
                </span>
              </div>
              <div className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>
                @{selectedUserForDelete.username}
                {selectedUserForDelete.email && ` • ${selectedUserForDelete.email}`}
              </div>
            </div>

            <p className="text-xs mb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
              Are you sure you want to delete this user? All their recorded working hours, break history, and attendance records will be permanently removed from the database. This action <strong className="text-rose-400">cannot be undone</strong>.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: "var(--border-subtle)" }}>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedUserForDelete(null);
                }}
                disabled={deleteSubmitting}
                className="px-4 py-2 text-xs font-semibold rounded-xl border transition-all hover:brightness-110"
                style={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-subtle)",
                  color: "var(--text-secondary)",
                }}
              >
                Cancel
              </button>
              {selectedUserForDelete.role === "admin" && totalAdmins <= 1 ? (
                <button
                  type="button"
                  disabled
                  className="px-4 py-2 text-xs font-bold rounded-xl border opacity-60 cursor-not-allowed flex items-center gap-1.5"
                  style={{
                    backgroundColor: "var(--bg-surface-elevated)",
                    borderColor: "var(--border-subtle)",
                    color: "var(--text-muted)",
                  }}
                  title="You are the only admin, please make someone else admin then only you can delete it."
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Cannot Delete Only Admin</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={deleteSubmitting}
                  className="px-4 py-2 text-xs font-bold rounded-xl text-white shadow-md transition-all flex items-center gap-1.5 hover:opacity-95"
                  style={{
                    backgroundColor: "#ef4444",
                    boxShadow: "0 4px 14px rgba(239, 68, 68, 0.4)",
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{deleteSubmitting ? "Deleting..." : "Delete User Permanently"}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ATTENDANCE HISTORY TAB VIEW */}
      {activeTab === "attendance_history" && (
        <div className="space-y-4 animate-fade-in">
          {/* Control Bar */}
          <div
            className="rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 border shadow-xl transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            {/* Date and User Filter */}
            <div className="flex flex-wrap items-center gap-3 w-full">
              <input
                type="date"
                value={historyDate}
                onChange={(e) => setHistoryDate(e.target.value)}
                className="px-4 py-2 text-xs rounded-xl border transition-colors outline-none"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              />
              <select
                value={historyUserId}
                onChange={(e) => setHistoryUserId(e.target.value)}
                className="px-4 py-2 text-xs rounded-xl border transition-colors outline-none"
                style={{
                  backgroundColor: "var(--bg-surface-subtle)",
                  borderColor: "var(--border-medium)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="all">All Employees</option>
                {users.map((u) => (
                  <option key={u.id || u._id} value={u.id || u._id}>{u.name} (@{u.username})</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={fetchHistory}
              disabled={loadingHistory}
              title="Refresh History"
              className="p-2.5 rounded-xl border transition-all hover:brightness-110"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-subtle)",
                color: "var(--text-secondary)",
              }}
            >
              <RefreshCw className={`w-4 h-4 ${loadingHistory ? "animate-spin" : ""}`} />
            </button>
          </div>

          {/* Records Table */}
          <div
            className="rounded-2xl border shadow-xl overflow-hidden transition-all"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-subtle)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr
                    className="border-b text-[11px] font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: "var(--bg-surface-elevated)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-muted)",
                    }}
                  >
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Employee</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Work Mode</th>
                    <th className="py-3.5 px-4">Login</th>
                    <th className="py-3.5 px-4">Logout</th>
                    <th className="py-3.5 px-4">Total Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-xs" style={{ borderColor: "var(--border-subtle)" }}>
                  {historyRecords.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center" style={{ color: "var(--text-muted)" }}>
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Clock className="w-7 h-7 opacity-40" />
                          <span className="font-semibold text-sm">No attendance records found.</span>
                          <span className="text-xs">Adjust your filters to see more results.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    historyRecords.map((record, idx) => {
                      const recId = record._id || record.id || `rec-${idx}`;
                      const user = users.find((u) => (u.id === record.userId) || (u._id === record.userId));
                      return (
                        <tr
                          key={recId}
                          className="hover:brightness-105 transition-colors"
                          style={{ backgroundColor: "var(--bg-surface)" }}
                        >
                          <td className="py-4 px-4 font-mono font-semibold" style={{ color: "var(--text-secondary)" }}>
                            {record.date}
                          </td>
                          <td className="py-4 px-4 font-bold" style={{ color: "var(--text-primary)" }}>
                            {user ? user.name : "Unknown"}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border inline-block"
                              style={{
                                backgroundColor: record.status === "present" ? "var(--status-working-bg)" : "var(--status-break-bg)",
                                borderColor: record.status === "present" ? "var(--status-working-border)" : "var(--status-break-border)",
                                color: record.status === "present" ? "var(--status-working-text)" : "var(--status-break-text)",
                              }}
                            >
                              {record.status}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            {record.workMode || "WFO"}
                          </td>
                          <td className="py-4 px-4 font-mono">
                            {record.login?.time ? formatTo12Hour(record.login.time) : "--"}
                          </td>
                          <td className="py-4 px-4 font-mono">
                            {record.logout?.time ? formatTo12Hour(record.logout.time) : "--"}
                          </td>
                          <td className="py-4 px-4 font-mono font-bold" style={{ color: "var(--text-primary)" }}>
                            {record.duration?.hours || 0}h {record.duration?.minutes || 0}m
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal for Admin */}
      <RejectionReasonModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setSelectedRequestForReject(null);
        }}
        request={selectedRequestForReject}
        onConfirmReject={handleConfirmReject}
      />
    </div>
  );
};
