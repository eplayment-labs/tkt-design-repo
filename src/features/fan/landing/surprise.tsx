"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useReducedMotion } from "motion/react";
import { Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Photo } from "@/components/ui/primitives";
import { eventState, whereLabel } from "@/lib/event";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";
import { PriceText } from "../event-card";
import { Magnetic } from "../fx";

/** Each tick's length: starts fast, eases out. 8 steps ≈ 900ms, none over 120ms. */
const STEPS = [70, 75, 85, 95, 105, 115, 120, 120];

/**
 * "Surprise me" (DESIGN_PLAN §000.1): a short slot-machine roll through real
 * upcoming events that lands on one on-sale pick. Reduced motion → instant.
 */
export function Surprise({ list }: { list: TktEvent[] }) {
  const reduced = useReducedMotion();
  const pool = list.filter((e) => eventState(e) === "on-sale");
  const [shown, setShown] = useState<TktEvent | null>(null);
  const [rolling, setRolling] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const roll = () => {
    if (!pool.length) return;
    timers.current.forEach(clearTimeout);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (reduced) {
      setShown(pick);
      return;
    }
    setRolling(true);
    let t = 0;
    STEPS.forEach((ms, i) => {
      t += ms;
      timers.current.push(
        setTimeout(() => {
          if (i === STEPS.length - 1) {
            setShown(pick);
            setRolling(false);
          } else {
            setShown(pool[Math.floor(Math.random() * pool.length)]);
          }
        }, t),
      );
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Button variant="secondary" iconLeft={<Shuffle size={16} aria-hidden />} onClick={roll} disabled={rolling} className="self-start active:scale-[0.97]" aria-label={shown ? "Surprise me again" : "Surprise me with a random event"}>
        {shown && !rolling ? "Roll again" : "Surprise me"}
      </Button>
      <p className="sr-only" aria-live="polite">
        {shown && !rolling ? `Picked ${shown.title}, ${f.dayShort(shown.start)}, ${whereLabel(shown)}.` : ""}
      </p>
      {shown && (
        <div className="flex items-center gap-4 rounded-lg border border-border-subtle bg-surface-raised p-3" aria-busy={rolling || undefined}>
          {/* Fixed-size window: the ticker swaps content in place, so nothing reflows. */}
          <div className="relative aspect-square w-20 shrink-0 overflow-hidden rounded-sm bg-surface-sunken md:w-24">
            <Photo key={shown.id} src={shown.cover.url} alt="" sizes="96px" position={shown.cover.position} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden">
            <p key={`t-${shown.id}`} className={`font-display truncate text-lg leading-tight font-extrabold ${rolling ? "animate-[tick_100ms_ease-out]" : ""}`}>
              {shown.title}
            </p>
            <p className="num truncate text-sm text-text-secondary">
              {f.dayShort(shown.start)} · {whereLabel(shown)}
            </p>
            {!rolling && (
              <p className="text-sm">
                <PriceText event={shown} />
              </p>
            )}
          </div>
          {!rolling && (
            <Magnetic>
              <Link
                href={`/e/${shown.slug}/tickets`}
                className="inline-flex min-h-11 shrink-0 items-center rounded-pill bg-accent px-4 text-sm font-semibold text-[var(--text-on-accent)] transition-colors duration-150 hover:bg-[var(--accent-hover)]"
              >
                Get tickets
              </Link>
            </Magnetic>
          )}
        </div>
      )}
      <style>{`@keyframes tick { from { transform: translateY(60%); opacity: 0 } to { transform: none; opacity: 1 } }`}</style>
    </div>
  );
}
