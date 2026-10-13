"use client";

import { EventPageView } from "@/features/fan/event-page";
import { totals, whereLabel } from "@/lib/event";
import * as f from "@/lib/format";
import type { Host, TktEvent } from "@/mocks/types";

function Row({ label, value, step, onEdit }: { label: string; value: React.ReactNode; step: number; onEdit: (i: number) => void }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-1 border-b border-border-subtle py-3 last:border-b-0 sm:grid-cols-[8rem_1fr_auto]">
      <dt className="text-sm text-text-tertiary">{label}</dt>
      <dd className="col-start-1 row-start-2 min-w-0 text-sm sm:col-start-2 sm:row-start-1">{value}</dd>
      <dd className="col-start-2 row-span-2 row-start-1 sm:col-start-3 sm:row-span-1">
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="-mr-2 inline-flex min-h-11 items-center rounded-sm px-2 text-sm font-medium underline underline-offset-4"
          aria-label={`Edit ${label.toLowerCase()}`}
        >
          Edit
        </button>
      </dd>
    </div>
  );
}

export function ReviewStep({ event, host, onEdit }: { event: TktEvent; host?: Host; onEdit: (i: number) => void }) {
  const t = totals(event);
  const free = event.tiers.every((x) => x.price === 0);
  return (
    <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
      <div className="flex flex-col gap-6 rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-8">
        <header className="flex flex-col gap-1">
          <h2 className="text-2xl font-bold tracking-tight">Review & publish</h2>
          <p className="text-sm text-text-secondary">Check the details. The preview is what fans see.</p>
        </header>
        <dl>
          <Row label="Event" value={<span className="font-medium">{event.title}</span>} step={0} onEdit={onEdit} />
          <Row label="When" value={<span className="tabular-nums">{f.eventWhen(event.start, event.end)}</span>} step={1} onEdit={onEdit} />
          <Row label="Where" value={whereLabel(event)} step={1} onEdit={onEdit} />
          <Row label="Cover" value={event.accent ? "Photo accent on" : "Neutral accent"} step={2} onEdit={onEdit} />
          <Row
            label="Tickets"
            value={
              <ul className="flex flex-col gap-1">
                {event.tiers.map((x) => (
                  <li key={x.id} className="num">
                    {x.name} · {f.price(x.price)} · {f.count(x.capacity)}
                    {x.unlockCode && <span className="text-text-tertiary"> · hidden</span>}
                    {x.earlyBird && <span className="text-text-tertiary"> · early bird</span>}
                  </li>
                ))}
                <li className="num text-text-tertiary">
                  {f.count(t.capacity)} total{free ? " · free RSVP" : ""}
                </li>
              </ul>
            }
            step={3}
            onEdit={onEdit}
          />
          <Row label="Refunds" value={event.refundPolicy} step={4} onEdit={onEdit} />
          <Row label="Visibility" value={event.visibility === "public" ? "Public" : "Unlisted"} step={4} onEdit={onEdit} />
        </dl>
      </div>

      <figure className="flex flex-col gap-2">
        <figcaption className="label">Phone preview</figcaption>
        {/* Bordered 375px viewport (§6.2): the real fan page with draft data, no device bezel. */}
        <div
          className="h-(--preview-height) w-(--preview-width) max-w-full overflow-y-auto rounded-lg border border-border-default bg-surface"
          // Local sizes for the phone preview only (§6.2: 375px wide). Not brand tokens, so they stay out of tokens.css.
          style={{ "--preview-width": "375px", "--preview-height": "44rem" } as React.CSSProperties}
        >
          <EventPageView event={event} host={host} preview />
        </div>
      </figure>
    </div>
  );
}
