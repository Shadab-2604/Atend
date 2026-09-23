import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";
import { processAutoPunchOut } from "@/lib/autoPunchOutService";

// GET /api/attendance?userId=...
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required." }, { status: 400 });
    }

    await processAutoPunchOut();
    const records = await Attendance.find({ userId }).sort({ date: 1 }).lean();
    return NextResponse.json({ success: true, records });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch attendance records." }, { status: 500 });
  }
}

// POST /api/attendance
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, date, status, loginTime, logoutTime, login, logout, notes, breakMinutes, oooMinutes, workMode } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: "userId and date are required." }, { status: 400 });
    }

    let record = await Attendance.findOne({ userId, date });
    if (!record) {
      record = new Attendance({ userId, date });
    }

    record.status = status || "upcoming";
    record.notes = notes !== undefined ? notes : (record.notes || "");
    if (workMode) record.workMode = workMode;
    if (breakMinutes !== undefined) record.breakMinutes = Number(breakMinutes) || 0;
    if (oooMinutes !== undefined) record.oooMinutes = Number(oooMinutes) || 0;

    const resolvedLoginTime = loginTime || login?.time;
    if (resolvedLoginTime) {
      const ts = login?.timestamp ? new Date(login.timestamp) : new Date(`${date}T${resolvedLoginTime}`);
      record.login = {
        time: resolvedLoginTime,
        timestamp: isNaN(ts.getTime()) ? new Date(`${date}T${resolvedLoginTime}`) : ts
      };
    }

    const resolvedLogoutTime = logoutTime || logout?.time;
    if (resolvedLogoutTime) {
      const ts = logout?.timestamp ? new Date(logout.timestamp) : new Date(`${date}T${resolvedLogoutTime}`);
      record.logout = {
        time: resolvedLogoutTime,
        timestamp: isNaN(ts.getTime()) ? new Date(`${date}T${resolvedLogoutTime}`) : ts
      };
    }

    if (record.login?.time && record.logout?.time) {
      const loginDate = record.login.timestamp || new Date(`${date}T${record.login.time}`);
      const logoutDate = record.logout.timestamp || new Date(`${date}T${record.logout.time}`);
      const loginMs = new Date(loginDate).getTime();
      const logoutMs = new Date(logoutDate).getTime();
      if (!isNaN(loginMs) && !isNaN(logoutMs)) {
        const grossMs = Math.max(0, logoutMs - loginMs);
        const grossMins = Math.round(grossMs / 60000);
        const breakMins = record.breakMinutes || 0;
        const oooMins = record.oooMinutes || 0;
        const mins = Math.max(0, grossMins - breakMins - oooMins);
        record.duration = {
          totalMinutes: mins,
          hours: Math.floor(mins / 60),
          minutes: mins % 60
        };

        if (record.status === "present" || record.status === "working") {
          record.status = (mins + breakMins) >= 555 ? "present" : "half-day";
        }
      }
    }

    await record.save();
    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error("Save attendance error:", err);
    return NextResponse.json({ error: "Failed to save attendance record." }, { status: 500 });
  }
}
