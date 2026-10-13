"use client";

import { useId, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Search, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/field";
import { usePublicEvents } from "@/features/events";
import * as f from "@/lib/format";
import { hosts } from "@/mocks/hosts";
import { CATEGORIES, CITIES, WHEN, live, matchesQuery, searchHref, type When } from "./catalog";

type Option = { id: string; group: "Events" | "Hosts" | "Cities" | "Categories"; label: string; sub?: string; href: string };

const ICON = { Events: CalendarDays, Hosts: User, Cities: MapPin, Categories: Tag };

/** Live suggestions for the search input. */
function useSuggestions(q: string): Option[] {
  const events = live(usePublicEvents());
  const t = q.trim().toLowerCase();
  if (!t) return [];
  const ev: Option[] = events
    .filter((e) => matchesQuery(e, t))
    .slice(0, 4)
    .map((e) => ({ id: `e-${e.id}`, group: "Events", label: e.title, sub: `${f.dayShort(e.start)} · ${e.city}`, href: `/e/${e.slug}` }));
  const hs: Option[] = hosts
    .filter((h) => h.name.toLowerCase().includes(t))
    .slice(0, 2)
    .map((h) => ({ id: `h-${h.id}`, group: "Hosts", label: h.name, sub: `@${h.handle}`, href: `/h/${h.handle}` }));
  const cs: Option[] = CITIES.filter((c) => c.toLowerCase().includes(t)).map((c) => ({ id: `c-${c}`, group: "Cities", label: c, href: searchHref({ city: c }) }));
  const cat: Option[] = CATEGORIES.filter((c) => c.toLowerCase().includes(t)).map((c) => ({ id: `k-${c}`, group: "Categories", label: c, href: searchHref({ cat: c }) }));
  return [...ev, ...hs, ...cs, ...cat];
}

/**
 * Search input with an ARIA combobox of live suggestions (events, hosts,
 * cities, categories). Arrow keys move, Enter opens, Escape closes. Enter
 * with nothing highlighted submits the full search.
 */
export function SearchInput({
  value,
  onChange,
  onSubmit,
  size = "lg",
  label = "Search events",
  placeholder = "Search events, hosts, cities",
  onFocusChange,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  size?: "lg" | "md";
  label?: string;
  placeholder?: string;
  onFocusChange?: (focused: boolean) => void;
}) {
  const router = useRouter();
  const id = useId();
  const listId = `${id}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const options = useSuggestions(value);
  const show = open && options.length > 0;

  const go = (o: Option) => {
    setOpen(false);
    router.push(o.href);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a + 1) % options.length);
    } else if (e.key === "ArrowUp" && options.length) {
      e.preventDefault();
      setOpen(true);
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (show && active >= 0) go(options[active]);
      else {
        setOpen(false);
        onSubmit();
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
    }
  };

  return (
    <div className="relative min-w-0 flex-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search size={20} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-text-tertiary" />
      <input
        id={id}
        type="search"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show && active >= 0 ? `${id}-${options[active].id}` : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => {
          setOpen(true);
          onFocusChange?.(true);
        }}
        onBlur={() => {
          setOpen(false);
          onFocusChange?.(false);
        }}
        onKeyDown={onKey}
        className={`w-full rounded-pill border border-border-default bg-surface-raised pr-4 pl-12 text-base outline-none placeholder:text-text-tertiary focus-visible:border-text-primary ${size === "lg" ? "h-14" : "h-12"}`}
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          className="absolute inset-x-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-lg border border-border-default bg-surface-raised p-2"
          style={{ boxShadow: "var(--shadow-overlay)" }}
        >
          {options.map((o, i) => {
            const heading = i === 0 || options[i - 1].group !== o.group;
            const Icon = ICON[o.group];
            return (
              <li key={o.id} role="presentation">
                {heading && <div className="label px-3 pt-2 pb-1">{o.group}</div>}
                <div
                  id={`${id}-${o.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(o)}
                  className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-sm px-3 py-2 ${i === active ? "bg-surface-sunken" : ""}`}
                >
                  <Icon size={16} aria-hidden className="shrink-0 text-text-tertiary" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-sm font-medium">{o.label}</span>
                    {o.sub && <span className="num truncate text-xs text-text-tertiary">{o.sub}</span>}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/** Home search block: keyword + city + when + category → /search. */
export function SearchBlock() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [when, setWhen] = useState<When>("any");
  const [cat, setCat] = useState("");
  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    router.push(searchHref({ q: q.trim(), city, when, cat }));
  };
  return (
    <form onSubmit={submit} role="search" aria-label="Find events" className="flex flex-col gap-3 lg:flex-row lg:items-center">
      <SearchInput value={q} onChange={setQ} onSubmit={() => submit()} />
      <div className="grid grid-cols-2 gap-3 lg:flex lg:w-auto">
        <FilterSelect label="City" value={city} onChange={setCity} options={[{ value: "", label: "Any city" }, ...CITIES.map((c) => ({ value: c, label: c }))]} />
        <FilterSelect label="When" value={when} onChange={(v) => setWhen(v as When)} options={WHEN} />
        <div className="col-span-2 lg:col-span-1">
          <FilterSelect label="Category" value={cat} onChange={setCat} options={[{ value: "", label: "Any category" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />
        </div>
      </div>
      <Button type="submit" size="lg" className="w-full lg:w-auto">
        Search
      </Button>
    </form>
  );
}

export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const id = useId();
  return (
    <div className="min-w-0">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="h-14 w-full rounded-pill lg:min-w-40">
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
