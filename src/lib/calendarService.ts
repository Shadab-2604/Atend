export interface WorkingDayInfo {
  dayNumber: number;
  date: string; // YYYY-MM-DD
  dayName: string;
}

export function isWeekend(dateObj: Date): boolean {
  return dateObj.getDay() === 0; // Only Sunday is weekend (0 = Sunday)
}

export function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function parseDateKey(str: string): Date {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Generates the 45 working days calendar starting from startDateStr,
 * strictly skipping Sundays (Saturdays are regular working days).
 */
export function generateWorkingDays(startDateStr: string, totalDays = 45): {
  workingDaysMap: Map<string, WorkingDayInfo>;
  endDateStr: string;
  workingDaysList: WorkingDayInfo[];
} {
  const workingDaysMap = new Map<string, WorkingDayInfo>();
  const workingDaysList: WorkingDayInfo[] = [];

  let currentDate = parseDateKey(startDateStr);
  let dayCounter = 0;
  let lastWorkingDateStr = startDateStr;

  let maxLoop = 365;
  while (dayCounter < totalDays && maxLoop > 0) {
    maxLoop--;
    if (!isWeekend(currentDate)) {
      dayCounter++;
      const dateKey = formatDateKey(currentDate);
      const info: WorkingDayInfo = {
        dayNumber: dayCounter,
        date: dateKey,
        dayName: currentDate.toLocaleDateString("en-US", { weekday: "long" })
      };
      workingDaysMap.set(dateKey, info);
      workingDaysList.push(info);
      lastWorkingDateStr = dateKey;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return { workingDaysMap, endDateStr: lastWorkingDateStr, workingDaysList };
}
