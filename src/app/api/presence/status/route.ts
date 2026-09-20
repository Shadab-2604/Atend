import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { User, PresenceStatus } from "@/models/User";
import { Attendance } from "@/models/Attendance";
import { formatDateKey } from "@/lib/calendarService";
import { processAutoPunchOut } from "@/lib/autoPunchOutService";
import { emitPresenceUpdate, emitAttendanceSaved } from "@/lib/socketServer";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, status } = body as { userId: string; status: PresenceStatus };

    if (!userId || !status) {
      return NextResponse.json({ error: "userId and status are required." }, { status: 400 });
    }

    // Auto punch out any past unclosed shifts first
    await processAutoPunchOut();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
    const todayStr = formatDateKey(now);

    // If user's previous session was on a different day, reset daily metrics
    if (user.loginTimestamp && formatDateKey(new Date(user.loginTimestamp)) !== todayStr) {
      user.totalBreakMinutes = 0;
      user.totalOooMinutes = 0;
      user.accumulatedWorkSeconds = 0;
      user.accumulatedBreakSeconds = 0;
      user.accumulatedOooSeconds = 0;
      user.todayWorkingMinutes = 0;
      user.loginTime = null;
      user.loginTimestamp = null;
      user.logoutTime = null;
      user.breakStartTime = null;
      user.oooStartTime = null;
      user.lastStatusChangeTimestamp = null;
      user.currentStatus = "logged_out";
    }

    const prevStatus = user.currentStatus;
    const lastChange = user.lastStatusChangeTimestamp || user.loginTimestamp || now;
    const sessionElapsedSec = Math.max(0, Math.floor((now.getTime() - new Date(lastChange).getTime()) / 1000));

    // 1. Accumulate duration of the previous status
    if (prevStatus === "working" && status !== "working") {
      user.accumulatedWorkSeconds = (user.accumulatedWorkSeconds || 0) + sessionElapsedSec;
      user.todayWorkingMinutes = Math.floor(user.accumulatedWorkSeconds / 60);
    } else if (prevStatus === "break" && status !== "break") {
      const breakSec = user.breakStartTime
        ? Math.max(0, Math.floor((now.getTime() - new Date(user.breakStartTime).getTime()) / 1000))
        : sessionElapsedSec;
      user.accumulatedBreakSeconds = (user.accumulatedBreakSeconds || 0) + breakSec;
      user.totalBreakMinutes = Math.floor(user.accumulatedBreakSeconds / 60);
      user.breakStartTime = null;
    } else if (prevStatus === "ooo" && status !== "ooo") {
      const oooSec = user.oooStartTime
        ? Math.max(0, Math.floor((now.getTime() - new Date(user.oooStartTime).getTime()) / 1000))
        : sessionElapsedSec;
      user.accumulatedOooSeconds = (user.accumulatedOooSeconds || 0) + oooSec;
      user.totalOooMinutes = Math.floor(user.accumulatedOooSeconds / 60);
      user.oooStartTime = null;
    }

    // 2. Set new status and update timestamp
    user.currentStatus = status;
    user.lastStatusChangeTimestamp = now;

    let attendance = await Attendance.findOne({ userId: user._id, date: todayStr });

    switch (status) {
      case "working": {
        // 🟢 Green: Logged In / Working
        if (!user.loginTimestamp) {
          user.loginTime = timeStr;
          user.loginTimestamp = now;
          user.logoutTime = null;
        }

        // Sync Attendance record
        if (!attendance) {
          attendance = await Attendance.create({
            userId: user._id,
            date: todayStr,
            status: "working",
            login: { time: timeStr, timestamp: now },
            notes: "Clocked in shift"
          });
        } else {
          attendance.status = "working";
          if (!attendance.login) {
            attendance.login = { time: timeStr, timestamp: now };
          }
          await attendance.save();
        }
        break;
      }

      case "break": {
        // 🟡 Yellow: Break Status
        if (!user.loginTimestamp) {
          user.loginTime = timeStr;
          user.loginTimestamp = now;
        }
        user.breakStartTime = now;

        if (!attendance) {
          attendance = await Attendance.create({
            userId: user._id,
            date: todayStr,
            status: "working",
            login: { time: timeStr, timestamp: now },
            notes: "On break"
          });
        }
        break;
      }

      case "ooo": {
        // 🔴 Red: Out of Office
        if (!user.loginTimestamp) {
          user.loginTime = timeStr;
          user.loginTimestamp = now;
        }
        user.oooStartTime = now;
        break;
      }

      case "logged_out": {
        // ⚪ Grey: Logged Out
        user.logoutTime = timeStr;
        const totalNetMinutes = Math.floor((user.accumulatedWorkSeconds || 0) / 60);
        user.todayWorkingMinutes = totalNetMinutes;

        if (attendance) {
          const totalOfficeMinutes = totalNetMinutes + (user.totalBreakMinutes || 0);
          const isFullDay = totalOfficeMinutes >= 555;
          attendance.status = isFullDay ? "present" : "half-day";
          attendance.logout = { time: timeStr, timestamp: now };
          attendance.duration = {
            totalMinutes: totalNetMinutes,
            hours: Math.floor(totalNetMinutes / 60),
            minutes: totalNetMinutes % 60
          };
          attendance.breakMinutes = user.totalBreakMinutes || 0;
          attendance.oooMinutes = user.totalOooMinutes || 0;
          await attendance.save();
        }
        break;
      }
    }

    await user.save();

    const userData = {
      id: user._id,
      username: user.username,
      name: user.name,
      currentStatus: user.currentStatus,
      loginTime: user.loginTime,
      loginTimestamp: user.loginTimestamp,
      logoutTime: user.logoutTime,
      breakStartTime: user.breakStartTime,
      totalBreakMinutes: user.totalBreakMinutes,
      oooStartTime: user.oooStartTime,
      totalOooMinutes: user.totalOooMinutes,
      todayWorkingMinutes: user.todayWorkingMinutes,
      lastStatusChangeTimestamp: user.lastStatusChangeTimestamp,
      accumulatedWorkSeconds: user.accumulatedWorkSeconds || 0,
      accumulatedBreakSeconds: user.accumulatedBreakSeconds || 0,
      accumulatedOooSeconds: user.accumulatedOooSeconds || 0
    };

    // Emit real-time WebSocket events
    emitPresenceUpdate(userData);
    if (attendance) emitAttendanceSaved(attendance);

    return NextResponse.json({
      success: true,
      status: user.currentStatus,
      user: userData,
      attendance
    });
  } catch (err) {
    console.error("Presence update error:", err);
    return NextResponse.json({ error: "Failed to update presence status." }, { status: 500 });
  }
}
