"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { motion, useInView } from "motion/react";
import { usePageVisible } from "./scene";
import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/ui/primitives";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";
import { searchHref } from "../catalog";
import { useMediaQuery } from "../hooks";
import { SearchInput } from "../search-box";
import { Magnetic } from "../fx";

const LINES = [
  ["Find", "your", "night."],
  ["Find", "your", "people."],
];

const EXAMPLES = ["Try “jazz in Davao”", "Try “free this weekend”", "Try “comedy”", "Try “Cebu”", "Try “supper club”"];

const SLIDE_MS = 6000;

/**
 * Hero (DESIGN_PLAN §000). Dark regardless of theme: it sits on photos.
 * Slow crossfade between covers with a gentle zoom, disabled with reduced
 * motion. The headline reveals word by word once, the one load animation.
 */
export function Hero({ covers, week, cities }: { covers: TktEvent[]; week: number; cities: number }) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const reduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [i, setI] = useState(0);
  const [cycled, setCycled] = useState(false);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);
  const [ex, setEx] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const onScreen = useInView(ref);
  const visible = usePageVisible();
  // Montage and placeholder pause when the hero is offscreen or the tab is hidden.
  const run = onScreen && visible;

  useEffect(() => {
    if (!run || reduced || covers.length < 2) return;
    const t = setInterval(() => {
      setCycled(true);
      setI((n) => (n + 1) % covers.length);
    }, SLIDE_MS);
    return () => clearInterval(t);
  }, [run, reduced, covers.length]);

  useEffect(() => {
    if (!run || focused || reduced) return;
    const t = setInterval(() => setEx((n) => (n + 1) % EXAMPLES.length), 3000);
    return () => clearInterval(t);
  }, [run, focused, reduced]);

  const submit = () => router.push(searchHref({ q: q.trim() }));
  const current = reduced ? 0 : i;

  return (
    <section ref={ref} data-theme="dark" aria-labelledby="hero-title" className="relative isolate flex min-h-[40rem] items-end overflow-hidden bg-[var(--gray-1000)] text-text-primary" style={{ height: "100svh" }}>
      <div aria-hidden className="absolute inset-0 -z-10">
        {covers.map((e, n) => {
          // Only the current cover, the one fading out, and the next one are mounted.
          // The next mounts hidden a full slide early, so it has loaded before its crossfade.
          const next = (current + 1) % covers.length;
          const prev = cycled ? (current - 1 + covers.length) % covers.length : -1;
          if (n !== current && n !== next && n !== prev) return null;
          return (
          <div key={e.id} className="absolute inset-0 transition-opacity ease-linear" style={{ opacity: n === current ? 1 : 0, transitionDuration: "1500ms" }}>
            <motion.div
              className="absolute inset-0"
              initial={false}
              animate={{ scale: n === current && !reduced && run ? 1.08 : 1 }}
              transition={{ duration: n === current && run ? 12 : 0, ease: "linear" }}
            >
              <Photo src={e.cover.url} alt="" sizes="100vw" position={e.cover.position} priority={n === 0} />
            </motion.div>
          </div>
          );
        })}
        {/* Functional scrim: legibility for the headline and search, not decoration. */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-black/45" />
      </div>

      <div className="content flex w-full flex-col gap-8 pt-32 pb-24 md:pb-32">
        <h1 id="hero-title" className="font-display font-extrabold" style={{ fontSize: "clamp(3rem, 9vw, 8.5rem)", lineHeight: 0.92, letterSpacing: "-0.045em" }}>
          {LINES.map((line, l) => (
            <span key={l} className="block">
              {line.map((w, wi) => {
                // 6 words × 0.1s stagger + 0.25s each = done by 0.75s.
                const d = ((l === 0 ? 0 : LINES[0].length) + wi) * 0.1;
                return (
                  <motion.span key={`${l}-${w}`} className="mr-[0.22em] inline-block" initial={{ opacity: 0, y: "0.25em" }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: d }}>
                    {w}
                  </motion.span>
                );
              })}
            </span>
          ))}
        </h1>

        <div className="flex max-w-2xl flex-col gap-4">
          <form
            role="search"
            aria-label="Search events"
            className="flex gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
          >
            <SearchInput value={q} onChange={setQ} onSubmit={submit} placeholder={EXAMPLES[ex]} onFocusChange={setFocused} />
            {/* On phones Enter submits; the button returns from sm up. A wrapper carries the breakpoint. */}
            <div className="hidden sm:block">
              <Magnetic>
                <Button type="submit" size="lg">
                  Search
                </Button>
              </Magnetic>
            </div>
          </form>
          {/* The counts depend on "now", so they only render after hydration (server and browser
              can disagree by a day or a minute). The line keeps its height meanwhile. */}
          <p className="num min-h-5 text-sm text-text-secondary">
            {mounted ? (
              <>
                <span className="font-semibold text-text-primary">{f.plural(week, "event")}</span> this week across {f.plural(cities, "city", "cities")}
              </>
            ) : (
              <span aria-hidden className="invisible">
                Events this week
              </span>
            )}
          </p>
        </div>
      </div>

      <a href="#reel" className="absolute right-[var(--gutter)] bottom-8 hidden min-h-11 items-center gap-2 rounded-pill px-3 text-sm text-text-secondary hover:text-text-primary md:flex">
        Scroll <ArrowDown size={16} aria-hidden />
      </a>
    </section>
  );
}
