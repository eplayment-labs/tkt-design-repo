"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Marquee, Reveal } from "@/components/ui/effects";
import { EndState, ErrorState, Photo } from "@/components/ui/primitives";
import { useDemoState, usePublicEvents } from "@/features/events";
import { whereLabel } from "@/lib/event";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";
import { CATEGORIES, CITIES, calendar, inWhen, lastCallList, live, salesEndsAt, searchHref, sortEvents, statusPill, untilLabel } from "./catalog";
import { EventCard, EventCardSkeleton, PhotoPill, PriceText } from "./event-card";
import { HeroCarousel } from "./hero-carousel";
import { useDelayedFlag, useNow } from "./hooks";
import { SearchBlock } from "./search-box";
import { Heading } from "./ui";

const container = "w-full lg:mx-auto lg:max-w-[var(--content-max)] lg:px-[var(--gutter)]";

export function Home() {
  const router = useRouter();
  const demo = useDemoState();
  const all = usePublicEvents();
  const [shown, setShown] = useState(8);
  const showSkeleton = useDelayedFlag(demo === "loading");

  if (demo === "error") {
    return (
      <div className="content">
        <ErrorState title="Events didn't load" actions={<Button onClick={() => router.replace("/discover")}>Try again</Button>} />
      </div>
    );
  }
  if (demo === "loading") return showSkeleton ? <HomeSkeleton /> : null;

  const list = demo === "empty" ? [] : live(all);
  if (!list.length) {
    return (
      <div className="content">
        <EndState title="No events yet" body="New events show up here as hosts publish them." actions={<Button onClick={() => router.replace("/discover")}>Refresh</Button>} />
      </div>
    );
  }

  const cal = calendar();
  const featured = list.filter((e) => e.featured).slice(0, 6);
  const hero = featured.length ? featured : sortEvents(list, "popular").slice(0, 5);
  const trending = sortEvents(list, "popular").slice(0, 5);
  const weekend = list.filter((e) => inWhen(e, "weekend", cal)).slice(0, 8);
  const lastCall = lastCallList(list).slice(0, 4);
  const cities = CITIES.map((c) => {
    const inCity = list.filter((e) => e.city === c);
    const cover = sortEvents(inCity, "popular")[0]?.cover;
    return { city: c, count: inCity.length, cover };
  }).filter((c) => c.count > 0);

  return (
    <div className="flex flex-col gap-12 pb-16 md:gap-16">
      <h1 className="sr-only">Events and tickets</h1>

      <div className={`${container} lg:pt-6`}>
        <HeroCarousel events={hero} />
      </div>

      <div className="content -mt-4 md:-mt-8">
        <section aria-labelledby="find" className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-6">
          <h2 id="find" className="text-2xl font-extrabold tracking-tight md:text-4xl">
            Find your next night out
          </h2>
          <SearchBlock />
        </section>
      </div>

      <Reveal className="content">
        <section aria-labelledby="trending" className="flex flex-col gap-4">
          <Heading id="trending" aside={<SeeAll href="/search?sort=popular" label="See all" />}>
            Trending now
          </Heading>
          <ol className="scroll-x -mx-[var(--gutter)] flex snap-x snap-mandatory gap-3 px-[var(--gutter)] md:mx-0 md:grid md:grid-cols-5 md:gap-6 md:overflow-visible md:px-0">
            {trending.map((e, i) => (
              <li key={e.id} className="relative flex w-60 shrink-0 snap-start items-start gap-1 md:w-auto">
                <span aria-hidden className="display num w-10 shrink-0 text-right text-text-tertiary md:w-auto">
                  {i + 1}
                </span>
                <span className="sr-only">Number {i + 1}:</span>
                <div className="min-w-0 flex-1">
                  <EventCard tilt event={e} ratio="portrait" showTime={false} sizes="(min-width: 768px) 18vw, 200px" />
                </div>
              </li>
            ))}
          </ol>
        </section>
      </Reveal>

      <Reveal>
        <section aria-label="Browse by category and city" className="flex flex-col gap-3">
          <Marquee duration={50}>
            {CATEGORIES.map((c) => (
              <PillLink key={c} href={searchHref({ cat: c })}>
                {c}
              </PillLink>
            ))}
          </Marquee>
          <Marquee duration={50} reverse>
            {CITIES.map((c) => (
              <PillLink key={c} href={searchHref({ city: c })}>
                {c === "Online" ? "Online events" : `Events in ${c}`}
              </PillLink>
            ))}
          </Marquee>
        </section>
      </Reveal>

      {weekend.length > 0 && (
        <Reveal className="content">
          <section aria-labelledby="weekend" className="flex flex-col gap-4">
            <Heading id="weekend" aside={<SeeAll href={searchHref({ when: "weekend" })} label="See all" />}>
              This weekend
            </Heading>
            <CardGrid events={weekend} />
          </section>
        </Reveal>
      )}

      {lastCall.length > 0 && (
        <Reveal className="content">
          <section aria-labelledby="last-call" className="flex flex-col gap-4">
            <Heading id="last-call">Last call</Heading>
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 2xl:grid-cols-4">
              {lastCall.map((e) => (
                <li key={e.id}>
                  <LastCallCard event={e} />
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      <Reveal className="content">
        <section aria-labelledby="upcoming" className="flex flex-col gap-4">
          <Heading id="upcoming" aside={<SeeAll href="/search" label="See all events" />}>
            Upcoming events
          </Heading>
          <CardGrid events={list.slice(0, shown)} />
          {shown < list.length && (
            <Button variant="secondary" size="lg" className="self-center" onClick={() => setShown((n) => n + 8)}>
              Load more
            </Button>
          )}
        </section>
      </Reveal>

      <Reveal className="content">
        <section aria-labelledby="cities" className="flex flex-col gap-4">
          <Heading id="cities">Browse by city</Heading>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-5 md:gap-6">
            {cities.map((c, i) => (
              <li key={c.city} className={i === 0 ? "col-span-2 md:col-span-1" : ""}>
                <Link href={searchHref({ city: c.city })} className="group relative block overflow-hidden rounded-lg bg-surface-sunken">
                  <div className={`relative ${i === 0 ? "aspect-[2/1] md:aspect-[3/4]" : "aspect-[3/4]"}`}>
                    {c.cover && (
                      <Photo
                        src={c.cover.url}
                        alt=""
                        sizes="(min-width: 768px) 20vw, 50vw"
                        position={c.cover.position}
                        className="transition-transform duration-250 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.04]"
                      />
                    )}
                  </div>
                  {/* Solid label, no scrim: readable on any photo in either theme. */}
                  <span className="absolute bottom-3 left-3 flex flex-col rounded-sm bg-[var(--gray-0)] px-3 py-2 text-[var(--gray-ink)]">
                    <span className="font-display text-lg leading-tight font-extrabold">{c.city}</span>
                    <span className="num text-xs font-medium">{f.plural(c.count, "event")}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </Reveal>
    </div>
  );
}

export function CardGrid({ events, cols = 4 }: { events: TktEvent[]; cols?: 3 | 4 }) {
  return (
    <ul className={`grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-6 md:gap-y-12 ${cols === 4 ? "md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" : "md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"}`}>
      {events.map((e) => (
        <li key={e.id}>
          <EventCard tilt event={e} sizes={cols === 4 ? "(min-width: 1536px) 17vw, (min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw" : "(min-width: 1280px) 25vw, (min-width: 1024px) 30vw, 50vw"} />
        </li>
      ))}
    </ul>
  );
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="flex min-h-11 shrink-0 items-center gap-1 rounded-pill text-sm font-semibold hover:underline hover:underline-offset-4">
      {label} <ArrowRight size={16} aria-hidden />
    </Link>
  );
}

function PillLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="inline-flex h-11 items-center rounded-pill border border-border-default px-5 text-sm font-semibold whitespace-nowrap transition-colors duration-150 hover:bg-surface-sunken"
    >
      {children}
    </Link>
  );
}

function LastCallCard({ event }: { event: TktEvent }) {
  const now = useNow();
  const end = salesEndsAt(event);
  const pill = statusPill(event);
  return (
    <Link href={`/e/${event.slug}`} className="group flex h-full gap-4 rounded-lg border border-border-subtle p-3 transition-colors duration-150 hover:border-border-strong">
      <div className="relative aspect-[4/3] w-32 shrink-0 overflow-hidden rounded-sm bg-surface-sunken md:w-48">
        <Photo src={event.cover.url} alt="" sizes="192px" position={event.cover.position} className="transition-transform duration-250 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.04]" />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-1">
        <h3 className="font-display line-clamp-2 text-lg leading-tight font-extrabold tracking-tight group-hover:underline group-hover:underline-offset-4">{event.title}</h3>
        <p className="num truncate text-sm text-text-secondary">
          {f.dayShort(event.start)} · {whereLabel(event)}
        </p>
        <p className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-sm">
          {end !== null && now > 0 && (
            <span className="inline-flex items-center gap-1 font-semibold text-warning">
              <Clock size={14} aria-hidden />
              <span className="num">Sales end in {untilLabel(end - now)}</span>
            </span>
          )}
          {pill && pill.label === "Few left" && <PhotoPill pill={pill} className="border border-border-default" />}
        </p>
        <p className="text-sm">
          <PriceText event={event} />
        </p>
      </div>
    </Link>
  );
}

function HomeSkeleton() {
  return (
    <div aria-busy className="flex flex-col gap-12 pb-16">
      <span className="sr-only">Loading events</span>
      <div className={`${container} lg:pt-6`}>
        <div className="h-[70svh] min-h-96 bg-surface-sunken lg:h-[35rem] lg:rounded-lg" />
      </div>
      <div className="content">
        <ul className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {[0, 1, 2, 3].map((i) => (
            <li key={i}>
              <EventCardSkeleton />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

