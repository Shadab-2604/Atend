"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  User,
  AttendanceRecord,
  SummaryStats,
  PresenceStatus,
  AdminMetrics,
  UserRole,
  RegularizationRequest,
  WorkMode,
} from "@/types";
import {
  apiLogin,
  apiGetMe,
  apiUpdatePresenceStatus,
  apiGetAttendance,
  apiGetAttendanceSummary,
  apiGetAdminUsers,
  apiGetAdminMetrics,
  apiAdminCreateUser,
  apiAdminUpdateUser,
  apiAdminDeleteUser,
  apiGetSettings,
  apiSubmitRegularization,
  apiGetRegularizationRequests,
  apiAdminGetRegularizationRequests,
  apiAdminReviewRegularization,
} from "@/lib/api";
import { getSocket } from "@/lib/socket";
import { LoginPortal } from "@/components/LoginPortal";
import { Navbar } from "@/components/Navbar";
import { ViewSwitcher, EmployeeViewMode } from "@/components/ViewSwitcher";
import { CurrentDayPunchCard } from "@/components/CurrentDayPunchCard";
import { CalendarView } from "@/components/CalendarView";
import { StatsGrid } from "@/components/StatsGrid";
import { RegularizeModal } from "@/components/RegularizeModal";
import { WorkLogModal } from "@/components/WorkLogModal";
import { AdminDashboard } from "@/components/AdminDashboard";
import { CheckCircle2, AlertTriangle, X, Bell, Calendar, Edit3, FileText } from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>("intern");
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Employee 2-option view mode: "current" (Current Day) vs "history" (Attendance History)
  const [employeeViewMode, setEmployeeViewMode] = useState<EmployeeViewMode>("current");
  const [initialPortalRole, setInitialPortalRole] = useState<UserRole>("intern");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("role") === "admin" || window.location.pathname.startsWith("/admin")) {
        setInitialPortalRole("admin");
      }
    }
  }, []);

  // Admin Data State
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminMetrics, setAdminMetrics] = useState<AdminMetrics>({
    total: 0,
    working: 0,
    break: 0,
    ooo: 0,
    loggedOut: 0,
  });
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminViewMode, setAdminViewMode] = useState<"admin" | "intern">("admin");
  const [adminRegRequests, setAdminRegRequests] = useState<RegularizationRequest[]>([]);

  // Intern Attendance State
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [userRegRequests, setUserRegRequests] = useState<RegularizationRequest[]>([]);
  const [summaryStats, setSummaryStats] = useState<SummaryStats>({
    completedDays: 0,
    remainingDays: 45,
    attendancePercentage: 0,
    totalWorkingHours: 0,
    averageWorkingHours: 0,
    totalWorkingMinutes: 0,
    averageWorkingMinutes: 0,
  });
  const [workingDaysMap, setWorkingDaysMap] = useState<Record<string, number>>({});
  const [presenceLoading, setPresenceLoading] = useState(false);

  // Regularization Modal
  const [isRegularizeModalOpen, setIsRegularizeModalOpen] = useState(false);
  const [regularizeDefaultDate, setRegularizeDefaultDate] = useState<string | undefined>(undefined);

  // Work Log Modal
  const [isWorkLogModalOpen, setIsWorkLogModalOpen] = useState(false);
  const [workLogDate, setWorkLogDate] = useState<string>("");
  const [workLogUserId, setWorkLogUserId] = useState<string>("");
  const [workLogUserName, setWorkLogUserName] = useState<string>("");

  const handleOpenWorkLog = (targetDate?: string, targetUserId?: string, targetUserName?: string) => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const todayIso = `${y}-${m}-${d}`;

    const effectiveDate = targetDate || todayIso;
    const effectiveUserId = targetUserId || user?.id || user?._id || "";
    const effectiveUserName = targetUserName || user?.name || "User";

    setWorkLogDate(effectiveDate);
    setWorkLogUserId(effectiveUserId);
    setWorkLogUserName(effectiveUserName);
    setIsWorkLogModalOpen(true);
  };

  // Real-time toast notifications
  const [toast, setToast] = useState<{
    id: string;
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const showToast = (type: "success" | "error" | "info", title: string, message: string) => {
    const id = Date.now().toString();
    setToast({ id, type, title, message });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 6000);
  };

  // Load Settings (Working Days map)
  const loadSettings = async () => {
    try {
      const data = await apiGetSettings();
      if (data.workingDays) {
        const map: Record<string, number> = {};
        data.workingDays.forEach((wd: any) => {
          map[wd.date] = wd.dayNumber;
        });
        setWorkingDaysMap(map);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  // Load Intern Attendance Records & Regularization Requests
  const loadAttendance = useCallback(async (userId: string) => {
    try {
      const [attRes, sumRes, regRes] = await Promise.all([
        apiGetAttendance(userId),
        apiGetAttendanceSummary(userId),
        apiGetRegularizationRequests(userId),
      ]);
      if (attRes.records) setAttendanceRecords(attRes.records);
      if (sumRes.summary) setSummaryStats(sumRes.summary);
      if (regRes.requests) setUserRegRequests(regRes.requests);
    } catch (err) {
      console.error("Failed to load attendance:", err);
    }
  }, []);

  // Load Admin Data
  const loadAdminData = useCallback(async () => {
    setAdminLoading(true);
    try {
      const [usersRes, metricsRes, regRes] = await Promise.all([
        apiGetAdminUsers(),
        apiGetAdminMetrics(),
        apiAdminGetRegularizationRequests(),
      ]);
      if (usersRes.users) setAdminUsers(usersRes.users);
      if (metricsRes.metrics) setAdminMetrics(metricsRes.metrics);
      if (regRes.requests) setAdminRegRequests(regRes.requests);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  // Check existing session
  useEffect(() => {
    const checkAuth = async () => {
      loadSettings();
      const token = localStorage.getItem("attend_token");
      if (!token) {
        setAuthLoading(false);
        return;
      }
      try {
        const res = await apiGetMe();
        if (res && res.user) {
          setUser(res.user);
          setRole(res.user.role);
          if (res.user.role === "admin") {
            loadAdminData();
          } else {
            loadAttendance(res.user.id || res.user._id);
          }
        } else {
          localStorage.removeItem("attend_token");
          setUser(null);
        }
      } catch {
        // Cleanly clear obsolete or expired session token
        localStorage.removeItem("attend_token");
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };
    checkAuth();
  }, [loadAdminData, loadAttendance]);

  // Socket.io Real-Time Synchronization
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    if (!socket.connected) {
      socket.connect();
    }

    if (user) {
      socket.emit("join", { userId: user.id || user._id, role: user.role });
    }

    socket.on("presence:updated", (payload: any) => {
      const updatedUser: User | undefined = payload?.user || payload;
      if (!updatedUser) return;

      const updatedId = updatedUser.id || updatedUser._id;
      const currentUserId = user?.id || user?._id;

      // 1. Update user if it's the active user
      if (
        user &&
        ((updatedId && updatedId === currentUserId) ||
          (updatedUser.username && updatedUser.username === user.username))
      ) {
        setUser((prev) => (prev ? { ...prev, ...updatedUser } : null));
        if (currentUserId) loadAttendance(currentUserId);
      }

      // 2. Update Admin state
      setAdminUsers((prev) => {
        const idx = prev.findIndex((u) => {
          const uid = u.id || u._id;
          return (uid && uid === updatedId) || (u.username && u.username === updatedUser.username);
        });
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = { ...updated[idx], ...updatedUser };
          return updated;
        }
        return [updatedUser, ...prev];
      });

      // Recalculate metrics on presence update
      apiGetAdminMetrics()
        .then((res) => {
          if (res.metrics) setAdminMetrics(res.metrics);
        })
        .catch(console.error);
    });

    socket.on("user:created", () => {
      loadAdminData();
    });

    socket.on("user:updated", () => {
      loadAdminData();
    });

    socket.on("user:deleted", () => {
      loadAdminData();
    });

    socket.on("attendance:saved", () => {
      if (user) loadAttendance(user.id || user._id || "");
    });

    // WebSocket: New Regularization Request Submitted
    socket.on("regularization:new", (data: any) => {
      if (role === "admin") {
        setAdminRegRequests((prev) => [data, ...prev]);
        showToast(
          "info",
          "New Attendance Request",
          `${data.userName || "An employee"} submitted an attendance regularization request for ${data.date}.`
        );
      }
    });

    // WebSocket: Regularization Request Reviewed (Approved / Rejected)
    socket.on("regularization:reviewed", (data: any) => {
      const currentUserId = user?.id || user?._id;

      if (role === "admin") {
        apiAdminGetRegularizationRequests().then((res) => {
          if (res.requests) setAdminRegRequests(res.requests);
        });
      }

      if (currentUserId && String(data.userId) === String(currentUserId)) {
        loadAttendance(currentUserId);

        if (data.status === "approved") {
          showToast(
            "success",
            "Attendance Approved",
            `Your attendance regularization request for ${data.date} was approved by Admin!`
          );
        } else if (data.status === "rejected") {
          showToast(
            "error",
            "Attendance Request Rejected",
            `Your request for ${data.date} was rejected. Reason: "${data.adminReason || "Not specified"}"`
          );
        }
      }
    });

    return () => {
      socket.off("presence:updated");
      socket.off("user:created");
      socket.off("user:updated");
      socket.off("user:deleted");
      socket.off("attendance:saved");
      socket.off("regularization:new");
      socket.off("regularization:reviewed");
    };
  }, [user, role, loadAttendance, loadAdminData]);

  // Production Auto-Sync Polling (Runs every 4s & on window focus for real-time break, calendar, & presence updates)
  useEffect(() => {
    if (!user) return;

    const syncLiveData = () => {
      if (document.hidden) return;
      if (role === "admin") {
        loadAdminData();
      } else {
        const userId = user.id || user._id || "";
        if (userId) loadAttendance(userId);
      }
    };

    const interval = setInterval(syncLiveData, 4000);
    window.addEventListener("focus", syncLiveData);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", syncLiveData);
    };
  }, [user, role, loadAttendance, loadAdminData]);

  // Login handler
  const handleLogin = async (username: string, pass: string, requestedRole?: UserRole) => {
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await apiLogin(username, pass, requestedRole);
      if (res.success && res.token && res.user) {
        localStorage.setItem("attend_token", res.token);
        setUser(res.user);
        setRole(res.user.role);

        if (res.user.role === "admin") {
          setAdminViewMode("admin");
          loadAdminData();
        } else {
          setEmployeeViewMode("current");
          loadAttendance(res.user.id || res.user._id);
        }
      }
    } catch (err: any) {
      setLoginError(err.message || "Login failed. Please verify credentials.");
    } finally {
      setLoginLoading(false);
    }
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem("attend_token");
    setUser(null);
    setAttendanceRecords([]);
    setUserRegRequests([]);
  };

  // Update Presence Status (Working, Break, OOO, Logged Out)
  const handleUpdatePresence = async (newStatus: PresenceStatus) => {
    if (!user) return;
    setPresenceLoading(true);
    try {
      const res = await apiUpdatePresenceStatus(user.id || user._id || "", newStatus);
      if (res.success && res.user) {
        setUser((prev) => (prev ? { ...prev, ...res.user } : null));
        loadAttendance(user.id || user._id || "");
      }
    } catch (err) {
      console.error("Presence status update failed:", err);
    } finally {
      setPresenceLoading(false);
    }
  };

  // Admin review regularization
  const handleAdminReviewRegularization = async (
    requestId: string,
    action: "approve" | "reject",
    adminReason?: string
  ) => {
    if (!user) return;
    await apiAdminReviewRegularization(requestId, action, adminReason, user.id || user._id);
    const res = await apiAdminGetRegularizationRequests();
    if (res.requests) setAdminRegRequests(res.requests);
    showToast(
      action === "approve" ? "success" : "info",
      action === "approve" ? "Request Approved" : "Request Rejected",
      `The attendance regularization request has been ${action}d.`
    );
  };

  // Submit regularization request by Employee
  const handleSubmitRegularization = async (data: {
    userId: string;
    date: string;
    workMode: WorkMode;
    hours: number;
    reason: string;
  }) => {
    const res = await apiSubmitRegularization(data);
    if (res.success) {
      showToast(
        "success",
        "Request Submitted",
        `Attendance regularization request for ${data.date} sent to Admin.`
      );
      if (user) {
        await loadAttendance(user.id || user._id || "");
      }
    }
  };

  // Admin create user
  const handleAdminCreateUser = async (userData: any) => {
    await apiAdminCreateUser(userData);
    await loadAdminData();
  };

  // Admin update user
  const handleAdminUpdateUser = async (userId: string, userData: any) => {
    await apiAdminUpdateUser(userId, userData);
    await loadAdminData();
  };

  // Admin delete user
  const handleAdminDeleteUser = async (userId: string) => {
    const adminId = user?.id || user?._id;
    await apiAdminDeleteUser(userId, adminId);
    if (adminId && String(adminId) === String(userId)) {
      handleLogout();
    } else {
      await loadAdminData();
    }
  };

  // Calculate Absent Dates for quick regularization
  const absentDates = useMemo(() => {
    const list: string[] = [];
    const todayStr = new Date().toISOString().split("T")[0];

    attendanceRecords.forEach((r) => {
      if (r.status === "absent" && !list.includes(r.date)) {
        list.push(r.date);
      }
    });

    Object.keys(workingDaysMap).forEach((d) => {
      if (d < todayStr) {
        const rec = attendanceRecords.find((r) => r.date === d);
        if (!rec || rec.status === "absent") {
          if (!list.includes(d)) list.push(d);
        }
      }
    });

    return list.sort().reverse();
  }, [attendanceRecords, workingDaysMap]);

  const absentCount = absentDates.length;

  // If loading session
  if (authLoading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center transition-colors"
        style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-secondary)" }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-9 h-9 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "var(--border-focus)", borderTopColor: "transparent" }}
          />
          <span className="text-xs font-mono font-bold tracking-wider">Loading AttendFlow...</span>
        </div>
      </div>
    );
  }

  // If not logged in, render LoginPortal
  if (!user) {
    return (
      <LoginPortal
        onLogin={handleLogin}
        loading={loginLoading}
        error={loginError}
        initialRole={initialPortalRole}
      />
    );
  }

  // Determine today info
  const todayIso = new Date().toISOString().split("T")[0];
  const todayRecord = attendanceRecords.find((r) => r.date === todayIso) || null;
  const todayDayNumber = workingDaysMap[todayIso] || 1;
  const isWorkingDay = workingDaysMap[todayIso] !== undefined;

  return (
    <div
      className="min-h-screen flex flex-col transition-colors selection:bg-white/10 w-full max-w-full overflow-x-hidden"
      style={{ backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)" }}
    >
      {/* Real-Time Toast Notification */}
      {toast && (
        <aside
          aria-live="polite"
          className="fixed top-4 right-4 left-4 sm:left-auto sm:right-5 sm:max-w-sm z-50 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl animate-fade-in flex items-start gap-3"
          style={{
            backgroundColor: "var(--bg-surface-elevated)",
            borderColor:
              toast.type === "success"
                ? "var(--status-working-border)"
                : toast.type === "error"
                ? "var(--status-ooo-border)"
                : "var(--border-medium)",
          }}
        >
          <div className="shrink-0 mt-0.5">
            {toast.type === "success" && (
              <CheckCircle2 className="w-5 h-5" style={{ color: "var(--status-working-text)" }} />
            )}
            {toast.type === "error" && (
              <AlertTriangle className="w-5 h-5" style={{ color: "var(--status-ooo-text)" }} />
            )}
            {toast.type === "info" && (
              <Bell className="w-5 h-5" style={{ color: "var(--text-primary)" }} />
            )}
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
              {toast.title}
            </h4>
            <p className="text-xs mt-0.5 leading-snug" style={{ color: "var(--text-secondary)" }}>
              {toast.message}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="p-1 rounded-lg border transition-all hover:brightness-125 shrink-0"
            style={{
              backgroundColor: "var(--bg-surface-subtle)",
              borderColor: "var(--border-subtle)",
              color: "var(--text-muted)",
            }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* Navigation Header with Mark Attendance Button */}
      <Navbar
        user={user}
        role={role}
        onLogout={handleLogout}
        onOpenRegularize={() => {
          setRegularizeDefaultDate(absentDates[0]);
          setIsRegularizeModalOpen(true);
        }}
        absentCount={absentCount}
        onJumpToday={() => {
          setEmployeeViewMode("current");
        }}
      />

      {/* Supervisor Console Mode Switcher */}
      {role === "admin" && (
        <div
          className="border-b px-4 md:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3 transition-colors"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-subtle)",
          }}
        >
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: "var(--text-muted)" }}
            >
              Console Mode:
            </span>
            <div
              className="flex items-center gap-1 p-1 rounded-xl border shadow-inner overflow-x-auto"
              style={{
                backgroundColor: "var(--bg-surface-elevated)",
                borderColor: "var(--border-subtle)",
              }}
            >
              <button
                type="button"
                onClick={() => setAdminViewMode("admin")}
                className="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                style={{
                  backgroundColor:
                    adminViewMode === "admin" ? "var(--accent-primary)" : "transparent",
                  color: adminViewMode === "admin" ? "var(--accent-text)" : "var(--text-secondary)",
                }}
              >
                Admin Console
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminViewMode("intern");
                  loadAttendance(user.id || user._id || "");
                }}
                className="px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition-all whitespace-nowrap"
                style={{
                  backgroundColor:
                    adminViewMode === "intern" ? "var(--accent-primary)" : "transparent",
                  color: adminViewMode === "intern" ? "var(--accent-text)" : "var(--text-secondary)",
                }}
              >
                Employee / Member View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 md:p-8 min-w-0 max-w-full overflow-hidden">
        {role === "admin" && adminViewMode === "admin" ? (
          /* ADMIN DASHBOARD VIEW */
          <AdminDashboard
            users={adminUsers}
            metrics={adminMetrics}
            onRefresh={loadAdminData}
            onCreateUser={handleAdminCreateUser}
            onUpdateUser={handleAdminUpdateUser}
            onDeleteUser={handleAdminDeleteUser}
            currentAdminId={user?.id || user?._id}
            regularizationRequests={adminRegRequests}
            onReviewRegularization={handleAdminReviewRegularization}
            onOpenWorkLogForUserAndDate={(uId, uName, d) => handleOpenWorkLog(d, uId, uName)}
            loading={adminLoading}
            workingDaysMap={workingDaysMap}
          />
        ) : (
          /* EMPLOYEE / INTERN DASHBOARD VIEW: 2 DISTINCT OPTIONS */
          <>
            {/* View Switcher: Option 1 (Current Day) vs Option 2 (Attendance History) */}
            <ViewSwitcher
              currentMode={employeeViewMode}
              onModeChange={(mode) => setEmployeeViewMode(mode)}
              absentCount={absentCount}
              todayStatus={user.currentStatus}
            />

            {employeeViewMode === "current" ? (
              /* OPTION 1: CURRENT DAY WORKSTATION WITH MINIMAL PUNCH DROPDOWN */
              <div className="space-y-6 animate-fade-in w-full min-w-0 max-w-full">
                <CurrentDayPunchCard
                  user={user}
                  todayRecord={todayRecord}
                  dayNumber={todayDayNumber}
                  isWorkingDay={isWorkingDay}
                  onUpdateStatus={handleUpdatePresence}
                  onOpenRegularizeModal={() => {
                    setRegularizeDefaultDate(absentDates[0]);
                    setIsRegularizeModalOpen(true);
                  }}
                  onOpenWorkLogModal={() => handleOpenWorkLog()}
                  loading={presenceLoading}
                />

                {/* Summary Progress Cards */}
                <StatsGrid stats={summaryStats} totalDays={45} />
              </div>
            ) : employeeViewMode === "history" ? (
              /* OPTION 2: ATTENDANCE HISTORY & CALENDAR WITH MONTH/YEAR SEARCH FILTERS */
              <div className="space-y-6 animate-fade-in w-full min-w-0 max-w-full overflow-hidden">
                {/* 45-Day Internship Attendance Calendar with month & year filter */}
                <CalendarView
                  attendanceRecords={attendanceRecords}
                  workingDaysMap={workingDaysMap}
                  onOpenRegularizeForDate={(date) => {
                    setRegularizeDefaultDate(date);
                    setIsRegularizeModalOpen(true);
                  }}
                  onOpenWorkLogForDate={(date) => handleOpenWorkLog(date)}
                />

                {/* Employee's Regularization Requests History & Admin Feedback */}
                {userRegRequests.length > 0 && (
                  <section
                    className="rounded-2xl p-5 sm:p-6 border shadow-xl transition-all"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-subtle)",
                    }}
                  >
                    <div
                      className="flex items-center justify-between pb-3 border-b mb-4"
                      style={{ borderColor: "var(--border-subtle)" }}
                    >
                      <div>
                        <h3 className="text-sm sm:text-base font-black" style={{ color: "var(--text-primary)" }}>
                          My Attendance Regularization Requests
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                          View approval status and supervisor feedback for submitted regularizations
                        </p>
                      </div>
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border"
                        style={{
                          backgroundColor: "var(--bg-surface-elevated)",
                          borderColor: "var(--border-subtle)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {userRegRequests.length} Total
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {userRegRequests.map((req, idx) => {
                        const isPending = req.status === "pending";
                        const isApproved = req.status === "approved";
                        const isRejected = req.status === "rejected";

                        return (
                          <div
                            key={`${req._id || req.id || "reg"}-${idx}`}
                            className="p-4 rounded-xl border flex flex-col justify-between transition-all"
                            style={{
                              backgroundColor: "var(--bg-surface-elevated)",
                              borderColor: isRejected
                                ? "var(--status-ooo-border)"
                                : isApproved
                                ? "var(--status-working-border)"
                                : "var(--border-subtle)",
                            }}
                          >
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <span className="font-mono font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                                  {req.date}
                                </span>
                                <span
                                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                                  style={{
                                    backgroundColor: isPending
                                      ? "var(--status-break-bg)"
                                      : isApproved
                                      ? "var(--status-working-bg)"
                                      : "var(--status-ooo-bg)",
                                    borderColor: isPending
                                      ? "var(--status-break-border)"
                                      : isApproved
                                      ? "var(--status-working-border)"
                                      : "var(--status-ooo-border)",
                                    color: isPending
                                      ? "var(--status-break-text)"
                                      : isApproved
                                      ? "var(--status-working-text)"
                                      : "var(--status-ooo-text)",
                                  }}
                                >
                                  {isPending ? "Pending Admin Review" : isApproved ? "Approved" : "Rejected"}
                                </span>
                              </div>

                              <div className="text-xs space-y-1 mb-2" style={{ color: "var(--text-secondary)" }}>
                                <div>
                                  <span style={{ color: "var(--text-muted)" }}>Mode & Hours: </span>
                                  <span className="font-semibold" style={{ color: "var(--text-primary)" }}>
                                    {req.workMode} • {req.hours} Hours
                                  </span>
                                </div>
                                <div>
                                  <span style={{ color: "var(--text-muted)" }}>Reason: </span>
                                  <span>&ldquo;{req.reason}&rdquo;</span>
                                </div>
                              </div>
                            </div>

                            {/* Admin Feedback / Rejection Reason display */}
                            {isRejected && req.adminReason && (
                              <div
                                className="p-2.5 rounded-lg border text-xs mt-2"
                                style={{
                                  backgroundColor: "var(--status-ooo-bg)",
                                  borderColor: "var(--status-ooo-border)",
                                  color: "var(--status-ooo-text)",
                                }}
                              >
                                <span className="font-bold block text-[11px]">Admin Rejection Reason:</span>
                                <p className="mt-0.5">&ldquo;{req.adminReason}&rdquo;</p>
                              </div>
                            )}

                            {isApproved && (
                              <div
                                className="p-2 rounded-lg border text-[11px] mt-2 font-medium"
                                style={{
                                  backgroundColor: "var(--status-working-bg)",
                                  borderColor: "var(--status-working-border)",
                                  color: "var(--status-working-text)",
                                }}
                              >
                                Regularized in Attendance Calendar
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* Summary Progress Cards */}
                <StatsGrid stats={summaryStats} totalDays={45} />
              </div>
            ) : (
              /* OPTION 3: DEDICATED WORK LOG DASHBOARD SECTION */
              <div className="space-y-6 animate-fade-in w-full min-w-0 max-w-full">
                <section
                  className="rounded-2xl p-5 sm:p-7 border shadow-xl transition-all space-y-6"
                  style={{
                    backgroundColor: "var(--bg-surface)",
                    borderColor: "var(--border-subtle)",
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b" style={{ borderColor: "var(--border-subtle)" }}>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black flex items-center gap-2.5" style={{ color: "var(--text-primary)" }}>
                        <FileText className="w-5 h-5 text-emerald-400" />
                        My Daily Work Logs & Activity
                      </h2>
                      <p className="text-xs mt-1" style={{ color: "var(--text-secondary)" }}>
                        Log your daily shift tasks with TipTap rich text, checklists, line numbers, and view supervisor remarks.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenWorkLog()}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all shadow-md hover:brightness-110"
                      style={{
                        backgroundColor: "var(--accent-primary)",
                        borderColor: "var(--border-medium)",
                        color: "var(--accent-text)",
                        boxShadow: "0 4px 14px var(--accent-glow)",
                      }}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Write / Edit Today&apos;s Work Log</span>
                    </button>
                  </div>

                  {/* Today Status Banner */}
                  <div
                    className="p-4 rounded-2xl border flex flex-wrap items-center justify-between gap-3 text-xs"
                    style={{
                      backgroundColor: "var(--bg-surface-elevated)",
                      borderColor: "var(--border-medium)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center border shrink-0"
                        style={{
                          backgroundColor: "var(--bg-surface-subtle)",
                          borderColor: "var(--border-subtle)",
                        }}
                      >
                        <Calendar className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                          Today&apos;s Status ({new Date().toISOString().split("T")[0]})
                        </span>
                        <h4 className="text-sm font-bold mt-0.5" style={{ color: "var(--text-primary)" }}>
                          Today&apos;s Work Log Editor & Live Preview
                        </h4>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenWorkLog()}
                      className="px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:brightness-110 flex items-center gap-1.5"
                      style={{
                        backgroundColor: "var(--bg-surface-subtle)",
                        borderColor: "var(--border-medium)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Open TipTap Split Work Log Editor</span>
                    </button>
                  </div>

                  {/* Quick Guide & Rules Info */}
                  <div
                    className="p-4 rounded-xl border text-xs leading-relaxed space-y-1.5"
                    style={{
                      backgroundColor: "var(--bg-surface-subtle)",
                      borderColor: "var(--border-subtle)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <span className="font-bold text-xs block text-primary">💡 Work Log Instructions:</span>
                    <ul className="list-disc pl-4 space-y-1 text-[11px] text-muted">
                      <li>You can write and edit your work log anytime for <strong>Today&apos;s Date</strong>.</li>
                      <li>Past dates are locked to prevent retroactive modification (Admins can override when necessary).</li>
                      <li>Use checklists (`[ ]`), bullet lists, bold text, and headings to structure your deliverables cleanly.</li>
                      <li>Your supervisor / admin can review your daily log and leave feedback remarks.</li>
                    </ul>
                  </div>
                </section>
              </div>
            )}
          </>
        )}
      </main>

      {/* Attendance Regularization Modal */}
      <RegularizeModal
        isOpen={isRegularizeModalOpen}
        onClose={() => setIsRegularizeModalOpen(false)}
        onSubmit={handleSubmitRegularization}
        userId={user.id || user._id || ""}
        defaultDate={regularizeDefaultDate}
        absentDates={absentDates}
      />

      {/* Work Log Modal */}
      <WorkLogModal
        isOpen={isWorkLogModalOpen}
        onClose={() => setIsWorkLogModalOpen(false)}
        userId={workLogUserId || (user ? (user.id || user._id || "") : "")}
        userName={workLogUserName || (user ? user.name : "User")}
        date={workLogDate}
        currentUserRole={role}
        currentUserId={user ? (user.id || user._id) : undefined}
      />
    </div>
  );
}
