/**
 * Time and duration formatting utilities
 */

/**
 * Formats a 24-hour time string ("HH:MM", "HH:MM:SS") or ISO time string into 12-hour AM/PM format.
 * Examples:
 *   "09:00" -> "09:00 AM"
 *   "14:20:17" -> "02:20:17 PM"
 *   "17:30" -> "05:30 PM"
 *   "09:00 AM" -> "09:00 AM"
 */
export function formatTo12Hour(timeStr?: string | null, omitSeconds: boolean = false): string {
  if (!timeStr || !timeStr.trim()) return "--:--";
  const str = timeStr.trim();

  // If already contains AM or PM (case-insensitive)
  if (/am|pm/i.test(str)) {
    if (omitSeconds) {
      return str.replace(/:(\d{2})\s*(AM|PM)/i, " $2");
    }
    return str;
  }

  // Check if it's an ISO timestamp
  if (str.includes("T") && str.includes("Z")) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        ...(omitSeconds ? {} : { second: "2-digit" }),
        hour12: true,
      });
    }
  }

  const parts = str.split(":");
  if (parts.length < 2) return str;

  let hours = parseInt(parts[0], 10);
  if (isNaN(hours)) return str;

  const minutes = parts[1].padStart(2, "0");
  const seconds = parts[2] ? parts[2].padStart(2, "0") : null;
  const ampm = hours >= 12 ? "PM" : "AM";

  hours = hours % 12;
  if (hours === 0) hours = 12;

  const formattedHours = String(hours).padStart(2, "0");
  if (!omitSeconds && seconds !== null) {
    return `${formattedHours}:${minutes}:${seconds} ${ampm}`;
  }
  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Formats seconds into HH:MM:SS with zero padding.
 */
export function formatSecondsToHMS(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/**
 * Formats seconds into human readable format without rounding off (e.g. "15m 10s", "1h 30m 20s").
 */
export function formatSecondsToReadable(totalSeconds: number): string {
  const sec = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;

  if (h > 0) {
    return `${h}h ${m}m ${s}s`;
  }
  if (m > 0) {
    return `${m}m ${s}s`;
  }
  return `${s}s`;
}
