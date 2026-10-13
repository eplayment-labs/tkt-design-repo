"use client";

import { useRef } from "react";
import { motion, useInView, useTransform, type MotionValue } from "motion/react";
import { sceneStyle, useSceneProgress } from "./scene";
import { QRCodeSVG } from "qrcode.react";
import { Photo } from "@/components/ui/primitives";
import { accentVars } from "@/lib/accent";
import { totals, whereLabel } from "@/lib/event";
import * as f from "@/lib/format";
import type { Ticket as TicketT, TktEvent } from "@/mocks/types";

/**
 * The ticket moment (DESIGN_PLAN §000.1): the ticket rises out of a slot,
 * then flips in 3D from the event side to the QR side. Desktop scrubs it
 * with scroll while pinned; phones play it once in view (650ms total);
 * reduced motion shows both faces side by side, flat.
 */
export function TicketMoment({ event, ticket }: { event: TktEvent; ticket: TicketT }) {
  return (
    <div className="event-scope" style={accentVars(event.accent)}>
      <div className="hidden lg:motion-safe:block">
        <Scrubbed event={event} ticket={ticket} />
      </div>
      <div className="lg:motion-safe:hidden motion-reduce:hidden">
        <Once event={event} ticket={ticket} />
      </div>
      <div className="hidden motion-reduce:block">
        <Flat event={event} ticket={ticket} />
      </div>
    </div>
  );
}

function Copy() {
  return (
    <div className="flex flex-col gap-4 lg:col-span-5">
      <h2 className="display max-w-[12ch]">Your ticket lives on your phone.</h2>
      <p className="max-w-[40ch] text-lg text-text-secondary">
        Show the QR at the door, even offline. Can&apos;t go? Send it to a friend or ask the host for a refund from the same screen.
      </p>
    </div>
  );
}

/* ---------- The two faces ---------- */

const face = "flex h-full flex-col overflow-hidden rounded-lg bg-[var(--gray-0)] text-[var(--gray-ink)]";

function Front({ event, ticket }: { event: TktEvent; ticket: TicketT }) {
  const tier = event.tiers.find((t) => t.id === ticket.tierId);
  const rows: [string, string][] = [
    ["Date", f.date(event.start)],
    ["Time", f.time(event.start)],
    ["Venue", whereLabel(event)],
    ["Tier", tier?.name ?? ""],
  ];
  return (
    <div className={face}>
      <div className="relative aspect-[3/1] shrink-0 bg-[var(--gray-100)]">
        <Photo src={event.cover.url} alt="" sizes="(min-width: 1024px) 36rem, 90vw" position={event.cover.position} />
      </div>
      <div aria-hidden className="h-1 shrink-0 bg-event" />
      <div className="flex flex-1 flex-col gap-4 p-6">
        <p className="font-display text-2xl leading-tight font-extrabold">{event.title}</p>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          {rows.map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs font-semibold tracking-wide text-[var(--gray-600)] uppercase">{k}</dt>
              <dd className="num text-base font-medium whitespace-normal">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-auto text-sm text-[var(--gray-600)]">{ticket.holderName}</p>
      </div>
    </div>
  );
}

function Back({ event, ticket }: { event: TktEvent; ticket: TicketT }) {
  const { capacity } = totals(event);
  return (
    <div className={`${face} items-center justify-center gap-3 p-6 text-center`}>
      <QRCodeSVG value={`tkt:${ticket.code}`} size={512} level="M" bgColor="#ffffff" fgColor="#000000" className="aspect-square h-auto w-2/5 max-w-48" title={`QR code for ticket ${ticket.code}`} />
      <span className="font-mono text-base">{ticket.code}</span>
      <span className="num font-mono text-2xl font-medium">
        No. {String(ticket.serial).padStart(4, "0")}
        {capacity ? ` / ${f.count(capacity)}` : ""}
      </span>
      <span className="rounded-pill bg-event px-4 py-1 text-sm font-semibold text-[var(--event-on-accent)]">Admit 1</span>
    </div>
  );
}

function Faces({ event, ticket }: { event: TktEvent; ticket: TicketT }) {
  return (
    <>
      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", filter: cardShadow }}>
        <Front event={event} ticket={ticket} />
      </div>
      <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)", filter: cardShadow }}>
        <Back event={event} ticket={ticket} />
      </div>
    </>
  );
}

const cardCls = "relative mx-auto aspect-[4/3] w-full max-w-xl";
// The ticket is the one floating object here. The shadow sits on each face: a filter on the
// 3D parent would flatten preserve-3d and break the two-sided flip.
const cardShadow = "drop-shadow(0 12px 24px rgba(10,11,12,0.14))";
const slotClip = { clipPath: "inset(-6rem -50% 0 -50%)" };

function Slot() {
  return <div aria-hidden className="mx-auto h-1 max-w-xl rounded-pill bg-border-strong" />;
}

function Scrubbed({ event, ticket }: { event: TktEvent; ticket: TicketT }) {
  const wrap = useRef<HTMLDivElement>(null);
  const { progress: scrollYProgress, active } = useSceneProgress(wrap);
  // Rises over the first 30%, holds the front, flips between 45% and 80%, holds the back.
  const y: MotionValue<string> = useTransform(scrollYProgress, [0, 0.3], ["100%", "0%"]);
  const rotateY = useTransform(scrollYProgress, [0.45, 0.8], [0, 180]);
  return (
    <section aria-label="Your ticket" ref={wrap} className="relative" style={{ height: "170svh" }}>
      <div className="sticky top-0 flex h-svh items-center" style={sceneStyle(active)}>
        <div className="content grid w-full items-center gap-12 lg:grid-cols-12">
          <Copy />
          <div className="lg:col-span-7" style={{ perspective: 1600 }}>
            <div style={slotClip}>
              <motion.div className="pb-6" style={{ y }}>
                <motion.div className={cardCls} style={{ rotateY, transformPerspective: 1600, transformStyle: "preserve-3d" }}>
                  <Faces event={event} ticket={ticket} />
                </motion.div>
              </motion.div>
            </div>
            <Slot />
          </div>
        </div>
      </div>
    </section>
  );
}

function Once({ event, ticket }: { event: TktEvent; ticket: TicketT }) {
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "-20% 0px" });
  return (
    <section aria-label="Your ticket" className="content flex flex-col gap-8 py-16 md:py-24">
      <Copy />
      <div ref={ref} style={{ perspective: 1600 }}>
        <div style={slotClip}>
          <motion.div className="pb-6" initial={{ y: "100%" }} animate={seen ? { y: "0%" } : undefined} transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}>
            {/* Rise 250ms, a 150ms beat, flip 250ms: 650ms in all. */}
            <motion.div
              className={cardCls}
              style={{ transformPerspective: 1600, transformStyle: "preserve-3d" }}
              initial={{ rotateY: 0 }}
              animate={seen ? { rotateY: 180 } : undefined}
              transition={{ duration: 0.25, delay: 0.4, ease: [0.2, 0, 0, 1] }}
            >
              <Faces event={event} ticket={ticket} />
            </motion.div>
          </motion.div>
        </div>
        <Slot />
      </div>
    </section>
  );
}

function Flat({ event, ticket }: { event: TktEvent; ticket: TicketT }) {
  return (
    <section aria-label="Your ticket" className="content grid items-center gap-12 py-16 md:py-24 lg:grid-cols-12">
      <Copy />
      <div className="grid gap-6 sm:grid-cols-2 lg:col-span-7">
        <div className="aspect-[4/3] rounded-lg border border-border-subtle">
          <Front event={event} ticket={ticket} />
        </div>
        <div className="aspect-[4/3] rounded-lg border border-border-subtle">
          <Back event={event} ticket={ticket} />
        </div>
      </div>
    </section>
  );
}
