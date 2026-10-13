"use client";

import { usePublicEvents } from "@/features/events";
import { useStore } from "@/features/store";
import { events as allMock } from "@/mocks/events";
import { hosts } from "@/mocks/hosts";
import { fanTickets } from "@/mocks/people";
import { CITIES, live, popularity, sortEvents, withinDays } from "../catalog";
import { Cities, type CityRow } from "./cities";
import { Creators, type Creator } from "./creators";
import { ForHosts } from "./for-hosts";
import { Hero } from "./hero";
import { Moods } from "./moods";
import { TicketMoment } from "./ticket-moment";
import { TimeReel } from "./time-reel";
import { PosterWall } from "./poster-wall";
import type { Photo as PhotoT } from "@/mocks/types";
import { suggest } from "../suggest";

/** The landing page (DESIGN_PLAN §000): one job per section, read top to bottom like a story. */
export function Landing() {
  const list = live(usePublicEvents());
  const following = useStore((s) => s.following);
  const thisWeek = withinDays(list, 7);
  const cities = new Set(thisWeek.filter((e) => e.city !== "Online").map((e) => e.city));

  const featured = list.filter((e) => e.featured).slice(0, 5);
  const covers = featured.length ? featured : list.slice(0, 5);
  const heroIds = new Set(covers.map((e) => e.id));

  // Photos already on screen above the creators: hero covers and the default mood picks.
  const seen = new Set([...covers, ...suggest(list, "loud", following).map((p) => p.event)].map((e) => e.cover.id));

  const creators: Creator[] = hosts
    .map((host) => {
      const events = list.filter((e) => e.hostId === host.id);
      const lead = events.find((e) => !seen.has(e.cover.id)) ?? events[0];
      // Prefer a photo nobody has seen yet: covers first, then the events' galleries.
      const photo = [...events.map((e) => e.cover), ...events.flatMap((e) => e.gallery)].find((ph) => !seen.has(ph.id)) ?? lead.cover;
      return { host, events, lead, photo };
    })
    .filter((c) => c.events.length >= 2)
    .sort((a, b) => popularity(b.events[0]) - popularity(a.events[0]))
    .slice(0, 3);

  const cityRows: CityRow[] = CITIES.map((city) => {
    const inCity = list.filter((e) => e.city === city);
    return { city, count: inCity.length, cover: sortEvents(inCity, "popular")[0]?.cover };
  }).filter((r) => r.count > 0);

  // Poster wall: distinct photos; the hero's first image is never in the first row (pushed last).
  const wall: PhotoT[] = [];
  const firstHero = covers[0]?.cover.id;
  for (const ph of [...list.map((e) => e.cover), ...list.flatMap((e) => e.gallery)]) {
    if (ph.id !== firstHero && !wall.some((w) => w.id === ph.id)) wall.push(ph);
  }
  if (covers[0]) wall.push(covers[0].cover);

  const ticketEvent = allMock.find((e) => e.id === "e1")!;
  const sampleTicket = fanTickets.find((t) => t.eventId === "e1")!;

  return (
    <>
      <Hero covers={covers} week={thisWeek.length} cities={cities.size} />
      <PosterWall photos={wall} />
      <TimeReel list={list} skip={heroIds} />
      <Moods list={list} />
      <Creators creators={creators} />
      <TicketMoment event={ticketEvent} ticket={sampleTicket} />
      <Cities rows={cityRows} />
      <ForHosts />
    </>
  );
}
