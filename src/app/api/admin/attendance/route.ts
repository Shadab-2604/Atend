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
