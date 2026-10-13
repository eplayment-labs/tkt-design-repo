"use client";

import { useMemo, useState } from "react";
import { Download, MoreHorizontal, Search, Send, Undo2, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Chip, Menu, MenuItem } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/field";
import { EndState, Slot, Status } from "@/components/ui/primitives";
import { useDemoState } from "@/features/events";
import { useStore } from "@/features/store";
import * as f from "@/lib/format";
import type { TktEvent } from "@/mocks/types";
import { Delayed, EventNotFound, RetryError, ShareLinkButton, SubHeader, downloadCsv, useAttendees, useHostEvent, type Row } from "./shared";

const PAGE = 50;

type CheckFilter = "all" | "in" | "out";

type Store = { checkIn: (e: string, a: string) => void; undoCheckIn: (e: string, a: string) => void };

function rowActions(event: TktEvent, { checkIn, undoCheckIn: undo }: Store) {
  const readOnly = event.status === "canceled" || event.status === "ended";
  return {
    readOnly,
    checkIn: (r: Row) => {
      checkIn(event.id, r.id);
      toast(`Checked in ${r.name}`);
    },
    undo: (r: Row) => {
      undo(event.id, r.id);
      toast(`Undid check-in for ${r.name}`);
    },
    resend: (r: Row) => toast(`Ticket resent to ${r.email}`),
  };
}

function RowMenu({ row, actions }: { row: Row; actions: ReturnType<typeof rowActions> }) {
  return (
    <Menu label={`Actions for ${row.name}`} trigger={<MoreHorizontal size={18} aria-hidden className="mx-1" />}>
      {(close) => (
        <>
          <MenuItem
            icon={<Send size={16} />}
            onSelect={() => {
              close();
              actions.resend(row);
            }}
          >
            Resend ticket
          </MenuItem>
          {!actions.readOnly && !row.checkedAt && (
            <MenuItem
              icon={<UserCheck size={16} />}
              onSelect={() => {
                close();
                actions.checkIn(row);
              }}
            >
              Check in
            </MenuItem>
          )}
          {!actions.readOnly && row.local && (
            <MenuItem
              icon={<Undo2 size={16} />}
              onSelect={() => {
                close();
                actions.undo(row);
              }}
            >
              Undo check-in
            </MenuItem>
          )}
        </>
      )}
    </Menu>
  );
}

function CheckState({ row }: { row: Row }) {
  return row.checkedAt ? (
    <Status tone="success">
      In <span className="num font-normal text-text-tertiary">{f.time(row.checkedAt)}</span>
    </Status>
  ) : (
    <Status tone="neutral">Not yet</Status>
  );
}

function CheckButton({ row, actions }: { row: Row; actions: ReturnType<typeof rowActions> }) {
  // Checked-in rows already say "In 7:42 PM"; undo lives in the row menu.
  if (row.checkedAt || actions.readOnly) return null;
  return (
    <Button variant="secondary" onClick={() => actions.checkIn(row)} aria-label={`Check in ${row.name}`}>
      Check in
    </Button>
  );
}

function Table({ rows, event, actions }: { rows: Row[]; event: TktEvent; actions: ReturnType<typeof rowActions> }) {
  const tierName = (id: string) => event.tiers.find((t) => t.id === id)?.name ?? "";
  return (
    <div className="hidden rounded-lg border border-border-subtle bg-surface-raised px-6 py-2 md:block">
    <table className="w-full text-left text-sm">
      <caption className="sr-only">Attendees</caption>
      <thead>
        <tr className="label border-b border-border-subtle">
          <th scope="col" className="py-2 pr-4 font-medium">Name</th>
          <th scope="col" className="py-2 pr-4 font-medium">Tier</th>
          <th scope="col" className="py-2 pr-4 font-medium">Ticket</th>
          <th scope="col" className="py-2 pr-4 font-medium">Order</th>
          <th scope="col" className="py-2 pr-4 font-medium">Status</th>
          <th scope="col" className="py-2 font-medium">
            <span className="sr-only">Actions</span>
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-b border-border-subtle last:border-b-0">
            <td className="py-2 pr-4">
              <div className="font-medium">{r.name}</div>
              <div className="text-text-tertiary">{r.email}</div>
            </td>
            <td className="py-2 pr-4 text-text-secondary">{tierName(r.tierId)}</td>
            <td className="py-2 pr-4 font-mono text-text-secondary">{r.ticketCode}</td>
            <td className="py-2 pr-4 font-mono text-text-secondary">{r.orderNumber}</td>
            <td className="py-2 pr-4">
              <CheckState row={r} />
            </td>
            <td className="py-2 text-right">
              <div className="flex items-center justify-end gap-2">
                <CheckButton row={r} actions={actions} />
                <RowMenu row={r} actions={actions} />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  );
}

function List({ rows, event, actions }: { rows: Row[]; event: TktEvent; actions: ReturnType<typeof rowActions> }) {
  const tierName = (id: string) => event.tiers.find((t) => t.id === id)?.name ?? "";
  return (
    <ul className="flex flex-col gap-3 md:hidden" aria-label="Attendees">
      {rows.map((r) => (
        <li key={r.id} className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-raised py-2 pr-2 pl-4">
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-base font-medium">{r.name}</span>
            <span className="flex flex-wrap items-center gap-x-3 text-sm text-text-tertiary">
              {tierName(r.tierId)}
              <CheckState row={r} />
            </span>
          </div>
          <RowMenu row={r} actions={actions} />
          <CheckButton row={r} actions={actions} />
        </li>
      ))}
    </ul>
  );
}

function Skeleton() {
  return (
    <div aria-busy="true" aria-label="Loading attendees" className="flex flex-col gap-3 md:gap-0 md:rounded-lg md:border md:border-border-subtle md:bg-surface-raised md:px-6 md:py-2">
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-surface-raised px-4 py-3 md:rounded-none md:border-b md:border-border-subtle md:px-0">
          <div className="flex flex-col gap-1">
            <Slot w="9rem" />
            <Slot w="12rem" className="hidden md:inline-block" />
          </div>
          <Slot w="5rem" className="hidden md:inline-block" />
          <Slot w="6rem" h="2.75rem" className="rounded-pill" />
        </div>
      ))}
    </div>
  );
}

export function AttendeesScreen({ id }: { id: string }) {
  const demo = useDemoState();
  const { ready, event } = useHostEvent(id);
  const { rows, checked } = useAttendees(id);
  const [q, setQ] = useState("");
  const [tier, setTier] = useState<string | null>(null);
  const [check, setCheck] = useState<CheckFilter>("all");
  const [limit, setLimit] = useState(PAGE);
  const checkIn = useStore((s) => s.checkIn);
  const undoCheckIn = useStore((s) => s.undoCheckIn);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!tier || r.tierId === tier) &&
        (check === "all" || (check === "in" ? Boolean(r.checkedAt) : !r.checkedAt)) &&
        (!needle ||
          r.name.toLowerCase().includes(needle) ||
          r.email.includes(needle) ||
          r.ticketCode.toLowerCase().includes(needle) ||
          r.orderNumber.toLowerCase().includes(needle)),
    );
  }, [rows, q, tier, check]);

  if (ready && !event) return <EventNotFound />;
  if (demo === "error" || !ready || !event || demo === "loading") {
    return (
      <div className="content flex flex-col gap-8 py-8">
        {event ? <SubHeader event={event} title="Attendees" /> : <h1 className="text-4xl font-extrabold tracking-(--tracking-display)">Attendees</h1>}
        {demo === "error" ? (
          <RetryError title="Attendees didn't load" />
        ) : (
          <Delayed>
            <Skeleton />
          </Delayed>
        )}
      </div>
    );
  }

  const all = demo === "empty" ? [] : rows;
  const shown = demo === "empty" ? [] : filtered.slice(0, limit);
  const actions = rowActions(event, { checkIn, undoCheckIn });

  const exportCsv = () => {
    const tierName = (tid: string) => event.tiers.find((t) => t.id === tid)?.name ?? "";
    downloadCsv(`${event.slug}-attendees.csv`, [
      ["Name", "Email", "Tier", "Ticket", "Serial", "Order", "Purchased", "Checked in"],
      ...filtered.map((r) => [r.name, r.email, tierName(r.tierId), r.ticketCode, r.serial, r.orderNumber, f.dateTime(r.purchasedAt), r.checkedAt ? f.dateTime(r.checkedAt) : ""]),
    ]);
    toast(`Exported ${f.plural(filtered.length, "attendee")}`);
  };

  return (
    <div className="content flex flex-col gap-6 py-8">
      <SubHeader
        event={event}
        title="Attendees"
        actions={
          all.length > 0 && (
            <Button variant="secondary" iconLeft={<Download size={18} aria-hidden />} onClick={exportCsv}>
              Export CSV
            </Button>
          )
        }
      />
      {all.length === 0 ? (
        <EndState title="No attendees yet" body="Share the event page. Everyone who gets a ticket shows up here." actions={<ShareLinkButton slug={event.slug} />} />
      ) : (
        <>
          <p className="num text-sm text-text-secondary">
            {f.count(checked)} of {f.count(all.length)} checked in
          </p>
          <div className="flex flex-col gap-3">
            <Field label="Search attendees" hideLabel>
              {({ id: fid }) => (
                <div className="relative">
                  <Search size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-text-tertiary" />
                  <Input
                    id={fid}
                    type="search"
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setLimit(PAGE);
                    }}
                    placeholder="Name, email, ticket, or order"
                    className="pl-12!"
                  />
                </div>
              )}
            </Field>
            <div className="scroll-x -mx-4 flex gap-2 px-4 md:mx-0 md:px-0" role="group" aria-label="Filters">
              {event.tiers.length > 1 &&
                event.tiers.map((t) => (
                  <Chip
                    key={t.id}
                    pressed={tier === t.id}
                    onClick={() => {
                      setTier(tier === t.id ? null : t.id);
                      setLimit(PAGE);
                    }}
                  >
                    {t.name}
                  </Chip>
                ))}
              <Chip pressed={check === "in"} onClick={() => setCheck(check === "in" ? "all" : "in")}>
                Checked in
              </Chip>
              <Chip pressed={check === "out"} onClick={() => setCheck(check === "out" ? "all" : "out")}>
                Not yet
              </Chip>
            </div>
          </div>

          {shown.length === 0 ? (
            <EndState
              title="No matches"
              body="Try a different name, or clear the filters."
              actions={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQ("");
                    setTier(null);
                    setCheck("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="flex flex-col gap-4">
              <Table rows={shown} event={event} actions={actions} />
              <List rows={shown} event={event} actions={actions} />
              <div className="flex flex-wrap items-center gap-4">
                <span className="num text-sm text-text-tertiary">
                  Showing {f.count(shown.length)} of {f.count(filtered.length)}
                </span>
                {filtered.length > shown.length && (
                  <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
                    Show more
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
