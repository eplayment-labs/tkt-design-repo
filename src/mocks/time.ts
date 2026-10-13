import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { TZ } from "@/lib/format";

/**
 * Mock dates are relative to "today" in Manila, so the demo never goes
 * stale. `at(3, "19:30")` = three days from today, 7:30 PM Manila time.
 */
export function at(dayOffset: number, hhmm: string): string {
  // Read "today" per call, not once per module load: a long-running dev
  // server otherwise mixes yesterday's date with today's weekday.
  const todayManila = formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
  const day = formatInTimeZone(addDays(fromZonedTime(`${todayManila}T12:00:00`, TZ), dayOffset), TZ, "yyyy-MM-dd");
  return fromZonedTime(`${day}T${hhmm}:00`, TZ).toISOString();
}

/** Next Saturday (or today if Saturday), as a day offset. */
export function nextSaturdayOffset(): number {
  const dow = Number(formatInTimeZone(new Date(), TZ, "i")); // 1 = Mon … 7 = Sun
  return dow === 7 ? 6 : 6 - dow;
}
