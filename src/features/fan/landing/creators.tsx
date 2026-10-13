"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "motion/react";
import { Avatar, Photo } from "@/components/ui/primitives";
import { ButtonLink } from "@/components/ui/button";
import * as f from "@/lib/format";
import type { Host, Photo as PhotoT, TktEvent } from "@/mocks/types";
import { FollowButton, FollowerCount } from "../event-page";
import { sceneStyle, useSceneProgress } from "./scene";

/** `lead` is the event whose cover fronts the panel (picked to avoid photos used above). */
export type Creator = { host: Host; events: TktEvent[]; lead: TktEvent; photo: PhotoT };

/** Share of each panel's scroll stretch spent holding still at the front. */
const HOLD = 0.55;

/** Creator spotlights (DESIGN_PLAN §000.1): a scroll-driven 3D coverflow on desktop, a snap strip elsewhere. */
export function Creators({ creators }: { creators: Creator[] }) {
  if (!creators.length) return null;
  return (
    <section aria-labelledby="creators-title">
      {/* Both are in the server HTML; CSS picks one, so nothing jumps on hydration. */}
      <div className="hidden lg:motion-safe:block">
        <Coverflow creators={creators} />
      </div>
      <div className="pt-16 md:pt-24 lg:motion-safe:hidden">
        <div className="content pb-6 md:pb-8">
          <Title />
        </div>
        <Strip creators={creators} />
      </div>
    </section>
  );
}

function Title({ id = "creators-title" }: { id?: string }) {
  return (
    <h2 id={id} className="display max-w-[16ch]">
      Made by people who care about the night
    </h2>
  );
}

/* ---------- Desktop: coverflow ---------- */

function Coverflow({ creators }: { creators: Creator[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const n = creators.length;
  const [front, setFront] = useState(0);
  const { progress: scrollYProgress, active } = useSceneProgress(wrap);

  // pos = which panel is at the front (0…n-1). Each panel holds, then the ring turns to the next.
  const input: number[] = [];
  const output: number[] = [];
  for (let i = 0; i < n; i++) {
    input.push(i / n, i === n - 1 ? 1 : i / n + HOLD / n);
    output.push(i, i);
  }
  const pos = useTransform(scrollYProgress, input, output);

  // React state only when the front panel changes (to move `inert`), never per frame.
  useMotionValueEvent(pos, "change", (v) => {
    const r = Math.round(v);
    if (r !== front) setFront(r);
  });

  const onFocus = (i: number) => {
    if (!wrap.current || i === front) return;
    const top = wrap.current.getBoundingClientRect().top + window.scrollY;
    const range = wrap.current.offsetHeight - window.innerHeight;
    window.scrollTo({ top: top + (range * (i + HOLD / 2)) / n });
  };

  return (
    <div ref={wrap} className="relative" style={{ height: `${n * 80}svh` }}>
      <motion.div className="sticky top-0 flex h-svh items-center justify-end overflow-hidden pt-[var(--bar-height)]" style={{ ...sceneStyle(active), perspective: 1400 }}>
        {/* Heading sits inside the scene, left; the ring fills the right. */}
        <div className="content pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2">
          <div className="max-w-[22rem] xl:max-w-[24rem]">
            <Title />
          </div>
        </div>
        <ol aria-label="Featured hosts" className="relative mr-[max(var(--gutter),calc((100vw_-_var(--content-max))/2_+_var(--gutter)+2rem))] h-[min(42rem,82svh)] w-[min(30rem,36vw)]" style={{ transformStyle: "preserve-3d" }}>
          {creators.map((c, i) => (
            <CoverPanel key={c.host.id} c={c} i={i} n={n} pos={pos} isFront={i === front} onFocus={() => onFocus(i)} />
          ))}
        </ol>
        <p className="num absolute right-[max(var(--gutter),calc((100vw_-_var(--content-max))/2_+_var(--gutter)))] bottom-8 text-sm font-semibold text-text-secondary" aria-live="polite">
          {String(front + 1).padStart(2, "0")} / {String(n).padStart(2, "0")}
        </p>
      </motion.div>
    </div>
  );
}

function CoverPanel({ c, i, n, pos, isFront, onFocus }: { c: Creator; i: number; n: number; pos: MotionValue<number>; isFront: boolean; onFocus: () => void }) {
  // d = distance from the front: 0 front, ±1 neighbors. Linear maps, clamped at ±1.
  const d = useTransform(pos, (p) => Math.max(-1.5, Math.min(1.5, i - p)));
  const x = useTransform(d, [-1, 0, 1], ["-60%", "0%", "60%"]);
  const rotateY = useTransform(d, [-1, 0, 1], [40, 0, -40]);
  const z = useTransform(d, [-1, 0, 1], [-260, 0, -260]);
  const opacity = useTransform(d, [-1.5, -1, 0, 1, 1.5], [0, 0.55, 1, 0.55, 0]);
  const zIndex = useTransform(d, (v) => n * 2 - Math.round(Math.abs(v) * 2));
  return (
    <motion.li
      className="absolute inset-0"
      style={{ x, rotateY, z, opacity, zIndex }}
      inert={!isFront || undefined}
      aria-hidden={!isFront || undefined}
      onFocus={onFocus}
    >
      <CoverCard c={c} />
    </motion.li>
  );
}

function CoverCard({ c }: { c: Creator }) {
  const { host, events, lead, photo } = c;
  return (
    <article aria-label={host.name} className="flex h-full flex-col overflow-hidden rounded-lg border border-border-subtle bg-surface-raised" style={{ boxShadow: "var(--shadow-overlay)" }}>
      <Link href={`/e/${lead.slug}`} className="group relative block shrink-0 overflow-hidden bg-surface-sunken">
        <div className="relative aspect-[2/1]">
          <Photo src={photo.url} alt={photo.alt} sizes="30rem" position={photo.position} className="transition-transform duration-250 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.04]" />
        </div>
        <span className="absolute bottom-3 left-3 rounded-sm bg-[var(--gray-0)] px-3 py-1 text-sm text-[var(--gray-ink)]">
          <span className="font-semibold">Next:</span> {lead.title} · <span className="num">{f.dayShort(lead.start)}</span>
        </span>
      </Link>
      <div className="flex min-h-0 flex-1 flex-col gap-4 p-6">
        <div className="flex items-center gap-3">
          <Avatar src={host.avatar} name={host.name} size={48} />
          <div className="flex min-w-0 flex-col">
            <h3 className="truncate text-2xl font-extrabold tracking-tight">{host.name}</h3>
            <p className="text-sm text-text-secondary">
              {host.city} · <FollowerCount host={host} />
            </p>
          </div>
        </div>
        <p className="line-clamp-2 text-base text-text-secondary">{host.bio}</p>
        <ul aria-label={`Upcoming from ${host.name}`} className="flex flex-col border-t border-border-subtle">
          {events.slice(0, 3).map((e) => (
            <li key={e.id} className="border-b border-border-subtle">
              <Link href={`/e/${e.slug}`} className="flex min-h-11 items-baseline gap-4 py-2 hover:underline hover:underline-offset-4">
                <span className="num w-20 shrink-0 text-sm text-text-secondary">{f.dayShort(e.start)}</span>
                <span className="truncate text-sm font-semibold">{e.title}</span>
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-auto flex gap-3">
          <FollowButton hostId={host.id} name={host.name} />
          <ButtonLink href={`/h/${host.handle}`} variant="secondary">
            View host
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

/* ---------- Phone and tablet: snap strip with a gentle turn ---------- */

function Strip({ creators }: { creators: Creator[] }) {
  const strip = useRef<HTMLOListElement>(null);
  return (
    <ol
      ref={strip}
      aria-label="Featured hosts"
      className="scroll-x flex snap-x snap-mandatory scroll-px-[var(--gutter)] gap-3 px-[var(--gutter)] pb-16 md:gap-6 md:pb-32"
      style={{ perspective: 1000 }}
    >
      {creators.map((c) => (
        <StripCard key={c.host.id} c={c} strip={strip} />
      ))}
    </ol>
  );
}

function StripCard({ c, strip }: { c: Creator; strip: React.RefObject<HTMLOListElement | null> }) {
  const ref = useRef<HTMLLIElement>(null);
  // Progress of this card across the strip: 0 entering right, 0.5 centered, 1 leaving left.
  const { scrollXProgress } = useScroll({ container: strip, target: ref, axis: "x", offset: ["start end", "end start"] });
  const rotateY = useTransform(scrollXProgress, [0, 0.5, 1], [-14, 0, 14], { clamp: true });
  return (
    <motion.li ref={ref} className="flex w-[85vw] max-w-md shrink-0 snap-start flex-col gap-4" style={{ rotateY }}>
      <Link href={`/e/${c.lead.slug}`} className="group relative block overflow-hidden rounded-lg bg-surface-sunken">
        <div className="relative aspect-[4/3]">
          <Photo src={c.photo.url} alt={c.photo.alt} sizes="85vw" position={c.photo.position} />
        </div>
      </Link>
      <div className="flex items-center gap-3">
        <Avatar src={c.host.avatar} name={c.host.name} size={48} />
        <div className="flex min-w-0 flex-col">
          <h3 className="truncate text-2xl font-extrabold tracking-tight">{c.host.name}</h3>
          <p className="num truncate text-sm text-text-secondary">
            Next: {c.lead.title} · {f.dayShort(c.lead.start)}
          </p>
        </div>
      </div>
      <div className="flex gap-3">
        <FollowButton hostId={c.host.id} name={c.host.name} />
        <ButtonLink href={`/h/${c.host.handle}`} variant="secondary">
          View host
        </ButtonLink>
      </div>
    </motion.li>
  );
}
