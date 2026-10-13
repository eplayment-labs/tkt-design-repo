"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Ban, CalendarPlus, Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar, EndState, Photo, Slot, Status } from "@/components/ui/primitives";
import { useStore } from "@/features/store";
import { Num } from "@/components/ui/number";
import { initialFollowing } from "@/mocks/people";
import { useAllEvents } from "@/features/events";
import { accentVars } from "@/lib/accent";
import { eventState, hasWaitlist, isFree, remaining, whereLabel, type EventState } from "@/lib/event";
import * as f from "@/lib/format";
import { downloadIcs } from "@/lib/ics";
import type { Host, Tier, TktEvent } from "@/mocks/types";
import { DateBlock, EventCard } from "./event-card";
import { lowestOpen, tierNow } from "./pricing";
import { Heading } from "./ui";

type Props = {
  event: TktEvent;
  host?: Host;
  /** Wizard phone preview: 375px container, no sticky bars, nothing interactive. */
  preview?: boolean;
  /** Opens ticket select, optionally with a tier preselected. */
  onGetTickets?: (tierId?: string) => void;
  /** Desktop only: replaces the info panel content (ticket select in place). */
  panel?: ReactNode;
};

/**
 * Shared layout classes so the skeleton matches the real page exactly.
 * Phone: inset rounded hero, white panel overlapping it by 48px.
 * Desktop: a 7/5 split inside the content container, hero row then body row.
 */
const L = {
  heroWrap: "relative isolate overflow-hidden px-3 pt-3 pb-8 lg:px-0 lg:pt-8 lg:pb-12",
  row: "lg:mx-auto lg:grid lg:w-full lg:max-w-[var(--read-max)] lg:grid-cols-12 lg:gap-6 lg:px-[var(--gutter)]",
  cover: "card-photo aspect-[4/5] rounded-lg lg:col-span-7 lg:aspect-[5/4]",
  panel: "relative -mt-12 flex flex-col gap-6 rounded-lg bg-surface-raised p-4 lg:col-span-5 lg:mt-0 lg:self-start lg:p-8",
  left: "flex flex-col gap-12 lg:col-span-7",
  right: "mt-12 flex flex-col gap-3 lg:sticky lg:top-[calc(var(--bar-height)_+_var(--space-6))] lg:col-span-5 lg:mt-0 lg:self-start lg:gap-6",
};

/** In preview, strip every `lg:` class: the frame is 375px no matter the viewport. */
const only = (preview: boolean | undefined, cls: string) => (preview ? cls.split(" ").filter((c) => !c.startsWith("lg:")).join(" ") : cls);

export function EventPageView({ event, host, preview, onGetTickets, panel }: Props) {
  const state = eventState(event);
  const o = (cls: string) => only(preview, cls);
  const pad = preview ? "px-4" : "gutter";

  return (
    <div className="event-scope" style={accentVars(event.accent)} inert={preview || undefined}>
      {/* Hero row: the photo glow sits behind it (DESIGN_PLAN §0). */}
      <div className={o(L.heroWrap)}>
        {/* Fades out at the bottom so the glow never ends in a hard edge. */}
        <span className="glow" aria-hidden style={{ maskImage: "linear-gradient(to bottom, #000 55%, transparent 90%)", WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent 90%)" }}>
          <Photo src={event.cover.url} alt="" sizes="50vw" position={event.cover.position} />
        </span>
        <div className={o(L.row)}>
          <div className={o(L.cover)}>
            <DateBlock iso={event.start} className="absolute top-3 left-3 z-10" />
            <Photo src={event.cover.url} alt={event.cover.alt} sizes={preview ? "375px" : "(min-width: 1024px) 58vw, 100vw"} position={event.cover.position} priority={!preview} />
          </div>
          <aside className={o(L.panel)} style={{ boxShadow: "var(--shadow-overlay)" }}>
            {panel ?? <InfoPanel event={event} host={host} state={state} preview={preview} onGetTickets={onGetTickets} />}
          </aside>
        </div>
      </div>

      {/* Body row: content left, host + venue cards right. */}
      <div className={`${o(L.row)} ${pad} pb-32 lg:pb-24`}>
        <div className={o(L.left)}>
          {state === "ended" && <MoreFromHost event={event} host={host} preview={preview} />}
          {event.gallery.length > 1 && <Gallery event={event} />}
          <section aria-labelledby="about" className="flex flex-col gap-4">
            <Heading id="about">About</Heading>
            <div className="flex max-w-[65ch] flex-col gap-4 text-base text-text-secondary">
              {event.description.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </section>
          <TierList event={event} state={state} onPick={(id) => onGetTickets?.(id)} />
          {event.faq.length > 0 && <Faq event={event} />}
        </div>
        <div className={o(L.right)}>
          {host && <HostCard host={host} />}
          <Where event={event} />
          <ShareRow event={event} state={state} />
        </div>
      </div>

      {!preview && <StickyBar event={event} state={state} onGetTickets={onGetTickets} />}
    </div>
  );
}

/* ---------- Info panel ---------- */

function InfoPanel({
  event,
  host,
  state,
  preview,
  onGetTickets,
}: {
  event: TktEvent;
  host?: Host;
  state: EventState;
  preview?: boolean;
  onGetTickets?: (tierId?: string) => void;
}) {
  return (
    <>
      <h1 className={preview ? "text-4xl leading-none font-extrabold tracking-tight" : "display"}>{event.title}</h1>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="tint flex flex-col gap-1 rounded-sm p-3">
          <dt className="text-xs font-semibold tracking-wide text-text-secondary uppercase">When</dt>
          <dd className="font-semibold tabular-nums">{f.dayShort(event.start)}</dd>
          <dd className="text-text-secondary tabular-nums">{f.eventWhen(event.start, event.end).split(" · ")[1] ?? f.time(event.start)}</dd>
        </div>
        <div className="tint flex min-w-0 flex-col gap-1 rounded-sm p-3">
          <dt className="text-xs font-semibold tracking-wide text-text-secondary uppercase">Where</dt>
          <dd className="font-semibold">{whereLabel(event)}</dd>
          <dd className="text-text-secondary">{event.format === "online" ? "Link arrives with your ticket" : event.city}</dd>
        </div>
      </dl>
      {host && (
        <Link href={`/h/${host.handle}`} className="flex min-h-11 items-center gap-3 self-start rounded-pill text-sm">
          <Avatar src={host.avatar} name={host.name} size={32} />
          <span>
            Hosted by <span className="font-semibold">{host.name}</span>
          </span>
        </Link>
      )}
      <PanelState event={event} state={state} preview={preview} onGetTickets={onGetTickets} />
    </>
  );
}

function PanelState({
  event,
  state,
  preview,
  onGetTickets,
}: {
  event: TktEvent;
  state: EventState;
  preview?: boolean;
  onGetTickets?: (tierId?: string) => void;
}) {
  // The CTA lives in the sticky bar on mobile; on desktop it sits in the panel.
  const cta = preview ? "hidden" : "hidden lg:block";
  if (state === "canceled") {
    return (
      <div className="flex flex-col gap-2 rounded-sm bg-danger-subtle p-4">
        <Status tone="danger" icon={<Ban size={14} aria-hidden />}>
          Canceled
        </Status>
        <p className="text-sm text-text-secondary">
          The host canceled this event. If you bought tickets, you&apos;ll get a full refund to the payment method you used.
        </p>
      </div>
    );
  }
  if (state === "ended") {
    return (
      <div className="flex flex-col gap-1">
        <Status>This event has ended</Status>
        <a href="#more" className="text-sm text-event-text underline underline-offset-4">
          See what&apos;s next from this host
        </a>
      </div>
    );
  }
  if (state === "sold-out") {
    return (
      <div className="flex flex-col gap-4">
        <Status tone="danger" icon={<Ban size={14} aria-hidden />}>
          Sold out
        </Status>
        {hasWaitlist(event) && (
          <div className={cta}>
            <Button variant="event" size="lg" fullWidth onClick={() => onGetTickets?.()}>
              Join waitlist
            </Button>
          </div>
        )}
      </div>
    );
  }
  if (state === "sales-closed") return <Status>Sales closed</Status>;
  return (
    <div className="flex flex-col gap-4">
      <p className="text-lg font-semibold">
        {isFree(event) ? (
          "Free"
        ) : (
          <>
            From <span className="num">{f.price(lowestOpen(event))}</span>
          </>
        )}
      </p>
      <div className={cta}>
        <Button variant="event" size="lg" fullWidth onClick={() => onGetTickets?.()}>
          {isFree(event) ? "RSVP" : "Get tickets"}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Body: left column ---------- */

function Gallery({ event }: { event: TktEvent }) {
  return (
    <section aria-label="Photos">
      <ul className="grid grid-cols-3 gap-3">
        {event.gallery.slice(0, 3).map((p) => (
          <li key={p.id} className="relative aspect-square overflow-hidden rounded-inner bg-surface-sunken">
            <Photo src={p.url} alt={p.alt} sizes="(min-width: 1024px) 20vw, 33vw" position={p.position} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function tierNote(t: Tier, s: ReturnType<typeof tierNow>): ReactNode {
  if (s === "sold-out")
    return (
      <span className="flex flex-wrap items-center gap-x-2">
        <Status tone="danger" icon={<Ban size={14} aria-hidden />}>
          Sold out
        </Status>
        {t.waitlist && <span className="text-sm text-text-secondary">Waitlist open</span>}
      </span>
    );
  if (s === "sales-closed") return <Status>Sales closed</Status>;
  if (s === "low")
    return (
      <Status tone="warning">
        <span className="num">{f.count(remaining(t))} left</span>
      </Status>
    );
  return (
    <span className="text-sm text-text-secondary">
      Sales end <span className="num">{f.date(t.salesEnd)}</span>
    </span>
  );
}

function TierList({ event, state, onPick }: { event: TktEvent; state: EventState; onPick: (tierId: string) => void }) {
  const unlocked = useStore((s) => s.unlocked);
  const tiers = event.tiers.filter((t) => tierNow(t, unlocked) !== "hidden");
  const inactive = state === "ended" || state === "canceled";
  return (
    <section aria-labelledby="tiers" className="flex flex-col gap-4">
      <Heading id="tiers">Tickets</Heading>
      <ul className="flex flex-col gap-3">
        {tiers.map((t) => {
          const s = tierNow(t, unlocked);
          const content = (
            <>
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-base font-bold">{t.name}</span>
                {t.description && <span className="text-sm text-text-secondary">{t.description}</span>}
                {!inactive && tierNote(t, s)}
              </span>
              <span className="num text-lg font-bold">{f.price(t.price)}</span>
            </>
          );
          return (
            <li key={t.id}>
              {inactive ? (
                <div className="tint flex items-start justify-between gap-4 rounded-lg p-4">{content}</div>
              ) : (
                <button
                  type="button"
                  onClick={() => onPick(t.id)}
                  className="tint flex min-h-11 w-full items-start justify-between gap-4 rounded-lg p-4 text-left outline-2 -outline-offset-2 outline-transparent transition-[outline-color] duration-150 hover:outline-[var(--event-accent)]"
                >
                  {content}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className="text-sm text-text-secondary">{event.refundPolicy}</p>
    </section>
  );
}

function Faq({ event }: { event: TktEvent }) {
  return (
    <section aria-labelledby="faq" className="flex flex-col gap-4">
      <Heading id="faq">FAQ</Heading>
      <div className="flex flex-col gap-3">
        {event.faq.map((q) => (
          <details key={q.q} className="group rounded-lg border border-border-subtle bg-surface-raised">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-base font-semibold [&::-webkit-details-marker]:hidden">
              {q.q}
              <span aria-hidden className="text-text-secondary group-open:hidden">+</span>
              <span aria-hidden className="hidden text-text-secondary group-open:inline">−</span>
            </summary>
            <p className="px-4 pb-4 text-sm text-text-secondary">{q.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function MoreFromHost({ event, host, preview }: { event: TktEvent; host?: Host; preview?: boolean }) {
  const all = useAllEvents();
  const next = all
    .filter((e) => e.hostId === event.hostId && e.id !== event.id && e.visibility === "public")
    .filter((e) => {
      const s = eventState(e);
      return s !== "ended" && s !== "canceled" && s !== "draft";
    })
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, 3);
  return (
    <section id="more" aria-labelledby="more-title" className="flex scroll-mt-24 flex-col gap-4">
      <Heading id="more-title">Next from {host?.name ?? "this host"}</Heading>
      {next.length ? (
        <div className={`grid grid-cols-2 gap-3 ${preview ? "" : "md:grid-cols-3 md:gap-6"}`}>
          {next.map((e) => (
            <EventCard key={e.id} event={e} sizes="(min-width: 768px) 20vw, 50vw" />
          ))}
        </div>
      ) : (
        <EndState className="py-0" title="Nothing new from this host yet" body="Follow them to see new events first." actions={<ButtonLink href="/discover" variant="secondary">Find events</ButtonLink>} />
      )}
    </section>
  );
}

/* ---------- Body: right column cards ---------- */

/**
 * Follow pill (DESIGN_PLAN §000.1). Both labels share one grid cell, so the
 * pill's width never changes; the labels cross-fade and a check appears.
 */
export function FollowButton({ hostId, name }: { hostId: string; name: string }) {
  const following = useStore((s) => s.following.includes(hostId));
  const toggle = useStore((s) => s.toggleFollow);
  return (
    <Button
      variant={following ? "secondary" : "primary"}
      aria-pressed={following}
      aria-label={following ? `Following ${name}` : `Follow ${name}`}
      className="active:scale-[0.97]"
      onClick={() => {
        toggle(hostId);
        toast(following ? `Unfollowed ${name}` : `Following ${name}`);
      }}
    >
      <span className="grid" aria-hidden>
        <span className={`col-start-1 row-start-1 transition-opacity duration-150 ${following ? "opacity-0" : "opacity-100"}`}>Follow</span>
        <span className={`col-start-1 row-start-1 inline-flex items-center gap-1 transition-opacity duration-150 ${following ? "opacity-100" : "opacity-0"}`}>
          <Check size={16} aria-hidden /> Following
        </span>
      </span>
    </Button>
  );
}

/** Follower count that ticks ±1 with the fan's own follow. */
export function FollowerCount({ host, className = "" }: { host: Host; className?: string }) {
  const following = useStore((s) => s.following.includes(host.id));
  // Mock counts already include the fan's starting follows.
  const n = host.followers + (following ? 1 : 0) - (initialFollowing.includes(host.id) ? 1 : 0);
  return (
    <span className={className}>
      <Num value={n} /> {n === 1 ? "follower" : "followers"}
    </span>
  );
}

function HostCard({ host }: { host: Host }) {
  return (
    <section aria-labelledby="host" className="tint flex flex-col gap-4 rounded-lg p-4 lg:p-6">
      <h2 id="host" className="text-sm font-semibold text-text-secondary">
        Host
      </h2>
      <div className="flex items-center justify-between gap-4">
        <Link href={`/h/${host.handle}`} className="flex min-w-0 items-center gap-3 rounded-pill">
          <Avatar src={host.avatar} name={host.name} size={48} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-lg font-extrabold tracking-tight">{host.name}</span>
            <FollowerCount host={host} className="text-sm text-text-secondary" />
          </span>
        </Link>
        <FollowButton hostId={host.id} name={host.name} />
      </div>
      <p className="text-sm text-text-secondary">{host.bio}</p>
    </section>
  );
}

function Where({ event }: { event: TktEvent }) {
  const online = event.format !== "in-person";
  return (
    <section aria-labelledby="where" className="tint flex flex-col gap-3 rounded-lg p-4 lg:p-6">
      <h2 id="where" className="text-sm font-semibold text-text-secondary">
        {event.format === "online" ? "Online" : "Venue"}
      </h2>
      {event.venue && event.format !== "online" && (
        <div className="flex flex-col gap-1">
          <span className="text-lg font-extrabold tracking-tight">{event.venue.name}</span>
          <span className="text-sm text-text-secondary">{event.venue.address}</span>
          {/* TODO: real map embed. Placeholder only, no fake map image. */}
          <span className="mt-2 flex min-h-24 items-center justify-center rounded-inner bg-surface-raised text-sm text-text-secondary">Map coming soon</span>
        </div>
      )}
      {online && (
        <div className="flex flex-col gap-1">
          <span className="text-base font-bold">{event.format === "hybrid" ? "Also streaming online" : "Join online"}</span>
          <span className="text-sm text-text-secondary">{event.onlineNote ?? "The link arrives with your ticket."}</span>
        </div>
      )}
    </section>
  );
}

function ShareRow({ event, state }: { event: TktEvent; state: EventState }) {
  const share = async () => {
    const url = `${window.location.origin}/e/${event.slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: event.title, url });
      } catch {
        // Dismissed share sheet.
      }
      return;
    }
    await navigator.clipboard?.writeText(url);
    toast("Copied the event link");
  };
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" iconLeft={<Share2 size={16} aria-hidden />} onClick={share}>
        Share
      </Button>
      {state !== "canceled" && state !== "ended" && (
        <Button variant="secondary" iconLeft={<CalendarPlus size={16} aria-hidden />} onClick={() => downloadIcs(event)}>
          Add to calendar
        </Button>
      )}
    </div>
  );
}

/* ---------- Mobile sticky CTA bar ---------- */

function StickyBar({ event, state, onGetTickets }: { event: TktEvent; state: EventState; onGetTickets?: (tierId?: string) => void }) {
  if (state === "ended") return null;
  let left: ReactNode;
  let action: ReactNode = null;
  if (state === "canceled") {
    left = (
      <Status tone="danger" icon={<Ban size={14} aria-hidden />}>
        Canceled
      </Status>
    );
  } else if (state === "sold-out") {
    left = (
      <Status tone="danger" icon={<Ban size={14} aria-hidden />}>
        Sold out
      </Status>
    );
    if (hasWaitlist(event))
      action = (
        <Button variant="event" size="lg" onClick={() => onGetTickets?.()}>
          Join waitlist
        </Button>
      );
  } else if (state === "sales-closed") {
    left = <Status>Sales closed</Status>;
  } else {
    left = (
      <span className="flex flex-col">
        <span className="text-sm text-text-secondary">{isFree(event) ? "Price" : "From"}</span>
        <span className="num text-base font-bold">{f.price(lowestOpen(event))}</span>
      </span>
    );
    action = (
      <Button variant="event" size="lg" onClick={() => onGetTickets?.()}>
        {isFree(event) ? "RSVP" : "Get tickets"}
      </Button>
    );
  }
  return (
    <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 bg-surface-raised lg:hidden" style={{ boxShadow: "var(--shadow-overlay)" }}>
      <div className="gutter flex items-center justify-between gap-4 py-2" style={{ minHeight: "var(--bar-height)" }}>
        {left}
        {action}
      </div>
    </div>
  );
}

/* ---------- Skeleton: the real layout, values as slots ---------- */

export function EventPageSkeleton() {
  return (
    <div aria-busy>
      <span className="sr-only">Loading event</span>
      <div className={L.heroWrap}>
        <div className={L.row}>
          <div className={L.cover} />
          <div className={L.panel} style={{ boxShadow: "var(--shadow-overlay)" }}>
            <div className="display">
              <Slot w="80%" h="0.9em" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-sm bg-surface-sunken p-3 text-xs font-semibold tracking-wide text-text-secondary uppercase">When</div>
              <div className="rounded-sm bg-surface-sunken p-3 text-xs font-semibold tracking-wide text-text-secondary uppercase">Where</div>
            </div>
            <p className="text-lg">
              From <Slot w="6rem" />
            </p>
          </div>
        </div>
      </div>
      <div className={`${L.row} gutter`}>
        <div className={L.left}>
          <section className="flex flex-col gap-4">
            <Heading>About</Heading>
            <div className="flex flex-col gap-2">
              <Slot w="100%" />
              <Slot w="92%" />
              <Slot w="60%" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
