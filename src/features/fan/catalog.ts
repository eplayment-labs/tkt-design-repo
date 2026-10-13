import { eventState, isFree, remaining, tierState } from "@/lib/event";
import * as f from "@/lib/format";
import { hostById } from "@/mocks/hosts";
import type { Category, City, TktEvent } from "@/mocks/types";
import { lowestOpen } from "./pricing";

/** Storefront queries (DESIGN_PLAN §00). Pure functions over the event list. */

export const CITIES: City[] = ["Manila", "Quezon City", "Cebu", "Davao", "Online"];
export const CATEGORIES: Category[] = ["Music", "Comedy", "Arts", "Food", "Workshop", "Talk", "Wellness"];

export type When = "any" | "today" | "weekend" | "month";
export const WHEN: { value: When; label: string }[] = [
  { value: "any", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "weekend", label: "This weekend" },
  { value: "month", label: "This month" },
];

export type PriceBand = "any" | "free" | "under-1000" | "1000-3000" | "over-3000";
export const PRICES: { value: PriceBand; label: string }[] = [
  { value: "any", label: "Any price" },
  { value: "free", label: "Free" },
  { value: "under-1000", label: "Under ₱1,000" },
  { value: "1000-3000", label: "₱1,000–₱3,000" },
  { value: "over-3000", label: "Over ₱3,000" },
];

export type Sort = "soonest" | "price-asc" | "price-desc" | "popular";
export const SORTS: { value: Sort; label: string }[] = [
  { value: "soonest", label: "Soonest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "popular", label: "Most popular" },
];

const DAY = 86_400_000;

/** Manila day keys for today, this weekend (Sat + Sun; just Sun on a Sunday), and this month. */
export function calendar(now = new Date()) {
  const key = (n: number) => f.dayKey(new Date(now.getTime() + n * DAY).toISOString());
  const weekday = f.dayShort(now).split(" ")[0];
  const i = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday) + 1; // 1 = Mon … 7 = Sun
  const weekend = i === 7 ? [key(0)] : i === 6 ? [key(0), key(1)] : [key(6 - i), key(7 - i)];
  // Rest of this week: tomorrow up to Friday (empty from Friday on).
  const restOfWeek = Array.from({ length: Math.max(0, 5 - i) }, (_, n) => key(n + 1));
  // Next week: the coming Monday to Sunday.
  const nextWeek = Array.from({ length: 7 }, (_, n) => key(8 - i + n));
  return { today: key(0), tomorrow: key(1), weekend, restOfWeek, nextWeek, month: key(0).slice(0, 7) };
}
export type Cal = ReturnType<typeof calendar>;

/** Public events a fan can still go to: not draft, not ended, not canceled. */
export function live(all: TktEvent[]): TktEvent[] {
  return all
    .filter((e) => e.visibility === "public")
    .filter((e) => {
      const s = eventState(e);
      return s !== "draft" && s !== "ended" && s !== "canceled";
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function inWhen(e: TktEvent, when: When, cal: Cal): boolean {
  const k = f.dayKey(e.start);
  if (when === "today") return k === cal.today;
  if (when === "weekend") return cal.weekend.includes(k);
  if (when === "month") return k.startsWith(cal.month);
  return true;
}

export function inPrice(e: TktEvent, band: PriceBand): boolean {
  if (band === "any") return true;
  if (band === "free") return isFree(e);
  const p = lowestOpen(e);
  if (p === 0) return false;
  if (band === "under-1000") return p < 100000;
  if (band === "1000-3000") return p >= 100000 && p <= 300000;
  return p > 300000;
}

/** Every word must appear in the title, host, venue, city, or category. */
export function matchesQuery(e: TktEvent, q: string): boolean {
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return true;
  const hay = [e.title, hostById(e.hostId)?.name, e.venue?.name, e.city, e.category].join(" ").toLowerCase();
  return words.every((w) => hay.includes(w));
}

export function popularity(e: TktEvent): number {
  if (e.popularity !== undefined) return e.popularity;
  const cap = e.tiers.reduce((n, t) => n + t.capacity, 0);
  const sold = e.tiers.reduce((n, t) => n + t.sold, 0);
  return cap ? Math.round((sold / cap) * 60) : 0;
}

export function sortEvents(list: TktEvent[], sort: Sort): TktEvent[] {
  const out = [...list];
  if (sort === "price-asc") out.sort((a, b) => lowestOpen(a) - lowestOpen(b));
  else if (sort === "price-desc") out.sort((a, b) => lowestOpen(b) - lowestOpen(a));
  else if (sort === "popular") out.sort((a, b) => popularity(b) - popularity(a));
  else out.sort((a, b) => a.start.localeCompare(b.start));
  return out;
}

/** True when every on-sale visible tier is low on stock. */
export function fewLeft(e: TktEvent): boolean {
  if (eventState(e) !== "on-sale") return false;
  const open = e.tiers.filter((t) => !t.unlockCode).map((t) => tierState(t));
  return open.includes("low") && !open.includes("on-sale");
}

/** Nearest sales end among tiers still on sale. */
export function salesEndsAt(e: TktEvent): number | null {
  const open = e.tiers.filter((t) => !t.unlockCode && remaining(t) > 0 && new Date(t.salesEnd).getTime() > Date.now());
  if (!open.length) return null;
  return Math.min(...open.map((t) => new Date(t.salesEnd).getTime()));
}

export type Pill = { label: string; tone: "neutral" | "warning" | "danger" };

/** One status pill per card: stock state first, then the host's callout. */
export function statusPill(e: TktEvent): Pill | null {
  const s = eventState(e);
  if (s === "sold-out") return { label: "Sold out", tone: "danger" };
  if (s === "sales-closed") return { label: "Sales closed", tone: "neutral" };
  if (fewLeft(e)) return { label: "Few left", tone: "warning" };
  if (e.badge === "just-announced") return { label: "Just announced", tone: "neutral" };
  if (e.badge === "new-date") return { label: "New date added", tone: "neutral" };
  if (e.badge === "selling-fast") return { label: "Selling fast", tone: "warning" };
  return null;
}

/** "2d 4h", "5h 12m", "12m". */
export function untilLabel(ms: number): string {
  const m = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  const mm = m % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${mm}m`;
  return `${mm}m`;
}

export function searchHref(p: { q?: string; city?: string; when?: string; cat?: string }): string {
  const sp = new URLSearchParams();
  if (p.q) sp.set("q", p.q);
  if (p.city) sp.set("city", p.city);
  if (p.when && p.when !== "any") sp.set("when", p.when);
  if (p.cat) sp.set("cat", p.cat);
  const s = sp.toString();
  return `/search${s ? `?${s}` : ""}`;
}

/** On sale, and either closing within a week or down to the last few tickets. Soonest close first. */
export function lastCallList(list: TktEvent[]): TktEvent[] {
  const now = Date.now();
  return list
    .filter((e) => eventState(e) === "on-sale")
    .map((e) => ({ e, end: salesEndsAt(e) }))
    .filter(({ e, end }) => fewLeft(e) || (end !== null && end - now < 7 * DAY))
    .sort((a, b) => (a.end ?? Infinity) - (b.end ?? Infinity))
    .map(({ e }) => e);
}

/** Events starting within the next `days` days. */
export function withinDays(list: TktEvent[], days: number): TktEvent[] {
  const now = Date.now();
  return list.filter((e) => new Date(e.start).getTime() - now < days * DAY);
}
