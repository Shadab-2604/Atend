import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Attendance } from "@/models/Attendance";
import { Settings } from "@/models/Settings";
import { generateWorkingDays, formatDateKey } from "@/lib/calendarService";
import { processAutoPunchOut } from "@/lib/autoPunchOutService";

export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required." }, { status: 400 });
    }

    await processAutoPunchOut();

    const settings = (await Settings.findOne()) || {
      startDate: "2026-09-15",
      totalWorkingDays: 45
    };

    const { workingDaysMap } = generateWorkingDays(settings.startDate, settings.totalWorkingDays);
    const presentRecords = await Attendance.find({ userId, status: { $in: ["present", "half-day"] } });

    const completedDays = presentRecords.reduce((acc, r) => acc + (r.status === "half-day" ? 0.5 : 1), 0);
    const remainingDays = Math.max(0, settings.totalWorkingDays - Math.floor(completedDays));

    const todayStr = formatDateKey(new Date());
    let elapsedWorkingDays = 0;
    for (const [dateStr] of workingDaysMap) {
      if (dateStr <= todayStr) elapsedWorkingDays++;
    }

    let attendancePercentage = 100;
    if (elapsedWorkingDays > 0) {
      attendancePercentage = Math.min(100, Math.round((completedDays / elapsedWorkingDays) * 100));
    }

    let totalWorkingMinutes = 0;
    presentRecords.forEach((r) => {
      if (r.duration && r.duration.totalMinutes) {
        totalWorkingMinutes += r.duration.totalMinutes;
      }
    });

    const totalWorkingHours = parseFloat((totalWorkingMinutes / 60).toFixed(2));
    const avgWorkingMinutes = completedDays > 0 ? Math.round(totalWorkingMinutes / completedDays) : 0;
    const averageWorkingHours = parseFloat((avgWorkingMinutes / 60).toFixed(2));

    return NextResponse.json({
      success: true,
      summary: {
        completedDays,
        remainingDays,
        attendancePercentage,
        totalWorkingHours,
        averageWorkingHours,
        totalWorkingMinutes,
        averageWorkingMinutes: avgWorkingMinutes
      }
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to calculate summary." }, { status: 500 });
  }
}
