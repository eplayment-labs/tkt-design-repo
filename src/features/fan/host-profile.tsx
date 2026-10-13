"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar, EndState, ErrorState } from "@/components/ui/primitives";
import { useDemoState, usePublicEvents } from "@/features/events";
import { useStore } from "@/features/store";
import { eventState } from "@/lib/event";
import * as f from "@/lib/format";
import { hostByHandle } from "@/mocks/hosts";
import { EventCard, EventCardSkeleton } from "./event-card";
import { FollowButton } from "./event-page";
import { upcomingFor } from "./following";
import { useDelayedFlag } from "./hooks";
import { Heading } from "./ui";

export function HostProfile({ handle }: { handle: string }) {
  const router = useRouter();
  const demo = useDemoState();
  const base = hostByHandle(handle);
  const override = useStore((s) => (base && s.hostId === base.id ? s.hostProfile : undefined));
  const events = usePublicEvents();
  const showSkeleton = useDelayedFlag(demo === "loading");

  if (demo === "error") {
    return (
      <div className="content">
        <ErrorState title="This profile didn't load" actions={<Button onClick={() => router.replace(`/h/${handle}`)}>Try again</Button>} />
      </div>
    );
  }
  if (!base) {
    return (
      <div className="content">
        <EndState title="We couldn't find that host" body="The link may be wrong, or the host changed their handle." actions={<ButtonLink href="/discover">Find events</ButtonLink>} />
      </div>
    );
  }
  const host = { ...base, ...override };
  const loading = demo === "loading";
  const upcoming = demo === "empty" ? [] : upcomingFor(events, host.id);
  const past = demo === "empty" ? [] : events.filter((e) => e.hostId === host.id && eventState(e) === "ended").sort((a, b) => b.start.localeCompare(a.start));

  return (
    <div className="content flex flex-col gap-12 py-6 lg:py-12">
      <header className="flex flex-col items-start gap-4 rounded-lg border border-border-subtle bg-surface-raised p-4 md:flex-row md:items-center md:gap-8 md:p-8">
        <Avatar src={host.avatar} name={host.name} size={128} />
        <div className="flex flex-1 flex-col gap-2">
          <h1 className="display">{host.name}</h1>
          <p className="num text-sm text-text-secondary">
            @{host.handle} · {f.plural(host.followers, "follower")}
          </p>
          <p className="max-w-[60ch] text-base text-text-secondary">{host.bio}</p>
        </div>
        <FollowButton hostId={host.id} name={host.name} />
      </header>

      <section aria-labelledby="upcoming" className="flex flex-col gap-4">
        <Heading id="upcoming">Upcoming</Heading>
        {loading ? (
          showSkeleton ? (
            <div aria-busy className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
              {[0, 1, 2, 3].map((i) => (
                <EventCardSkeleton key={i} />
              ))}
            </div>
          ) : null
        ) : upcoming.length ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6">
            {upcoming.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        ) : (
          <EndState className="py-0" title="No upcoming events" body={`Follow ${host.name} to hear about the next one.`} actions={<ButtonLink href="/discover" variant="secondary">Find events</ButtonLink>} />
        )}
      </section>

      {!loading && past.length > 0 && (
        <section aria-labelledby="past" className="flex flex-col gap-4">
          <Heading id="past">Past</Heading>
          <ul className="flex flex-col rounded-lg border border-border-subtle bg-surface-raised px-4 md:px-6">
            {past.map((e) => (
              <li key={e.id} className="border-b border-border-subtle last:border-0">
                <Link href={`/e/${e.slug}`} className="flex min-h-11 items-baseline gap-6 py-3 hover:underline hover:underline-offset-4">
                  <span className="num w-24 shrink-0 text-sm text-text-secondary">{f.date(e.start)}</span>
                  <span className="text-base font-bold">{e.title}</span>
                  <span className="ml-auto hidden text-sm text-text-secondary sm:inline">{e.city}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
