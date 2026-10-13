"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Sheet } from "@/components/ui/controls";
import { EndState, ErrorState } from "@/components/ui/primitives";
import { useHydrated } from "@/components/providers";
import { useDemoState, useEvent, withDemoState } from "@/features/events";
import { hostById } from "@/mocks/hosts";
import { accentVars } from "@/lib/accent";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";
import { EventPageSkeleton, EventPageView } from "./event-page";
import { useDelayedFlag, useIsDesktop } from "./hooks";
import { CartCount, TicketSelectBody, TicketSelectFooter, useTicketSelection } from "./ticket-select";

/**
 * Lives in the /e/[slug] layout so /e/[slug] ↔ /e/[slug]/tickets keeps the
 * page mounted: the selector opens over (mobile) or inside (desktop) it.
 */
export function EventRoute({ slug }: { slug: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const tier = useSearchParams().get("tier");
  const demo = useDemoState();
  const hydrated = useHydrated();
  const isDesktop = useIsDesktop();
  const raw = useEvent(slug);

  const loading = demo === "loading" || (!raw && !hydrated);
  const showSkeleton = useDelayedFlag(loading);
  const keep = demo ? `state=${demo}` : "";

  if (demo === "error") {
    return (
      <div className="content">
        <ErrorState title="This event didn't load" actions={<Button onClick={() => router.replace(`/e/${slug}`)}>Try again</Button>} />
      </div>
    );
  }
  if (loading) return showSkeleton ? <EventPageSkeleton /> : null;
  if (!raw) {
    return (
      <div className="content">
        <EndState
          title="We couldn't find that event"
          body="The link may be wrong, or the host may have taken the event down."
          actions={<ButtonLink href="/discover">Find events</ButtonLink>}
        />
      </div>
    );
  }

  const event = withDemoState(raw, demo);
  const host = hostById(event.hostId);
  const open = pathname.endsWith("/tickets");

  const openTickets = (tierId?: string) => {
    const q = [tierId ? `tier=${tierId}` : "", keep].filter(Boolean).join("&");
    router.push(`/e/${slug}/tickets${q ? `?${q}` : ""}`, { scroll: false });
    // Desktop picks tickets inside the hero panel, so bring it into view.
    if (isDesktop) window.scrollTo({ top: 0 });
  };
  const close = () => router.push(`/e/${slug}${keep ? `?${keep}` : ""}`, { scroll: false });

  return (
    <>
      <EventPageView
        event={event}
        host={host}
        onGetTickets={openTickets}
        panel={isDesktop && open ? <PanelSelect key={tier ?? "all"} event={event} tier={tier} onClose={close} /> : undefined}
      />
      {!isDesktop && <SheetSelect key={tier ?? "all"} event={event} tier={tier} open={open} onClose={close} />}
    </>
  );
}

function PanelSelect({ event, tier, onClose }: { event: TktEvent; tier: string | null; onClose: () => void }) {
  const sel = useTicketSelection(event, tier);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <div className="-ml-3 flex items-center gap-2">
          <Button variant="ghost" iconOnly aria-label="Back to event" iconLeft={<ArrowLeft size={18} aria-hidden />} onClick={onClose} />
          <h2 className="text-2xl font-extrabold tracking-tight">{event.title}</h2>
        </div>
        <p className="num text-sm text-text-secondary">
          {f.dayShort(event.start)} · {f.time(event.start)}
        </p>
      </div>
      <TicketSelectBody sel={sel} />
      <TicketSelectFooter sel={sel} />
    </div>
  );
}

function SheetSelect({ event, tier, open, onClose }: { event: TktEvent; tier: string | null; open: boolean; onClose: () => void }) {
  const sel = useTicketSelection(event, tier);
  // The sheet portals out of the page's .event-scope, so each part re-applies the accent.
  const accent = accentVars(event.accent);
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={
        <span className="flex items-center gap-2">
          {event.title} <CartCount sel={sel} />
        </span>
      }
      description={`${f.dayShort(event.start)} · ${f.time(event.start)}`}
      footer={
        <div className="event-scope" style={accent}>
          <TicketSelectFooter sel={sel} />
        </div>
      }
    >
      <div className="event-scope" style={accent}>
        <TicketSelectBody sel={sel} />
      </div>
    </Sheet>
  );
}
