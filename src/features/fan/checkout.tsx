"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, CircleAlert, Clock } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import { Segmented } from "@/components/ui/controls";
import { Field, Input, InputGroup } from "@/components/ui/field";
import { EndState, ErrorState, Photo, Slot } from "@/components/ui/primitives";
import { useHydrated } from "@/components/providers";
import { useDemoState, useAllEvents, withDemoState } from "@/features/events";
import { useStore, type Hold } from "@/features/store";
import { accentVars } from "@/lib/accent";
import { remaining } from "@/lib/event";
import * as f from "@/lib/format";
import { fan } from "@/mocks/people";
import type { Order, PaymentMethod, Ticket, TktEvent } from "@/mocks/types";
import { markPrint, useDelayedFlag, useNow } from "./hooks";
import { priceLines } from "./pricing";

const METHODS: { value: PaymentMethod; label: string; hint: string }[] = [
  { value: "gcash", label: "GCash", hint: "Pay in the GCash app" },
  { value: "maya", label: "Maya", hint: "Pay in the Maya app" },
  { value: "card", label: "Card", hint: "Credit or debit card" },
  { value: "qrph", label: "QR Ph", hint: "Scan with any bank app" },
];

const schema = z.object({
  name: z.string().trim().min(1, "Enter your name"),
  email: z.email("Enter an email like ana@email.com"),
  mobile: z
    .string()
    .transform((v) => v.replace(/\D/g, "").replace(/^63/, "").replace(/^0/, ""))
    .pipe(z.string().regex(/^9\d{9}$/, "Enter a 10-digit number starting with 9")),
  attendees: z.array(z.string()),
  payment: z.enum(["gcash", "maya", "card", "qrph"]),
});
type FormIn = z.input<typeof schema>;
type FormOut = z.output<typeof schema>;

const uid = () => Math.random().toString(36).slice(2, 10);
const orderNumber = () => `TK-${Math.floor(50000 + Math.random() * 40000)}`;
const code = (prefix: string) => {
  const part = () => Math.floor(Math.random() * 36 ** 4).toString(36).toUpperCase().padStart(4, "0");
  return `${prefix}-${part()}-${part()}`;
};

export function Checkout({ holdId }: { holdId: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const demo = useDemoState();
  const signedIn = useStore((s) => s.signedIn);
  const hold = useStore((s) => s.holds.find((h) => h.id === holdId));
  const events = useAllEvents();
  const now = useNow();
  const showSkeleton = useDelayedFlag(!hydrated || demo === "loading");

  useEffect(() => {
    if (hydrated && !signedIn) router.replace(`/login?next=${encodeURIComponent(`/checkout/${holdId}`)}`);
  }, [hydrated, signedIn, holdId, router]);

  if (demo === "error") {
    return (
      <div className="content">
        <ErrorState title="Checkout didn't load" actions={<Button onClick={() => router.replace(`/checkout/${holdId}`)}>Try again</Button>} />
      </div>
    );
  }
  if (!hydrated || demo === "loading" || !signedIn) return showSkeleton ? <CheckoutSkeleton /> : null;

  const raw = hold && events.find((e) => e.id === hold.eventId);
  const expired = !hold || !raw || (now > 0 && hold.expiresAt <= now);
  if (expired) {
    return (
      <div className="content">
        <EndState
          icon={<Clock size={24} aria-hidden />}
          title="Your hold ran out"
          body="We held your tickets for 10 minutes. Nothing was charged, and they may still be available."
          actions={raw ? <ButtonLink href={`/e/${raw.slug}/tickets`}>Pick tickets</ButtonLink> : <ButtonLink href="/discover">Find events</ButtonLink>}
        />
      </div>
    );
  }

  const event = withDemoState(raw, demo);
  const short = hold.items.some((i) => {
    const t = event.tiers.find((x) => x.id === i.tierId);
    return !t || (demo === "sold-out" && remaining(t) < i.qty);
  });
  if (short) {
    return (
      <div className="content">
        <EndState
          title="These tickets sold out"
          body="The last ones went before payment finished. Nothing was charged."
          actions={<ButtonLink href={`/e/${event.slug}/tickets`}>See other tickets</ButtonLink>}
        />
      </div>
    );
  }

  return <CheckoutForm event={event} hold={hold} now={now} />;
}

function CheckoutForm({ event, hold, now }: { event: TktEvent; hold: Hold; now: number }) {
  const router = useRouter();
  const promos = useStore((s) => s.promos);
  const payment = useStore((s) => s.payment);
  const lastPayment = useStore((s) => s.lastPayment);
  const setDev = useStore((s) => s.setDev);
  const completeOrder = useStore((s) => s.completeOrder);
  const tickets = useStore((s) => s.tickets);
  const [failed, setFailed] = useState(false);

  const promo = promos.find((p) => p.code === hold.promo && p.eventId === event.id);
  const lines = priceLines(event, hold.items, promo);
  const free = lines.subtotal === 0;
  const left = hold.expiresAt - now;

  const { register, handleSubmit, control, formState } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: fan.name,
      email: fan.email,
      mobile: f.mobile(fan.mobile).replace("+63 ", ""),
      attendees: Array.from({ length: lines.qty }, () => ""),
      payment: lastPayment,
    },
  });
  const method = useWatch({ control, name: "payment" });
  const { errors, isSubmitting } = formState;

  const submit = async (v: FormOut) => {
    setFailed(false);
    await new Promise((r) => setTimeout(r, 700));
    if (!free && payment === "fail") {
      setFailed(true);
      requestAnimationFrame(() => document.getElementById("pay-failed")?.focus());
      return;
    }
    const orderId = uid();
    const order: Order = {
      id: orderId,
      number: orderNumber(),
      eventId: event.id,
      buyerName: v.name,
      buyerEmail: v.email,
      items: hold.items.map((i) => ({ ...i, unit: event.tiers.find((t) => t.id === i.tierId)?.price ?? 0 })),
      fees: lines.fees,
      discount: lines.discount,
      total: lines.total,
      createdAt: new Date().toISOString(),
      payment: v.payment,
    };
    const prefix = event.slug.slice(0, 2).toUpperCase();
    let serial = event.tiers.reduce((n, t) => n + t.sold, 0) + tickets.filter((t) => t.eventId === event.id).length;
    let k = 0;
    const newTickets: Ticket[] = hold.items.flatMap((i) =>
      Array.from({ length: i.qty }, () => {
        const holder = v.attendees[k]?.trim() || v.name;
        k++;
        serial++;
        return { id: uid(), code: code(prefix), serial, eventId: event.id, tierId: i.tierId, orderId, holderName: holder, status: "valid" as const };
      }),
    );
    markPrint(orderId);
    completeOrder(order, newTickets, hold.id);
    router.push(`/orders/${orderId}?new=1`);
  };

  const summary = <Summary event={event} hold={hold} lines={lines} promoCode={promo?.code} />;

  return (
    <div className="event-scope" style={accentVars(event.accent)}>
      <form id="checkout" onSubmit={handleSubmit(submit)} noValidate className="content max-w-[var(--read-max)] pt-4 pb-32 lg:grid lg:grid-cols-12 lg:gap-6 lg:pt-8">
        <div className="flex max-w-[var(--form-max)] flex-col gap-6 lg:col-span-7 lg:max-w-none">
          <div className="flex flex-col gap-2">
            <Link href={`/e/${event.slug}/tickets`} className="-ml-1 flex min-h-11 items-center gap-2 self-start rounded-sm text-sm text-text-secondary hover:text-text-primary">
              <ArrowLeft size={16} aria-hidden /> Back to tickets
            </Link>
            <h1 className="text-4xl font-extrabold tracking-tight">{free ? "Confirm your RSVP" : "Checkout"}</h1>
          </div>

          <details className="group rounded-lg border border-border-subtle bg-surface-raised lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 text-sm [&::-webkit-details-marker]:hidden">
              <span className="font-medium">Order summary</span>
              <span className="flex items-center gap-2">
                <span className="num font-medium">{f.price(lines.total)}</span>
                <span className="text-text-tertiary group-open:hidden">Show</span>
                <span className="hidden text-text-tertiary group-open:inline">Hide</span>
              </span>
            </summary>
            <div className="border-t border-border-subtle p-4">{summary}</div>
          </details>

          <div className="rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-6">
          <fieldset className="flex flex-col gap-4">
            <legend className="mb-4 text-lg font-extrabold tracking-tight">Your details</legend>
            <Field label="Full name" error={errors.name?.message}>
              {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete="name" {...register("name")} />}
            </Field>
            <Field label="Email" hint="We send your tickets here." error={errors.email?.message}>
              {({ id, describedBy, invalid }) => (
                <Input id={id} type="email" inputMode="email" aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete="email" {...register("email")} />
              )}
            </Field>
            <Field label="Mobile" error={errors.mobile?.message}>
              {({ id, describedBy, invalid }) => (
                <InputGroup addon="+63" id={id} type="tel" inputMode="tel" aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete="tel-national" {...register("mobile")} />
              )}
            </Field>
          </fieldset>
          </div>

          {lines.qty > 1 && (
            <div className="rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-6">
            <fieldset className="flex flex-col gap-4">
              <legend className="mb-1 text-lg font-extrabold tracking-tight">Attendee names</legend>
              <p className="-mt-2 text-sm text-text-tertiary">Optional. Blank tickets use your name.</p>
              {Array.from({ length: lines.qty }, (_, i) => (
                <Field key={i} label={`Ticket ${i + 1}`} optional>
                  {({ id }) => <Input id={id} autoComplete="off" {...register(`attendees.${i}`)} />}
                </Field>
              ))}
            </fieldset>
            </div>
          )}

          {!free && (
            <div className="rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-6">
            <fieldset className="flex flex-col gap-3">
              <legend className="mb-4 text-lg font-extrabold tracking-tight">Payment</legend>
              {METHODS.map((m) => (
                <label
                  key={m.value}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg bg-surface px-4 py-3 outline-2 -outline-offset-2 transition-[outline-color] duration-150 ${
                    method === m.value ? "outline-[var(--text-primary)]" : "outline-transparent hover:outline-[var(--border-strong)]"
                  }`}
                >
                  <input type="radio" value={m.value} {...register("payment")} className="h-4 w-4 accent-[var(--text-primary)]" />
                  {/* Neutral placeholder mark. Never a real logo. */}
                  <span aria-hidden className="h-8 w-8 shrink-0 rounded-sm bg-surface-sunken" />
                  <span className="flex flex-col">
                    <span className="text-base font-medium">{m.label}</span>
                    <span className="text-sm text-text-tertiary">{m.hint}</span>
                  </span>
                </label>
              ))}

              {failed && (
                <div id="pay-failed" tabIndex={-1} role="alert" className="flex flex-col gap-3 rounded-sm bg-danger-subtle p-4 outline-none">
                  <p className="flex items-center gap-2 text-base font-medium text-danger">
                    <CircleAlert size={18} aria-hidden /> Payment didn&apos;t go through
                  </p>
                  <p className="text-sm text-text-secondary">
                    {METHODS.find((m) => m.value === method)?.label} didn&apos;t confirm the payment, so nothing was charged. Your tickets are still held. Try again or pick another method.
                  </p>
                  <Button type="submit" variant="secondary" className="self-start" loading={isSubmitting}>
                    Try again
                  </Button>
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 rounded-lg border border-dashed border-border-strong p-4">
                <span className="text-sm font-medium">Demo: payment result</span>
                <span className="text-sm text-text-tertiary">Mock checkout. No real payment is made.</span>
                <div>
                <Segmented
                  label="Demo: payment result"
                  value={payment}
                  onChange={(v) => setDev({ payment: v })}
                  options={[
                    { value: "success", label: "Succeeds" },
                    { value: "fail", label: "Fails" },
                  ]}
                />
                </div>
              </div>
            </fieldset>
            </div>
          )}
        </div>

        <aside className="hidden lg:col-span-5 lg:col-start-8 lg:block">
          <div className="sticky top-[calc(var(--bar-height)+var(--space-8))] flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-raised p-6">
            <h2 className="text-lg font-extrabold tracking-tight">Order summary</h2>
            {summary}
          </div>
        </aside>
      </form>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 bg-surface-raised" style={{ boxShadow: "var(--shadow-overlay)" }}>
        <div className="content flex items-center justify-between gap-4 py-2" style={{ minHeight: "var(--bar-height)" }}>
          <div className="flex flex-col">
            <span className={`flex items-center gap-1 text-sm ${left < 60_000 ? "text-warning" : "text-text-tertiary"}`} role="timer" aria-live="off">
              <Clock size={14} aria-hidden />
              Held for <span className="num font-medium">{f.countdown(left)}</span>
            </span>
            <span className="num text-base font-semibold">{f.price(lines.total)}</span>
          </div>
          <Button type="submit" form="checkout" variant="event" size="lg" loading={isSubmitting}>
            {free ? "Confirm RSVP" : `Pay ${f.money(lines.total)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Summary({ event, hold, lines, promoCode }: { event: TktEvent; hold: Hold; lines: ReturnType<typeof priceLines>; promoCode?: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <div className="relative aspect-[3/2] w-20 shrink-0 overflow-hidden rounded-sm bg-surface-sunken">
          <Photo src={event.cover.url} alt="" sizes="80px" position={event.cover.position} />
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="text-base font-medium">{event.title}</span>
          <span className="num text-sm text-text-secondary">
            {f.dayShort(event.start)} · {f.time(event.start)}
          </span>
        </div>
      </div>
      <dl className="flex flex-col gap-2 border-t border-border-subtle pt-4 text-sm">
        {hold.items.map((i) => {
          const t = event.tiers.find((x) => x.id === i.tierId);
          return (
            <div key={i.tierId} className="flex justify-between gap-4">
              <dt>
                <span className="num">{i.qty}</span> × {t?.name}
              </dt>
              <dd className="num">{f.price((t?.price ?? 0) * i.qty)}</dd>
            </div>
          );
        })}
        {lines.discount > 0 && (
          <div className="flex justify-between gap-4">
            <dt>
              Discount <span className="font-mono">{promoCode}</span>
            </dt>
            <dd className="num">−{f.money(lines.discount)}</dd>
          </div>
        )}
        {lines.subtotal > 0 && (
          <div className="flex justify-between gap-4">
            <dt>Service fee</dt>
            <dd className="num">{f.money(lines.fees)}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-border-subtle pt-2 text-base font-semibold">
          <dt>Total</dt>
          <dd className="num">{f.price(lines.total)}</dd>
        </div>
      </dl>
    </div>
  );
}

function CheckoutSkeleton() {
  return (
    <div aria-busy className="content pt-4 lg:pt-8">
      <span className="sr-only">Loading checkout</span>
      <div className="flex max-w-[var(--form-max)] flex-col gap-8">
        <h1 className="mt-12 text-4xl font-extrabold tracking-tight">Checkout</h1>
        <div className="flex flex-col gap-4">
          <span className="text-lg font-semibold">Your details</span>
          {["Full name", "Email", "Mobile"].map((l) => (
            <div key={l} className="flex flex-col gap-2">
              <span className="text-sm font-medium">{l}</span>
              <Slot w="100%" h="2.75rem" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
