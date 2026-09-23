import { Attendance } from "../models/Attendance";
import { User } from "../models/User";
import { formatDateKey } from "./calendarService";

let lastAutoPunchOutCheck = 0;
const AUTO_PUNCH_OUT_INTERVAL_MS = 30000; // 30 seconds

/**
 * Scans for any open attendance records from previous dates (date < todayStr)
 * where the user forgot to punch out before midnight, and automatically closes them
 * at 11:59:59 PM of that day.
 */
export async function processAutoPunchOut(force = false): Promise<{ processedCount: number; records: any[] }> {
  try {
    const now = new Date();
    const nowMs = now.getTime();
    if (!force && nowMs - lastAutoPunchOutCheck < AUTO_PUNCH_OUT_INTERVAL_MS) {
      return { processedCount: 0, records: [] };
    }
    lastAutoPunchOutCheck = nowMs;

    const todayStr = formatDateKey(now);

    // Find records from dates strictly prior to today that are still marked as "working" or have no logout
    const openPastRecords = await Attendance.find({
      date: { $lt: todayStr },
      $or: [
        { status: "working" },
        { logout: null, login: { $ne: null } }
      ]
    });

    if (openPastRecords.length === 0) {
      return { processedCount: 0, records: [] };
    }

    console.log(`[AutoPunchOut] Detected ${openPastRecords.length} unclosed shift(s) from past dates. Auto-closing...`);

    const processedRecords = [];

    for (const record of openPastRecords) {
      const [year, month, day] = record.date.split("-").map(Number);
      // Construct end of day at 23:59:59
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      const logoutTimeStr = "11:59:59 PM";

      // Calculate gross milliseconds
      let loginMs: number;
      if (record.login?.timestamp) {
        loginMs = new Date(record.login.timestamp).getTime();
      } else if (record.login?.time) {
        loginMs = new Date(`${record.date}T${record.login.time}`).getTime();
      } else {
        loginMs = new Date(year, month - 1, day, 9, 0, 0).getTime();
      }

      const logoutMs = endOfDay.getTime();
      const grossMs = Math.max(0, logoutMs - loginMs);
      const grossMins = Math.round(grossMs / 60000);
      const breakMins = record.breakMinutes || 0;
      const oooMins = record.oooMinutes || 0;
      const totalMinutes = Math.max(0, grossMins - breakMins - oooMins);

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      // 9.5 hours target with 15-minute login buffer allowance (555 minutes = 9h 15m) for present vs half-day
      const isFullDay = (totalMinutes + breakMins) >= 555;
      record.status = isFullDay ? "present" : "half-day";

      record.logout = {
        time: logoutTimeStr,
        timestamp: endOfDay
      };

      record.duration = {
        totalMinutes,
        hours,
        minutes
      };

      record.isAutoPunchOut = true;

      const autoNote = "Auto punched out at 11:59 PM (Day rollover)";
      if (!record.notes) {
        record.notes = autoNote;
      } else if (!record.notes.includes("Auto punched out")) {
        record.notes = `${record.notes} | ${autoNote}`;
      }

      await record.save();
      processedRecords.push(record);
      console.log(`[AutoPunchOut] Auto-punched out user ${record.userId} on ${record.date}: ${hours}h ${minutes}m (${record.status})`);

      // If user document is still in working/break/ooo status for that past day, reset user presence to logged_out
      const user = await User.findById(record.userId);
      if (user) {
        const userLoginDate = user.loginTimestamp ? formatDateKey(new Date(user.loginTimestamp)) : null;
        if (userLoginDate === record.date && user.currentStatus !== "logged_out") {
          user.currentStatus = "logged_out";
          user.logoutTime = logoutTimeStr;
          user.todayWorkingMinutes = totalMinutes;
          user.lastStatusChangeTimestamp = endOfDay;
          await user.save();
        }
      }
    }

    return { processedCount: processedRecords.length, records: processedRecords };
  } catch (err) {
    console.error("[AutoPunchOut] Error during auto punch-out processing:", err);
    return { processedCount: 0, records: [] };
  }
}
