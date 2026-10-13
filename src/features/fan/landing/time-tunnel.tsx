"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useMotionValueEvent, useTransform, type MotionValue } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import type { TktEvent } from "@/mocks/types";
import { DateBlock, EventCard } from "../event-card";
import { groupEvents, span, StaticReel, type Item } from "./time-reel";
import { sceneStyle, useSceneProgress } from "./scene";

/**
 * Time tunnel (DESIGN_PLAN §000.2). Scroll moves you forward through time.
 * Every card follows the same path, keyed by t = its distance from the
 * front in "cards" (−2 far ahead … 0 front … +0.5 passed): it comes from
 * the back, becomes the large front card, then slides past the camera. The
 * path is laid out so the card ahead never overlaps the front card's text.
 * Group words are a brief front-most moment as you cross into a new group
 * (cards dim behind it), not text buried at depth. Only the front card is
 * interactive. Reduced motion gets the flat grouped scroller.
 */

type Path = { t: number[]; x: string[]; y: string[]; z: number[]; opacity: number[] };

type Tune = {
  cards: number;
  perspective: number;
  height: string;
  cardW: string;
  /** Camera start, in cards before the first card reaches the front (title shows first). */
  lead: number;
  /** Camera range (in cards) over which the title fades: held until the first card is close. */
  titleOut: [number, number];
  path: Path;
};

// Desktop: cards travel from back-right to front-left. The front card sits left of
// center at ~34vw; the next card waits small at the right, clear of it.
const DESKTOP: Tune = {
  cards: 14,
  perspective: 1000,
  height: "250svh",
  cardW: "min(34vw, 34rem)",
  lead: 2.5,
  // The front card's path crosses the title's corner near u ≈ −0.4, so it clears just before.
  titleOut: [-1.3, -0.8],
  // Holds at the front between t −0.15 and +0.15 so the front state reads, then slides past fast.
  path: {
    t: [-2.2, -2, -1, -0.15, 0.15, 0.45],
    x: ["56vw", "54vw", "44vw", "-12vw", "-14vw", "-46vw"],
    y: ["-4svh", "-4svh", "-2svh", "2svh", "2svh", "6svh"],
    z: [-1500, -1400, -800, 0, 40, 420],
    opacity: [0, 0.3, 0.55, 1, 1, 0],
  },
};

// Phone: one card at a time. The front card is large and centered low; at most one
// next card waits far behind, high and dim (≤0.35), never touching the front card.
const PHONE: Tune = {
  cards: 9,
  perspective: 700,
  height: "200svh",
  cardW: "78vw",
  lead: 1.8,
  // The next card waits high on phone, right where the title sits, so it clears earlier.
  titleOut: [-1.5, -1.15],
  // Front card centered (clear of the HUD); the next one waits high and far behind it.
  // A passing card lifts away and is gone within 0.1 of a card, before the next one arrives.
  path: {
    t: [-1.3, -1.15, -1, -0.15, 0.15, 0.24],
    x: ["0vw", "0vw", "0vw", "0vw", "0vw", "0vw"],
    y: ["-50svh", "-49svh", "-48svh", "-2svh", "-2svh", "-30svh"],
    z: [-1300, -1200, -1100, 0, 30, 120],
    opacity: [0, 0.28, 0.35, 1, 1, 0],
  },
};

export function TimeTunnel({ list, skip }: { list: TktEvent[]; skip?: Set<string> }) {
  const items = groupEvents(list, skip);
  if (!items.length) return null;
  return (
    <div id="reel">
      {/* Each version is in the server HTML; CSS picks one, so nothing jumps on hydration. */}
      <div className="hidden lg:motion-safe:block">
        <Tunnel items={items.slice(0, DESKTOP.cards)} tune={DESKTOP} id="tunnel-lg" />
      </div>
      <div className="hidden motion-safe:block lg:motion-safe:hidden">
        <Tunnel items={items.slice(0, PHONE.cards)} tune={PHONE} id="tunnel-sm" />
      </div>
      <div className="hidden motion-reduce:block">
        <StaticReel items={items} />
      </div>
    </div>
  );
}

function Tunnel({ items, tune, id }: { items: Item[]; tune: Tune; id: string }) {
  const wrap = useRef<HTMLDivElement>(null);
  const { progress, active } = useSceneProgress(wrap);
  const n = items.length;
  // u = camera position in cards: −lead at the start, n−1 (last card at the front) at the end.
  const u = useTransform(progress, [0, 1], [-tune.lead, n - 1]);
  // The title holds while the first card approaches, then clears before their paths cross.
  const titleOpacity = useTransform(u, tune.titleOut, [1, 0]);
  // The HUD lives in the pinned frame and fades out as the scene ends.
  const hudOpacity = useTransform(progress, [0.02, 0.08, 0.95, 1], [0, 1, 1, 0]);

  const [front, setFront] = useState(0);
  // State changes once per card, never per frame.
  useMotionValueEvent(u, "change", (v) => {
    const k = Math.max(0, Math.min(n - 1, Math.round(v)));
    if (k !== front) setFront(k);
  });

  const jump = (k: number) => {
    if (!wrap.current) return;
    const top = wrap.current.getBoundingClientRect().top + window.scrollY;
    const range = wrap.current.offsetHeight - window.innerHeight;
    const p = (k + tune.lead) / (n - 1 + tune.lead);
    window.scrollTo({ top: top + Math.min(1, Math.max(0, p)) * range, behavior: "smooth" });
  };

  const it = items[front];
  const groupItems = items.filter((x) => x.group === it.group);
  const boundaries = items.map((x, k) => (x.first ? k : -1)).filter((k) => k >= 0);

  return (
    <section aria-labelledby={`${id}-title`} aria-roledescription="carousel" ref={wrap} className="relative" style={{ height: tune.height }}>
      <div className="sticky top-0 h-svh overflow-hidden bg-surface" style={sceneStyle(active)}>
        {/* Near the top of the frame, so it enters right behind the poster wall (no blank screen). */}
        <motion.div className="content pointer-events-none absolute inset-x-0 top-[calc(var(--bar-height)+var(--space-12))] z-30" style={{ opacity: titleOpacity }}>
          <h2 id={`${id}-title`} className="display max-w-[14ch]">
            From tonight to next month
          </h2>
          <p className="mt-2 text-base text-text-secondary">Scroll to move through time.</p>
        </motion.div>

        {/* The 3D layer is its own stacking context, so the group word, title, and HUD always sit in front of it. */}
        <div className="absolute inset-0 isolate z-0" style={{ perspective: tune.perspective, perspectiveOrigin: "50% 45%" }}>
          {items.map((x, k) => (
            <Card key={x.event.id} item={x} k={k} u={u} tune={tune} isFront={k === front} />
          ))}
        </div>

        {boundaries.map((b) => (
          <GroupMoment key={items[b].group} label={items[b].group} b={b} u={u} />
        ))}

        <motion.div
          className="content absolute inset-x-0 bottom-[calc(var(--space-4)+3.5rem+env(safe-area-inset-bottom))] z-40 flex items-end justify-between gap-4 md:bottom-[calc(var(--space-6)+env(safe-area-inset-bottom))]"
          style={{ opacity: hudOpacity }}
        >
          <div className="flex items-center gap-3" aria-live="polite">
            <div className="relative h-14 w-12 overflow-hidden">
              <AnimatePresence initial={false}>
                <motion.div key={it.event.id} className="absolute inset-0" initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "-100%" }} transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}>
                  <DateBlock iso={it.event.start} className="border border-border-subtle" />
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg leading-tight font-extrabold">{it.group}</span>
              <span className="num text-sm text-text-secondary">
                {span(groupItems)} · {front + 1} of {n}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/discover" className="mr-2 hidden min-h-11 items-center gap-1 rounded-pill px-3 text-sm font-semibold hover:underline hover:underline-offset-4 sm:inline-flex">
              See all <ArrowRight size={16} aria-hidden />
            </Link>
            <button type="button" onClick={() => jump(front - 1)} disabled={front === 0} aria-label="Previous event" className="flex h-11 w-11 items-center justify-center rounded-pill border border-border-default bg-surface-raised disabled:opacity-40">
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button type="button" onClick={() => jump(front + 1)} disabled={front === n - 1} aria-label="Next event" className="flex h-11 w-11 items-center justify-center rounded-pill border border-border-default bg-surface-raised disabled:opacity-40">
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Card({ item, k, u, tune, isFront }: { item: Item; k: number; u: MotionValue<number>; tune: Tune; isFront: boolean }) {
  const P = tune.path;
  // t: this card's distance from the front, in cards. Clamped mappings, all linear.
  const t = useTransform(u, (v) => v - k);
  const x = useTransform(t, P.t, P.x);
  const y = useTransform(t, P.t, P.y);
  const z = useTransform(t, P.t, P.z);
  const opacity = useTransform(t, P.t, P.opacity);
  // Keep offscreen cards out of the paint entirely.
  const visibility = useTransform(t, (v) => (v < P.t[0] || v > P.t[P.t.length - 1] ? "hidden" : "visible"));
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ transformStyle: "preserve-3d" }}>
      <motion.div className={isFront ? "pointer-events-auto" : ""} inert={!isFront || undefined} style={{ width: tune.cardW, x, y, z, opacity, visibility }}>
        <EventCard event={item.event} sizes="(min-width: 1024px) 34vw, 78vw" />
      </motion.div>
    </div>
  );
}

/** A brief, front-most group word as you cross into a group; the scene dims behind it. */
function GroupMoment({ label, b, u }: { label: string; b: number; u: MotionValue<number> }) {
  const opacity = useTransform(u, [b - 0.7, b - 0.6, b - 0.3, b - 0.2], [0, 1, 1, 0]);
  const scale = useTransform(u, [b - 0.7, b - 0.2], [0.96, 1.03]);
  const dim = useTransform(opacity, (o) => o * 0.92);
  const visibility = useTransform(opacity, (o) => (o <= 0.001 ? "hidden" : "visible"));
  return (
    <>
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-20 bg-surface" style={{ opacity: dim, visibility }} />
      <motion.p
        aria-hidden
        className="font-display pointer-events-none absolute inset-x-0 top-1/2 z-30 -translate-y-1/2 text-center leading-none font-extrabold tracking-tight text-text-primary"
        style={{ opacity, scale, visibility, fontSize: "clamp(3rem, 11vw, 9rem)" }}
      >
        {label}
      </motion.p>
    </>
  );
}
