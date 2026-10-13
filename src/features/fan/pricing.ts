import { feesFor } from "@/mocks/fees";
import { fromPrice, tierState } from "@/lib/event";
import type { PromoCode, TktEvent } from "@/mocks/types";

export type Line = { tierId: string; qty: number };

export function discountFor(p: PromoCode | undefined, subtotal: number): number {
  if (!p || subtotal === 0) return 0;
  return p.kind === "percent" ? Math.round((subtotal * p.amount) / 100) : Math.min(subtotal, p.amount);
}

export function priceLines(event: TktEvent, items: Line[], promo?: PromoCode) {
  const qty = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((n, i) => n + (event.tiers.find((t) => t.id === i.tierId)?.price ?? 0) * i.qty, 0);
  const discount = discountFor(promo, subtotal);
  const fees = feesFor(subtotal, qty);
  return { qty, subtotal, discount, fees, total: subtotal - discount + fees };
}

export function promoLabel(p: PromoCode): string {
  return p.kind === "percent" ? `${p.amount}% off` : "off";
}

export type PromoCheck =
  | { kind: "discount"; promo: PromoCode }
  | { kind: "tier"; code: string; tierName: string }
  | { kind: "error"; message: string };

/** Matches a code against hidden tiers first, then this event's promo codes. */
export function checkCode(raw: string, event: TktEvent, promos: PromoCode[], now: number): PromoCheck {
  const code = raw.trim().toUpperCase();
  if (!code) return { kind: "error", message: "Enter a code first" };
  const tier = event.tiers.find((t) => t.unlockCode?.toUpperCase() === code);
  if (tier) return { kind: "tier", code, tierName: tier.name };
  const promo = promos.find((p) => p.eventId === event.id && p.code.toUpperCase() === code);
  if (!promo) return { kind: "error", message: "That code doesn't work for this event" };
  if (new Date(promo.expires).getTime() < now) return { kind: "error", message: "That code has expired" };
  if (promo.used >= promo.limit) return { kind: "error", message: "That code is all used up" };
  return { kind: "discount", promo };
}

/** "From" price among tiers still on sale; falls back to the lowest visible tier. */
export function lowestOpen(event: TktEvent): number {
  const open = event.tiers.filter((t) => {
    const s = tierState(t);
    return s === "on-sale" || s === "low";
  });
  return open.length ? Math.min(...open.map((t) => t.price)) : fromPrice(event);
}

/** Tier state right now, honoring codes the fan has entered. */
export function tierNow(t: TktEvent["tiers"][number], unlocked: string[]) {
  return tierState(t, Date.now(), unlocked);
}
