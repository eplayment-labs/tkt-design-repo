import type { EventAccent } from "@/lib/accent";

export type City = "Manila" | "Quezon City" | "Cebu" | "Davao" | "Online";
export type Category = "Music" | "Comedy" | "Workshop" | "Talk" | "Food" | "Wellness" | "Arts";

/** Storefront callouts (DESIGN_PLAN §00). "Few left" is derived from stock, never stored. */
export type EventBadge = "just-announced" | "new-date" | "selling-fast";
export type EventFormat = "in-person" | "online" | "hybrid";
export type EventStatus = "draft" | "live" | "ended" | "canceled";

export type Host = {
  id: string;
  handle: string;
  name: string;
  avatar: string;
  bio: string;
  city: City;
  followers: number;
  /** Masked sample only. Never a real account number. */
  payoutMasked: string;
};

export type Tier = {
  id: string;
  name: string;
  description?: string;
  /** Centavos. 0 = free RSVP. */
  price: number;
  capacity: number;
  sold: number;
  perOrderLimit: number;
  salesEnd: string;
  earlyBird?: boolean;
  /** Hidden tiers show only after entering this code. */
  unlockCode?: string;
  waitlist?: boolean;
};

export type Venue = { name: string; address: string };

export type Photo = { id: string; url: string; alt: string; position?: string };

export type SalesPoint = { day: string; sold: number; gross: number };

export type TktEvent = {
  id: string;
  slug: string;
  title: string;
  hostId: string;
  category: Category;
  city: City;
  format: EventFormat;
  start: string;
  end: string;
  venue?: Venue;
  onlineNote?: string;
  cover: Photo;
  gallery: Photo[];
  description: string[];
  faq: { q: string; a: string }[];
  tiers: Tier[];
  status: EventStatus;
  visibility: "public" | "unlisted";
  refundPolicy: string;
  accent: EventAccent | null;
  checkedIn: number;
  sales: SalesPoint[];
  questions?: string[];
  /** Storefront: shows in the home hero carousel. */
  featured?: boolean;
  badge?: EventBadge;
  /** Storefront: 0–100, drives "Trending" and the "Most popular" sort. */
  popularity?: number;
};

export type TicketStatus = "valid" | "checked-in" | "transferred" | "refund-requested" | "canceled";

export type Ticket = {
  id: string;
  code: string;
  serial: number;
  eventId: string;
  tierId: string;
  orderId: string;
  holderName: string;
  status: TicketStatus;
  checkedInAt?: string;
  transferredTo?: string;
};

export type OrderItem = { tierId: string; qty: number; unit: number };

export type Order = {
  id: string;
  number: string;
  eventId: string;
  buyerName: string;
  buyerEmail: string;
  items: OrderItem[];
  fees: number;
  discount: number;
  total: number;
  createdAt: string;
  payment: PaymentMethod;
};

export type PaymentMethod = "gcash" | "maya" | "card" | "qrph";

export type Attendee = {
  id: string;
  ticketCode: string;
  serial: number;
  name: string;
  email: string;
  tierId: string;
  orderNumber: string;
  purchasedAt: string;
  checkedInAt?: string;
};

export type PromoCode = {
  id: string;
  eventId: string;
  code: string;
  kind: "percent" | "fixed";
  /** Percent (0–100) or centavos. */
  amount: number;
  limit: number;
  used: number;
  expires: string;
};

export type Fan = {
  id: string;
  name: string;
  email: string;
  mobile: string;
  city: City;
  avatar: string;
};
