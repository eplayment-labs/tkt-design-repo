"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useTransform } from "motion/react";
import { sceneStyle, useSceneProgress } from "./scene";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";
import { calendar } from "../catalog";
import { EventCard } from "../event-card";

export type Group = "Tonight" | "This week" | "This weekend" | "Next week" | "Later";
export type Item = { event: TktEvent; group: Group; first: boolean };

const ORDER: Group[] = ["Tonight", "This week", "This weekend", "Next week", "Later"];
const CAPS: Record<Group, number> = { Tonight: 4, "This week": 4, "This weekend": 6, "Next week": 5, Later: 4 };
const CARD = 320;
const GAP = 24;

/**
 * Chronological buckets in Manila time: today, the rest of this week
 * (to Friday), this weekend, next Monday to Sunday, then later. Events are
 * sorted by start first, so the reel always reads in order.
 */
export function groupEvents(list: TktEvent[], skipFirst: Set<string> = new Set()): Item[] {
  const cal = calendar();
  const by: Record<Group, TktEvent[]> = { Tonight: [], "This week": [], "This weekend": [], "Next week": [], Later: [] };
  const sorted = [...list].sort((a, b) => a.start.localeCompare(b.start));
  let kept = 0;
  for (const e of sorted) {
    // Keep the hero's covers off the first screen of the reel.
    if (kept < 4 && skipFirst.has(e.id)) continue;
    kept++;
    const k = f.dayKey(e.start);
    if (k === cal.today) by.Tonight.push(e);
    else if (cal.restOfWeek.includes(k)) by["This week"].push(e);
    else if (cal.weekend.includes(k)) by["This weekend"].push(e);
    else if (cal.nextWeek.includes(k)) by["Next week"].push(e);
    else by.Later.push(e);
  }
  return ORDER.flatMap((g) => by[g].slice(0, CAPS[g]).map((event, i) => ({ event, group: g, first: i === 0 })));
}

/** "Sat 17 – Sun 18 Oct", "Fri 16 Oct", or "Tue 3 Nov – Sat 12 Dec". */
export function span(items: Item[]): string {
  if (!items.length) return "";
  const a = items[0].event.start;
  const b = items[items.length - 1].event.start;
  if (f.dayKey(a) === f.dayKey(b)) return f.dayShort(a);
  const [aw, ad, am] = f.dayShort(a).split(" ");
  return am === f.dayShort(b).split(" ")[2] ? `${aw} ${ad} – ${f.dayShort(b)}` : `${f.dayShort(a)} – ${f.dayShort(b)}`;
}

/**
 * Time reel (DESIGN_PLAN §000). Both versions are in the server HTML and CSS
 * picks one, so nothing jumps on hydration: the pinned reel from 1024px when
 * motion is allowed, the plain scroller otherwise.
 */
export function TimeReel({ list, skip }: { list: TktEvent[]; skip?: Set<string> }) {
  const items = groupEvents(list, skip);
  if (!items.length) return null;
  return (
    <div id="reel">
      <div className="hidden lg:motion-safe:block">
        <PinnedReel items={items} />
      </div>
      <div className="lg:motion-safe:hidden">
        <StaticReel items={items} />
      </div>
    </div>
  );
}

function Title({ id }: { id: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 id={id} className="display">
        From tonight to next month
      </h2>
      <p className="text-base text-text-secondary">Everything coming up, in order.</p>
    </div>
  );
}

export function StaticReel({ items }: { items: Item[] }) {
  return (
    <section aria-labelledby="reel-title" className="flex flex-col gap-8 py-16 md:py-24">
      <div className="content">
        <Title id="reel-title" />
      </div>
      <ol
        aria-label="Upcoming events by time"
        className="scroll-x mx-auto flex w-full max-w-[var(--content-max)] snap-x snap-mandatory scroll-px-[var(--gutter)] gap-3 px-[var(--gutter)] md:gap-6"
      >
        {items.map((it) => (
          <li key={it.event.id} className="w-64 shrink-0 snap-start md:w-80">
            {/* Group label above the first card of each group; others keep the rhythm. */}
            <p className={`mb-3 text-sm font-semibold ${it.first ? "" : "invisible"}`} aria-hidden={!it.first || undefined}>
              {it.group}
            </p>
            <div>
              <EventCard tilt event={it.event} sizes="320px" />
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function PinnedReel({ items }: { items: Item[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLOListElement>(null);
  const offsets = useRef<number[]>([]);
  const [dist, setDist] = useState<number | null>(null);
  const [label, setLabel] = useState<Group>(items[0].group);

  // Measure per resize. Until then the height uses a CSS estimate, so first paint is close.
  useLayoutEffect(() => {
    const measure = () => {
      if (!track.current || !viewport.current || !viewport.current.clientWidth) return;
      setDist(Math.max(0, track.current.scrollWidth - viewport.current.clientWidth));
      const kids = Array.from(track.current.children) as HTMLElement[];
      const base = kids[0]?.offsetLeft ?? 0;
      offsets.current = kids.map((c) => c.offsetLeft - base);
    };
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  const d = dist ?? 0;
  // Smoothed, visibility-gated scroll progress, shared with the other scenes (§000.2).
  const { progress, active } = useSceneProgress(wrap);
  const x = useTransform(progress, (v) => -v * d);

  // React state changes only when the label changes, not every frame.
  useMotionValueEvent(progress, "change", (v) => {
    const at = v * d + CARD / 2; // the card at least half visible at the left edge
    let idx = 0;
    offsets.current.forEach((o, i) => {
      if (o <= at) idx = i;
    });
    const g = items[idx]?.group;
    if (g && g !== label) setLabel(g);
  });

  // Keyboard: tabbing to a card scrolls the page so the reel brings it into view.
  const onFocus = (i: number) => {
    if (!wrap.current || !d) return;
    if (viewport.current) viewport.current.scrollLeft = 0;
    const top = wrap.current.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + Math.min(1, (offsets.current[i] ?? 0) / d) * d });
  };

  const inGroup = items.filter((it) => it.group === label);
  // Track width minus the visible reel area (viewport minus the left column and gutters).
  const estimate = `calc(100svh + ${items.length * (CARD + GAP)}px - 100vw + 22rem)`;

  return (
    <section aria-labelledby="reel-title-pinned">
      <div ref={wrap} className="relative" style={{ height: dist === null ? estimate : `calc(100svh + ${d}px)` }}>
        {/* The whole frame pins: title, live label, and the reel moving sideways. */}
        <div className="sticky top-0 flex h-svh flex-col justify-center gap-12 overflow-hidden pt-[var(--bar-height)]" style={sceneStyle(active)}>
          <div className="content">
            <Title id="reel-title-pinned" />
          </div>
          <div className="flex w-full items-start gap-12 pl-[max(var(--gutter),calc((100vw_-_var(--content-max))/2_+_var(--gutter)))]">
            <div className="w-56 shrink-0" aria-live="polite">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                  <p className="font-display text-4xl leading-none font-extrabold tracking-tight">{label}</p>
                  <p className="num mt-3 text-sm text-text-secondary">{span(inGroup)}</p>
                </motion.div>
              </AnimatePresence>
            </div>
            <div ref={viewport} className="min-w-0 flex-1 overflow-hidden">
              <motion.ol ref={track} aria-label="Upcoming events by time" className="flex gap-6 pr-[var(--gutter)]" style={{ x }}>
                {items.map((it, i) => (
                  <li key={it.event.id} className="w-80 shrink-0" onFocus={() => onFocus(i)}>
                    <EventCard tilt event={it.event} sizes="320px" />
                  </li>
                ))}
              </motion.ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
