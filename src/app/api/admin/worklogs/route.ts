import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { WorkLog } from "@/models/WorkLog";

function getTodayIsoString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// GET /api/admin/worklogs?date=YYYY-MM-DD
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const targetDate = searchParams.get("date") || getTodayIsoString();

    // Fetch all active users (interns/employees/users excluding admins if desired, or all users)
    const users = await User.find({ role: { $ne: "admin" } }).select("name username role email").sort({ name: 1 }).lean();

    // Fetch all work logs for the specified date
    const workLogs = await WorkLog.find({ date: targetDate }).lean();
    const logMap = new Map<string, any>();
    workLogs.forEach((log) => {
      logMap.set(String(log.userId), log);
    });

    let submittedCount = 0;
    let missedCount = 0;
    let reviewedCount = 0;

    const items = users.map((user) => {
      const uId = String(user._id);
      const log = logMap.get(uId);
      const hasContent = Boolean(log && log.content && log.content.trim().length > 0);
      const hasAdminRemark = Boolean(log && log.adminRemark && log.adminRemark.trim().length > 0);

      if (hasContent) {
        submittedCount++;
      } else {
        missedCount++;
      }

      if (hasAdminRemark) {
        reviewedCount++;
      }

      return {
        userId: uId,
        userName: user.name,
        userUsername: user.username,
        userRole: user.role,
        userEmail: user.email || "",
        date: targetDate,
        hasSubmitted: hasContent,
        workLog: log || null,
        workLogTitle: log?.title || (hasContent ? `Work Log — ${targetDate}` : "No Work Log Submitted"),
        contentSnippet: hasContent
          ? log.content.replace(/<[^>]+>/g, " ").trim().substring(0, 120)
          : "",
        adminRemark: log?.adminRemark || "",
        updatedAt: log?.updatedAt || null,
      };
    });

    return NextResponse.json({
      success: true,
      date: targetDate,
      metrics: {
        totalUsers: users.length,
        submittedCount,
        missedCount,
        reviewedCount,
      },
      items,
    });
  } catch (err: any) {
    console.error("GET admin worklogs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch admin work log audit data." },
      { status: 500 }
    );
  }
}
