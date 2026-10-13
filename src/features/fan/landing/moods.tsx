"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Chip } from "@/components/ui/controls";
import { useStore } from "@/features/store";
import type { TktEvent } from "@/mocks/types";
import { EventCard } from "../event-card";
import { MOODS, suggest, type Mood } from "../suggest";
import { Surprise } from "./surprise";

/** "What are you in the mood for?" Each pick says why, from data. */
export function Moods({ list }: { list: TktEvent[] }) {
  const [mood, setMood] = useState<Mood>("loud");
  const following = useStore((s) => s.following);
  const picks = suggest(list, mood, following);

  return (
    <section aria-labelledby="mood-title" className="content flex flex-col gap-8 py-16 md:py-24">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <h2 id="mood-title" className="display max-w-[14ch]">
            What are you in the mood for?
          </h2>
          <div className="lg:w-[28rem]">
            <Surprise list={list} />
          </div>
        </div>
        <div role="group" aria-label="Mood" className="scroll-x -mx-[var(--gutter)] flex gap-2 px-[var(--gutter)] md:mx-0 md:flex-wrap md:px-0">
          {MOODS.map((m) => (
            <Chip key={m.value} pressed={mood === m.value} onClick={() => setMood(m.value)}>
              {m.label}
            </Chip>
          ))}
        </div>
      </div>
      <div aria-live="polite" className="min-h-96">
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
            key={mood}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-2 gap-x-3 gap-y-8 md:gap-x-6 lg:grid-cols-4"
          >
            {picks.length ? (
              picks.map(({ event, reason }) => (
                <li key={event.id} className="flex flex-col gap-3">
                  <p className="text-sm font-semibold text-text-secondary">{reason}</p>
                  <div>
                    <EventCard tilt event={event} sizes="(min-width: 1024px) 25vw, 50vw" />
                  </div>
                </li>
              ))
            ) : (
              <li className="col-span-full text-base text-text-secondary">Nothing fits that mood right now. Try another one.</li>
            )}
          </motion.ul>
        </AnimatePresence>
      </div>
    </section>
  );
}
