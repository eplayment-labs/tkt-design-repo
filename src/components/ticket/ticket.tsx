"use client";

import { motion } from "motion/react";
import { QRCodeSVG } from "qrcode.react";
import { Ban, Repeat, Undo2 } from "lucide-react";
import { Photo, Slot, Status } from "@/components/ui/primitives";
import { accentVars } from "@/lib/accent";
import * as f from "@/lib/format";
import { totals, whereLabel } from "@/lib/event";
import type { Ticket as TicketT, TktEvent } from "@/mocks/types";
import styles from "./ticket.module.css";

type Props = {
  event: TktEvent;
  ticket?: TicketT;
  /** Render the real frame with value slots only. */
  loading?: boolean;
  layout?: "portrait" | "auto";
  /** Tap the QR to expand it. Sets a shared layoutId on the QR. */
  onExpand?: () => void;
  qrLayoutId?: string;
  past?: boolean;
};

export function Ticket({ event, ticket, loading, layout = "auto", onExpand, qrLayoutId, past }: Props) {
  const tier = event.tiers.find((t) => t.id === ticket?.tierId);
  const { capacity } = totals(event);
  const status = ticket?.status ?? "valid";
  const qrVisible = !loading && ticket && (status === "valid" || status === "refund-requested" || status === "checked-in");
  const dim = status === "checked-in";

  const qr = ticket ? (
    <QRCodeSVG value={`tkt:${ticket.code}`} size={128} level="M" bgColor="#ffffff" fgColor="#000000" title={`QR code for ticket ${ticket.code}`} />
  ) : null;

  return (
    <div className={`${styles.wrap} event-scope`} style={accentVars(event.accent)}>
      <article
        className={[styles.ticket, layout === "auto" && styles.landscapeAuto, dim && styles.dim].filter(Boolean).join(" ")}
        aria-label={`Ticket for ${event.title}`}
        aria-busy={loading || undefined}
      >
        <div className={styles.photo}>
          <Photo src={event.cover.url} alt="" sizes="(min-width: 768px) 640px, 100vw" position={event.cover.position} muted={past} />
        </div>

        <div className={styles.body}>
          <h3 className={styles.title}>{loading ? <Slot w="12rem" /> : event.title}</h3>
          <dl className={styles.grid}>
            <div>
              <dt>Date</dt>
              <dd className="num">{loading ? <Slot w="6.5rem" /> : f.dayLong(event.start).replace(/^\w+, /, "")}</dd>
            </div>
            <div>
              <dt>Time</dt>
              <dd className="num">{loading ? <Slot w="4rem" /> : f.time(event.start)}</dd>
            </div>
            <div className={layout === "auto" ? "" : styles.wide}>
              <dt>{event.format === "online" ? "Where" : "Venue"}</dt>
              <dd>{loading ? <Slot w="8rem" /> : whereLabel(event)}</dd>
            </div>
            <div>
              <dt>Tier</dt>
              <dd>{loading ? <Slot w="5rem" /> : tier?.name}</dd>
            </div>
            <div>
              <dt>Name</dt>
              <dd>{loading ? <Slot w="7rem" /> : ticket?.holderName}</dd>
            </div>
          </dl>
        </div>

        <div className={styles.perf} aria-hidden />

        <div className={styles.stub}>
          {qrVisible ? (
            onExpand ? (
              <motion.button
                type="button"
                layoutId={qrLayoutId}
                onClick={onExpand}
                className={styles.qr}
                aria-label="Show full-screen QR"
              >
                {qr}
              </motion.button>
            ) : (
              <motion.div layoutId={qrLayoutId} className={styles.qr}>
                {qr}
              </motion.div>
            )
          ) : loading ? (
            <div className={styles.qrHidden} />
          ) : (
            <div className={styles.qrHidden}>
              {status === "canceled" ? "No QR. This ticket was canceled." : status === "transferred" ? "No QR. You transferred this ticket." : ""}
            </div>
          )}

          <div className={styles.stubMeta}>
            {loading ? (
              <Slot w="8rem" />
            ) : (
              <>
                <span className={styles.code}>{ticket?.code}</span>
                {ticket && (
                  <span className={`${styles.serial} num`}>
                    No. {String(ticket.serial).padStart(4, "0")}
                    {capacity ? ` / ${f.count(capacity)}` : ""}
                  </span>
                )}
                <TicketStatus ticket={ticket} past={past} />
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}

function TicketStatus({ ticket, past }: { ticket?: TicketT; past?: boolean }) {
  if (!ticket) return null;
  switch (ticket.status) {
    case "checked-in":
      return <Status tone="success">Checked in {ticket.checkedInAt ? `at ${f.time(ticket.checkedInAt)}` : ""}</Status>;
    case "canceled":
      return (
        <Status tone="danger" icon={<Ban size={14} aria-hidden />}>
          <span className={styles.canceledMark}>Canceled</span>
        </Status>
      );
    case "transferred":
      return (
        <Status icon={<Repeat size={14} aria-hidden />}>Sent to {ticket.transferredTo}</Status>
      );
    case "refund-requested":
      return (
        <Status tone="warning" icon={<Undo2 size={14} aria-hidden />}>
          Refund requested
        </Status>
      );
    default:
      return past ? <Status>Past event</Status> : <span className="text-sm font-medium">Admit 1</span>;
  }
}

/** Compact stub for lists (My tickets, confirmation summary). */
export function TicketRow({ event, ticket, past }: { event: TktEvent; ticket: TicketT; past?: boolean }) {
  const tier = event.tiers.find((t) => t.id === ticket.tierId);
  const canceled = ticket.status === "canceled";
  return (
    <div className={`${styles.wrap} ${styles.wrapFlat} event-scope`} style={accentVars(event.accent)}>
      <div className={`${styles.ticket} ${styles.compact} ${canceled ? styles.compactCanceled : ""}`}>
        <div className={styles.photo}>
          <Photo src={event.cover.url} alt="" sizes="96px" muted={past || canceled} />
        </div>
        <div className={styles.body}>
          <span className={styles.title}>{event.title}</span>
          <span className="num text-sm text-text-secondary">
            {f.dayShort(event.start)} · {f.time(event.start)}
          </span>
          <span className="text-sm text-text-tertiary">
            {tier?.name} · {ticket.holderName}
          </span>
        </div>
        {!canceled && <div className={styles.compactEdge} aria-hidden />}
      </div>
    </div>
  );
}
