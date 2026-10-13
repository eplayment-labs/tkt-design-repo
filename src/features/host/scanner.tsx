"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "motion/react";
import { Ban, CameraOff, CircleAlert, CircleCheck, CircleHelp, LoaderCircle, Search, Undo2, UserCheck, WifiOff, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Segmented, Sheet, Switch } from "@/components/ui/controls";
import { Field, Input } from "@/components/ui/field";
import { Num } from "@/components/ui/number";
import { Slot } from "@/components/ui/primitives";
import { useSearchParams } from "next/navigation";
import { useDemoState } from "@/features/events";
import { accentVars } from "@/lib/accent";
import { useStore } from "@/features/store";
import { totals } from "@/lib/event";
import * as f from "@/lib/format";
import { shake } from "@/lib/motion";
import { events as mockEvents } from "@/mocks/events";
import { attendeesFor } from "@/mocks/people";
import type { TktEvent } from "@/mocks/types";
import { useAttendees, useHostEvent, type Row } from "./shared";

type Result =
  | { kind: "valid"; name: string; tier: string; serial: number }
  | { kind: "duplicate"; name: string; tier: string; at?: string }
  | { kind: "wrong"; name: string; eventTitle: string }
  | { kind: "notfound" };

type Camera = "starting" | "on" | "denied" | "blocked";

const READER_ID = "tkt-qr-reader";

/** Always dark while open: theme tokens are scoped by [data-theme], and sheets/toasts portal to <body>. */
function useForceDark() {
  useEffect(() => {
    const html = document.documentElement;
    html.dataset.theme = "dark";
    const keep = new MutationObserver(() => {
      if (html.dataset.theme !== "dark") html.dataset.theme = "dark";
    });
    keep.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
    // Any theme change while scanning (toggle in another tab, OS switch) is reverted by the observer above.
    return () => {
      keep.disconnect();
      // Hand back to the user's light/dark/system preference (tkt-theme).
      window.dispatchEvent(new Event("tkt-theme"));
    };
  }, []);
}

/* ---------- Camera ---------- */

function useCamera(enabled: boolean, onCode: (text: string) => void, forced: Camera | null) {
  const [state, setState] = useState<Camera>("starting");
  const handler = useRef(onCode);
  useEffect(() => {
    handler.current = onCode;
  }, [onCode]);

  useEffect(() => {
    if (!enabled || forced) return;
    let cancelled = false;
    let scanner: { stop: () => Promise<void>; isScanning?: boolean } | null = null;
    (async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        if (cancelled) return;
        const q = new Html5Qrcode(READER_ID, { verbose: false });
        scanner = q;
        await q.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: (w, h) => ({ width: Math.min(w, h) * 0.6, height: Math.min(w, h) * 0.6 }) },
          (text) => handler.current(text),
          undefined,
        );
        if (!cancelled) setState("on");
        else q.stop().catch(() => {});
      } catch {
        if (!cancelled) setState("denied");
      }
    })();
    return () => {
      cancelled = true;
      if (scanner?.isScanning) scanner.stop().catch(() => {});
    };
  }, [enabled, forced]);

  return forced ?? (enabled ? state : "blocked");
}

/* ---------- Result block ---------- */

function ResultBlock({ result, capacity, pulse }: { result: Result | null; capacity: number; pulse: number }) {
  const controls = useAnimationControls();
  const reduced = useReducedMotion();
  const [staticFlash, setStaticFlash] = useState(false);
  const bad = result && result.kind !== "valid";

  useEffect(() => {
    if (!pulse || !bad) return;
    if (reduced) {
      const on = setTimeout(() => setStaticFlash(true), 0);
      const off = setTimeout(() => setStaticFlash(false), 600);
      return () => {
        clearTimeout(on);
        clearTimeout(off);
      };
    }
    controls.start({ x: shake.x, transition: shake.transition });
  }, [pulse, bad, reduced, controls]);

  let icon = null;
  let word = "Ready";
  let tone = "text-text-tertiary";
  let detail: React.ReactNode = <span className="text-text-tertiary">Point the camera at a ticket QR.</span>;
  if (result?.kind === "valid") {
    icon = <CircleCheck aria-hidden size="0.9em" className="shrink-0" />;
    word = "Valid";
    tone = "text-success";
    detail = (
      <>
        <span>
          {result.name} · <span className="font-medium text-event-text">{result.tier}</span>
        </span>
        <span className="num font-mono text-base text-text-secondary">
          No. {String(result.serial).padStart(4, "0")}
          {capacity ? ` / ${f.count(capacity)}` : ""}
        </span>
      </>
    );
  } else if (result?.kind === "duplicate") {
    icon = <CircleAlert aria-hidden size="0.9em" className="shrink-0" />;
    word = "Already in";
    tone = "text-danger";
    detail = (
      <span>
        {result.name} · {result.tier}
        {result.at && <span className="num text-text-secondary"> · in at {f.time(result.at)}</span>}
      </span>
    );
  } else if (result?.kind === "wrong") {
    icon = <Ban aria-hidden size="0.9em" className="shrink-0" />;
    word = "Wrong event";
    tone = "text-danger";
    detail = (
      <span>
        {result.name} · ticket for {result.eventTitle}
      </span>
    );
  } else if (result?.kind === "notfound") {
    icon = <CircleHelp aria-hidden size="0.9em" className="shrink-0" />;
    word = "Not found";
    tone = "text-danger";
    detail = <span className="text-text-secondary">This QR isn&rsquo;t a ticket we know. Search by name instead.</span>;
  }

  return (
    <motion.div
      animate={controls}
      role="status"
      aria-live="assertive"
      // Rounded result panel; bad results get a danger edge (border is always 2px so nothing shifts).
      className={`flex flex-col gap-1 rounded-lg border-2 bg-surface-raised p-4 transition-colors duration-150 ${bad ? "border-[var(--danger)]" : "border-border-subtle"} ${staticFlash ? "bg-danger-subtle" : ""}`}
    >
      <span className={`display flex items-center gap-3 ${tone}`}>
        {icon}
        {word}
      </span>
      <span className="flex flex-col gap-1 text-lg">{detail}</span>
    </motion.div>
  );
}

function SuccessFlash({ pulse }: { pulse: number }) {
  const reduced = useReducedMotion();
  const [staticOn, setStaticOn] = useState(false);
  useEffect(() => {
    if (!pulse || !reduced) return;
    const on = setTimeout(() => setStaticOn(true), 0);
    const off = setTimeout(() => setStaticOn(false), 600);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [pulse, reduced]);
  if (!pulse) return null;
  if (reduced) return staticOn ? <div aria-hidden className="pointer-events-none fixed inset-0 z-40 bg-[var(--success)] opacity-25" /> : null;
  return (
    <motion.div
      key={pulse}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 bg-[var(--success)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 0.24, 0] }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
    />
  );
}

/* ---------- Manual search sheet ---------- */

function SearchSheet({
  open,
  onOpenChange,
  rows,
  event,
  disabled,
  onCheckIn,
  onUndo,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  rows: Row[];
  event: TktEvent;
  disabled: boolean;
  onCheckIn: (r: Row) => void;
  onUndo: (r: Row) => void;
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const matches = (needle ? rows.filter((r) => r.name.toLowerCase().includes(needle) || r.ticketCode.toLowerCase().includes(needle) || r.email.includes(needle)) : rows).slice(0, 30);
  const tierName = (id: string) => event.tiers.find((t) => t.id === id)?.name ?? "";
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Search attendees" description={disabled ? "Check-in is off for this event." : undefined}>
      <div className="flex flex-col gap-3">
        <Field label="Name, email, or ticket code" hideLabel>
          {({ id }) => <Input id={id} type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, email, or ticket code" autoComplete="off" />}
        </Field>
        <ul aria-label="Results">
          {matches.map((r) => (
            <li key={r.id} className="flex items-center gap-3 border-b border-border-subtle py-2">
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-base font-medium">{r.name}</span>
                <span className="truncate text-sm text-text-tertiary">
                  {tierName(r.tierId)} · <span className="font-mono">{r.ticketCode}</span>
                </span>
              </div>
              {r.checkedAt ? (
                <>
                  <span className="num text-sm text-success">In {f.time(r.checkedAt)}</span>
                  {r.local && !disabled && (
                    <button
                      type="button"
                      onClick={() => onUndo(r)}
                      aria-label={`Undo check-in for ${r.name}`}
                      className="flex h-11 w-11 items-center justify-center rounded-pill border border-border-default"
                    >
                      <Undo2 size={18} aria-hidden />
                    </button>
                  )}
                </>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onCheckIn(r)}
                  aria-label={`Check in ${r.name}`}
                  className="flex h-11 w-11 items-center justify-center rounded-pill bg-accent text-[var(--text-on-accent)] disabled:bg-surface-sunken disabled:text-text-disabled"
                >
                  <UserCheck size={20} aria-hidden />
                </button>
              )}
            </li>
          ))}
          {matches.length === 0 && <li className="py-4 text-sm text-text-tertiary">No one matches that. Check the spelling or try the ticket code.</li>}
        </ul>
      </div>
    </Sheet>
  );
}

/* ---------- Demo sheet ---------- */

function DemoSheet({
  open,
  onOpenChange,
  offline,
  onOffline,
  onSimulate,
  disabled,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  offline: boolean;
  onOffline: (v: boolean) => void;
  onSimulate: (k: "valid" | "duplicate" | "wrong") => void;
  disabled: boolean;
}) {
  const [kind, setKind] = useState<"valid" | "duplicate" | "wrong">("valid");
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Demo" description="Prototype controls. Not part of the real scanner.">
      <div className="flex flex-col gap-6 pb-2">
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">Simulate scan</span>
          <Segmented
            label="Scan result"
            value={kind}
            onChange={setKind}
            options={[
              { value: "valid", label: "Valid" },
              { value: "duplicate", label: "Already in" },
              { value: "wrong", label: "Wrong event" },
            ]}
          />
          <Button
            variant="secondary"
            disabled={disabled}
            onClick={() => {
              onSimulate(kind);
              onOpenChange(false);
            }}
          >
            Simulate scan
          </Button>
        </div>
        <Switch checked={offline} onChange={onOffline} label="Offline" hint="Queue check-ins until you're back online." />
      </div>
    </Sheet>
  );
}

/* ---------- Screen ---------- */

export function Scanner({ id }: { id: string }) {
  useForceDark();
  const demo = useDemoState();
  const { ready, event } = useHostEvent(id);
  const { rows, checked } = useAttendees(id);
  const offline = useStore((s) => s.offline);
  const queued = useStore((s) => s.syncQueue.filter((q) => q.eventId === id).length);
  const setDev = useStore((s) => s.setDev);
  const checkIn = useStore((s) => s.checkIn);
  const undoCheckIn = useStore((s) => s.undoCheckIn);
  const updateTicket = useStore((s) => s.updateTicket);

  const [result, setResult] = useState<Result | null>(null);
  const [pulse, setPulse] = useState(0);
  const [goodPulse, setGoodPulse] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const last = useRef<{ code: string; t: number } | null>(null);
  const search = useSearchParams();
  // Demo controls only when asked for (?demo=1) or while previewing a ?state=.
  const showDemo = search.get("demo") === "1" || search.has("state");

  // Door safety: a result never lingers for the next guest.
  useEffect(() => {
    if (!result) return;
    const t = setTimeout(() => setResult(null), 3000);
    return () => clearTimeout(t);
  }, [result, pulse, goodPulse]);

  const canceled = event?.status === "canceled";
  const sold = event ? totals(event).sold : 0;
  const capacity = event ? totals(event).capacity : 0;
  const tierName = useCallback((tid: string) => event?.tiers.find((t) => t.id === tid)?.name ?? "", [event]);

  useEffect(() => {
    if (demo === "offline") setDev({ offline: true });
  }, [demo, setDev]);

  const show = useCallback((r: Result) => {
    setResult(r);
    if (r.kind === "valid") {
      setGoodPulse((n) => n + 1);
      navigator.vibrate?.(30);
    } else {
      setPulse((n) => n + 1);
      navigator.vibrate?.([40, 60, 40]);
    }
  }, []);

  /** One handler for camera, demo, and manual check-in. Payload: tkt:<ticketCode>. */
  const handle = useCallback(
    (text: string) => {
      if (!event || canceled) return;
      const now = Date.now();
      if (last.current && last.current.code === text && now - last.current.t < 2500) return;
      last.current = { code: text, t: now };

      const code = text.startsWith("tkt:") ? text.slice(4).trim() : "";
      if (!code) return show({ kind: "notfound" });
      const s = useStore.getState();
      const local = s.checkIns[id] ?? {};

      const a = attendeesFor(id).find((x) => x.ticketCode === code);
      if (a) {
        const at = local[a.id] ?? a.checkedInAt;
        if (at) return show({ kind: "duplicate", name: a.name, tier: tierName(a.tierId), at });
        checkIn(id, a.id);
        return show({ kind: "valid", name: a.name, tier: tierName(a.tierId), serial: a.serial });
      }

      const t = s.tickets.find((x) => x.code === code);
      if (t) {
        if (t.eventId !== id) {
          const other = mockEvents.find((e) => e.id === t.eventId) ?? s.drafts.find((e) => e.id === t.eventId);
          return show({ kind: "wrong", name: t.holderName, eventTitle: other?.title ?? "another event" });
        }
        if (t.status === "canceled" || t.status === "transferred") return show({ kind: "notfound" });
        const at = local[t.id] ?? t.checkedInAt;
        if (at || t.status === "checked-in") return show({ kind: "duplicate", name: t.holderName, tier: tierName(t.tierId), at });
        checkIn(id, t.id);
        updateTicket(t.id, { status: "checked-in", checkedInAt: new Date().toISOString() });
        return show({ kind: "valid", name: t.holderName, tier: tierName(t.tierId), serial: t.serial });
      }

      for (const e of mockEvents) {
        if (e.id === id || e.tiers.every((x) => x.sold === 0)) continue;
        const hit = attendeesFor(e.id).find((x) => x.ticketCode === code);
        if (hit) return show({ kind: "wrong", name: hit.name, eventTitle: e.title });
      }
      show({ kind: "notfound" });
    },
    [event, canceled, id, show, tierName, checkIn, updateTicket],
  );

  const forced: Camera | null = demo === "loading" ? "starting" : demo === "error" ? "denied" : null;
  const camera = useCamera(Boolean(ready && event && !canceled), handle, forced);

  const simulate = (k: "valid" | "duplicate" | "wrong") => {
    last.current = null;
    if (k === "valid") {
      const r = rows.find((x) => !x.checkedAt);
      if (r) handle(`tkt:${r.ticketCode}`);
      else toast("Everyone is already checked in");
    } else if (k === "duplicate") {
      let r = rows.find((x) => x.checkedAt);
      if (!r) {
        r = rows[0];
        if (r) checkIn(id, r.id);
      }
      if (r) handle(`tkt:${r.ticketCode}`);
    } else {
      const other = mockEvents.find((e) => e.id !== id && e.hostId === event?.hostId && e.tiers.some((t) => t.sold > 0)) ?? mockEvents.find((e) => e.id !== id);
      const a = other ? attendeesFor(other.id)[0] : undefined;
      if (a) handle(`tkt:${a.ticketCode}`);
    }
  };

  const setOffline = (v: boolean) => {
    if (!v) {
      const n = useStore.getState().syncQueue.length;
      setDev({ offline: false });
      if (n) toast(`${f.plural(n, "check-in")} synced`);
    } else {
      setDev({ offline: true });
    }
  };

  const manualCheckIn = (r: Row) => {
    last.current = null;
    setSearchOpen(false);
    handle(`tkt:${r.ticketCode}`);
  };

  const animated = pulse + goodPulse > 0;

  if (ready && !event) {
    return (
      <div data-theme="dark" className="fixed inset-0 flex flex-col items-start gap-4 bg-surface p-6 text-text-primary">
        <h1 className="text-2xl font-semibold">Event not found</h1>
        <p className="text-sm text-text-secondary">The scanner link may be wrong.</p>
        <Link href="/host" className="inline-flex min-h-11 items-center rounded-pill border border-border-default px-4 text-sm font-medium">
          Back to events
        </Link>
      </div>
    );
  }

  return (
    <div data-theme="dark" className="fixed inset-0 flex flex-col bg-surface text-text-primary">
      <SuccessFlash pulse={goodPulse} />

      {/* Top 55%: viewfinder. Close is the only control up here. */}
      <div className="relative shrink-0 overflow-hidden bg-[var(--gray-1000)]" style={{ height: "55svh" }}>
        <div id={READER_ID} className="absolute inset-0 [&_video]:h-full! [&_video]:w-full! [&_video]:object-cover" />
        {camera !== "on" && (
          <div className="absolute inset-0 flex flex-col items-start justify-end gap-3 p-6">
            {camera === "starting" && (
              <p className="flex items-center gap-2 text-sm text-text-secondary">
                <LoaderCircle size={18} aria-hidden className="animate-spin" /> Starting camera
              </p>
            )}
            {camera === "denied" && (
              <>
                <CameraOff size={24} aria-hidden className="text-text-tertiary" />
                <p className="text-lg font-medium">Camera unavailable</p>
                <p className="max-w-[40ch] text-sm text-text-secondary">Allow camera access in your browser settings, or find people by name below.</p>
              </>
            )}
            {camera === "blocked" && canceled && (
              <>
                <Ban size={24} aria-hidden className="text-danger" />
                <p className="text-lg font-medium">Scanning is off</p>
                <p className="max-w-[40ch] text-sm text-text-secondary">This event was canceled, so tickets can&rsquo;t be checked in.</p>
              </>
            )}
          </div>
        )}
        <Link
          href={`/host/events/${id}`}
          aria-label="Close scanner"
          className="absolute top-4 left-4 z-10 flex h-11 w-11 items-center justify-center rounded-pill bg-surface-raised text-text-primary"
        >
          <X size={20} aria-hidden />
        </Link>
      </div>

      <div className="safe-bottom flex min-h-0 flex-1 flex-col gap-4 px-4 pt-4 pb-4">
        <div className="min-h-0 flex-1">
          {canceled ? (
            <div className="flex flex-col gap-1 rounded-lg border-2 border-[var(--danger)] bg-surface-raised p-4">
              <span className="display flex items-center gap-3 text-danger">
                <Ban aria-hidden size="0.9em" className="shrink-0" /> Canceled
              </span>
              <span className="text-lg text-text-secondary">{event?.title}</span>
            </div>
          ) : (
            <div className="event-scope" style={accentVars(event?.accent)}>
              <ResultBlock result={result} capacity={capacity} pulse={pulse} />
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <span className="num text-lg font-medium">
            {ready ? (
              <>
                <Num value={checked} animated={animated} /> / {f.count(sold)} in
              </>
            ) : (
              <Slot w="7rem" />
            )}
          </span>
          {offline && (
            <span className="inline-flex items-center gap-2 text-sm font-medium text-warning">
              <WifiOff size={16} aria-hidden />
              <span>
                Offline · <span className="num">{queued}</span> to sync
              </span>
            </span>
          )}
        </div>

        {/* Thumb zone */}
        <div className="flex gap-3">
          {showDemo && (
            <Button variant="secondary" size="lg" onClick={() => setDemoOpen(true)} aria-label="Demo controls">
              Demo
            </Button>
          )}
          <Button size="lg" fullWidth className="flex-1" iconLeft={<Search size={20} aria-hidden />} onClick={() => setSearchOpen(true)} disabled={!ready || !event}>
            Search attendees
          </Button>
        </div>
      </div>

      {event && (
        <>
          <SearchSheet
            open={searchOpen}
            onOpenChange={setSearchOpen}
            rows={rows}
            event={event}
            disabled={canceled}
            onCheckIn={manualCheckIn}
            onUndo={(r) => {
              undoCheckIn(id, r.id);
              toast(`Undid check-in for ${r.name}`);
            }}
          />
          <DemoSheet open={demoOpen} onOpenChange={setDemoOpen} offline={offline} onOffline={setOffline} onSimulate={simulate} disabled={canceled || !ready} />
        </>
      )}
    </div>
  );
}
