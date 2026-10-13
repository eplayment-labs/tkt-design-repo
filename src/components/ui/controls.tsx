"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { Check, Minus, Plus, X } from "lucide-react";
import { Drawer } from "vaul";
import { Num } from "./number";

/* ---------- Chip: filter toggle, radius-sm, never a pill ---------- */

export function Chip({
  pressed,
  onClick,
  children,
  icon,
}: {
  pressed: boolean;
  onClick: () => void;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`inline-flex min-h-10 shrink-0 items-center gap-2 rounded-pill border px-4 text-sm font-semibold transition-colors duration-150 ${
        pressed
          ? "border-transparent bg-accent text-[var(--text-on-accent)]"
          : "border-border-subtle bg-surface-raised text-text-primary hover:border-border-strong"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

/* ---------- Tabs: underline indicator shares a layoutId ---------- */

export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  const id = useId();
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    const next = (i + dir + tabs.length) % tabs.length;
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div role="tablist" aria-label={label} className="scroll-x flex gap-1 rounded-pill bg-surface-sunken p-1 self-start max-w-full">
      {tabs.map((t, i) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            role="tab"
            type="button"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onKeyDown={(e) => onKey(e, i)}
            onClick={() => onChange(t.value)}
            className={`relative flex min-h-10 shrink-0 items-center gap-2 rounded-pill px-4 text-sm font-semibold transition-colors duration-150 ${
              active ? "text-text-primary" : "text-text-tertiary hover:text-text-primary"
            }`}
          >
            {active && <motion.span layoutId={`tab-${id}`} className="absolute inset-0 -z-0 rounded-pill bg-surface-raised" style={{ boxShadow: "var(--shadow-overlay)" }} />}
            <span className="relative">{t.label}</span>
            {t.count !== undefined && <span className="num relative text-text-tertiary">{t.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Stepper: rolls digits; first add morphs into a check ---------- */

export function Stepper({
  value,
  onChange,
  max,
  label,
  disabled,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
  label: string;
  disabled?: boolean;
}) {
  const [justAdded, setJustAdded] = useState(false);
  useEffect(() => {
    if (!justAdded) return;
    const t = setTimeout(() => setJustAdded(false), 1200);
    return () => clearTimeout(t);
  }, [justAdded]);

  if (value === 0) {
    return (
      <button
        type="button"
        disabled={disabled || max === 0}
        onClick={() => {
          onChange(1);
          setJustAdded(true);
        }}
        aria-label={`Add ${label}`}
        className="inline-flex min-h-11 min-w-24 items-center justify-center gap-2 rounded-pill bg-accent px-5 text-sm font-semibold text-[var(--text-on-accent)] disabled:cursor-not-allowed disabled:bg-surface-sunken disabled:text-text-disabled"
      >
        <Plus size={16} aria-hidden /> Add
      </button>
    );
  }

  return (
    <div className="inline-flex min-h-11 items-center rounded-pill bg-surface-sunken p-0.5" role="group" aria-label={`${label} quantity`}>
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label={`Remove one ${label}`}
        className="flex h-10 w-10 items-center justify-center rounded-pill bg-surface-raised"
      >
        <Minus size={16} aria-hidden />
      </button>
      <span className="relative flex w-8 items-center justify-center text-base font-semibold" aria-live="polite">
        {justAdded ? (
          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex text-event-text">
            <Check size={18} aria-label="Added" />
          </motion.span>
        ) : (
          <Num value={value} />
        )}
      </span>
      <button
        type="button"
        onClick={() => {
          setJustAdded(false);
          onChange(value + 1);
        }}
        disabled={value >= max}
        aria-label={`Add one ${label}`}
        className="flex h-10 w-10 items-center justify-center rounded-pill bg-surface-raised disabled:cursor-not-allowed disabled:text-text-disabled"
      >
        <Plus size={16} aria-hidden />
      </button>
    </div>
  );
}

/* ---------- Switch ---------- */

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4">
      <label htmlFor={id} className="flex flex-col gap-1">
        <span className="text-sm font-medium">{label}</span>
        {hint && <span className="text-sm text-text-tertiary">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-10 shrink-0 rounded-pill transition-colors duration-150 ${checked ? "bg-accent" : "bg-border-strong"}`}
      >
        <span
          className="absolute top-1 left-1 h-4 w-4 rounded-pill bg-surface-raised transition-transform duration-150"
          style={{ transform: checked ? "translateX(var(--space-4))" : "none" }}
        />
      </button>
    </div>
  );
}

/* ---------- Segmented: radio group as buttons ---------- */

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-pill bg-surface-sunken p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`flex min-h-9 items-center gap-2 rounded-pill px-4 text-sm font-semibold transition-colors duration-150 ${
            o.value === value ? "bg-surface-raised text-text-primary" : "text-text-tertiary hover:text-text-primary"
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Sheet: vaul drawer (bottom on mobile, side on desktop if asked) ---------- */

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  side = "bottom",
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  side?: "bottom" | "right";
}) {
  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} direction={side}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-[var(--surface-overlay)]" />
        <Drawer.Content
          className={`fixed z-50 flex flex-col bg-surface-raised outline-none ${
            side === "bottom"
              ? "inset-x-0 bottom-0 max-h-[92svh] rounded-t-lg"
              : "inset-y-0 right-0 w-full max-w-md"
          }`}
          style={{ boxShadow: "var(--shadow-overlay)" }}
        >
          {side === "bottom" && <div aria-hidden className="mx-auto mt-3 h-1 w-10 rounded-pill bg-border-strong" />}
          <div className="flex items-start justify-between gap-4 px-4 pt-4 pb-3 md:px-6">
            <div className="flex flex-col gap-1">
              <Drawer.Title className="text-lg font-semibold">{title}</Drawer.Title>
              {description ? (
                <Drawer.Description className="text-sm text-text-tertiary">{description}</Drawer.Description>
              ) : (
                <Drawer.Description className="sr-only">{title}</Drawer.Description>
              )}
            </div>
            <Drawer.Close className="flex h-10 w-10 items-center justify-center rounded-pill bg-surface-sunken hover:bg-border-subtle" aria-label="Close">
              <X size={18} aria-hidden />
            </Drawer.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4 md:px-6">{children}</div>
          {footer && <div className="safe-bottom border-t border-border-subtle px-4 py-3 md:px-6">{footer}</div>}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/* ---------- Menu: small accessible dropdown ---------- */

export function Menu({
  trigger,
  label,
  children,
  align = "end",
}: {
  trigger: ReactNode;
  label: string;
  children: (close: () => void) => ReactNode;
  align?: "start" | "end";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  const onMenuKey = (e: React.KeyboardEvent) => {
    const items = Array.from(ref.current?.querySelectorAll<HTMLElement>("[role=menuitem]") ?? []);
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]?.focus();
    }
  };
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-11 items-center gap-2 rounded-pill px-1 hover:bg-surface-sunken"
      >
        {trigger}
      </button>
      {open && (
        <div
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
          className={`absolute top-full z-50 mt-2 min-w-56 rounded-lg border border-border-subtle bg-surface-raised p-2 ${align === "end" ? "right-0" : "left-0"}`}
          style={{ boxShadow: "var(--shadow-overlay)" }}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ onSelect, children, icon }: { onSelect: () => void; children: ReactNode; icon?: ReactNode }) {
  return (
    <button
      type="button"
      role="menuitem"
      tabIndex={-1}
      onClick={onSelect}
      className="flex min-h-10 w-full items-center gap-3 rounded-sm px-3 text-left text-sm hover:bg-surface-sunken focus-visible:bg-surface-sunken focus-visible:outline-none"
    >
      {icon && <span className="text-text-tertiary">{icon}</span>}
      {children}
    </button>
  );
}

export function MenuLabel({ children }: { children: ReactNode }) {
  return <div className="label px-3 pt-2 pb-1">{children}</div>;
}
