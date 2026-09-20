import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Attendance } from "@/models/Attendance";
import { RegularizationRequest } from "@/models/RegularizationRequest";
import { emitRegularizationNew } from "@/lib/socketServer";

// GET /api/attendance/regularize?userId=...
export async function GET(req: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId query parameter is required." }, { status: 400 });
    }

    const requests = await RegularizationRequest.find({ userId }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, requests });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch regularization requests." }, { status: 500 });
  }
}

// POST /api/attendance/regularize
export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, date, workMode, hours, reason } = body;

    if (!userId || !date || !workMode || !hours || !reason) {
      return NextResponse.json(
        { error: "userId, date, workMode, hours, and reason are required." },
        { status: 400 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const parsedHours = Number(hours);
    if (isNaN(parsedHours) || parsedHours <= 0 || parsedHours > 24) {
      return NextResponse.json({ error: "Hours must be a number between 1 and 24." }, { status: 400 });
    }

    let existingRequest = await RegularizationRequest.findOne({ userId, date, status: "pending" });
    if (existingRequest) {
      return NextResponse.json(
        { error: "A regularization request for this date is already pending admin review." },
        { status: 409 }
      );
    }

    const request = await RegularizationRequest.create({
      userId: user._id,
      userName: user.name,
      date,
      workMode: workMode === "WFH" ? "WFH" : "WFO",
      hours: parsedHours,
      reason: String(reason).trim(),
      status: "pending"
    });

    let attendance = await Attendance.findOne({ userId: user._id, date });
    if (!attendance) {
      attendance = new Attendance({
        userId: user._id,
        date,
        status: "pending",
        workMode: request.workMode,
        duration: {
          totalMinutes: parsedHours * 60,
          hours: Math.floor(parsedHours),
          minutes: Math.round((parsedHours % 1) * 60)
        },
        regularizationStatus: "pending",
        regularizationReason: request.reason,
        notes: `Regularization Pending (${request.workMode}, ${parsedHours}h): ${request.reason}`
      });
    } else {
      attendance.status = "pending";
      attendance.workMode = request.workMode;
      attendance.duration = {
        totalMinutes: parsedHours * 60,
        hours: Math.floor(parsedHours),
        minutes: Math.round((parsedHours % 1) * 60)
      };
      attendance.regularizationStatus = "pending";
      attendance.regularizationReason = request.reason;
      attendance.notes = `Regularization Pending (${request.workMode}, ${parsedHours}h): ${request.reason}`;
    }
    await attendance.save();

    // Emit real-time WebSocket event
    emitRegularizationNew(request);

    return NextResponse.json(
      {
        success: true,
        message: "Attendance regularization request submitted successfully.",
        request,
        attendance
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Regularize attendance error:", err);
    return NextResponse.json({ error: "Failed to submit attendance regularization request." }, { status: 500 });
  }
}
