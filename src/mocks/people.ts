import { events, seeded } from "./events";
import { photos } from "./photos";
import { at } from "./time";
import type { Attendee, Fan, Order, PromoCode, Ticket } from "./types";

export const fan: Fan = {
  id: "f1",
  name: "Ana Reyes",
  email: "ana@email.com",
  mobile: "9171234567",
  city: "Quezon City",
  avatar: photos.fan.url,
};

export const initialFollowing = ["h1", "h2"];

/** Ana's existing orders: upcoming, past, and one canceled event. */
export const fanOrders: Order[] = [
  { id: "o1", number: "TK-48213", eventId: "e1", buyerName: fan.name, buyerEmail: fan.email, items: [{ tierId: "e1-ga", qty: 2, unit: 125000 }], fees: 10000, discount: 0, total: 260000, createdAt: at(-6, "21:14"), payment: "gcash" },
  { id: "o2", number: "TK-48877", eventId: "e10", buyerName: fan.name, buyerEmail: fan.email, items: [{ tierId: "e10-seat", qty: 1, unit: 60000 }], fees: 5000, discount: 0, total: 65000, createdAt: at(-3, "09:02"), payment: "maya" },
  { id: "o3", number: "TK-41029", eventId: "e5", buyerName: fan.name, buyerEmail: fan.email, items: [{ tierId: "e5-ga", qty: 1, unit: 60000 }], fees: 5000, discount: 0, total: 65000, createdAt: at(-34, "19:40"), payment: "card" },
  { id: "o4", number: "TK-47502", eventId: "e6", buyerName: fan.name, buyerEmail: fan.email, items: [{ tierId: "e6-ga", qty: 1, unit: 25000 }], fees: 5000, discount: 0, total: 30000, createdAt: at(-8, "12:30"), payment: "qrph" },
];

export const fanTickets: Ticket[] = [
  { id: "t1", code: "MG-7Q4K-2PXA", serial: 213, eventId: "e1", tierId: "e1-ga", orderId: "o1", holderName: "Ana Reyes", status: "valid" },
  { id: "t2", code: "MG-7Q4K-9LMB", serial: 214, eventId: "e1", tierId: "e1-ga", orderId: "o1", holderName: "Migs Santos", status: "valid" },
  { id: "t3", code: "SF-2H8D-K3RT", serial: 47, eventId: "e10", tierId: "e10-seat", orderId: "o2", holderName: "Ana Reyes", status: "valid" },
  { id: "t4", code: "RS-5TT2-W8QN", serial: 88, eventId: "e5", tierId: "e5-ga", orderId: "o3", holderName: "Ana Reyes", status: "checked-in", checkedInAt: at(-20, "18:42") },
  { id: "t5", code: "OM-9JX1-C4VE", serial: 12, eventId: "e6", tierId: "e6-ga", orderId: "o4", holderName: "Ana Reyes", status: "canceled" },
];

const FIRST = ["Ana", "Migs", "Bea", "Paolo", "Kat", "Jun", "Trish", "Carlo", "Mara", "Rafa", "Inday", "Joaquin", "Lia", "Nico", "Pia", "Enzo", "Bianca", "Gab", "Sam", "Tin", "Dom", "Ella", "Marco", "Jess", "Aly", "Iggy", "Ria", "Toby", "Chesca", "Ken"];
const LAST = ["Reyes", "Santos", "Cruz", "Bautista", "Garcia", "Mendoza", "Torres", "Flores", "Villanueva", "Ramos", "Aquino", "Castillo", "Navarro", "Dizon", "Salazar", "Tan", "Lim", "Uy", "Go", "Co", "Domingo", "Pascual", "Manalo", "Ocampo", "Lopez"];

const cache = new Map<string, Attendee[]>();

/** Deterministic attendee list for any event, one row per sold ticket. */
export function attendeesFor(eventId: string): Attendee[] {
  const hit = cache.get(eventId);
  if (hit) return hit;
  const ev = events.find((e) => e.id === eventId);
  if (!ev) return [];
  const rand = seeded(eventId.split("").reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
  const prefix = ev.slug.slice(0, 2).toUpperCase();
  const rows: Attendee[] = [];
  let serial = 1;
  let order = 40000 + Math.floor(rand() * 5000);
  let left = 0;
  let orderNumber = "";
  let purchasedAt = "";
  for (const tier of ev.tiers) {
    for (let i = 0; i < tier.sold; i++) {
      if (left === 0) {
        left = 1 + Math.floor(rand() * 3);
        order += 1 + Math.floor(rand() * 9);
        orderNumber = `TK-${order}`;
        purchasedAt = at(-Math.floor(rand() * 28) - 1, `${String(8 + Math.floor(rand() * 14)).padStart(2, "0")}:${String(Math.floor(rand() * 60)).padStart(2, "0")}`);
      }
      left--;
      const first = FIRST[Math.floor(rand() * FIRST.length)];
      const last = LAST[Math.floor(rand() * LAST.length)];
      const checked = ev.checkedIn > 0 && serial <= ev.checkedIn;
      const code = `${prefix}-${Math.floor(rand() * 36 ** 4).toString(36).toUpperCase().padStart(4, "0")}-${Math.floor(rand() * 36 ** 4).toString(36).toUpperCase().padStart(4, "0")}`;
      rows.push({
        id: `${eventId}-a${serial}`,
        ticketCode: code,
        serial,
        name: `${first} ${last}`,
        email: `${first}.${last}${serial % 7 === 0 ? serial : ""}@email.com`.toLowerCase(),
        tierId: tier.id,
        orderNumber,
        purchasedAt,
        checkedInAt: checked ? at(-20, "18:30") : undefined,
      });
      serial++;
    }
  }
  cache.set(eventId, rows);
  return rows;
}

export const promoCodes: PromoCode[] = [
  { id: "p1", eventId: "e1", code: "GARDEN10", kind: "percent", amount: 10, limit: 50, used: 12, expires: at(5, "23:59") },
  { id: "p2", eventId: "e1", code: "BANDFRIENDS", kind: "fixed", amount: 30000, limit: 20, used: 20, expires: at(5, "23:59") },
  { id: "p3", eventId: "e1", code: "LAUNCH", kind: "percent", amount: 15, limit: 100, used: 64, expires: at(-12, "23:59") },
  { id: "p4", eventId: "e2", code: "CEBU500", kind: "fixed", amount: 50000, limit: 200, used: 87, expires: at(30, "23:59") },
];
