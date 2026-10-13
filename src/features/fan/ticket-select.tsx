"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Ban, Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Stepper } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/field";
import { Num } from "@/components/ui/number";
import { EndState, Status } from "@/components/ui/primitives";
import { useStore } from "@/features/store";
import { eventState, remaining } from "@/lib/event";
import * as f from "@/lib/format";
import { HOLD_MS } from "@/mocks/fees";
import type { PromoCode, TktEvent } from "@/mocks/types";
import { checkCode, priceLines, promoLabel, tierNow } from "./pricing";

export type Selection = ReturnType<typeof useTicketSelection>;

/** Selection state shared by the sheet (mobile) and the in-panel picker (desktop). */
export function useTicketSelection(event: TktEvent, initialTier?: string | null) {
  const unlocked = useStore((s) => s.unlocked);
  const [qty, setQty] = useState<Record<string, number>>(() => {
    const t = event.tiers.find((x) => x.id === initialTier);
    if (!t) return {};
    const s = tierNow(t, unlocked);
    return s === "on-sale" || s === "low" ? { [t.id]: 1 } : {};
  });
  const [promo, setPromo] = useState<PromoCode | undefined>();
  const items = Object.entries(qty)
    .filter(([, n]) => n > 0)
    .map(([tierId, n]) => ({ tierId, qty: n }));
  const lines = priceLines(event, items, promo);
  const free = event.tiers.every((t) => t.price === 0);
  const state = eventState(event);
  return { event, qty, setQty, promo, setPromo, items, lines, free, state, unlocked };
}

export function CartCount({ sel }: { sel: Selection }) {
  return (
    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-sm bg-surface-sunken px-2 text-sm font-medium">
      <Num value={sel.lines.qty} />
      <span className="sr-only"> selected</span>
    </span>
  );
}

export function TicketSelectBody({ sel }: { sel: Selection }) {
  const { event, qty, setQty, unlocked, state } = sel;
  const waitlist = useStore((s) => s.waitlist);
  const joinWaitlist = useStore((s) => s.joinWaitlist);

  if (state === "ended" || state === "canceled") {
    return (
      <EndState
        className="py-6"
        title={state === "ended" ? "Sales closed" : "This event was canceled"}
        body={state === "ended" ? "This event has ended, so tickets are no longer on sale." : "Tickets are no longer on sale. Ticket holders get a full refund."}
        actions={null}
      />
    );
  }

  const visible = event.tiers.filter((t) => tierNow(t, unlocked) !== "hidden");
  // Sold-out tiers go last, collapsed to one line.
  const open = visible.filter((t) => tierNow(t, unlocked) !== "sold-out");
  const gone = visible.filter((t) => tierNow(t, unlocked) === "sold-out");

  return (
    <div className="flex flex-col gap-6">
      <ul className="flex flex-col gap-3">
        {open.map((t) => {
          const s = tierNow(t, unlocked);
          const n = qty[t.id] ?? 0;
          const max = Math.min(t.perOrderLimit, remaining(t));
          return (
            <li
              key={t.id}
              // Selected: stronger tint plus a 2px accent ring (outline, not a shadow).
              className={`tint flex flex-col gap-3 rounded-lg p-4 outline-2 -outline-offset-2 transition-[outline-color] duration-150 ${n > 0 ? "outline-[var(--event-accent)] [--tint:22%]" : "outline-transparent"}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="text-base font-bold">
                    {t.name}
                    {t.unlockCode && <span className="ml-2 text-sm font-normal text-text-secondary">Code applied</span>}
                  </span>
                  {t.description && <span className="text-sm text-text-secondary">{t.description}</span>}
                </div>
                <span className="num text-lg font-bold">{f.price(t.price)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 flex-col gap-1 text-sm">
                  {s === "low" && (
                    <Status tone="warning">
                      <span className="num">{f.count(remaining(t))} left</span>
                    </Status>
                  )}
                  {s === "sales-closed" && <Status>Sales closed</Status>}
                  {(s === "on-sale" || s === "low") && (
                    <span className="text-text-secondary">
                      Sales end <span className="num">{f.date(t.salesEnd)}</span>
                      {t.perOrderLimit < remaining(t) && (
                        <>
                          {" · "}max <span className="num">{t.perOrderLimit}</span>
                        </>
                      )}
                    </span>
                  )}
                </div>
                {(s === "on-sale" || s === "low") && (
                  <Stepper label={t.name} value={n} max={max} onChange={(v) => setQty({ ...qty, [t.id]: Math.max(0, Math.min(max, v)) })} />
                )}
              </div>
            </li>
          );
        })}
        {gone.map((t) => {
          const onList = waitlist.includes(t.id);
          return (
            <li key={t.id} className="flex min-h-11 items-center justify-between gap-4 rounded-lg bg-surface-sunken px-4 py-2 text-sm">
              <span className="flex min-w-0 flex-wrap items-center gap-x-2">
                <span className="font-medium text-text-secondary">{t.name}</span>
                <span className="num text-text-secondary">{f.price(t.price)}</span>
                <Status tone="danger" icon={<Ban size={14} aria-hidden />}>
                  Sold out
                </Status>
              </span>
              {t.waitlist &&
                (onList ? (
                  <Status tone="success" icon={<Check size={14} aria-hidden />}>
                    On the waitlist
                  </Status>
                ) : (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      joinWaitlist(t.id);
                      toast(`Joined the waitlist for ${t.name}`);
                    }}
                  >
                    Join waitlist
                  </Button>
                ))}
            </li>
          );
        })}
      </ul>
      <PromoField sel={sel} />
    </div>
  );
}

function PromoField({ sel }: { sel: Selection }) {
  const promos = useStore((s) => s.promos);
  const unlock = useStore((s) => s.unlock);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string>();
  const [note, setNote] = useState<string>();
  const [reveal, setReveal] = useState(false);

  const apply = (e: FormEvent) => {
    e.preventDefault();
    const r = checkCode(code, sel.event, promos, Date.now());
    if (r.kind === "error") {
      setError(r.message);
      setNote(undefined);
      return;
    }
    setError(undefined);
    if (r.kind === "tier") {
      unlock(r.code);
      setNote(`Added the ${r.tierName} tier.`);
      toast(`Added the ${r.tierName} tier`);
    } else {
      sel.setPromo(r.promo);
      setNote(undefined);
    }
    setCode("");
  };

  if (sel.promo) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-sm bg-surface-sunken px-4 py-2 text-sm">
        <span>
          <span className="font-mono font-medium">{sel.promo.code}</span> applied ·{" "}
          {sel.promo.kind === "percent" ? promoLabel(sel.promo) : <span className="num">{f.money(sel.promo.amount)} off</span>}
        </span>
        <Button variant="ghost" size="sm" iconLeft={<X size={16} aria-hidden />} onClick={() => sel.setPromo(undefined)}>
          Remove
        </Button>
      </div>
    );
  }

  if (!reveal) {
    return (
      <div>
        {note && <p className="mb-2 text-sm text-text-secondary">{note}</p>}
        <button type="button" onClick={() => setReveal(true)} className="-mx-1 min-h-11 rounded-sm px-1 text-sm font-medium underline underline-offset-4">
          Have a code?
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={apply} className="flex items-start gap-2" noValidate>
      <Field label="Promo code" error={error} hint={note} className="flex-1">
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            aria-invalid={invalid || undefined}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoCapitalize="characters"
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
        )}
      </Field>
      <Button type="submit" variant="secondary" className="mt-6">
        Apply
      </Button>
    </form>
  );
}

export function TicketSelectFooter({ sel }: { sel: Selection }) {
  const router = useRouter();
  const createHold = useStore((s) => s.createHold);
  const { lines, free, state } = sel;
  if (state === "ended" || state === "canceled") return null;

  const go = () => {
    const id = createHold({ eventId: sel.event.id, items: sel.items, promo: sel.promo?.code }, HOLD_MS);
    router.push(`/checkout/${id}`);
  };

  return (
    <div className="flex flex-col gap-2">
      {lines.fees > 0 && (
        <p className="text-sm text-text-tertiary">
          Plus <Num money value={lines.fees} /> service fee, itemized at checkout
        </p>
      )}
      <Button variant="event" size="lg" fullWidth disabled={lines.qty === 0} onClick={go}>
        {lines.qty === 0 ? (
          "Select tickets"
        ) : free ? (
          // One span: the button is a flex row with a gap, which doubled every space.
          <span>
            RSVP · <Num value={lines.qty} /> {lines.qty === 1 ? "spot" : "spots"}
          </span>
        ) : (
          <span>
            Get <Num value={lines.qty} /> {lines.qty === 1 ? "ticket" : "tickets"} · <Num money value={lines.subtotal - lines.discount} />
          </span>
        )}
      </Button>
    </div>
  );
}
