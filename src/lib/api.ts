const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = typeof window !== "undefined" ? localStorage.getItem("attend_token") : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(url, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "An error occurred during API request");
  }

  return data as T;
}

// Auth APIs
export async function apiLogin(username: string, password: string, role?: string) {
  return apiRequest<{ success: boolean; token: string; user: any }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password, role })
  });
}

export async function apiGetMe() {
  return apiRequest<{ success: boolean; user: any }>("/auth/me");
}

// Presence APIs
export async function apiUpdatePresenceStatus(userId: string, status: string) {
  return apiRequest<{ success: boolean; status: string; user: any; attendance: any }>("/presence/status", {
    method: "POST",
    body: JSON.stringify({ userId, status })
  });
}

// Attendance APIs
export async function apiGetAttendance(userId: string) {
  return apiRequest<{ success: boolean; records: any[] }>(`/attendance?userId=${userId}`);
}

export async function apiGetAttendanceSummary(userId: string) {
  return apiRequest<{ success: boolean; summary: any }>(`/attendance/summary?userId=${userId}`);
}

export async function apiSaveAttendance(data: any) {
  return apiRequest<{ success: boolean; record: any }>("/attendance", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function apiResetAttendance(userId: string, date: string) {
  return apiRequest<{ success: boolean; message: string }>(`/attendance/${date}?userId=${userId}`, {
    method: "DELETE"
  });
}

// Admin APIs
export async function apiGetAdminUsers(role?: string) {
  const query = role && role !== "all" ? `?role=${role}` : "";
  return apiRequest<{ success: boolean; users: any[] }>(`/admin/users${query}`);
}

export async function apiGetAdminMetrics() {
  return apiRequest<{ success: boolean; metrics: any }>("/admin/metrics");
}

export async function apiAdminGetAllAttendance(date?: string, userId?: string) {
  const params = new URLSearchParams();
  if (date) params.append("date", date);
  if (userId) params.append("userId", userId);
  const query = params.toString() ? `?${params.toString()}` : "";
  return apiRequest<{ success: boolean; records: any[] }>(`/admin/attendance${query}`);
}

export async function apiAdminCreateUser(userData: any) {
  return apiRequest<{ success: boolean; user: any }>("/admin/users", {
    method: "POST",
    body: JSON.stringify(userData)
  });
}

export async function apiAdminUpdateUser(userId: string, userData: any) {
  return apiRequest<{ success: boolean; message: string; user: any }>(`/admin/users/${userId}`, {
    method: "PUT",
    body: JSON.stringify(userData)
  });
}

export async function apiAdminDeleteUser(userId: string, adminId?: string) {
  const query = adminId ? `?adminId=${adminId}` : "";
  return apiRequest<{ success: boolean; message: string }>(`/admin/users/${userId}${query}`, {
    method: "DELETE"
  });
}

// Settings APIs
export async function apiGetSettings() {
  return apiRequest<{ success: boolean; settings: any; workingDays: any[] }>("/settings");
}

// Regularization APIs
export async function apiSubmitRegularization(data: {
  userId: string;
  date: string;
  workMode: "WFO" | "WFH";
  hours: number;
  reason: string;
}) {
  return apiRequest<{ success: boolean; message: string; request: any; attendance: any }>("/attendance/regularize", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function apiGetRegularizationRequests(userId: string) {
  return apiRequest<{ success: boolean; requests: any[] }>(`/attendance/regularize?userId=${userId}`);
}

export async function apiAdminGetRegularizationRequests(status?: string) {
  const query = status && status !== "all" ? `?status=${status}` : "";
  return apiRequest<{ success: boolean; requests: any[] }>(`/admin/regularize-requests${query}`);
}

export async function apiAdminReviewRegularization(
  requestId: string,
  action: "approve" | "reject",
  adminReason?: string,
  adminId?: string
) {
  return apiRequest<{ success: boolean; message: string; request: any; attendance: any }>(
    `/admin/regularize/${requestId}/review`,
    {
      method: "POST",
      body: JSON.stringify({ action, adminReason, adminId })
    }
  );
}
