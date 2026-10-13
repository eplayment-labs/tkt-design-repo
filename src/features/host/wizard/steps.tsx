"use client";

import { Controller, useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Segmented, Switch } from "@/components/ui/controls";
import { Field, Input, InputGroup, Select, Textarea } from "@/components/ui/field";
import { Rule } from "@/components/ui/primitives";
import * as f from "@/lib/format";
import { CATEGORIES, CITIES, REFUNDS, newTier, type Values } from "./schema";

/* ---------- helpers ---------- */

function StepHead({ title, body }: { title: string; body: string }) {
  return (
    <header className="flex flex-col gap-1">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      <p className="text-sm text-text-secondary">{body}</p>
    </header>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium" aria-hidden>
        {label}
      </span>
      {children}
    </div>
  );
}

/* ---------- 1. Basics ---------- */

export function BasicsStep() {
  const {
    register,
    formState: { errors },
  } = useFormContext<Values>();
  return (
    <div className="flex flex-col gap-6">
      <StepHead title="Basics" body="What it is, in a few words." />
      <Field label="Event name" error={errors.title?.message}>
        {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} {...register("title")} />}
      </Field>
      <Field label="Category" error={errors.category?.message}>
        {({ id, describedBy, invalid }) => (
          <Select id={id} aria-describedby={describedBy} aria-invalid={invalid} {...register("category")}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        )}
      </Field>
      <Field label="Description" error={errors.description?.message} hint="Leave a blank line between paragraphs.">
        {({ id, describedBy, invalid }) => <Textarea id={id} aria-describedby={describedBy} aria-invalid={invalid} rows={7} {...register("description")} />}
      </Field>
    </div>
  );
}

/* ---------- 2. When & where ---------- */

export function WhenStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<Values>();
  const multiDay = useWatch({ control, name: "multiDay" });
  const format = useWatch({ control, name: "format" });
  return (
    <div className="flex flex-col gap-6">
      <StepHead title="When & where" body="Times are in Manila time." />
      <Labeled label="Length">
        <Controller
          control={control}
          name="multiDay"
          render={({ field }) => (
            <Segmented
              label="Length"
              value={field.value ? "multi" : "single"}
              onChange={(v) => field.onChange(v === "multi")}
              options={[
                { value: "single", label: "Single day" },
                { value: "multi", label: "Multi-day" },
              ]}
            />
          )}
        />
      </Labeled>
      <div className="grid grid-cols-2 gap-4">
        <Field label={multiDay ? "Start date" : "Date"} error={errors.startDate?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} type="date" className="num" aria-describedby={describedBy} aria-invalid={invalid} {...register("startDate")} />}
        </Field>
        <Field label="Starts" error={errors.startTime?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} type="time" className="num" aria-describedby={describedBy} aria-invalid={invalid} {...register("startTime")} />}
        </Field>
        {multiDay && (
          <Field label="End date" error={errors.endDate?.message}>
            {({ id, describedBy, invalid }) => <Input id={id} type="date" className="num" aria-describedby={describedBy} aria-invalid={invalid} {...register("endDate")} />}
          </Field>
        )}
        <Field label="Ends" error={errors.endTime?.message} className={multiDay ? "" : "col-start-2"}>
          {({ id, describedBy, invalid }) => <Input id={id} type="time" className="num" aria-describedby={describedBy} aria-invalid={invalid} {...register("endTime")} />}
        </Field>
      </div>
      <Rule />
      <Labeled label="Format">
        <Controller
          control={control}
          name="format"
          render={({ field }) => (
            <Segmented
              label="Format"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "in-person", label: "In person" },
                { value: "online", label: "Online" },
                { value: "hybrid", label: "Hybrid" },
              ]}
            />
          )}
        />
      </Labeled>
      {format !== "online" && (
        <>
          <Field label="City" error={errors.city?.message}>
            {({ id, describedBy, invalid }) => (
              <Select id={id} aria-describedby={describedBy} aria-invalid={invalid} {...register("city")}>
                <option value="">Choose a city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Venue" error={errors.venueName?.message}>
            {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} {...register("venueName")} />}
          </Field>
          <Field label="Address" error={errors.venueAddress?.message}>
            {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} autoComplete="street-address" {...register("venueAddress")} />}
          </Field>
          {/* TODO: seat maps are out of scope. */}
        </>
      )}
      {format !== "in-person" && (
        <Field label="Joining details" error={errors.onlineNote?.message} hint="Ticket holders see this after they get a ticket.">
          {({ id, describedBy, invalid }) => <Textarea id={id} rows={3} aria-describedby={describedBy} aria-invalid={invalid} {...register("onlineNote")} />}
        </Field>
      )}
    </div>
  );
}

/* ---------- 4. Tickets ---------- */

function TierCard({ index, onRemove, canRemove }: { index: number; onRemove: () => void; canRemove: boolean }) {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<Values>();
  const pricing = useWatch({ control, name: "pricing" });
  const hidden = useWatch({ control, name: `tiers.${index}.hidden` });
  const sold = useWatch({ control, name: `tiers.${index}.sold` });
  const e = errors.tiers?.[index];
  const paid = pricing === "paid";
  return (
    <fieldset className="tint flex flex-col gap-4 rounded-lg border border-border-subtle p-4 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <legend className="text-lg font-medium">Tier {index + 1}</legend>
        {canRemove && (
          <Button variant="ghost" size="sm" iconLeft={<Trash2 size={16} aria-hidden />} onClick={onRemove} disabled={sold > 0} aria-label={`Remove tier ${index + 1}`}>
            Remove
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name" error={e?.name?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} {...register(`tiers.${index}.name`)} />}
        </Field>
        {paid ? (
          <Field label="Price" error={e?.price?.message}>
            {({ id, describedBy, invalid }) => (
              <InputGroup
                addon="₱"
                id={id}
                type="number"
                inputMode="decimal"
                step={0.01}
                min={0}
                className="num"
                aria-describedby={describedBy}
                aria-invalid={invalid}
                {...register(`tiers.${index}.price`, { valueAsNumber: true })}
              />
            )}
          </Field>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium">Price</span>
            <span className="flex min-h-11 items-center text-base text-text-secondary">Free</span>
          </div>
        )}
        <Field label="Description" optional error={e?.description?.message} className="sm:col-span-2">
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} {...register(`tiers.${index}.description`)} />}
        </Field>
        <Field label="Capacity" error={e?.capacity?.message}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} type="number" inputMode="numeric" min={1} className="num" aria-describedby={describedBy} aria-invalid={invalid} {...register(`tiers.${index}.capacity`, { valueAsNumber: true })} />
          )}
        </Field>
        <Field label="Per-order limit" error={e?.perOrderLimit?.message}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} type="number" inputMode="numeric" min={1} max={20} className="num" aria-describedby={describedBy} aria-invalid={invalid} {...register(`tiers.${index}.perOrderLimit`, { valueAsNumber: true })} />
          )}
        </Field>
        <Field label="Sales end" error={e?.salesEndDate?.message} hint="At 11:59 PM that day." className="sm:col-span-2">
          {({ id, describedBy, invalid }) => <Input id={id} type="date" className="num" aria-describedby={describedBy} aria-invalid={invalid} {...register(`tiers.${index}.salesEndDate`)} />}
        </Field>
      </div>
      {paid && (
        <Controller
          control={control}
          name={`tiers.${index}.earlyBird`}
          render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="Early bird" hint="Labels this tier as early bird on the event page." />}
        />
      )}
      <Controller
        control={control}
        name={`tiers.${index}.hidden`}
        render={({ field }) => <Switch checked={field.value} onChange={field.onChange} label="Hidden tier" hint="Only shows after a fan enters the code." />}
      />
      {hidden && (
        <Field label="Access code" error={e?.unlockCode?.message}>
          {({ id, describedBy, invalid }) => (
            <Input id={id} className="font-mono! uppercase" autoCapitalize="characters" aria-describedby={describedBy} aria-invalid={invalid} {...register(`tiers.${index}.unlockCode`)} />
          )}
        </Field>
      )}
    </fieldset>
  );
}

export function TicketsStep() {
  const {
    control,
    getValues,
    formState: { errors },
  } = useFormContext<Values>();
  const { fields, append, remove } = useFieldArray({ control, name: "tiers", keyName: "key" });
  const tiers = useWatch({ control, name: "tiers" });
  const cap = (tiers ?? []).reduce((n, t) => n + (Number.isNaN(t.capacity) ? 0 : t.capacity), 0);
  return (
    <div className="flex flex-col gap-6">
      <StepHead title="Tickets" body="Free RSVP or paid tiers. You can add tiers later." />
      <Labeled label="Pricing">
        <Controller
          control={control}
          name="pricing"
          render={({ field }) => (
            <Segmented
              label="Pricing"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "free", label: "Free RSVP" },
                { value: "paid", label: "Paid tiers" },
              ]}
            />
          )}
        />
      </Labeled>
      {fields.map((t, i) => (
        <TierCard key={t.key} index={i} canRemove={fields.length > 1} onRemove={() => remove(i)} />
      ))}
      {errors.tiers?.root?.message && <p className="text-sm text-danger">{errors.tiers.root.message}</p>}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Button
          variant="secondary"
          iconLeft={<Plus size={18} aria-hidden />}
          onClick={() => append(newTier(getValues("tiers")[0]?.salesEndDate ?? getValues("startDate"), { name: "" }))}
          disabled={fields.length >= 8}
        >
          Add tier
        </Button>
        <span className="num text-sm text-text-secondary">
          Capacity {f.count(cap)} across {f.plural(fields.length, "tier")}
        </span>
      </div>
    </div>
  );
}

/* ---------- 5. Settings ---------- */

export function SettingsStep() {
  const {
    register,
    control,
    formState: { errors },
  } = useFormContext<Values>();
  const preset = useWatch({ control, name: "refundPreset" });
  const { fields, append, remove } = useFieldArray({ control, name: "questions", keyName: "key" });
  return (
    <div className="flex flex-col gap-6">
      <StepHead title="Settings" body="Refunds, what you ask attendees, and who can find it." />
      <Labeled label="Refund policy">
        <Controller
          control={control}
          name="refundPreset"
          render={({ field }) => (
            <Segmented
              label="Refund policy"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "standard", label: "7-day refunds" },
                { value: "none", label: "No refunds" },
                { value: "custom", label: "Custom" },
              ]}
            />
          )}
        />
        {preset === "custom" ? (
          <Field label="Your policy" hideLabel error={errors.refundCustom?.message}>
            {({ id, describedBy, invalid }) => <Textarea id={id} rows={3} aria-describedby={describedBy} aria-invalid={invalid} {...register("refundCustom")} />}
          </Field>
        ) : (
          <p className="text-sm text-text-secondary">{REFUNDS[preset]}</p>
        )}
      </Labeled>
      <Rule />
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium">Attendee questions</span>
          <span className="text-sm text-text-tertiary">Asked at checkout. Up to 5.</span>
        </div>
        {fields.map((q, i) => (
          <div key={q.key} className="flex items-start gap-2">
            <Field label={`Question ${i + 1}`} hideLabel error={errors.questions?.[i]?.value?.message} className="flex-1">
              {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} placeholder="Any dietary needs?" {...register(`questions.${i}.value`)} />}
            </Field>
            <Button variant="ghost" iconOnly aria-label={`Remove question ${i + 1}`} iconLeft={<Trash2 size={18} aria-hidden />} onClick={() => remove(i)} />
          </div>
        ))}
        {fields.length < 5 && (
          <Button variant="secondary" className="w-fit" iconLeft={<Plus size={18} aria-hidden />} onClick={() => append({ value: "" })}>
            Add question
          </Button>
        )}
      </div>
      <Rule />
      <Labeled label="Visibility">
        <Controller
          control={control}
          name="visibility"
          render={({ field }) => (
            <Segmented
              label="Visibility"
              value={field.value}
              onChange={field.onChange}
              options={[
                { value: "public", label: "Public" },
                { value: "unlisted", label: "Unlisted" },
              ]}
            />
          )}
        />
        <VisibilityHint />
      </Labeled>
    </div>
  );
}

function VisibilityHint() {
  const v = useWatch<Values, "visibility">({ name: "visibility" });
  return (
    <p className="text-sm text-text-secondary">
      {v === "public" ? "Shows in Discover and on your host page." : "Only people with the link can find it."}
    </p>
  );
}
