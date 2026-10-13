"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Tabs } from "@/components/ui/controls";
import { EndState, Photo, Slot } from "@/components/ui/primitives";
import { useHydrated } from "@/components/providers";
import { useDemoState } from "@/features/events";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";
import { CapacityBar, Delayed, EventStatus, RetryError, useHostEvents, useNow } from "./shared";

type Tab = "drafts" | "live" | "past";

function bucket(e: TktEvent, now: number): Tab {
  if (e.status === "draft") return "drafts";
  if (e.status === "live" && new Date(e.end).getTime() >= now) return "live";
  return "past";
}

const emptyCopy: Record<Tab, { title: string; body: string }> = {
  drafts: { title: "No drafts", body: "Events you start but don't publish wait here." },
  live: { title: "No live events", body: "Publish an event and it shows up here." },
  past: { title: "No past events yet", body: "Ended and canceled events move here." },
};

function Header() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <h1 className="text-4xl font-extrabold tracking-(--tracking-display)">Events</h1>
      <ButtonLink href="/host/events/new" iconLeft={<Plus size={18} aria-hidden />}>
        Create event
      </ButtonLink>
    </div>
  );
}

const grid = "grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-6 xl:grid-cols-3";

function EventCard({ event, now }: { event: TktEvent; now: number }) {
  const href = event.status === "draft" ? `/host/events/new?draft=${event.id}` : `/host/events/${event.id}`;
  return (
    <li>
      {/* Showcase (§00): image-first card, text below, no tinted frame. */}
      <Link href={href} className="group flex h-full flex-col gap-3 rounded-lg">
        <span className="relative aspect-video overflow-hidden rounded-lg bg-surface-sunken">
          <Photo
            src={event.cover.url}
            alt=""
            sizes="(min-width: 1280px) 400px, (min-width: 768px) 50vw, 100vw"
            position={event.cover.position}
            className="transition-transform duration-250 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
          {event.status === "draft" && <span className="sticker">Draft</span>}
        </span>
        <span className="flex flex-1 flex-col gap-3">
          <span className="flex flex-col gap-1">
            <span className="text-lg font-bold">{event.title}</span>
            <span className="num text-sm text-text-secondary">{f.date(event.start)}</span>
          </span>
          <EventStatus event={event} now={now} />
          <CapacityBar event={event} className="mt-auto" />
        </span>
      </Link>
    </li>
  );
}

function Skeleton() {
  return (
    <ul aria-busy="true" aria-label="Loading events" className={grid}>
      {Array.from({ length: 3 }, (_, i) => (
        <li key={i} className="flex flex-col gap-3">
          <span className="aspect-video rounded-lg bg-surface-sunken" />
          <span className="flex flex-col gap-3">
            <Slot w="10rem" h="1.25rem" />
            <Slot w="6rem" />
            <Slot w="100%" h="0.5rem" />
          </span>
        </li>
      ))}
    </ul>
  );
}

export function EventsList() {
  const demo = useDemoState();
  const hydrated = useHydrated();
  const now = useNow();
  const events = useHostEvents();
  const [tab, setTab] = useState<Tab>("live");

  const ready = hydrated && now !== null && demo !== "loading";
  const groups: Record<Tab, TktEvent[]> = { drafts: [], live: [], past: [] };
  if (now !== null && demo !== "empty") {
    for (const e of events) groups[bucket(e, now)].push(e);
    groups.live.sort((a, b) => a.start.localeCompare(b.start));
    groups.past.sort((a, b) => b.start.localeCompare(a.start));
  }
  const rows = groups[tab];

  return (
    <div className="content flex flex-col gap-8 py-8">
      <Header />
      <Tabs
        label="Event status"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "drafts", label: "Drafts", count: ready ? groups.drafts.length : undefined },
          { value: "live", label: "Live", count: ready ? groups.live.length : undefined },
          { value: "past", label: "Past", count: ready ? groups.past.length : undefined },
        ]}
      />
      <div role="tabpanel">
        {demo === "error" ? (
          <RetryError title="Events didn't load" />
        ) : !ready ? (
          <Delayed>
            <Skeleton />
          </Delayed>
        ) : rows.length === 0 ? (
          <EndState
            title={emptyCopy[tab].title}
            body={emptyCopy[tab].body}
            actions={<ButtonLink href="/host/events/new">Create event</ButtonLink>}
          />
        ) : (
          <ul className={grid}>
            {rows.map((e) => (
              <EventCard key={e.id} event={e} now={now} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
