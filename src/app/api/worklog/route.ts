import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { WorkLog } from "@/models/WorkLog";
import { User } from "@/models/User";

// Helper to get local YYYY-MM-DD string
function getTodayIsoString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// GET /api/worklog?userId=...&date=...
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const date = searchParams.get("date");

    if (!userId || !date) {
      return NextResponse.json(
        { error: "Both userId and date query parameters are required." },
        { status: 400 }
      );
    }

    const workLog = await WorkLog.findOne({ userId, date });
    return NextResponse.json({ success: true, workLog: workLog || null });
  } catch (err: any) {
    console.error("GET worklog error:", err);
    return NextResponse.json(
      { error: "Failed to fetch work log." },
      { status: 500 }
    );
  }
}

function extractTitleFromHtml(html: string, date: string): string {
  if (!html) return `Work Log — ${date}`;
  const match = html.match(/<h[1-3][^>]*>(.*?)<\/h[1-3]>/i) || html.match(/<p[^>]*>(.*?)<\/p>/i);
  if (match && match[1]) {
    const clean = match[1].replace(/<[^>]+>/g, "").trim();
    if (clean.length > 0) return clean.substring(0, 70);
  }
  const cleanText = html.replace(/<[^>]+>/g, " ").trim();
  if (cleanText.length > 0) return cleanText.substring(0, 70);
  return `Work Log — ${date}`;
}

// POST /api/worklog
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, date, content, title, adminRemark, requesterRole, requesterId } = body;

    if (!userId || !date) {
      return NextResponse.json(
        { error: "userId and date are required." },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "Target user not found." }, { status: 404 });
    }

    const todayIso = getTodayIsoString();
    const isAdmin = requesterRole === "admin" || user.role === "admin";

    // Date restriction check for non-admin users
    if (!isAdmin && date !== todayIso) {
      return NextResponse.json(
        {
          error: `Employees and interns can only create or edit today's work log (${todayIso}). Past or future date edits are locked.`,
        },
        { status: 403 }
      );
    }

    const htmlContent = content !== undefined ? content : "";
    const derivedTitle = title ? title.trim() : extractTitleFromHtml(htmlContent, date);

    const updateFields: any = {
      content: htmlContent,
      title: derivedTitle,
    };

    if (adminRemark !== undefined) {
      updateFields.adminRemark = adminRemark;
    }

    if (requesterId) {
      updateFields.updatedBy = requesterId;
    }

    const workLog = await WorkLog.findOneAndUpdate(
      { userId: user._id, date },
      { $set: updateFields },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json(
      {
        success: true,
        message: "Work log saved successfully.",
        workLog,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("POST worklog error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to save work log." },
      { status: 500 }
    );
  }
}
