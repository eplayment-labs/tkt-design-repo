import { z } from "zod";
import { addDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { TZ } from "@/lib/format";
import type { EventAccent } from "@/lib/accent";
import { photos } from "@/mocks/photos";
import type { Category, City, Photo, TktEvent } from "@/mocks/types";

export const CATEGORIES: Category[] = ["Music", "Workshop", "Talk", "Food", "Wellness", "Arts"];
export const CITIES: Exclude<City, "Online">[] = ["Manila", "Quezon City", "Cebu", "Davao"];

export const REFUNDS = {
  standard: "Full refund up to 7 days before the event. No refunds after that, but you can transfer your ticket.",
  none: "No refunds. You can transfer your ticket to someone else up to the day before.",
} as const;

/** Mock photos a host can pick for cover and gallery (avatars left out). */
export const PHOTO_CHOICES: Photo[] = Object.entries(photos)
  .filter(([k]) => !k.startsWith("avatar") && k !== "fan")
  .map(([, p]) => p);

export const STEPS = [
  { slug: "basics", label: "Basics" },
  { slug: "when", label: "When & where" },
  { slug: "media", label: "Media" },
  { slug: "tickets", label: "Tickets" },
  { slug: "settings", label: "Settings" },
  { slug: "review", label: "Review & publish" },
] as const;

export type StepSlug = (typeof STEPS)[number]["slug"];

const num = (msg: string) => z.number({ error: msg }).refine((n) => !Number.isNaN(n), msg);

export const tierSchema = z
  .object({
    id: z.string(),
    name: z.string().trim().min(1, "Name the tier").max(40, "Keep it under 40 characters"),
    description: z.string().max(80, "Keep it under 80 characters"),
    // Free RSVP leaves price blank (NaN); paid tiers are checked in the event-level refine.
    price: z.number().min(0, "Enter ₱0.00 or more").or(z.nan()),
    capacity: num("Enter a capacity").pipe(z.number().int("Use a whole number").min(1, "Allow at least 1 ticket")),
    perOrderLimit: num("Enter a limit").pipe(z.number().int("Use a whole number").min(1, "Allow at least 1").max(20, "Keep it at 20 or fewer")),
    salesEndDate: z.string().min(1, "Pick a date"),
    earlyBird: z.boolean(),
    hidden: z.boolean(),
    unlockCode: z.string(),
    sold: z.number(),
  })
  .superRefine((t, ctx) => {
    if (t.hidden && !/^[A-Za-z0-9]{4,20}$/.test(t.unlockCode.trim()))
      ctx.addIssue({ code: "custom", path: ["unlockCode"], message: "Use 4–20 letters or numbers" });
    if (t.capacity < t.sold) ctx.addIssue({ code: "custom", path: ["capacity"], message: `Already ${t.sold} sold, so keep it at ${t.sold} or more` });
  });

export const schema = z
  .object({
    id: z.string(),
    // Basics
    title: z.string().trim().min(3, "Use at least 3 characters").max(80, "Keep it under 80 characters"),
    category: z.enum(CATEGORIES as [Category, ...Category[]], { error: "Pick a category" }),
    description: z.string().trim().min(20, "Write at least a sentence or two").max(2000, "Keep it under 2,000 characters"),
    // When & where
    multiDay: z.boolean(),
    startDate: z.string().min(1, "Pick a date"),
    startTime: z.string().min(1, "Pick a time"),
    endDate: z.string(),
    endTime: z.string().min(1, "Pick a time"),
    format: z.enum(["in-person", "online", "hybrid"]),
    city: z.string(),
    venueName: z.string().trim(),
    venueAddress: z.string().trim(),
    onlineNote: z.string().trim(),
    // Media
    coverUrl: z.string().min(1, "Pick a cover photo"),
    coverAlt: z.string(),
    coverPosition: z.string(),
    gallery: z.array(z.string()).max(6, "Pick up to 6 photos"),
    accent: z.custom<EventAccent | null>(),
    // Tickets
    pricing: z.enum(["free", "paid"]),
    tiers: z.array(tierSchema).min(1, "Add at least one tier"),
    // Settings
    refundPreset: z.enum(["standard", "none", "custom"]),
    refundCustom: z.string().trim(),
    questions: z.array(z.object({ value: z.string().trim().min(1, "Write the question or remove it").max(120, "Keep it under 120 characters") })).max(5),
    visibility: z.enum(["public", "unlisted"]),
  })
  .superRefine((v, ctx) => {
    const start = toIso(v.startDate, v.startTime);
    const end = toIso(v.multiDay ? v.endDate : v.startDate, v.endTime);
    if (v.multiDay && !v.endDate) ctx.addIssue({ code: "custom", path: ["endDate"], message: "Pick an end date" });
    else if (start && end && end <= start)
      ctx.addIssue({ code: "custom", path: [v.multiDay ? "endDate" : "endTime"], message: "Set the end after the start" });
    if (v.format !== "online") {
      if (!CITIES.includes(v.city as (typeof CITIES)[number])) ctx.addIssue({ code: "custom", path: ["city"], message: "Pick a city" });
      if (v.venueName.length < 2) ctx.addIssue({ code: "custom", path: ["venueName"], message: "Enter the venue name" });
      if (v.venueAddress.length < 5) ctx.addIssue({ code: "custom", path: ["venueAddress"], message: "Enter the address" });
    }
    if (v.format !== "in-person" && v.onlineNote.length < 5)
      ctx.addIssue({ code: "custom", path: ["onlineNote"], message: "Tell people how to join" });
    if (v.pricing === "paid") {
      v.tiers.forEach((t, i) => {
        if (!(t.price > 0)) ctx.addIssue({ code: "custom", path: ["tiers", i, "price"], message: "Enter a price above ₱0.00, or switch to free" });
      });
    }
    if (v.refundPreset === "custom" && v.refundCustom.length < 10)
      ctx.addIssue({ code: "custom", path: ["refundCustom"], message: "Write your refund policy" });
  });

export type Values = z.infer<typeof schema>;
export type TierValues = Values["tiers"][number];

export const STEP_FIELDS: Record<StepSlug, (keyof Values)[]> = {
  basics: ["title", "category", "description"],
  when: ["multiDay", "startDate", "startTime", "endDate", "endTime", "format", "city", "venueName", "venueAddress", "onlineNote"],
  media: ["coverUrl", "gallery"],
  tickets: ["pricing", "tiers"],
  settings: ["refundPreset", "refundCustom", "questions", "visibility"],
  review: [],
};

/* ---------- Conversions ---------- */

function toIso(date: string, time: string): string | null {
  if (!date || !time) return null;
  try {
    return fromZonedTime(`${date}T${time}:00`, TZ).toISOString();
  } catch {
    return null;
  }
}

const day = (iso: string) => formatInTimeZone(iso, TZ, "yyyy-MM-dd");
const hm = (iso: string) => formatInTimeZone(iso, TZ, "HH:mm");

export function newTier(salesEndDate: string, partial: Partial<TierValues> = {}): TierValues {
  return {
    id: `t-${Math.random().toString(36).slice(2, 8)}`,
    name: "General",
    description: "",
    price: Number.NaN,
    capacity: 100,
    perOrderLimit: 4,
    salesEndDate,
    earlyBird: false,
    hidden: false,
    unlockCode: "",
    sold: 0,
    ...partial,
  };
}

export function blankValues(): Values {
  const start = formatInTimeZone(addDays(new Date(), 30), TZ, "yyyy-MM-dd");
  return {
    id: `ev-${Math.random().toString(36).slice(2, 8)}`,
    title: "",
    category: "Music",
    description: "",
    multiDay: false,
    startDate: start,
    startTime: "19:00",
    endDate: start,
    endTime: "22:00",
    format: "in-person",
    city: "",
    venueName: "",
    venueAddress: "",
    onlineNote: "",
    coverUrl: "",
    coverAlt: "",
    coverPosition: "50% 50%",
    gallery: [],
    accent: null,
    pricing: "paid",
    tiers: [newTier(start)],
    refundPreset: "standard",
    refundCustom: "",
    questions: [],
    visibility: "public",
  };
}

export function fromEvent(e: TktEvent): Values {
  const preset = e.refundPolicy === REFUNDS.standard ? "standard" : e.refundPolicy === REFUNDS.none ? "none" : "custom";
  return {
    id: e.id,
    title: e.title,
    category: e.category,
    description: e.description.join("\n\n"),
    multiDay: day(e.start) !== day(e.end),
    startDate: day(e.start),
    startTime: hm(e.start),
    endDate: day(e.end),
    endTime: hm(e.end),
    format: e.format,
    city: e.city === "Online" ? "" : e.city,
    venueName: e.venue?.name ?? "",
    venueAddress: e.venue?.address ?? "",
    onlineNote: e.onlineNote ?? "",
    coverUrl: e.cover.url,
    coverAlt: e.cover.alt,
    coverPosition: e.cover.position ?? "50% 50%",
    gallery: e.gallery.map((g) => g.url),
    accent: e.accent,
    pricing: e.tiers.every((t) => t.price === 0) ? "free" : "paid",
    tiers: e.tiers.map((t) => ({
      id: t.id,
      name: t.name,
      description: t.description ?? "",
      price: t.price / 100,
      capacity: t.capacity,
      perOrderLimit: t.perOrderLimit,
      salesEndDate: day(t.salesEnd),
      earlyBird: Boolean(t.earlyBird),
      hidden: Boolean(t.unlockCode),
      unlockCode: t.unlockCode ?? "",
      sold: t.sold,
    })),
    refundPreset: preset,
    refundCustom: preset === "custom" ? e.refundPolicy : "",
    questions: (e.questions ?? []).map((value) => ({ value })),
    visibility: e.visibility,
  };
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "event";

/** Form values → event record. Lenient so the live preview works mid-edit. */
export function toEvent(v: Values, opts: { hostId: string; status: TktEvent["status"]; taken: string[]; existing?: TktEvent }): TktEvent {
  const fallbackStart = toIso(v.startDate, v.startTime) ?? new Date().toISOString();
  const start = fallbackStart;
  const end = toIso(v.multiDay ? v.endDate : v.startDate, v.endTime) ?? start;
  const base = slugify(v.title || "untitled event");
  const slug = opts.existing?.slug && opts.existing.slug.startsWith(base) ? opts.existing.slug : opts.taken.includes(base) ? `${base}-${v.id.slice(-4)}` : base;
  const coverChoice = PHOTO_CHOICES.find((p) => p.url === v.coverUrl);
  const online = v.format === "online";
  return {
    id: v.id,
    slug,
    title: v.title || "Untitled event",
    hostId: opts.hostId,
    category: v.category,
    city: online ? "Online" : ((v.city || "Manila") as City),
    format: v.format,
    start,
    end,
    venue: online ? undefined : { name: v.venueName || "Venue", address: v.venueAddress },
    onlineNote: online || v.format === "hybrid" ? v.onlineNote : undefined,
    cover: {
      id: coverChoice?.id ?? "upload",
      url: v.coverUrl || PHOTO_CHOICES[0].url,
      alt: coverChoice?.alt ?? (v.coverAlt || v.title || "Event cover"),
      position: v.coverPosition,
    },
    gallery: v.gallery.map((url, i) => PHOTO_CHOICES.find((p) => p.url === url) ?? { id: `g${i}`, url, alt: "" }),
    description: v.description
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean),
    faq: opts.existing?.faq ?? [],
    tiers: v.tiers.map((t) => ({
      id: t.id,
      name: t.name || "Tier",
      description: t.description || undefined,
      price: v.pricing === "free" || Number.isNaN(t.price) ? 0 : Math.round(t.price * 100),
      capacity: Number.isNaN(t.capacity) ? 0 : t.capacity,
      sold: t.sold,
      perOrderLimit: Number.isNaN(t.perOrderLimit) ? 1 : t.perOrderLimit,
      salesEnd: toIso(t.salesEndDate, "23:59") ?? end,
      earlyBird: v.pricing === "paid" && t.earlyBird ? true : undefined,
      unlockCode: t.hidden && t.unlockCode ? t.unlockCode.trim().toUpperCase() : undefined,
    })),
    status: opts.status,
    visibility: v.visibility,
    refundPolicy: v.refundPreset === "custom" ? v.refundCustom : REFUNDS[v.refundPreset],
    accent: v.accent ?? null,
    checkedIn: opts.existing?.checkedIn ?? 0,
    sales: opts.existing?.sales ?? [],
    questions: v.questions.map((q) => q.value).filter(Boolean),
  };
}
