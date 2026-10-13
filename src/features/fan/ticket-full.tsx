"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, MoreHorizontal, Repeat, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Menu, MenuItem, Sheet } from "@/components/ui/controls";
import { Field, Input, Textarea } from "@/components/ui/field";
import { EndState, ErrorState, Photo, Slot } from "@/components/ui/primitives";
import { accentVars } from "@/lib/accent";
import { totals } from "@/lib/event";
import { useHydrated } from "@/components/providers";
import { useAllEvents, useDemoState } from "@/features/events";
import { useStore } from "@/features/store";
import * as f from "@/lib/format";
import type { Ticket, TktEvent } from "@/mocks/types";
import { useDelayedFlag } from "./hooks";

/* The QR surface is always white with black ink, in both themes, for scanner reliability. */
const ink = "text-[var(--gray-ink)]";
const muted = "text-[var(--gray-600)]";

export function TicketFull({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const hydrated = useHydrated();
  const demo = useDemoState();
  const ticket = useStore((s) => s.tickets.find((t) => t.id === ticketId));
  const events = useAllEvents();
  const showSkeleton = useDelayedFlag(!hydrated || demo === "loading");
  const [sheet, setSheet] = useState<"transfer" | "refund" | null>(null);

  const back = (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push("/tickets"))}
      aria-label="Back to tickets"
      className="flex h-11 w-11 items-center justify-center rounded-pill bg-surface-raised text-text-primary hover:bg-surface-sunken"
    >
      <ArrowLeft size={20} aria-hidden />
    </button>
  );

  if (demo === "error") {
    return (
      <div className="content">
        <ErrorState title="This ticket didn't load" actions={<Button onClick={() => router.replace(`/tickets/${ticketId}`)}>Try again</Button>} />
      </div>
    );
  }
  if (!hydrated || demo === "loading") {
    return showSkeleton ? (
      <Surface back={back}>
        <div aria-busy className="flex flex-col items-center gap-6">
          <span className="sr-only">Loading ticket</span>
          <div className="aspect-square w-full max-w-80 rounded-lg bg-[var(--gray-100)]" />
          <Slot w="10rem" className="bg-[var(--gray-100)]" />
        </div>
      </Surface>
    ) : null;
  }
  const event = ticket && events.find((e) => e.id === ticket.eventId);
  if (!ticket || !event) {
    return (
      <div className="content">
        <EndState title="We couldn't find that ticket" body="It may have been transferred to someone else." actions={<ButtonLink href="/tickets">View tickets</ButtonLink>} />
      </div>
    );
  }

  const tier = event.tiers.find((t) => t.id === ticket.tierId);
  const showQr = ticket.status === "valid" || ticket.status === "refund-requested" || ticket.status === "checked-in";
  const canAct = ticket.status === "valid" && event.status !== "ended" && event.status !== "canceled";

  const { capacity } = totals(event);
  const more = canAct ? (
    <div className="rounded-pill bg-surface-raised text-text-primary">
      <Menu label="More actions" trigger={<MoreHorizontal size={20} aria-hidden />}>
        {(close) => (
          <>
            <MenuItem
              icon={<Repeat size={16} />}
              onSelect={() => {
                close();
                setSheet("transfer");
              }}
            >
              Transfer
            </MenuItem>
            <MenuItem
              icon={<Undo2 size={16} />}
              onSelect={() => {
                close();
                setSheet("refund");
              }}
            >
              Request refund
            </MenuItem>
          </>
        )}
      </Menu>
    </div>
  ) : null;

  return (
    <Surface back={back} more={more} glow={event.cover.url}>
      <div
        className="event-scope flex w-full flex-col items-center gap-6 overflow-hidden rounded-lg bg-[var(--gray-0)] pb-6 text-center"
        style={{ ...accentVars(event.accent), boxShadow: "var(--shadow-overlay)" }}
      >
        <div className="w-full">
          <div className="relative aspect-[3/1] bg-[var(--gray-100)]">
            {ticket.status === "valid" && <span className="sticker">Admit 1</span>}
            <Photo src={event.cover.url} alt="" sizes="448px" position={event.cover.position} muted={ticket.status === "canceled"} />
          </div>
          {/* 4px stub band in the photo accent. */}
          <div aria-hidden className={`h-1 ${ticket.status === "canceled" ? "bg-[var(--gray-300)]" : "bg-event"}`} />
        </div>

        <div className="flex flex-col gap-1">
          <h1 className={`text-2xl font-extrabold tracking-tight ${ink}`}>{event.title}</h1>
          <p className={`num text-sm ${muted}`}>
            {f.dayShort(event.start)} · {f.time(event.start)}
          </p>
        </div>

        {showQr ? (
          <motion.div layoutId={`qr-${ticket.id}`} className="w-full max-w-64 rounded-sm bg-[var(--gray-0)] p-2">
            <QRCodeSVG value={`tkt:${ticket.code}`} size={512} level="M" bgColor="#ffffff" fgColor="#000000" className="h-auto w-full" title={`QR code for ticket ${ticket.code}`} />
          </motion.div>
        ) : (
          <div className={`flex aspect-square w-full max-w-72 items-center justify-center rounded-lg border border-dashed border-[var(--gray-300)] p-6 text-sm ${muted}`}>
            {ticket.status === "canceled" ? "No QR. This ticket was canceled." : `No QR. You sent this ticket to ${ticket.transferredTo}.`}
          </div>
        )}

        {showQr && ticket.status === "valid" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.15 }} className={`-mt-2 text-sm ${muted}`}>
            Turn up your brightness
          </motion.p>
        )}

        <div className="flex flex-col items-center gap-1">
          <span className={`font-mono text-base ${ink}`}>{ticket.code}</span>
          <span className={`num font-mono text-2xl font-medium ${ink}`}>
            No. {String(ticket.serial).padStart(4, "0")}
            {capacity ? ` / ${f.count(capacity)}` : ""}
          </span>
        </div>

        <dl className="grid w-full max-w-72 grid-cols-2 gap-4 border-t border-[var(--gray-200)] pt-4 text-left">
          <div>
            <dt className={`text-xs font-medium tracking-wide uppercase ${muted}`}>Name</dt>
            <dd className={`text-base font-medium ${ink}`}>{ticket.holderName}</dd>
          </div>
          <div>
            <dt className={`text-xs font-medium tracking-wide uppercase ${muted}`}>Tier</dt>
            <dd className={`text-base font-medium ${ink}`}>{tier?.name}</dd>
          </div>
        </dl>

        {ticket.status !== "valid" && (
          <p className={`text-sm font-medium ${ink}`}>
            {ticket.status === "checked-in"
              ? `Checked in${ticket.checkedInAt ? ` at ${f.time(ticket.checkedInAt)}` : ""}`
              : ticket.status === "refund-requested"
                ? "Refund requested. The host will reply by email."
                : ticket.status === "canceled"
                  ? "Canceled"
                  : `Sent to ${ticket.transferredTo}`}
          </p>
        )}
      </div>

      <TransferSheet open={sheet === "transfer"} onOpenChange={(o) => setSheet(o ? "transfer" : null)} ticket={ticket} />
      <RefundSheet open={sheet === "refund"} onOpenChange={(o) => setSheet(o ? "refund" : null)} ticket={ticket} event={event} />
    </Surface>
  );
}

function Surface({ back, more, glow, children }: { back: React.ReactNode; more?: React.ReactNode; glow?: string; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-40 isolate overflow-y-auto bg-surface">
      {/* Photo glow behind the ticket (DESIGN_PLAN §0: event hero and this screen only). */}
      {glow && (
        <span className="glow" aria-hidden>
          <Photo src={glow} alt="" sizes="50vw" />
        </span>
      )}
      <div className="mx-auto flex min-h-full max-w-md flex-col px-4 pb-12">
        <div className="flex items-center justify-between" style={{ height: "var(--bar-height)" }}>
          {back}
          {more}
        </div>
        <div className="flex flex-1 flex-col items-center justify-center py-4">{children}</div>
      </div>
    </div>
  );
}

const transferSchema = z.object({
  name: z.string().trim().min(1, "Enter their name"),
  email: z.email("Enter an email like migs@email.com"),
});

function TransferSheet({ open, onOpenChange, ticket }: { open: boolean; onOpenChange: (o: boolean) => void; ticket: Ticket }) {
  const updateTicket = useStore((s) => s.updateTicket);
  const { register, handleSubmit, formState, reset } = useForm({ resolver: zodResolver(transferSchema), defaultValues: { name: "", email: "" } });
  const submit = handleSubmit((v) => {
    updateTicket(ticket.id, { status: "transferred", transferredTo: v.email, holderName: v.name });
    toast(`Ticket sent to ${v.email}`);
    reset();
    onOpenChange(false);
  });
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Transfer ticket"
      description="They get a new QR. This one stops working."
      footer={
        <Button type="submit" form="transfer" size="lg" fullWidth>
          Send ticket
        </Button>
      }
    >
      <form id="transfer" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Their name" error={formState.errors.name?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete="off" {...register("name")} />}
        </Field>
        <Field label="Their email" error={formState.errors.email?.message}>
          {({ id, describedBy, invalid }) => <Input id={id} type="email" inputMode="email" aria-describedby={describedBy} aria-invalid={invalid || undefined} autoComplete="off" {...register("email")} />}
        </Field>
      </form>
    </Sheet>
  );
}

function RefundSheet({ open, onOpenChange, ticket, event }: { open: boolean; onOpenChange: (o: boolean) => void; ticket: Ticket; event: TktEvent }) {
  const updateTicket = useStore((s) => s.updateTicket);
  const [reason, setReason] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    updateTicket(ticket.id, { status: "refund-requested" });
    toast(`Refund requested for ${event.title}`);
    setReason("");
    onOpenChange(false);
  };
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Request a refund"
      description="The host reviews every request."
      footer={
        <Button type="submit" form="refund" size="lg" fullWidth>
          Send request
        </Button>
      }
    >
      <form id="refund" onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 rounded-sm bg-surface-sunken p-4">
          <span className="text-sm font-medium">Refund policy</span>
          <p className="text-sm text-text-secondary">{event.refundPolicy}</p>
        </div>
        <Field label="Reason" optional hint="Helps the host decide faster.">
          {({ id, describedBy }) => <Textarea id={id} aria-describedby={describedBy} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />}
        </Field>
      </form>
    </Sheet>
  );
}
