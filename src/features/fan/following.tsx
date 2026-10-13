"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, MoreHorizontal, UserMinus, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Menu, MenuItem } from "@/components/ui/controls";
import { Button, ButtonLink } from "@/components/ui/button";
import { Avatar, EndState, ErrorState, Slot } from "@/components/ui/primitives";
import { useHydrated } from "@/components/providers";
import { useDemoState, usePublicEvents } from "@/features/events";
import { useStore } from "@/features/store";
import { eventState } from "@/lib/event";
import * as f from "@/lib/format";
import { hosts } from "@/mocks/hosts";
import type { TktEvent } from "@/mocks/types";
import { EventCard } from "./event-card";
import { useDelayedFlag } from "./hooks";

export function upcomingFor(events: TktEvent[], hostId: string): TktEvent[] {
  return events
    .filter((e) => e.hostId === hostId)
    .filter((e) => {
      const s = eventState(e);
      return s !== "ended" && s !== "canceled" && s !== "draft";
    })
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function Following() {
  const router = useRouter();
  const demo = useDemoState();
  const hydrated = useHydrated();
  const following = useStore((s) => s.following);
  const events = usePublicEvents();
  // Every row starts open so the events are visible; fans can collapse rows.
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const toggleFollow = useStore((s) => s.toggleFollow);
  const loading = !hydrated || demo === "loading";
  const showSkeleton = useDelayedFlag(loading);
  // Soonest next event first; hosts with nothing coming up go last.
  const nextStart = (id: string) => upcomingFor(events, id)[0]?.start ?? "9999";
  const list = demo === "empty" ? [] : hosts.filter((h) => following.includes(h.id)).sort((a, b) => nextStart(a.id).localeCompare(nextStart(b.id)));

  let body;
  if (demo === "error") {
    body = <ErrorState title="Hosts didn't load" actions={<Button onClick={() => router.replace("/following")}>Try again</Button>} />;
  } else if (loading) {
    body = showSkeleton ? (
      <ul aria-busy className="flex flex-col border-t border-border-subtle">
        {[0, 1].map((i) => (
          <li key={i} className="flex items-center gap-4 border-b border-border-subtle py-4">
            <span className="h-12 w-12 rounded-[50%] bg-surface-sunken" />
            <span className="flex flex-col gap-1">
              <Slot w="8rem" />
              <span className="text-sm text-text-tertiary">
                Next <Slot w="5rem" />
              </span>
            </span>
          </li>
        ))}
      </ul>
    ) : null;
  } else if (!list.length) {
    body = <EndState title="You're not following anyone yet" body="Follow hosts to see their new events here first." actions={<ButtonLink href="/discover">Find events</ButtonLink>} />;
  } else {
    body = (
      <ul className="flex flex-col gap-3 md:gap-6">
        {list.map((h) => {
          const next = upcomingFor(events, h.id);
          const expanded = !collapsed.includes(h.id);
          const panelId = `host-${h.id}-events`;
          return (
            <li key={h.id} className="overflow-hidden rounded-lg border border-border-subtle bg-surface-raised p-3 md:p-4">
              <div className="flex items-center gap-4 p-1 pb-3">
                <Link href={`/h/${h.handle}`} className="flex min-w-0 flex-1 items-center gap-4 rounded-sm">
                  <Avatar src={h.avatar} name={h.name} size={48} />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-lg font-extrabold tracking-tight">{h.name}</span>
                    <span className="num text-sm text-text-secondary">{next[0] ? `Next: ${f.dayShort(next[0].start)} · ${f.plural(next.length, "upcoming event")}` : "No upcoming events"}</span>
                  </span>
                </Link>
                <Menu label={`Options for ${h.name}`} trigger={<MoreHorizontal size={18} aria-hidden />}>
                  {(close) => (
                    <>
                      <MenuItem
                        icon={<UserRound size={16} />}
                        onSelect={() => {
                          close();
                          router.push(`/h/${h.handle}`);
                        }}
                      >
                        View profile
                      </MenuItem>
                      <MenuItem
                        icon={<UserMinus size={16} />}
                        onSelect={() => {
                          close();
                          toggleFollow(h.id);
                          toast(`Unfollowed ${h.name}`);
                        }}
                      >
                        Unfollow
                      </MenuItem>
                    </>
                  )}
                </Menu>
                {next.length > 0 && (
                  <Button
                    variant="ghost"
                    iconOnly
                    aria-label={`${expanded ? "Hide" : "Show"} events from ${h.name}`}
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => setCollapsed((c) => (expanded ? [...c, h.id] : c.filter((x) => x !== h.id)))}
                    iconLeft={<ChevronDown size={18} aria-hidden className={`transition-transform duration-150 ${expanded ? "rotate-180" : ""}`} />}
                  />
                )}
              </div>
              {expanded && (
                <ul
                  id={panelId}
                  className="scroll-x -mx-3 flex gap-3 px-3 md:mx-0 md:grid md:grid-cols-4 md:gap-6 md:overflow-visible md:px-0"
                >
                  {next.slice(0, 4).map((e) => (
                    <li key={e.id} className="w-44 shrink-0 md:w-auto">
                      <EventCard event={e} sizes="(min-width: 768px) 25vw, 176px" />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <div className="content flex flex-col gap-6 py-6 lg:py-12">
      <h1 className="text-4xl font-extrabold tracking-tight">Following</h1>
      {body}
    </div>
  );
}
