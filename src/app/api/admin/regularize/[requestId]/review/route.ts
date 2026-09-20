import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { RegularizationRequest } from "@/models/RegularizationRequest";
import { Attendance } from "@/models/Attendance";
import { emitRegularizationReviewed, emitAttendanceSaved } from "@/lib/socketServer";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    await connectDB();
    const { requestId } = await params;
    const body = await req.json();
    const { action, adminReason, adminId } = body as {
      action: "approve" | "reject";
      adminReason?: string;
      adminId?: string;
    };

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Valid action ('approve' or 'reject') is required." }, { status: 400 });
    }

    if (action === "reject" && (!adminReason || !adminReason.trim())) {
      return NextResponse.json({ error: "A rejection reason is required when rejecting a request." }, { status: 400 });
    }

    const request = await RegularizationRequest.findById(requestId);
    if (!request) {
      return NextResponse.json({ error: "Regularization request not found." }, { status: 404 });
    }

    const now = new Date();
    const newStatus = action === "approve" ? "approved" : "rejected";
    request.status = newStatus;
    request.adminReason = adminReason ? adminReason.trim() : action === "approve" ? "Approved by Admin" : "Rejected";
    if (adminId) {
      request.reviewedBy = adminId as any;
    }
    request.reviewedAt = now;
    await request.save();

    let attendance = await Attendance.findOne({ userId: request.userId, date: request.date });
    if (!attendance) {
      attendance = new Attendance({
        userId: request.userId,
        date: request.date,
        status: action === "approve" ? "present" : "absent",
        workMode: request.workMode,
        duration:
          action === "approve"
            ? {
                totalMinutes: request.hours * 60,
                hours: Math.floor(request.hours),
                minutes: Math.round((request.hours % 1) * 60)
              }
            : { totalMinutes: 0, hours: 0, minutes: 0 },
        regularizationStatus: newStatus,
        regularizationReason: request.reason,
        adminRejectionReason: action === "reject" ? request.adminReason : "",
        notes:
          action === "approve"
            ? `Regularized (${request.workMode}, ${request.hours}h): ${request.reason}`
            : `Regularization Rejected: ${request.adminReason}`
      });
    } else {
      attendance.status = action === "approve" ? "present" : "absent";
      attendance.workMode = request.workMode;
      if (action === "approve") {
        attendance.duration = {
          totalMinutes: request.hours * 60,
          hours: Math.floor(request.hours),
          minutes: Math.round((request.hours % 1) * 60)
        };
        attendance.notes = `Regularized (${request.workMode}, ${request.hours}h): ${request.reason}`;
      } else {
        attendance.adminRejectionReason = request.adminReason;
        attendance.notes = `Regularization Rejected: ${request.adminReason}`;
      }
      attendance.regularizationStatus = newStatus;
    }
    await attendance.save();

    // Emit real-time WebSocket events
    emitRegularizationReviewed(request);
    emitAttendanceSaved(attendance);

    return NextResponse.json({
      success: true,
      message: `Request ${action === "approve" ? "approved" : "rejected"} successfully.`,
      request,
      attendance
    });
  } catch (err) {
    console.error("Review regularization error:", err);
    return NextResponse.json({ error: "Failed to review regularization request." }, { status: 500 });
  }
}
