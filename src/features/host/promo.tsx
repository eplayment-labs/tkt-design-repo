"use client";

import Link from "next/link";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { fromZonedTime } from "date-fns-tz";
import { Button } from "@/components/ui/button";
import { Menu, MenuItem, Segmented, Sheet } from "@/components/ui/controls";
import { Field, Input, InputGroup, Select } from "@/components/ui/field";
import { EndState, Slot, Status } from "@/components/ui/primitives";
import { useHydrated } from "@/components/providers";
import { useDemoState } from "@/features/events";
import { useStore } from "@/features/store";
import * as f from "@/lib/format";
import type { PromoCode, TktEvent } from "@/mocks/types";
import { Delayed, EventNotFound, RetryError, SubHeader, useHostEvent, useHostEvents, useNow } from "./shared";

/* ---------- Status ---------- */

function promoState(p: PromoCode, now: number) {
  if (p.used >= p.limit) return { label: "Used up", tone: "neutral" as const };
  if (new Date(p.expires).getTime() < now) return { label: "Expired", tone: "neutral" as const };
  return { label: "Active", tone: "success" as const };
}

function discount(p: PromoCode) {
  return p.kind === "percent" ? `${p.amount}% off` : `${f.money(p.amount)} off`;
}

/* ---------- List ---------- */

const cols = "md:grid-cols-[1fr_8rem_6rem_8rem_7rem_3rem]";

function Head() {
  return (
    <div className={`label hidden gap-x-4 border-b border-border-subtle pt-2 pb-3 md:grid ${cols}`} aria-hidden>
      <span>Code</span>
      <span>Discount</span>
      <span>Uses</span>
      <span>Expires</span>
      <span>Status</span>
      <span />
    </div>
  );
}

export function PromoList({ promos, now }: { promos: PromoCode[]; now: number }) {
  const removePromo = useStore((s) => s.removePromo);
  return (
    <div className="rounded-lg border border-border-subtle bg-surface-raised px-4 py-2 md:px-6">
      <Head />
      <ul>
        {promos.map((p) => {
          const s = promoState(p, now);
          return (
            <li key={p.id} className={`grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-border-subtle py-3 last:border-b-0 ${cols}`}>
              <span className="inline-flex w-fit items-center rounded-pill bg-surface-sunken px-3 py-1 font-mono text-sm font-medium">{p.code}</span>
              <span className="row-span-2 md:order-last md:row-span-1">
                <Menu label={`Actions for ${p.code}`} trigger={<MoreHorizontal size={18} aria-hidden className="mx-1" />}>
                  {(close) => (
                    <MenuItem
                      icon={<Trash2 size={16} />}
                      onSelect={() => {
                        close();
                        removePromo(p.id);
                        toast(`Deleted ${p.code}`);
                      }}
                    >
                      Delete code
                    </MenuItem>
                  )}
                </Menu>
              </span>
              <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary md:contents">
                <span className="num">{discount(p)}</span>
                <span className="num">
                  {f.count(p.used)} / {f.count(p.limit)}
                  <span className="md:sr-only"> used</span>
                </span>
                <span className="num">
                  <span className="md:sr-only">Expires </span>
                  {f.date(p.expires)}
                </span>
                <Status tone={s.tone}>{s.label}</Status>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading promo codes" className="rounded-lg border border-border-subtle bg-surface-raised px-4 py-2 md:px-6">
      <Head />
      {Array.from({ length: 3 }, (_, i) => (
        <div key={i} className={`grid grid-cols-[1fr_auto] gap-4 border-b border-border-subtle py-3 last:border-b-0 ${cols}`}>
          <Slot w="7rem" h="1.75rem" className="rounded-pill" />
          <Slot w="4.5rem" className="hidden md:inline-block" />
          <Slot w="3rem" className="hidden md:inline-block" />
          <Slot w="6rem" className="hidden md:inline-block" />
          <Slot w="4rem" className="hidden md:inline-block" />
        </div>
      ))}
    </div>
  );
}

/* ---------- Create sheet ---------- */

const uid = () => `p-${Math.random().toString(36).slice(2, 9)}`;

const schema = z
  .object({
    eventId: z.string().min(1, "Pick an event"),
    code: z
      .string()
      .trim()
      .min(3, "Use at least 3 characters")
      .max(20, "Keep it under 20 characters")
      .regex(/^[A-Za-z0-9]+$/, "Use letters and numbers only"),
    kind: z.enum(["percent", "fixed"]),
    amount: z.number({ error: "Enter an amount" }).positive("Enter an amount above 0"),
    limit: z.number({ error: "Enter a usage limit" }).int("Use a whole number").min(1, "Allow at least 1 use"),
    expires: z.string().min(1, "Pick an expiry date"),
  })
  .superRefine((v, ctx) => {
    if (v.kind === "percent" && v.amount > 100) ctx.addIssue({ code: "custom", path: ["amount"], message: "Keep it at 100% or less" });
  });

type Values = z.infer<typeof schema>;

function CreateSheet({
  open,
  onOpenChange,
  events,
  fixedEvent,
  existing,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  events: TktEvent[];
  fixedEvent?: TktEvent;
  existing: PromoCode[];
}) {
  const addPromo = useStore((s) => s.addPromo);
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { eventId: fixedEvent?.id ?? "", code: "", kind: "percent", amount: undefined, limit: 50, expires: "" },
  });
  const kind = useWatch({ control, name: "kind" });

  const onSubmit = (v: Values) => {
    const code = v.code.toUpperCase();
    if (existing.some((p) => p.eventId === v.eventId && p.code === code)) {
      setError("code", { message: "This event already uses that code, so pick another" });
      return;
    }
    addPromo({
      id: uid(),
      eventId: v.eventId,
      code,
      kind: v.kind,
      amount: v.kind === "fixed" ? Math.round(v.amount * 100) : v.amount,
      limit: v.limit,
      used: 0,
      expires: fromZonedTime(`${v.expires}T23:59:00`, f.TZ).toISOString(),
    });
    toast(`Created ${code}`);
    reset({ eventId: fixedEvent?.id ?? "", code: "", kind: "percent", amount: undefined, limit: 50, expires: "" });
    onOpenChange(false);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Create code"
      description={fixedEvent ? `For ${fixedEvent.title}` : undefined}
      side="right"
      footer={
        <Button type="submit" form="promo-form" fullWidth>
          Create code
        </Button>
      }
    >
      <form id="promo-form" onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6 pt-2">
        {!fixedEvent && (
          <Field label="Event" error={errors.eventId?.message}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} aria-describedby={describedBy} aria-invalid={invalid} {...register("eventId")}>
                <option value="">Choose an event</option>
                {events.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        )}
        <Field label="Code" error={errors.code?.message} hint="Fans type this at checkout.">
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              autoCapitalize="characters"
              className="font-mono! uppercase"
              {...register("code")}
            />
          )}
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium" id="kind-label">
            Discount type
          </span>
          <Controller
            control={control}
            name="kind"
            render={({ field }) => (
              <Segmented
                label="Discount type"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: "percent", label: "Percent" },
                  { value: "fixed", label: "Fixed amount" },
                ]}
              />
            )}
          />
        </div>
        <Field label="Amount" error={errors.amount?.message}>
          {({ id, describedBy, invalid }) => (
            <InputGroup
              addon={kind === "percent" ? "%" : "₱"}
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              inputMode="decimal"
              type="number"
              step={kind === "percent" ? 1 : 0.01}
              min={0}
              className="num"
              {...register("amount", { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Usage limit" error={errors.limit?.message}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              aria-invalid={invalid}
              type="number"
              inputMode="numeric"
              min={1}
              className="num"
              {...register("limit", { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Expires" error={errors.expires?.message} hint="Ends at 11:59 PM, Manila time.">
          {({ id, describedBy, invalid }) => (
            <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} type="date" className="num" {...register("expires")} />
          )}
        </Field>
      </form>
    </Sheet>
  );
}

/* ---------- Screens ---------- */

function useLoad() {
  const demo = useDemoState();
  const hydrated = useHydrated();
  const now = useNow();
  return { demo, ready: hydrated && now !== null && demo !== "loading", now: now ?? 0 };
}

export function EventPromoScreen({ id }: { id: string }) {
  const { demo, ready, now } = useLoad();
  const { event } = useHostEvent(id);
  const promos = useStore((s) => s.promos);
  const [open, setOpen] = useState(false);

  if (ready && !event) return <EventNotFound />;
  const mine = demo === "empty" ? [] : promos.filter((p) => p.eventId === id);
  const create = (
    <Button iconLeft={<Plus size={18} aria-hidden />} onClick={() => setOpen(true)}>
      Create code
    </Button>
  );

  return (
    <div className="content flex flex-col gap-8 py-8">
      {event ? (
        <SubHeader event={event} title="Promo codes" actions={create} />
      ) : (
        <h1 className="text-4xl font-extrabold tracking-(--tracking-display)">Promo codes</h1>
      )}
      {demo === "error" ? (
        <RetryError title="Promo codes didn't load" />
      ) : !ready || !event ? (
        <Delayed>
          <ListSkeleton />
        </Delayed>
      ) : mine.length === 0 ? (
        <EndState title="No promo codes yet" body="Create a code to give fans a percent or fixed discount." actions={create} />
      ) : (
        <PromoList promos={mine} now={now} />
      )}
      {event && <CreateSheet open={open} onOpenChange={setOpen} events={[event]} fixedEvent={event} existing={promos} />}
    </div>
  );
}

export function AllPromoScreen() {
  const { demo, ready, now } = useLoad();
  const events = useHostEvents();
  const promos = useStore((s) => s.promos);
  const [open, setOpen] = useState(false);

  const groups = demo === "empty" ? [] : events.map((e) => ({ event: e, promos: promos.filter((p) => p.eventId === e.id) })).filter((g) => g.promos.length);
  const eligible = events.filter((e) => e.status !== "canceled" && e.status !== "ended");
  const create = (
    <Button iconLeft={<Plus size={18} aria-hidden />} onClick={() => setOpen(true)}>
      Create code
    </Button>
  );

  return (
    <div className="content flex flex-col gap-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-4xl font-extrabold tracking-(--tracking-display)">Promo codes</h1>
        {create}
      </div>
      {demo === "error" ? (
        <RetryError title="Promo codes didn't load" />
      ) : !ready ? (
        <Delayed>
          <ListSkeleton />
        </Delayed>
      ) : groups.length === 0 ? (
        <EndState title="No promo codes yet" body="Create a code to give fans a percent or fixed discount." actions={create} />
      ) : (
        <div className="flex flex-col gap-12">
          {groups.map((g) => (
            <section key={g.event.id} aria-labelledby={`promo-${g.event.id}`} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <h2 id={`promo-${g.event.id}`} className="text-2xl font-bold tracking-tight">
                  {g.event.title}
                </h2>
                <Link href={`/host/events/${g.event.id}/promo`} className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4">
                  Manage codes
                </Link>
              </div>
              <PromoList promos={g.promos} now={now} />
            </section>
          ))}
        </div>
      )}
      <CreateSheet open={open} onOpenChange={setOpen} events={eligible} existing={promos} />
    </div>
  );
}
