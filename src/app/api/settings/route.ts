import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Settings } from "@/models/Settings";
import { generateWorkingDays } from "@/lib/calendarService";

export async function GET() {
  try {
    await connectDB();
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({
        title: "Internship Attendance Tracker",
        totalWorkingDays: 45,
        startDate: "2026-09-15",
        endDate: "2026-11-05",
        workingHoursPerDay: 8
      });
    }

    const { workingDaysList } = generateWorkingDays(settings.startDate, settings.totalWorkingDays);
    return NextResponse.json({ success: true, settings, workingDays: workingDaysList });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch settings." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { title, startDate, totalWorkingDays, workingHoursPerDay } = body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    if (title) settings.title = title;
    if (startDate) settings.startDate = startDate;
    if (totalWorkingDays) settings.totalWorkingDays = totalWorkingDays;
    if (workingHoursPerDay) settings.workingHoursPerDay = workingHoursPerDay;

    const { endDateStr, workingDaysList } = generateWorkingDays(settings.startDate, settings.totalWorkingDays);
    settings.endDate = endDateStr;

    await settings.save();
    return NextResponse.json({ success: true, settings, workingDays: workingDaysList });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update settings." }, { status: 500 });
  }
}
