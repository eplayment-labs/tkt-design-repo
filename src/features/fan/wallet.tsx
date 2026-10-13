"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, Repeat, Undo2, WifiOff } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Tabs } from "@/components/ui/controls";
import { EndState, ErrorState, Status } from "@/components/ui/primitives";
import { Ticket, TicketRow } from "@/components/ticket/ticket";
import { useHydrated } from "@/components/providers";
import { useAllEvents, useDemoState } from "@/features/events";
import { useStore } from "@/features/store";
import type { Ticket as TicketT, TktEvent } from "@/mocks/types";
import { useDelayedFlag, useNow, useOnline } from "./hooks";

type Entry = { ticket: TicketT; event: TktEvent };

export function Wallet() {
  const router = useRouter();
  const demo = useDemoState();
  const hydrated = useHydrated();
  const online = useOnline();
  const signedIn = useStore((s) => s.signedIn);
  const tickets = useStore((s) => s.tickets);
  const events = useAllEvents();
  const now = useNow();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const loading = !hydrated || demo === "loading";
  const showSkeleton = useDelayedFlag(loading);

  const entries: Entry[] = tickets.flatMap((t) => {
    const event = events.find((e) => e.id === t.eventId);
    return event ? [{ ticket: t, event }] : [];
  });
  const isPast = (e: TktEvent) => e.status === "ended" || (now > 0 && new Date(e.end).getTime() < now);
  const upcoming = demo === "empty" ? [] : entries.filter((x) => !isPast(x.event)).sort((a, b) => a.event.start.localeCompare(b.event.start));
  const past = demo === "empty" ? [] : entries.filter((x) => isPast(x.event)).sort((a, b) => b.event.start.localeCompare(a.event.start));
  const lead = upcoming.find((x) => x.ticket.status === "valid" || x.ticket.status === "refund-requested");
  const rest = upcoming.filter((x) => x !== lead);

  const header = (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl font-extrabold tracking-tight">My tickets</h1>
      {(!online || demo === "offline") && (
        <p className="flex items-center gap-2 text-sm text-text-secondary">
          <WifiOff size={16} aria-hidden /> Offline. Your tickets still work.
        </p>
      )}
      <Tabs
        label="Tickets"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "upcoming", label: "Upcoming", count: loading ? undefined : upcoming.length },
          { value: "past", label: "Past", count: loading ? undefined : past.length },
        ]}
      />
    </div>
  );

  if (hydrated && !signedIn) {
    return (
      <div className="content">
        <EndState title="Sign in to see your tickets" body="Your tickets and QR codes live here once you sign in." actions={<ButtonLink href="/login?next=/tickets">Sign in</ButtonLink>} />
      </div>
    );
  }

  let body;
  if (demo === "error") {
    body = <ErrorState title="Your tickets didn't load" body="Tickets you've opened before still work offline. Try again in a moment." actions={<Button onClick={() => router.replace("/tickets")}>Try again</Button>} />;
  } else if (loading) {
    body = showSkeleton ? (
      <div aria-busy className="flex flex-col gap-3">
        <span className="sr-only">Loading tickets</span>
        <WalletSkeletonTicket />
      </div>
    ) : null;
  } else if (tab === "upcoming") {
    body = upcoming.length ? (
      <div className="flex flex-col gap-8">
        {lead && <Ticket event={lead.event} ticket={lead.ticket} qrLayoutId={`qr-${lead.ticket.id}`} onExpand={() => router.push(`/tickets/${lead.ticket.id}`)} />}
        {rest.length > 0 && <List entries={rest} />}
      </div>
    ) : (
      <EndState title="No tickets yet" body="Tickets you get show up here, ready for the door." actions={<ButtonLink href="/discover">Find events</ButtonLink>} />
    );
  } else {
    body = past.length ? <List entries={past} past /> : <EndState title="No past events yet" body="Events you've been to show up here." actions={<ButtonLink href="/discover">Find events</ButtonLink>} />;
  }

  return (
    <div className="content flex max-w-[calc(40rem_+_2*var(--gutter))] flex-col gap-6 py-6 lg:py-12">
      {header}
      <div role="tabpanel" aria-label={tab === "upcoming" ? "Upcoming" : "Past"}>
        {body}
      </div>
    </div>
  );
}

function List({ entries, past }: { entries: Entry[]; past?: boolean }) {
  return (
    <ul className="flex flex-col gap-3">
      {entries.map(({ ticket, event }) => (
        <li key={ticket.id}>
          <Link href={`/tickets/${ticket.id}`} className="block rounded-lg" aria-label={`${event.title}, ${ticket.holderName}${ticket.status !== "valid" ? `, ${ticket.status.replace("-", " ")}` : ""}`}>
            <TicketRow event={event} ticket={ticket} past={past} />
          </Link>
          {ticket.status !== "valid" && ticket.status !== "checked-in" && (
            <p className="mt-2">
              {ticket.status === "canceled" ? (
                <Status tone="danger" icon={<Ban size={14} aria-hidden />}>
                  Canceled. The host called off this event.
                </Status>
              ) : ticket.status === "transferred" ? (
                <Status icon={<Repeat size={14} aria-hidden />}>Sent to {ticket.transferredTo}</Status>
              ) : (
                <Status tone="warning" icon={<Undo2 size={14} aria-hidden />}>
                  Refund requested
                </Status>
              )}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function WalletSkeletonTicket() {
  const events = useAllEvents();
  return <Ticket event={events[0]} loading />;
}
