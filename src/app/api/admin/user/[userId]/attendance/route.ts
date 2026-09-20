import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectDB();
    const { userId } = await params;
    const records = await Attendance.find({ userId }).sort({ date: 1 });
    return NextResponse.json({ success: true, records });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch user attendance." }, { status: 500 });
  }
}
