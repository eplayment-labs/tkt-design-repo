"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Chip, Sheet, Switch } from "@/components/ui/controls";
import { Select } from "@/components/ui/field";
import { EndState, ErrorState } from "@/components/ui/primitives";
import { useDemoState, usePublicEvents } from "@/features/events";
import { eventState } from "@/lib/event";
import * as f from "@/lib/format";
import { CATEGORIES, CITIES, PRICES, SORTS, WHEN, calendar, inPrice, inWhen, live, matchesQuery, searchHref, sortEvents, type PriceBand, type Sort, type When } from "./catalog";
import { EventCardSkeleton } from "./event-card";
import { CardGrid } from "./home";
import { useDelayedFlag } from "./hooks";
import { SearchInput } from "./search-box";
import { Heading } from "./ui";

type Params = { q: string; city: string; when: When; cat: string; price: PriceBand; hide: boolean; sort: Sort };

function read(sp: URLSearchParams): Params {
  const when = (WHEN.find((w) => w.value === sp.get("when"))?.value ?? "any") as When;
  const price = (PRICES.find((p) => p.value === sp.get("price"))?.value ?? "any") as PriceBand;
  const sort = (SORTS.find((s) => s.value === sp.get("sort"))?.value ?? "soonest") as Sort;
  const city = CITIES.find((c) => c === sp.get("city")) ?? "";
  const cat = CATEGORIES.find((c) => c === sp.get("cat")) ?? "";
  return { q: sp.get("q") ?? "", city, when, cat, price, hide: sp.get("hide") === "soldout", sort };
}

/** Search results, fully driven by the URL so every view is shareable (DESIGN_PLAN §00). */
export function SearchPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const demo = useDemoState();
  const all = usePublicEvents();
  const p = read(sp);
  const [draft, setDraft] = useState(p.q);
  const [sheet, setSheet] = useState(false);
  const showSkeleton = useDelayedFlag(demo === "loading");

  const set = (patch: Partial<Params>) => {
    const next = new URLSearchParams(sp.toString());
    const write = (k: string, v: string | undefined, def = "") => (v && v !== def ? next.set(k, v) : next.delete(k));
    if ("q" in patch) write("q", patch.q?.trim());
    if ("city" in patch) write("city", patch.city);
    if ("when" in patch) write("when", patch.when, "any");
    if ("cat" in patch) write("cat", patch.cat);
    if ("price" in patch) write("price", patch.price, "any");
    if ("hide" in patch) write("hide", patch.hide ? "soldout" : "");
    if ("sort" in patch) write("sort", patch.sort, "soonest");
    next.delete("state");
    const s = next.toString();
    router.replace(`/search${s ? `?${s}` : ""}`, { scroll: false });
  };

  const cal = calendar();
  const base = demo === "empty" ? [] : live(all);
  const results = sortEvents(
    base.filter(
      (e) =>
        matchesQuery(e, p.q) &&
        (!p.city || e.city === p.city) &&
        inWhen(e, p.when, cal) &&
        (!p.cat || e.category === p.cat) &&
        inPrice(e, p.price) &&
        !(p.hide && eventState(e) === "sold-out"),
    ),
    p.sort,
  );

  const active: { key: string; label: string; clear: Partial<Params> }[] = [
    p.q && { key: "q", label: `“${p.q}”`, clear: { q: "" } },
    p.city && { key: "city", label: p.city, clear: { city: "" } },
    p.when !== "any" && { key: "when", label: WHEN.find((w) => w.value === p.when)!.label, clear: { when: "any" as When } },
    p.cat && { key: "cat", label: p.cat, clear: { cat: "" } },
    p.price !== "any" && { key: "price", label: PRICES.find((x) => x.value === p.price)!.label, clear: { price: "any" as PriceBand } },
    p.hide && { key: "hide", label: "Hide sold out", clear: { hide: false } },
  ].filter(Boolean) as { key: string; label: string; clear: Partial<Params> }[];

  const clearAll = () => {
    setDraft("");
    router.replace(p.sort !== "soonest" ? `/search?sort=${p.sort}` : "/search", { scroll: false });
  };

  const filters = <Filters p={p} set={set} />;

  return (
    <div className="content flex flex-col gap-6 pt-6 pb-16 lg:pt-8">
      <div className="flex flex-col gap-4">
        <h1 className="text-4xl font-extrabold tracking-tight">{p.q ? `Results for “${p.q}”` : "All events"}</h1>
        <form
          role="search"
          aria-label="Search events"
          className="flex gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: draft });
          }}
        >
          <SearchInput value={draft} onChange={setDraft} onSubmit={() => set({ q: draft })} size="md" />
          {/* Wrapper carries the breakpoint: the Button's CSS module outranks Tailwind's display utilities. */}
          <div className="hidden sm:block">
            <Button type="submit" size="lg">
              Search
            </Button>
          </div>
        </form>
      </div>

      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-8">
        <aside aria-label="Filters" className="hidden lg:block">
          <div className="sticky top-[calc(var(--bar-height)_+_var(--space-6))] flex flex-col gap-6">{filters}</div>
        </aside>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="num text-sm font-semibold" aria-live="polite">
              {f.plural(results.length, "event")}
            </p>
            <div className="flex items-center gap-2">
              <div className="lg:hidden">
                <Button variant="secondary" iconLeft={<SlidersHorizontal size={16} aria-hidden />} onClick={() => setSheet(true)}>
                  Filters{active.length ? ` (${active.length})` : ""}
                </Button>
              </div>
              <label className="flex items-center gap-2 text-sm text-text-secondary">
                <span className="hidden whitespace-nowrap sm:inline">Sort by</span>
                <span className="sr-only sm:hidden">Sort by</span>
                <Select value={p.sort} onChange={(e) => set({ sort: e.target.value as Sort })} className="h-11 rounded-pill">
                  {SORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </Select>
              </label>
            </div>
          </div>

          {active.length > 0 && (
            <ul aria-label="Active filters" className="flex flex-wrap items-center gap-2">
              {active.map((a) => (
                <li key={a.key}>
                  <button
                    type="button"
                    onClick={() => {
                      if (a.key === "q") setDraft("");
                      set(a.clear);
                    }}
                    aria-label={`Remove filter: ${a.label}`}
                    className="inline-flex min-h-9 items-center gap-1 rounded-pill bg-surface-sunken pr-2 pl-3 text-sm font-medium hover:bg-border-default"
                  >
                    {a.label} <X size={14} aria-hidden />
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={clearAll} className="min-h-9 rounded-pill px-2 text-sm font-semibold underline underline-offset-4">
                  Clear all
                </button>
              </li>
            </ul>
          )}

          {demo === "error" ? (
            <ErrorState title="Results didn't load" actions={<Button onClick={() => set({})}>Try again</Button>} />
          ) : demo === "loading" ? (
            showSkeleton ? (
              <ul aria-busy className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-2 md:gap-x-6 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <li key={i}>
                    <EventCardSkeleton />
                  </li>
                ))}
              </ul>
            ) : null
          ) : results.length ? (
            <CardGrid events={results} cols={3} />
          ) : (
            <NoResults base={base} hasFilters={active.length > 0} onClear={clearAll} />
          )}
        </div>
      </div>

      <Sheet
        open={sheet}
        onOpenChange={setSheet}
        title="Filters"
        footer={
          <div className="flex gap-3">
            {active.length > 0 && (
              <Button variant="ghost" size="lg" onClick={clearAll}>
                Clear all
              </Button>
            )}
            <Button size="lg" fullWidth onClick={() => setSheet(false)}>
              {`Show ${f.plural(results.length, "event")}`}
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-6 pb-4">{filters}</div>
      </Sheet>
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}

function Filters({ p, set }: { p: Params; set: (patch: Partial<Params>) => void }) {
  return (
    <>
      <Group label="When">
        {WHEN.map((w) => (
          <Chip key={w.value} pressed={p.when === w.value} onClick={() => set({ when: w.value })}>
            {w.label}
          </Chip>
        ))}
      </Group>
      <Group label="City">
        <Chip pressed={!p.city} onClick={() => set({ city: "" })}>
          Any city
        </Chip>
        {CITIES.map((c) => (
          <Chip key={c} pressed={p.city === c} onClick={() => set({ city: p.city === c ? "" : c })}>
            {c}
          </Chip>
        ))}
      </Group>
      <Group label="Category">
        <Chip pressed={!p.cat} onClick={() => set({ cat: "" })}>
          All
        </Chip>
        {CATEGORIES.map((c) => (
          <Chip key={c} pressed={p.cat === c} onClick={() => set({ cat: p.cat === c ? "" : c })}>
            {c}
          </Chip>
        ))}
      </Group>
      <Group label="Price">
        {PRICES.map((x) => (
          <Chip key={x.value} pressed={p.price === x.value} onClick={() => set({ price: x.value })}>
            {x.label}
          </Chip>
        ))}
      </Group>
      <Switch label="Hide sold out" checked={p.hide} onChange={(v) => set({ hide: v })} />
    </>
  );
}

function NoResults({ base, hasFilters, onClear }: { base: ReturnType<typeof live>; hasFilters: boolean; onClear: () => void }) {
  const weekend = base.filter((e) => inWhen(e, "weekend", calendar())).slice(0, 3);
  return (
    <div className="flex flex-col gap-12">
      <EndState
        className="py-6"
        title="No events match"
        body={hasFilters ? "Try fewer filters or a different word." : "Nothing is on sale right now. Check back soon."}
        actions={hasFilters ? <Button onClick={onClear}>Clear all</Button> : null}
      />
      <section aria-labelledby="popular-cats" className="flex flex-col gap-3">
        <Heading id="popular-cats" size="lg">
          Popular categories
        </Heading>
        <ul className="flex flex-wrap gap-2">
          {CATEGORIES.slice(0, 5).map((c) => (
            <li key={c}>
              <Link href={searchHref({ cat: c })} className="inline-flex h-11 items-center rounded-pill border border-border-default px-5 text-sm font-semibold hover:bg-surface-sunken">
                {c}
              </Link>
            </li>
          ))}
        </ul>
      </section>
      {weekend.length > 0 && (
        <section aria-labelledby="weekend-suggest" className="flex flex-col gap-4">
          <Heading id="weekend-suggest" size="lg">
            On this weekend
          </Heading>
          <CardGrid events={weekend} cols={3} />
        </section>
      )}
    </div>
  );
}
