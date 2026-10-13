"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { Photo } from "@/components/ui/primitives";
import * as f from "@/lib/format";
import type { City, Photo as PhotoT } from "@/mocks/types";
import { searchHref } from "../catalog";

export type CityRow = { city: City; count: number; cover?: PhotoT };

/** Cities as type. Desktop: hovering or focusing a row slides that city's photo alongside it (transform only). */
export function Cities({ rows }: { rows: CityRow[] }) {
  const list = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const [y, setY] = useState<number | null>(null);
  const [firstY, setFirstY] = useState(0);

  // With nothing hovered, the photo rests beside the first city.
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      const el = list.current?.querySelector("a");
      if (el) setFirstY(el.offsetTop + el.offsetHeight / 2);
    });
    return () => cancelAnimationFrame(raf);
  }, []);
  const shown = active ?? 0;

  const show = (i: number, el: HTMLElement) => {
    setActive(i);
    setY(el.offsetTop + el.offsetHeight / 2);
  };

  return (
    <section aria-labelledby="cities-title" className="content flex flex-col gap-8 py-16 md:py-24">
      <h2 id="cities-title" className="display">
        Wherever you are
      </h2>

      {/* Phone and tablet: photo tiles. */}
      <ul className="grid grid-cols-2 gap-3 md:gap-6 lg:hidden">
        {rows.map((r, i) => (
          <li key={r.city} className={i === 0 ? "col-span-2" : ""}>
            <Link href={searchHref({ city: r.city })} className="group relative block overflow-hidden rounded-lg bg-surface-sunken">
              <div className={`relative ${i === 0 ? "aspect-[2/1]" : "aspect-square"}`}>
                {r.cover && <Photo src={r.cover.url} alt="" sizes="50vw" position={r.cover.position} />}
              </div>
              <span className="absolute bottom-3 left-3 flex flex-col rounded-sm bg-[var(--gray-0)] px-3 py-2 text-[var(--gray-ink)]">
                <span className="font-display text-lg leading-tight font-extrabold">{r.city}</span>
                <span className="num text-xs font-medium">{f.plural(r.count, "event")}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      {/* Desktop: big type list with a following photo. */}
      <div className="relative hidden lg:block" onMouseLeave={() => setActive(null)}>
        <ol ref={list} className="flex flex-col border-t border-border-subtle">
          {rows.map((r, i) => (
            <li key={r.city} className="border-b border-border-subtle">
              <Link
                href={searchHref({ city: r.city })}
                onMouseEnter={(e) => show(i, e.currentTarget)}
                onFocus={(e) => show(i, e.currentTarget)}
                onBlur={() => setActive(null)}
                className={`group flex items-baseline justify-between gap-6 py-6 transition-colors duration-150 ${active !== null && active !== i ? "text-text-tertiary" : ""}`}
              >
                <span className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-none font-extrabold tracking-tight">{r.city}</span>
                <span className="flex items-center gap-2 text-base text-text-secondary">
                  <span className="num">{f.plural(r.count, "event")}</span>
                  <ArrowUpRight size={20} aria-hidden className="transition-transform duration-150 group-hover:translate-x-1 group-hover:-translate-y-1" />
                </span>
              </Link>
            </li>
          ))}
        </ol>
        <motion.div
          aria-hidden
          className="pointer-events-none absolute top-0 right-48 w-80 overflow-hidden rounded-lg bg-surface-sunken"
          initial={false}
          animate={{ y: (active === null || y === null ? firstY : y) - 120, opacity: 1 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
        >
          {rows.map((r, i) => (
            <div key={r.city} className="absolute inset-0 transition-opacity duration-150" style={{ opacity: shown === i ? 1 : 0 }}>
              {r.cover && <Photo src={r.cover.url} alt="" sizes="320px" position={r.cover.position} />}
            </div>
          ))}
          <div className="aspect-[4/3]" />
        </motion.div>
      </div>
    </section>
  );
}
