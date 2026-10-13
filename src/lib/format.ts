import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { differenceInCalendarDays, isSameDay } from "date-fns";

export const TZ = "Asia/Manila";

const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₱1,234.56 — amounts are stored in centavos to avoid float drift. */
export function money(centavos: number): string {
  return peso.format(centavos / 100).replace(/^PHP\s?/, "₱");
}

/** "Free" for zero, ₱ otherwise. Use for prices shown to fans. */
export function price(centavos: number): string {
  return centavos === 0 ? "Free" : money(centavos);
}

export function count(n: number): string {
  return new Intl.NumberFormat("en-PH").format(n);
}

/** 27 Aug 2026 */
export function date(iso: string | Date): string {
  return formatInTimeZone(iso, TZ, "d MMM yyyy");
}

/** Fri 9 Oct */
export function dayShort(iso: string | Date): string {
  return formatInTimeZone(iso, TZ, "EEE d MMM");
}

/** Fri, 9 Oct 2026 */
export function dayLong(iso: string | Date): string {
  return formatInTimeZone(iso, TZ, "EEE, d MMM yyyy");
}

/** 7:30 PM */
export function time(iso: string | Date): string {
  return formatInTimeZone(iso, TZ, "h:mm a");
}

/** 27 Aug 2026, 7:30 PM */
export function dateTime(iso: string | Date): string {
  return `${date(iso)}, ${time(iso)}`;
}

/** "Fri, 9 Oct 2026 · 7:30–11:00 PM" or a multi-day range. */
export function eventWhen(startIso: string, endIso: string): string {
  const s = toZonedTime(startIso, TZ);
  const e = toZonedTime(endIso, TZ);
  if (isSameDay(s, e)) {
    const sameMeridiem = formatInTimeZone(startIso, TZ, "a") === formatInTimeZone(endIso, TZ, "a");
    const start = sameMeridiem ? formatInTimeZone(startIso, TZ, "h:mm") : time(startIso);
    return `${dayLong(startIso)} · ${start}–${time(endIso)}`;
  }
  return `${formatInTimeZone(startIso, TZ, "d MMM")}–${date(endIso)}`;
}

/** Day key in Manila time, for grouping. */
export function dayKey(iso: string): string {
  return formatInTimeZone(iso, TZ, "yyyy-MM-dd");
}

export function daysUntil(iso: string, now: Date = new Date()): number {
  return differenceInCalendarDays(toZonedTime(iso, TZ), toZonedTime(now, TZ));
}

/** 9:58 */
export function countdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** +63 917 123 4567 */
export function mobile(digits: string): string {
  const d = digits.replace(/\D/g, "").replace(/^63/, "").replace(/^0/, "");
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 10)].filter(Boolean);
  return parts.length ? `+63 ${parts.join(" ")}` : "";
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${count(n)} ${n === 1 ? one : many}`;
}
