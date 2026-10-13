"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { Photo } from "@/components/ui/primitives";
import { publicEvents } from "@/mocks/events";
import { hosts } from "@/mocks/hosts";
import { eventState, whereLabel } from "@/lib/event";
import * as f from "@/lib/format";

export function SearchPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const events = publicEvents().filter((e) => eventState(e) !== "ended");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={onOpenChange}
      label="Search events and hosts"
      overlayClassName="fixed inset-0 z-40 bg-[var(--surface-overlay)]"
      contentClassName="fixed inset-x-4 top-4 z-50 mx-auto max-w-xl overflow-hidden rounded-lg bg-surface-raised md:top-24"
      className="flex flex-col"
    >
      <div className="flex items-center gap-3 border-b border-border-subtle px-4" style={{ boxShadow: "var(--shadow-overlay)" }}>
        <Search size={18} className="text-text-tertiary" aria-hidden />
        <Command.Input
          placeholder="Search events, hosts, cities"
          className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-text-tertiary"
        />
      </div>
      <Command.List className="max-h-[60svh] overflow-y-auto p-2">
        <Command.Empty className="px-3 py-6 text-sm text-text-secondary">
          Nothing matches that. Try a city or a category, like &ldquo;Cebu&rdquo; or &ldquo;Music&rdquo;.
        </Command.Empty>
        <Command.Group heading="Events" className="[&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
          {events.map((e) => (
            <Command.Item
              key={e.id}
              value={`${e.title} ${e.city} ${e.category} ${whereLabel(e)}`}
              onSelect={() => go(`/e/${e.slug}`)}
              className="flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 data-[selected=true]:bg-surface-sunken"
            >
              <span className="relative h-10 w-14 shrink-0 overflow-hidden rounded-sm bg-surface-sunken">
                <Photo src={e.cover.url} alt="" sizes="56px" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{e.title}</span>
                <span className="num truncate text-sm text-text-tertiary">
                  {f.dayShort(e.start)} · {e.city}
                </span>
              </span>
            </Command.Item>
          ))}
        </Command.Group>
        <Command.Group heading="Hosts" className="[&_[cmdk-group-heading]]:label [&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2">
          {hosts.map((h) => (
            <Command.Item
              key={h.id}
              value={`${h.name} ${h.handle}`}
              onSelect={() => go(`/h/${h.handle}`)}
              className="flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-sm data-[selected=true]:bg-surface-sunken"
            >
              {h.name}
              <span className="text-text-tertiary">@{h.handle}</span>
            </Command.Item>
          ))}
        </Command.Group>
      </Command.List>
    </Command.Dialog>
  );
}
