"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Ban, CircleCheck, ExternalLink, QrCode, Tag, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { LineChart } from "@/components/ui/chart";
import { Num } from "@/components/ui/number";
import { EndState, Slot } from "@/components/ui/primitives";
import { accentVars } from "@/lib/accent";
import { useDemoState, withDemoState } from "@/features/events";
import { eventState, isFree, salesEnd, totals } from "@/lib/event";
import * as f from "@/lib/format";
import type { Tier, TktEvent } from "@/mocks/types";
import { Delayed, EventNotFound, EventStatus, Panel, RetryError, ShareLinkButton, Thumb, useAttendees, useHostEvent, useNow, type Row } from "./shared";

type Order = { number: string; buyer: string; email: string; tierId: string; qty: number; total: number; at: string; live?: boolean };

const BUYERS = ["Bea Cruz", "Paolo Garcia", "Kat Mendoza", "Jun Ramos", "Trish Tan", "Carlo Lim", "Mara Dizon", "Rafa Uy"];

/** Recent orders rebuilt from the deterministic attendee list. */
function ordersFrom(rows: Row[], tiers: Tier[]): Order[] {
  const byNumber = new Map<string, Order>();
  for (const r of rows) {
    const price = tiers.find((t) => t.id === r.tierId)?.price ?? 0;
    const o = byNumber.get(r.orderNumber);
    if (o) {
      o.qty++;
      o.total += price;
    } else {
      byNumber.set(r.orderNumber, { number: r.orderNumber, buyer: r.name, email: r.email, tierId: r.tierId, qty: 1, total: price, at: r.purchasedAt });
    }
  }
  return [...byNumber.values()].sort((a, b) => b.at.localeCompare(a.at));
}

/* ---------- Pieces ---------- */

function Clause({ children }: { children: ReactNode }) {
  return <span className="whitespace-nowrap">{children}</span>;
}

function Sep() {
  return <span className="text-text-tertiary"> · </span>;
}

function QuickActions({ event, readOnly }: { event: TktEvent; readOnly: boolean }) {
  return (
    <Panel aria-labelledby="actions-title" className="flex flex-col gap-4 lg:col-span-5">
      <h2 id="actions-title" className={cardTitle}>
        Quick actions
      </h2>
      <div className="flex flex-col gap-3">
        {!readOnly && (
          <ButtonLink href={`/host/events/${event.id}/check-in`} size="lg" fullWidth iconLeft={<QrCode size={20} aria-hidden />}>
            Check-in
          </ButtonLink>
        )}
        <div className="grid grid-cols-2 gap-3">
          <ButtonLink href={`/host/events/${event.id}/attendees`} variant="secondary" fullWidth iconLeft={<Users size={18} aria-hidden />}>
            Attendees
          </ButtonLink>
          <ButtonLink href={`/host/events/${event.id}/promo`} variant="secondary" fullWidth iconLeft={<Tag size={18} aria-hidden />}>
            Promo codes
          </ButtonLink>
        </div>
        <ShareLinkButton slug={event.slug} variant="secondary" />
      </div>
      <p className="mt-auto truncate text-sm text-text-secondary">
        Public page <span className="font-mono">/e/{event.slug}</span>
      </p>
    </Panel>
  );
}

const cardTitle = "text-lg font-bold";

function Banner({ tone, icon, title, body }: { tone: "danger" | "warning" | "neutral"; icon: ReactNode; title: string; body: string }) {
  const cls = tone === "danger" ? "bg-danger-subtle text-danger" : tone === "warning" ? "bg-warning-subtle text-warning" : "bg-surface-sunken text-text-secondary";
  return (
    <div role="status" className={`flex items-start gap-3 rounded-lg px-4 py-4 md:px-6 ${cls}`}>
      <span className="flex h-5 items-center">{icon}</span>
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold">{title}</span>
        <span className="text-sm text-text-secondary">{body}</span>
      </div>
    </div>
  );
}

const swatch = {
  in: "bg-text-primary",
  sold: "bg-text-secondary",
  left: "bg-surface-raised border border-border-default",
};

function Swatch({ kind }: { kind: keyof typeof swatch }) {
  return <span className={`mr-1 inline-block h-3 w-3 rounded-pill align-middle ${swatch[kind]}`} aria-hidden />;
}

function TierBars({ event, rows, animated, showCheckIns, unit }: { event: TktEvent; rows: Row[]; animated: boolean; showCheckIns: boolean; unit: string }) {
  return (
    <div className="flex flex-col gap-2">
      {/* One shared legend; each row repeats the numbers in words. */}
      <p className="flex flex-wrap gap-x-4 text-sm text-text-secondary">
        {showCheckIns && (
          <span>
            <Swatch kind="in" />
            Checked in
          </span>
        )}
        <span>
          <Swatch kind="sold" />
          {showCheckIns ? "Not in yet" : unit === "RSVPs" ? "RSVPs" : "Sold"}
        </span>
        <span>
          <Swatch kind="left" />
          Left
        </span>
      </p>
      <ul className="flex flex-col">
        {event.tiers.map((t) => {
          const checked = showCheckIns ? rows.filter((r) => r.tierId === t.id && r.checkedAt).length : 0;
          const left = Math.max(0, t.capacity - t.sold);
          const pct = (n: number) => (t.capacity ? (n / t.capacity) * 100 : 0);
          return (
            <li key={t.id} className="flex flex-col gap-2 border-b border-border-subtle py-4 last:border-b-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-base font-medium">
                  {t.name}
                  <span className="num ml-2 text-sm font-normal text-text-tertiary">{f.price(t.price)}</span>
                  {t.unlockCode && (
                    <span className="ml-2 text-sm font-normal text-text-tertiary">
                      Hidden · code <span className="font-mono">{t.unlockCode}</span>
                    </span>
                  )}
                </span>
                <span className="num text-sm text-text-secondary">
                  {showCheckIns && <>{f.count(checked)} in · </>}
                  <Num value={t.sold} animated={animated} /> {unit === "RSVPs" ? "RSVPs" : "sold"} · {f.count(left)} left
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-pill bg-surface-sunken" aria-hidden>
                <div className="flex h-full overflow-hidden rounded-pill" style={{ width: `${pct(t.sold)}%` }}>
                  {showCheckIns && <div className={`h-full ${swatch.in}`} style={{ width: `${t.sold ? (checked / t.sold) * 100 : 0}%` }} />}
                  <div className={`h-full flex-1 ${swatch.sold}`} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OrdersTable({ orders, event, free }: { orders: Order[]; event: TktEvent; free: boolean }) {
  const tierName = (id: string) => event.tiers.find((t) => t.id === id)?.name ?? "";
  const placed = (o: Order) => (o.live ? "Just now" : f.dateTime(o.at));
  return (
    <>
      <table className="hidden w-full text-left text-sm md:table">
        <caption className="sr-only">{free ? "Recent RSVPs" : "Recent orders"}</caption>
        <thead>
          <tr className="label border-b border-border-subtle">
            <th scope="col" className="py-2 pr-4 font-medium">Order</th>
            <th scope="col" className="py-2 pr-4 font-medium">{free ? "Name" : "Buyer"}</th>
            <th scope="col" className="py-2 pr-4 font-medium">Tickets</th>
            {!free && <th scope="col" className="py-2 pr-4 text-right font-medium">Total</th>}
            <th scope="col" className="py-2 font-medium">Placed</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.number} className="border-b border-border-subtle">
              <td className="py-3 pr-4 font-mono whitespace-nowrap">{o.number}</td>
              <td className="py-3 pr-4">
                <div className="font-medium">{o.buyer}</div>
                <div className="text-text-tertiary">{o.email}</div>
              </td>
              <td className="num py-3 pr-4 text-text-secondary">
                {o.qty} × {tierName(o.tierId)}
              </td>
              {!free && <td className="num py-3 pr-4 text-right">{f.price(o.total)}</td>}
              <td className="num py-3 text-text-secondary">{placed(o)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <ul className="md:hidden" aria-label={free ? "Recent RSVPs" : "Recent orders"}>
        {orders.map((o) => (
          <li key={o.number} className="flex items-start justify-between gap-4 border-b border-border-subtle py-3">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-base font-medium">{o.buyer}</span>
              <span className="num text-sm text-text-tertiary">
                {o.qty} × {tierName(o.tierId)} · {placed(o)}
              </span>
            </div>
            {!free && <span className="num text-sm">{f.price(o.total)}</span>}
          </li>
        ))}
      </ul>
    </>
  );
}

function Skeleton() {
  return (
    <div className="content flex flex-col gap-8 py-8 md:gap-12" aria-busy="true" aria-label="Loading dashboard">
      <div className="flex items-center gap-4">
        <Slot w="4rem" h="4rem" className="rounded-inner" />
        <div className="flex flex-col gap-2">
          <Slot w="12rem" h="1.5rem" />
          <Slot w="14rem" />
        </div>
      </div>
      <p className="text-4xl font-extrabold">
        <Slot w="min(40rem, 100%)" h="2.25rem" />
      </p>
      <div className="grid grid-cols-1 gap-3 md:gap-6 lg:grid-cols-12">
        <Panel className="flex flex-col gap-4 lg:col-span-7">
          <h2 className={cardTitle}>Tiers</h2>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="flex flex-col gap-2 py-2">
              <Slot w="8rem" />
              <Slot w="100%" h="0.75rem" className="rounded-pill" />
            </div>
          ))}
        </Panel>
        <Panel className="flex flex-col gap-4 lg:col-span-5">
          <h2 className={cardTitle}>Quick actions</h2>
          <Slot w="100%" h="3.25rem" className="rounded-pill" />
          <Slot w="100%" h="2.75rem" className="rounded-pill" />
        </Panel>
        <Panel className="flex flex-col gap-4 lg:col-span-12">
          <h2 className={cardTitle}>Sales over time</h2>
          <Slot w="100%" h="10rem" />
        </Panel>
      </div>
    </div>
  );
}

/* ---------- Screen ---------- */

export function Dashboard({ id }: { id: string }) {
  const demo = useDemoState();
  const now = useNow();
  const { ready, event: raw } = useHostEvent(id);
  const { rows, checked } = useAttendees(id);

  // Live mock orders while the page is open: tierId → extra tickets.
  const [extra, setExtra] = useState<Record<string, number>>({});
  const [liveOrders, setLiveOrders] = useState<Order[]>([]);

  const base = raw ? withDemoState(raw, demo) : undefined;
  const event = useMemo(
    () => (base ? { ...base, tiers: base.tiers.map((t) => ({ ...t, sold: Math.min(t.capacity, t.sold + (extra[t.id] ?? 0)) })) } : undefined),
    [base, extra],
  );
  const state = event && now !== null ? eventState(event, now) : null;
  const live = state === "on-sale" && demo === null;
  const animated = liveOrders.length > 0 || checked > 0;

  useEffect(() => {
    if (!live || !raw) return;
    let timer: ReturnType<typeof setTimeout>;
    let n = 0;
    const schedule = () => {
      timer = setTimeout(() => {
        const open = raw.tiers.filter((t) => !t.unlockCode && t.sold < t.capacity && new Date(t.salesEnd).getTime() > Date.now());
        if (open.length) {
          const tier = open[Math.floor(Math.random() * open.length)];
          const qty = 1 + Math.floor(Math.random() * 2);
          const buyer = BUYERS[n++ % BUYERS.length];
          setExtra((x) => ({ ...x, [tier.id]: (x[tier.id] ?? 0) + qty }));
          setLiveOrders((o) => [
            {
              number: `TK-${49000 + Math.floor(Math.random() * 900)}`,
              buyer,
              email: `${buyer.toLowerCase().replace(" ", ".")}@email.com`,
              tierId: tier.id,
              qty,
              total: tier.price * qty,
              at: new Date().toISOString(),
              live: true,
            },
            ...o,
          ]);
        }
        schedule();
      }, 8000 + Math.random() * 7000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, [live, raw]);

  const orders = useMemo(() => (event ? [...liveOrders, ...ordersFrom(rows, event.tiers)].slice(0, 8) : []), [liveOrders, rows, event]);

  if (demo === "error")
    return (
      <div className="content py-8">
        <RetryError title="Dashboard didn't load" />
      </div>
    );
  if (!ready || now === null || demo === "loading")
    return (
      <Delayed>
        <Skeleton />
      </Delayed>
    );
  if (!event || !state) return <EventNotFound />;

  const t = totals(event);
  const sold = demo === "empty" ? 0 : t.sold;
  const free = isFree(event);
  const end = salesEnd(event);
  const salesOver = new Date(end).getTime() < now;
  const eventDay = f.dayKey(event.start) === f.dayKey(new Date(now).toISOString()) && state !== "ended" && state !== "canceled";
  const unit = free ? "RSVPs" : "sold";

  const extraTotal = Object.values(extra).reduce((a, b) => a + b, 0);
  const chart = event.sales.map((p, i, all) => {
    const add = i === all.length - 1 ? extraTotal : 0;
    return { label: f.dayShort(p.day), day: p.day, value: free ? p.sold + add : p.gross + add * (t.sold ? t.gross / t.sold : 0) };
  });
  const peak = chart.reduce<(typeof chart)[number] | null>((best, p) => (!best || p.value > best.value ? p : best), null);
  // Check-in numbers only mean something from the event day on.
  const showCheckIns = eventDay || now >= new Date(event.start).getTime();

  let lead: ReactNode;
  if (eventDay) {
    lead = (
      <>
        <Clause>
          <Num value={checked} animated={animated} /> of {f.count(sold)} checked in
        </Clause>
        <Sep />
        <Clause>
          {f.count(sold)} of {f.count(t.capacity)} {unit}
        </Clause>
        <Sep />
        <Clause>ends {f.time(event.end)}</Clause>
      </>
    );
  } else {
    lead = (
      <>
        <Clause>
          <Num value={sold} animated={animated} /> of {f.count(t.capacity)} {unit}
        </Clause>
        {!free && (
          <>
            <Sep />
            <Clause>
              <Num value={demo === "empty" ? 0 : t.gross} money animated={animated} /> gross
            </Clause>
          </>
        )}
        <Sep />
        <Clause>
          {state === "canceled"
            ? "canceled"
            : state === "ended"
              ? `ended ${f.date(event.end)}`
              : `${free ? "RSVPs close" : salesOver ? "sales ended" : "sales end"} ${f.date(end)}`}
        </Clause>
      </>
    );
  }

  const readOnly = state === "canceled" || state === "ended";

  return (
    <div className="content event-scope flex flex-col gap-8 py-8 md:gap-12" style={accentVars(event.accent)}>
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Thumb event={event} />
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="truncate text-2xl font-extrabold tracking-(--tracking-display)">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
              <span className="num">{f.eventWhen(event.start, event.end)}</span>
              <EventStatus event={event} now={now} />
            </div>
          </div>
        </div>
        <ButtonLink href={`/e/${event.slug}`} variant="ghost" size="sm" iconLeft={<ExternalLink size={16} aria-hidden />}>
          View public page
        </ButtonLink>
      </header>

      {state === "canceled" && (
        <Banner tone="danger" icon={<Ban size={18} aria-hidden />} title="This event was canceled" body="Sales and check-in are off. Ticket holders were told about refunds." />
      )}
      {state === "sold-out" && (
        <Banner tone="neutral" icon={<CircleCheck size={18} aria-hidden />} title="Sold out" body="Every public tier is sold out. New fans can join the waitlist where it's on." />
      )}
      {state === "ended" && (
        <Banner tone="neutral" icon={<Ban size={18} aria-hidden />} title="This event has ended" body="The dashboard is read-only now." />
      )}

      <p className="text-2xl font-extrabold tracking-(--tracking-display) sm:text-4xl" aria-live="polite">
        {lead}
      </p>

      <div className="grid grid-cols-1 gap-3 md:gap-6 lg:grid-cols-12">
        {sold === 0 ? (
          <Panel tint className="lg:col-span-7">
            <EndState
              className="py-0"
              title={free ? "No RSVPs yet" : "No sales yet"}
              body={free ? "Share the event page to get your first RSVPs." : "Share the event page to get your first orders."}
              actions={<ShareLinkButton slug={event.slug} />}
            />
          </Panel>
        ) : (
          <Panel tint aria-labelledby="tiers-title" className="flex flex-col gap-4 lg:col-span-7">
            <h2 id="tiers-title" className={cardTitle}>
              Tiers
            </h2>
            <TierBars event={event} rows={rows} animated={animated} showCheckIns={showCheckIns} unit={unit} />
          </Panel>
        )}
        <QuickActions event={event} readOnly={readOnly} />

        {sold > 0 && chart.length > 1 && (
          <Panel aria-labelledby="sales-title" className="flex flex-col gap-4 lg:col-span-12">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="sales-title" className={cardTitle}>
                {free ? "RSVPs over time" : "Sales over time"}
              </h2>
              {peak && peak.value > 0 && (
                <p className="num text-sm text-text-secondary">
                  Peak {free ? f.plural(Math.round(peak.value), "RSVP") : f.money(Math.round(peak.value))} on {f.date(peak.day)}
                </p>
              )}
            </div>
            <LineChart data={chart} height={160} format={(n) => (free ? f.plural(Math.round(n), "RSVP") : f.money(Math.round(n)))} label={free ? "Daily RSVPs" : "Daily gross sales"} />
          </Panel>
        )}

        {sold > 0 && (
          <Panel aria-labelledby="orders-title" className="flex flex-col gap-4 lg:col-span-12">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h2 id="orders-title" className={cardTitle}>
                {free ? "Recent RSVPs" : "Recent orders"}
              </h2>
              <ButtonLink href={`/host/events/${event.id}/attendees`} variant="ghost" size="sm">
                View attendees
              </ButtonLink>
            </div>
            {orders.length ? (
              <OrdersTable orders={orders} event={event} free={free} />
            ) : (
              <p className="text-sm text-text-tertiary">{free ? "No RSVPs to show." : "No orders to show."}</p>
            )}
          </Panel>
        )}
      </div>
    </div>
  );
}
