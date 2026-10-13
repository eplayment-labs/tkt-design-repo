"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ErrorState, Photo, Status } from "@/components/ui/primitives";
import { useHydrated } from "@/components/providers";
import { useAllEvents } from "@/features/events";
import { useStore } from "@/features/store";
import { eventState, isFree, totals, type EventState } from "@/lib/event";
import * as f from "@/lib/format";
import { hostById } from "@/mocks/hosts";
import { attendeesFor } from "@/mocks/people";
import type { Attendee, Host, TktEvent } from "@/mocks/types";

/* ---------- Loading gate: skeletons only after 300ms (DESIGN_PLAN §8) ---------- */

export function useDelayed(ms = 300) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setShow(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return show;
}

/** Renders the skeleton only once loading has run past 300ms. */
export function Delayed({ children }: { children: ReactNode }) {
  const show = useDelayed();
  return show ? <>{children}</> : null;
}

/** Ticks once a minute so "now"-based states stay pure during render. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const t = setInterval(tick, intervalMs);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [intervalMs]);
  return now;
}

/* ---------- Host data ---------- */

/** Mock host merged with whatever the host edited in onboarding/profile. */
export function useHost(): Host | undefined {
  const hostId = useStore((s) => s.hostId);
  const profile = useStore((s) => s.hostProfile);
  return useMemo(() => {
    const base = hostById(hostId);
    return base ? { ...base, ...profile, id: base.id, payoutMasked: base.payoutMasked } : undefined;
  }, [hostId, profile]);
}

export function useHostEvents(): TktEvent[] {
  const hostId = useStore((s) => s.hostId);
  const all = useAllEvents();
  return useMemo(() => all.filter((e) => e.hostId === hostId), [all, hostId]);
}

/** Store-backed event lookup for host screens. `ready` is false until persisted state loads. */
export function useHostEvent(id: string) {
  const hydrated = useHydrated();
  const events = useHostEvents();
  const event = events.find((e) => e.id === id);
  return { ready: hydrated, event };
}

/* ---------- Attendees + check-ins (mock base + this browser's check-ins) ---------- */

export type Row = Attendee & { checkedAt?: string; local: boolean };

export function useAttendees(eventId: string) {
  const map = useStore((s) => s.checkIns[eventId]);
  const base = useMemo(() => attendeesFor(eventId), [eventId]);
  return useMemo(() => {
    const local = map ?? {};
    const rows: Row[] = base.map((a) => ({
      ...a,
      checkedAt: local[a.id] ?? a.checkedInAt,
      local: Boolean(local[a.id]),
    }));
    const known = new Set(base.map((a) => a.id));
    // Fan tickets from this browser (scanned at the door) count too.
    const extra = Object.keys(local).filter((k) => !known.has(k)).length;
    const checked = rows.filter((r) => r.checkedAt).length + extra;
    return { rows, checked };
  }, [base, map]);
}

/* ---------- Status word per event state ---------- */

const stateWord: Record<EventState, { label: string; tone: "neutral" | "success" | "warning" | "danger" }> = {
  draft: { label: "Draft", tone: "neutral" },
  "on-sale": { label: "On sale", tone: "success" },
  "sold-out": { label: "Sold out", tone: "success" },
  "sales-closed": { label: "Sales closed", tone: "neutral" },
  ended: { label: "Ended", tone: "neutral" },
  canceled: { label: "Canceled", tone: "danger" },
};

export function EventStatus({ event, now, pill = true }: { event: TktEvent; now: number; pill?: boolean }) {
  const state = eventState(event, now);
  const s = stateWord[state];
  // Free events take RSVPs, not sales.
  const label = state === "on-sale" && isFree(event) ? "RSVPs open" : s.label;
  const status = <Status tone={s.tone}>{label}</Status>;
  return pill ? <span className="inline-flex w-fit items-center rounded-pill bg-surface-sunken px-3 py-1">{status}</span> : status;
}

/* ---------- Capacity bar: one inline bar + "312 / 500" ---------- */

export function CapacityBar({ event, className = "" }: { event: TktEvent; className?: string }) {
  const { sold, capacity } = totals(event);
  const pct = capacity ? Math.min(100, (sold / capacity) * 100) : 0;
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="h-2 min-w-16 flex-1 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden>
        <div className="h-full rounded-pill bg-text-primary" style={{ width: `${pct}%` }} />
      </div>
      <span className="num text-sm text-text-secondary">
        {f.count(sold)} / {f.count(capacity)}
        <span className="sr-only"> sold</span>
      </span>
    </div>
  );
}

/* ---------- Cover thumb ---------- */

export function Thumb({ event, size = "md" }: { event: TktEvent; size?: "sm" | "md" }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-inner bg-surface-sunken ${size === "sm" ? "h-12 w-12" : "h-16 w-16"}`}>
      <Photo src={event.cover.url} alt="" sizes="64px" position={event.cover.position} />
    </span>
  );
}

/* ---------- Soft pop building blocks (DESIGN_PLAN §0) ---------- */

export const titleCls = "text-4xl font-extrabold tracking-(--tracking-display)";

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className={titleCls}>{children}</h1>;
}

/** White rounded-lg card. Grid cards never get a shadow. */
export function Panel({ children, className = "", tint, ...rest }: { children: ReactNode; className?: string; tint?: boolean } & React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={`rounded-lg border border-border-subtle p-4 md:p-6 ${tint ? "tint" : "bg-surface-raised"} ${className}`} {...rest}>
      {children}
    </section>
  );
}

/* ---------- Share link ---------- */

export function ShareLinkButton({ slug, variant = "primary" }: { slug: string; variant?: "primary" | "secondary" }) {
  return (
    <Button
      variant={variant}
      iconLeft={<Link2 size={18} aria-hidden />}
      onClick={() => {
        const url = `${window.location.origin}/e/${slug}`;
        navigator.clipboard?.writeText(url).catch(() => {});
        toast("Copied the event link");
      }}
    >
      Copy link
    </Button>
  );
}

/* ---------- Event sub-page header (attendees, promo) ---------- */

export function SubHeader({ event, title, actions }: { event: TktEvent; title: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4">
      <Link
        href={`/host/events/${event.id}`}
        className="-ml-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-sm px-2 text-sm text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft size={16} aria-hidden />
        {event.title}
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <PageTitle>{title}</PageTitle>
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </header>
  );
}

/* ---------- Not found / error ---------- */

export function EventNotFound() {
  return (
    <div className="content py-8">
      <ErrorState
        title="Event not found"
        body="It may have been removed, or the link is wrong."
        actions={
          <Link href="/host" className="inline-flex min-h-11 items-center rounded-sm border border-border-default bg-surface-raised px-4 text-sm font-medium">
            Back to events
          </Link>
        }
      />
    </div>
  );
}

/** Error view with a retry that drops the demo `?state=` param. */
export function RetryError({ title, body }: { title?: string; body?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  return (
    <ErrorState
      title={title}
      body={body}
      actions={
        <Button
          variant="secondary"
          onClick={() => {
            const next = new URLSearchParams(params);
            next.delete("state");
            const q = next.toString();
            router.replace(q ? `${pathname}?${q}` : pathname);
          }}
        >
          Try again
        </Button>
      }
    />
  );
}

/* ---------- CSV ---------- */

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([rows.map((r) => r.map(esc).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ---------- Images: downscale uploads to a data URL so drafts survive reloads ---------- */

export function fileToDataUrl(file: File, max = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image failed to load"));
    };
    img.src = url;
  });
}
