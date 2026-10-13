"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { CalendarPlus } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { EndState, ErrorState, Slot } from "@/components/ui/primitives";
import { Ticket, TicketRow } from "@/components/ticket/ticket";
import { useHydrated } from "@/components/providers";
import { useAllEvents, useDemoState } from "@/features/events";
import { useStore } from "@/features/store";
import { accentVars } from "@/lib/accent";
import * as f from "@/lib/format";
import { downloadIcs } from "@/lib/ics";
import { clearPrint, isPrintPending, useDelayedFlag } from "./hooks";

export function Confirmation({ orderId }: { orderId: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const demo = useDemoState();
  const isNew = useSearchParams().get("new") === "1";
  const order = useStore((s) => s.orders.find((o) => o.id === orderId));
  const allTickets = useStore((s) => s.tickets);
  const events = useAllEvents();
  // Print only on the client transition right after Pay. A refresh or direct visit is static.
  const [print] = useState(() => isNew && isPrintPending(orderId));
  const [printed, setPrinted] = useState(false);
  const showSkeleton = useDelayedFlag(!hydrated || demo === "loading");

  useEffect(() => {
    if (!print) return;
    const done = setTimeout(() => setPrinted(true), 260);
    const t = setTimeout(() => {
      clearPrint();
      router.replace(`/orders/${orderId}`, { scroll: false });
    }, 300);
    return () => {
      clearTimeout(done);
      clearTimeout(t);
    };
  }, [print, orderId, router]);

  if (demo === "error") {
    return (
      <div className="content">
        <ErrorState title="Your order didn't load" body="Your order is saved. Check your connection, then try again." actions={<Button onClick={() => router.replace(`/orders/${orderId}`)}>Try again</Button>} />
      </div>
    );
  }
  if (!hydrated || demo === "loading") {
    return showSkeleton ? (
      <div aria-busy className="content flex max-w-[var(--form-max)] flex-col gap-8 py-12 lg:max-w-3xl">
        <h1 className="display">You&apos;re going</h1>
        <Slot w="10rem" />
      </div>
    ) : null;
  }

  const event = order && events.find((e) => e.id === order.eventId);
  if (!order || !event) {
    return (
      <div className="content">
        <EndState title="We couldn't find that order" body="It may belong to another account. Your tickets are always in My tickets." actions={<ButtonLink href="/tickets">View tickets</ButtonLink>} />
      </div>
    );
  }
  const tickets = allTickets.filter((t) => t.orderId === order.id);
  const [first, ...rest] = tickets;
  const free = order.total === 0;

  return (
    <div className="event-scope" style={accentVars(event.accent)}>
      <div className="content flex flex-col gap-8 py-8 lg:max-w-3xl lg:py-12">
        <div className="flex flex-col gap-2">
          <h1 className="display">You&apos;re going</h1>
          <p className="text-base text-text-secondary">
            {free ? "RSVP" : "Order"} <span className="font-mono text-text-primary">{order.number}</span>
            {" · "}
            <span className="num">{f.plural(tickets.length, "ticket")}</span>
            {!free && (
              <>
                {" · "}
                <span className="num">{f.money(order.total)}</span>
              </>
            )}
          </p>
        </div>

        <div>
          {/* Clipped at the slot line only: the ticket rises out of it, its shadow stays visible. */}
          <div style={print && !printed ? { clipPath: "inset(-3rem -3rem 0 -3rem)" } : undefined}>
            <motion.div
              className="pb-6"
              initial={print ? { y: "100%" } : false}
              animate={{ y: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            >
              {first && <Ticket event={event} ticket={first} />}
            </motion.div>
          </div>
          {/* The slot exists only while the ticket prints. */}
          {print && !printed && <div aria-hidden className="h-1 rounded-sm bg-border-strong" />}
        </div>

        {rest.length > 0 && (
          <ul className="flex flex-col gap-3">
            {rest.map((t) => (
              <li key={t.id}>
                <TicketRow event={event} ticket={t} />
              </li>
            ))}
          </ul>
        )}

        {/* Thumb zone on mobile: sticks above the tab bar until the page end. */}
        <div className="safe-bottom sticky bottom-0 -mx-[var(--gutter)] flex gap-2 bg-surface px-[var(--gutter)] py-3 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0">
          <ButtonLink href="/tickets" size="lg" variant="event" className="min-w-0 flex-1 md:flex-none">
            View tickets
          </ButtonLink>
          <Button variant="secondary" size="lg" className="min-w-0 flex-1 md:flex-none" iconLeft={<CalendarPlus size={18} aria-hidden />} onClick={() => downloadIcs(event)}>
            Add to calendar
          </Button>
        </div>
      </div>
    </div>
  );
}
