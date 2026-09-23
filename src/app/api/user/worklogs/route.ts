import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { WorkLog } from "@/models/WorkLog";

// GET /api/user/worklogs?userId=...
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId query parameter is required." },
        { status: 400 }
      );
    }

    const workLogs = await WorkLog.find({ userId }).sort({ date: -1 }).limit(100).lean();
    return NextResponse.json({ success: true, workLogs });
  } catch (err: any) {
    console.error("GET user worklogs error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user work log history." },
      { status: 500 }
    );
  }
}
