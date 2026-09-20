import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    await connectDB();
    const { date } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId || !date) {
      return NextResponse.json({ error: "userId and date are required." }, { status: 400 });
    }

    await Attendance.deleteOne({ userId, date });
    return NextResponse.json({ success: true, message: `Record for ${date} reset.` });
  } catch (err) {
    return NextResponse.json({ error: "Failed to reset attendance record." }, { status: 500 });
  }
}
