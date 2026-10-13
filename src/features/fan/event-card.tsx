"use client";

import Link from "next/link";
import { Ban } from "lucide-react";
import { Photo, Slot } from "@/components/ui/primitives";
import { isFree, whereLabel } from "@/lib/event";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";
import { statusPill, type Pill } from "./catalog";
import { lowestOpen } from "./pricing";
import { motion } from "motion/react";
import { useTilt } from "./fx";

/** Date block on the photo: white, upright, month small over a big day number. */
export function DateBlock({ iso, className = "" }: { iso: string; className?: string }) {
  const [, day, month] = f.dayShort(iso).split(" ");
  return (
    <span className={`flex min-w-12 flex-col items-center rounded-sm bg-[var(--gray-0)] px-2 py-1 text-[var(--gray-ink)] transition-transform duration-150 group-hover:-translate-y-0.5 ${className}`}>
      <span className="text-xs font-semibold tracking-wide uppercase">{month}</span>
      <span className="font-display num text-2xl leading-none font-extrabold">{day}</span>
    </span>
  );
}

/** Status label on a photo: always white with ink text, so it reads on any photo in either theme. */
export function PhotoPill({ pill, className = "" }: { pill: Pill; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-pill bg-[var(--gray-0)] px-3 py-1 text-xs font-semibold text-[var(--gray-ink)] ${className}`}>
      {pill.tone === "danger" && <Ban size={12} aria-hidden />}
      {pill.tone === "warning" && <span aria-hidden className="h-2 w-2 rounded-pill bg-[var(--warning-500)]" />}
      {pill.label}
    </span>
  );
}

export function PriceText({ event }: { event: TktEvent }) {
  if (isFree(event)) return <span className="font-semibold">Free</span>;
  return (
    <span className="font-semibold">
      From <span className="num">{f.price(lowestOpen(event))}</span>
    </span>
  );
}

/**
 * Storefront card (DESIGN_PLAN §00): image first, text below, one link.
 * The photo zooms 1.04× inside its frame on hover; the card never scales.
 */
export function EventCard({
  event,
  ratio = "landscape",
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority,
  showTime = true,
  tilt,
}: {
  event: TktEvent;
  ratio?: "landscape" | "portrait";
  sizes?: string;
  priority?: boolean;
  showTime?: boolean;
  /** Tilt the photo toward the pointer (≤6°, fine pointers only). */
  tilt?: boolean;
}) {
  const pill = statusPill(event);
  const t = useTilt(6);
  return (
    <Link href={`/e/${event.slug}`} className="group flex h-full flex-col gap-3 rounded-lg" {...(tilt ? t.handlers : {})}>
      <motion.div
        style={tilt ? t.style : undefined}
        className={`relative overflow-hidden rounded-lg bg-surface-sunken ${ratio === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"}`}
      >
        <Photo
          src={event.cover.url}
          alt={event.cover.alt}
          sizes={sizes}
          position={event.cover.position}
          priority={priority}
          className="transition-transform duration-250 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-[1.04]"
        />
        <DateBlock iso={event.start} className="absolute top-3 left-3" />
        {pill && <PhotoPill pill={pill} className="absolute right-3 bottom-3" />}
      </motion.div>
      <div className="flex flex-1 flex-col gap-1">
        <h3 className="font-display line-clamp-2 text-lg leading-tight font-extrabold tracking-tight group-hover:underline group-hover:underline-offset-4">
          {event.title}
        </h3>
        <p className="truncate text-sm text-text-secondary">
          {showTime && (
            <span className="num">
              {f.dayShort(event.start).split(" ")[0]} · {f.time(event.start)} ·{" "}
            </span>
          )}
          {whereLabel(event)}
          {event.format !== "online" && event.venue ? `, ${event.city}` : ""}
        </p>
        <p className="mt-auto pt-1 text-sm">
          <PriceText event={event} />
        </p>
      </div>
    </Link>
  );
}

export function EventCardSkeleton({ ratio = "landscape" }: { ratio?: "landscape" | "portrait" }) {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <div className={`rounded-lg bg-surface-sunken ${ratio === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"}`} />
      <span className="text-lg">
        <Slot w="70%" />
      </span>
      <span className="text-sm">
        <Slot w="9rem" />
      </span>
      <span className="text-sm">
        <Slot w="6rem" />
      </span>
    </div>
  );
}
