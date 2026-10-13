import { isFree } from "@/lib/event";
import * as f from "@/lib/format";
import { hostById } from "@/mocks/hosts";
import type { TktEvent } from "@/mocks/types";
import { popularity } from "./catalog";
import { lowestOpen } from "./pricing";

/**
 * Mood → events, with a one-line reason per pick (DESIGN_PLAN §000).
 * Every rule and every reason is derived from event data or the fan's own
 * follows. Nothing claims taste we can't see.
 */

export type Mood = "loud" | "chill" | "learn" | "date" | "friends" | "free";

export const MOODS: { value: Mood; label: string }[] = [
  { value: "loud", label: "Loud" },
  { value: "chill", label: "Chill" },
  { value: "learn", label: "Learn something" },
  { value: "date", label: "Date night" },
  { value: "friends", label: "With friends" },
  { value: "free", label: "Free" },
];

const capacity = (e: TktEvent) => e.tiers.reduce((n, t) => n + t.capacity, 0);
const startHour = (e: TktEvent) => Number(f.time(e.start).split(":")[0]) % 12 + (f.time(e.start).endsWith("PM") ? 12 : 0);
const sameDay = (e: TktEvent) => f.dayKey(e.start) === f.dayKey(e.end);

/** Rules, in plain terms:
 *  loud     music for 300+ people, or any music starting 9 PM or later
 *  chill    150 or fewer people, or arts and wellness
 *  learn    workshops and talks
 *  date     food, or evening music for 300 or fewer, under ₱3,500 a ticket
 *  friends  comedy, or 200+ capacity events that sell 4+ tickets per order
 *  free     free events
 */
const RULES: Record<Mood, (e: TktEvent) => boolean> = {
  loud: (e) => e.category === "Music" && (capacity(e) >= 300 || startHour(e) >= 21),
  chill: (e) => capacity(e) <= 150 || e.category === "Arts" || e.category === "Wellness",
  learn: (e) => e.category === "Workshop" || e.category === "Talk",
  date: (e) => (e.category === "Food" || (e.category === "Music" && startHour(e) >= 18 && capacity(e) <= 300)) && lowestOpen(e) <= 350000,
  friends: (e) => e.category === "Comedy" || (capacity(e) >= 200 && e.tiers.some((t) => t.perOrderLimit >= 4)),
  free: (e) => isFree(e),
};

export function suggest(list: TktEvent[], mood: Mood, following: string[], n = 4) {
  return list
    .filter(RULES[mood])
    .sort((a, b) => popularity(b) - popularity(a))
    .slice(0, n)
    .map((e) => ({ event: e, reason: reasonFor(e, mood, following) }));
}

/** The most specific true thing we can say about this pick for this mood. */
export function reasonFor(e: TktEvent, mood: Mood, following: string[]): string {
  const host = hostById(e.hostId);
  if (host && following.includes(host.id)) return `Because you follow ${host.name}`;
  const cap = capacity(e);
  const ends = sameDay(e) ? `Doors ${f.time(e.start)}, ends by ${f.time(e.end)}` : `${f.dayShort(e.start)} to ${f.dayShort(e.end)}`;
  switch (mood) {
    case "free":
      return "Free, RSVP only";
    case "loud":
      return cap >= 300 ? `Big room · ${f.count(cap)} capacity` : `Starts ${f.time(e.start)}`;
    case "chill":
      return cap <= 150 ? `Small room · ${f.count(cap)} spots` : ends;
    case "learn":
      return e.format === "online" ? "Online, join from anywhere" : `Hands-on · ${f.count(cap)} seats`;
    case "date":
      return ends;
    case "friends": {
      const max = Math.max(...e.tiers.map((t) => t.perOrderLimit));
      return `Book up to ${max} tickets together`;
    }
  }
}

export function popularThisWeek(e: TktEvent): boolean {
  return popularity(e) >= 80;
}
