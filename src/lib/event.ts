import type { Tier, TktEvent } from "@/mocks/types";

/** Show "12 left" only when stock is actually low. */
export const LOW_STOCK = 0.15;

export type TierState = "on-sale" | "low" | "sold-out" | "sales-closed" | "hidden";

export function remaining(t: Tier): number {
  return Math.max(0, t.capacity - t.sold);
}

export function tierState(t: Tier, now = Date.now(), unlocked: string[] = []): TierState {
  if (t.unlockCode && !unlocked.includes(t.unlockCode.toUpperCase())) return "hidden";
  if (remaining(t) === 0) return "sold-out";
  if (new Date(t.salesEnd).getTime() < now) return "sales-closed";
  if (remaining(t) <= Math.max(3, Math.ceil(t.capacity * LOW_STOCK))) return "low";
  return "on-sale";
}

export type EventState = "draft" | "on-sale" | "sold-out" | "sales-closed" | "ended" | "canceled";

export function eventState(e: TktEvent, now = Date.now()): EventState {
  if (e.status === "draft") return "draft";
  if (e.status === "canceled") return "canceled";
  if (e.status === "ended" || new Date(e.end).getTime() < now) return "ended";
  const visible = e.tiers.filter((t) => !t.unlockCode);
  const states = visible.map((t) => tierState(t, now));
  if (states.some((s) => s === "on-sale" || s === "low")) return "on-sale";
  if (states.every((s) => s === "sold-out")) return "sold-out";
  return states.some((s) => s === "sold-out") && !states.includes("sales-closed") ? "sold-out" : "sales-closed";
}

export function isFree(e: TktEvent): boolean {
  return e.tiers.every((t) => t.price === 0);
}

/** Lowest visible price, for "From ₱850.00". */
export function fromPrice(e: TktEvent): number {
  const visible = e.tiers.filter((t) => !t.unlockCode);
  return Math.min(...visible.map((t) => t.price));
}

export function totals(e: TktEvent) {
  const capacity = e.tiers.reduce((n, t) => n + t.capacity, 0);
  const sold = e.tiers.reduce((n, t) => n + t.sold, 0);
  const gross = e.tiers.reduce((n, t) => n + t.sold * t.price, 0);
  return { capacity, sold, gross };
}

export function hasWaitlist(e: TktEvent): boolean {
  return e.tiers.some((t) => t.waitlist && remaining(t) === 0);
}

export function salesEnd(e: TktEvent): string {
  return e.tiers.reduce((latest, t) => (t.salesEnd > latest ? t.salesEnd : latest), e.tiers[0]?.salesEnd ?? e.start);
}

export function whereLabel(e: TktEvent): string {
  if (e.format === "online") return "Online";
  if (!e.venue) return e.city;
  return e.format === "hybrid" ? `${e.venue.name} + online` : e.venue.name;
}
