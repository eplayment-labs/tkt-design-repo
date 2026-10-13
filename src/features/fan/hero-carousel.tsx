"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { Photo } from "@/components/ui/primitives";
import { whereLabel } from "@/lib/event";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";
import { statusPill } from "./catalog";
import { PhotoPill } from "./event-card";
import { useMediaQuery } from "./hooks";

const DELAY = 6000;

/**
 * Featured hero (DESIGN_PLAN §00). Embla + Autoplay, looping. Pauses on
 * hover and focus, never autoplays with reduced motion, and has a visible
 * pause button. Segmented bars show progress and jump to a slide.
 */
export function HeroCarousel({ events }: { events: TktEvent[] }) {
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [viewportRef, api] = useEmblaCarousel({ loop: true, duration: 25 }, [
    Autoplay({ delay: DELAY, playOnInit: false, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true }),
  ]);
  const [selected, setSelected] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  // Autoplay resumes itself on mouse leave; this keeps a user's pause (or reduced motion) in charge.
  const pausedRef = useRef(false);

  useEffect(() => {
    if (!api) return;
    const autoplay = api.plugins().autoplay;
    const onSelect = () => setSelected(api.selectedScrollSnap());
    pausedRef.current = reduced || userPaused;
    const onPlay = () => {
      if (pausedRef.current) autoplay?.stop();
      else setPlaying(true);
    };
    const onStop = () => setPlaying(false);
    api.on("select", onSelect).on("autoplay:play", onPlay).on("autoplay:stop", onStop);
    if (!reduced && !userPaused) autoplay?.play();
    else autoplay?.stop();
    return () => {
      api.off("select", onSelect).off("autoplay:play", onPlay).off("autoplay:stop", onStop);
    };
  }, [api, reduced, userPaused]);

  const go = useCallback((i: number) => api?.scrollTo(i), [api]);
  const prev = useCallback(() => api?.scrollPrev(), [api]);
  const next = useCallback(() => api?.scrollNext(), [api]);
  const togglePlay = () => setUserPaused((p) => !p);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      prev();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      next();
    }
  };

  if (!events.length) return null;
  const paused = reduced || userPaused;

  return (
    <section aria-roledescription="carousel" aria-label="Featured events" onKeyDown={onKey} className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] 2xl:grid-cols-[minmax(0,1fr)_22rem] lg:gap-6">
      <div className="relative overflow-hidden bg-[var(--gray-1000)] lg:rounded-lg">
        <div ref={viewportRef} className="overflow-hidden">
          <div className="flex touch-pan-y">
            {events.map((e, i) => (
              <Slide key={e.id} event={e} index={i} total={events.length} active={i === selected} priority={i === 0} />
            ))}
          </div>
        </div>

        {/* Controls sit on the scrim, so they are always white on dark. */}
        <div className="absolute inset-x-0 bottom-0 flex items-center gap-3 px-4 pb-2 md:px-8 lg:px-12">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill text-[var(--gray-0)] hover:bg-[var(--gray-0)]/15"
          >
            {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
          </button>
          <div className="flex flex-1 gap-2">
            {events.map((e, i) => (
              <button
                key={e.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show slide ${i + 1}: ${e.title}`}
                aria-current={i === selected || undefined}
                className="flex h-11 flex-1 items-center"
              >
                <span className="relative h-1 w-full overflow-hidden rounded-pill bg-[var(--gray-0)]/30">
                  {i === selected && (
                    <motion.span
                      key={`${selected}-${playing && !paused}`}
                      className="absolute inset-0 origin-left rounded-pill bg-[var(--gray-0)]"
                      initial={{ scaleX: playing && !paused ? 0 : 1 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: playing && !paused ? DELAY / 1000 : 0, ease: "linear" }}
                    />
                  )}
                  {i < selected && <span className="absolute inset-0 rounded-pill bg-[var(--gray-0)]/70" />}
                </span>
              </button>
            ))}
          </div>
          <div className="hidden gap-2 md:flex">
            <button type="button" onClick={prev} aria-label="Previous slide" className="flex h-11 w-11 items-center justify-center rounded-pill bg-[var(--gray-0)] text-[var(--gray-ink)] hover:bg-[var(--gray-200)]">
              <ChevronLeft size={20} aria-hidden />
            </button>
            <button type="button" onClick={next} aria-label="Next slide" className="flex h-11 w-11 items-center justify-center rounded-pill bg-[var(--gray-0)] text-[var(--gray-ink)] hover:bg-[var(--gray-200)]">
              <ChevronRight size={20} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      {/* Desktop rail: every featured event at a glance; click to jump. */}
      <ol aria-label="Featured events" className="hidden flex-col gap-2 lg:flex">
        {events.map((e, i) => (
          <li key={e.id} className="flex-1">
            <button
              type="button"
              onClick={() => go(i)}
              aria-label={`Show slide ${i + 1}: ${e.title}`}
              aria-current={i === selected || undefined}
              className={`flex h-full w-full items-center gap-3 rounded-sm p-2 text-left transition-colors duration-150 ${
                i === selected ? "bg-surface-sunken" : "hover:bg-surface-sunken"
              }`}
            >
              <span className="relative aspect-square h-14 shrink-0 overflow-hidden rounded-sm bg-surface-sunken">
                <Photo src={e.cover.url} alt="" sizes="56px" position={e.cover.position} />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className={`font-display truncate text-base leading-tight font-extrabold ${i === selected ? "" : "text-text-secondary"}`}>{e.title}</span>
                <span className="num truncate text-xs text-text-tertiary">
                  {f.dayShort(e.start)} · {e.city}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Slide({ event, index, total, active, priority }: { event: TktEvent; index: number; total: number; active: boolean; priority?: boolean }) {
  const pill = statusPill(event);
  return (
    <div
      role="group"
      aria-roledescription="slide"
      aria-label={`${index + 1} of ${total}`}
      aria-hidden={!active || undefined}
      inert={!active || undefined}
      className="relative h-[70svh] min-h-96 min-w-0 shrink-0 grow-0 basis-full lg:h-[35rem] 2xl:h-[42rem]"
    >
      <Photo src={event.cover.url} alt={event.cover.alt} sizes="(min-width: 1024px) 75vw, 100vw" position={event.cover.position} priority={priority} />
      {/* The one allowed gradient: a legibility scrim behind the text (bottom on phone, bottom-left on desktop). */}
      <div aria-hidden className="absolute inset-0 bg-linear-to-t from-black/85 via-black/45 to-black/0 lg:bg-linear-to-tr lg:from-black/85 lg:via-black/40" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-start gap-3 px-4 pb-16 md:px-8 lg:max-w-2xl lg:px-12 lg:pb-20">
        {pill && <PhotoPill pill={pill} />}
        <h2 className="display text-[var(--gray-0)]">{event.title}</h2>
        <p className="num text-base text-[var(--gray-0)]/90">
          {f.dayLong(event.start)} · {whereLabel(event)}
          {event.format !== "online" ? `, ${event.city}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Link
            href={`/e/${event.slug}/tickets`}
            className="inline-flex min-h-12 items-center rounded-pill bg-[var(--gray-0)] px-6 text-base font-semibold text-[var(--gray-ink)] transition-colors duration-150 hover:bg-[var(--gray-200)]"
          >
            Get tickets
          </Link>
          <Link
            href={`/e/${event.slug}`}
            className="inline-flex min-h-12 items-center rounded-pill border border-[var(--gray-0)]/60 px-6 text-base font-semibold text-[var(--gray-0)] transition-colors duration-150 hover:bg-[var(--gray-0)]/15"
          >
            More info
          </Link>
        </div>
      </div>
    </div>
  );
}
