import type { ReactNode } from "react";
import { eventState, tierState } from "@/lib/event";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";

/** Soft pop section heading: 800 weight, tight tracking (DESIGN_PLAN §0). */
export function Heading({ children, id, as: Tag = "h2", size = "2xl", aside }: { children: ReactNode; id?: string; as?: "h1" | "h2" | "h3"; size?: "lg" | "2xl" | "4xl"; aside?: ReactNode }) {
  const cls = size === "4xl" ? "text-4xl" : size === "lg" ? "text-lg" : "text-2xl";
  return (
    <div className="flex items-baseline justify-between gap-4">
      <Tag id={id} className={`${cls} font-extrabold tracking-tight`}>
        {children}
      </Tag>
      {aside}
    </div>
  );
}

/** "10 / OCT" date sticker for a photo corner. */
export function DateSticker({ iso }: { iso: string }) {
  const [, day, month] = f.dayShort(iso).split(" ");
  return (
    <span className="sticker">
      <b className="num">{day}</b>
      {month}
    </span>
  );
}

/** "Sold out" or "Few left" when either applies; otherwise null. */
export function statusSticker(e: TktEvent): string | null {
  const s = eventState(e);
  if (s === "sold-out") return "Sold out";
  if (s === "on-sale" && e.tiers.some((t) => !t.unlockCode && tierState(t) === "low") && !e.tiers.some((t) => !t.unlockCode && tierState(t) === "on-sale")) return "Few left";
  return null;
}

/** One sticker per card: status beats date. */
export function CardSticker({ event, date }: { event: TktEvent; date?: boolean }) {
  const status = statusSticker(event);
  if (status) return <span className="sticker">{status}</span>;
  return date ? <DateSticker iso={event.start} /> : null;
}
