import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const userId = searchParams.get("userId");

    const filter: any = {};
    if (date) filter.date = date;
    if (userId && userId !== "all") filter.userId = userId;

    const records = await Attendance.find(filter).sort({ date: -1, createdAt: -1 });
    return NextResponse.json({ success: true, records });
  } catch (err) {
    console.error("Admin fetch attendance error:", err);
    return NextResponse.json({ error: "Failed to fetch attendance records." }, { status: 500 });
  }
}

// POST /api/admin/attendance - Override attendance status by Admin
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, date, status, notes, workMode } = body;

    if (!userId || !date || !status) {
      return NextResponse.json({ error: "userId, date, and status are required." }, { status: 400 });
    }

    let record = await Attendance.findOne({ userId, date });

    let loginObj: any = null;
    let logoutObj: any = null;
    let durationObj = { totalMinutes: 0, hours: 0, minutes: 0 };

    if (status === "present") {
      const loginTimeStr = record?.login?.time || "09:30 AM";
      const logoutTimeStr = record?.logout?.time || "06:30 PM";
      loginObj = { time: loginTimeStr, timestamp: new Date(`${date}T09:30:00`) };
      logoutObj = { time: logoutTimeStr, timestamp: new Date(`${date}T18:30:00`) };
      durationObj = { totalMinutes: 540, hours: 9, minutes: 0 };
    } else if (status === "half-day") {
      const loginTimeStr = record?.login?.time || "09:30 AM";
      const logoutTimeStr = record?.logout?.time || "01:30 PM";
      loginObj = { time: loginTimeStr, timestamp: new Date(`${date}T09:30:00`) };
      logoutObj = { time: logoutTimeStr, timestamp: new Date(`${date}T13:30:00`) };
      durationObj = { totalMinutes: 240, hours: 4, minutes: 0 };
    }

    if (record) {
      record.status = status;
      record.set("login", loginObj || undefined);
      record.set("logout", logoutObj || undefined);
      record.duration = durationObj;
      if (notes !== undefined) record.notes = notes;
      if (workMode !== undefined) record.workMode = workMode;
      record.adminRejectionReason = "";
      await record.save();
    } else {
      record = await Attendance.create({
        userId,
        date,
        dayNumber: 0,
        status,
        workMode: workMode || "WFO",
        login: loginObj || undefined,
        logout: logoutObj || undefined,
        duration: durationObj,
        notes: notes || `Marked ${status} by Admin`,
      });
    }

    return NextResponse.json({ success: true, record });
  } catch (err: any) {
    console.error("Admin override attendance error:", err);
    return NextResponse.json({ error: err?.message || "Failed to update attendance status." }, { status: 500 });
  }
}
