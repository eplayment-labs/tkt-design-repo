"use client";

import { useSearchParams } from "next/navigation";
import { useStore } from "./store";
import { events as mockEvents } from "@/mocks/events";
import type { TktEvent } from "@/mocks/types";

/** Mock events plus anything the host created or published in the wizard. */
export function useAllEvents(): TktEvent[] {
  const drafts = useStore((s) => s.drafts);
  const ids = new Set(drafts.map((d) => d.id));
  return [...drafts, ...mockEvents.filter((e) => !ids.has(e.id))];
}

export function useEvent(idOrSlug: string): TktEvent | undefined {
  const all = useAllEvents();
  return all.find((e) => e.id === idOrSlug || e.slug === idOrSlug);
}

export function usePublicEvents(): TktEvent[] {
  return useAllEvents().filter((e) => e.status !== "draft" && e.visibility === "public");
}

/**
 * Dev-only state preview: any screen reads `?state=loading|error|empty|
 * sold-out|ended|canceled|offline` and renders that state with mock data.
 */
export type DemoState = "loading" | "error" | "empty" | "sold-out" | "ended" | "canceled" | "offline" | null;

export function useDemoState(): DemoState {
  const v = useSearchParams().get("state");
  const allowed = ["loading", "error", "empty", "sold-out", "ended", "canceled", "offline"];
  return v && allowed.includes(v) ? (v as DemoState) : null;
}

/** Apply a demo state to an event for preview purposes. */
export function withDemoState(e: TktEvent, s: DemoState): TktEvent {
  if (s === "sold-out") return { ...e, tiers: e.tiers.map((t) => ({ ...t, sold: t.capacity })) };
  if (s === "ended") return { ...e, status: "ended" };
  if (s === "canceled") return { ...e, status: "canceled" };
  return e;
}
