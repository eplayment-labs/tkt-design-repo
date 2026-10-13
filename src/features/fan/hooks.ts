"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** True only once `flag` has stayed true for `ms` (skeletons never flash on fast loads). */
export function useDelayedFlag(flag: boolean, ms = 300): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!flag) return;
    const t = setTimeout(() => setShown(true), ms);
    return () => {
      clearTimeout(t);
      setShown(false);
    };
  }, [flag, ms]);
  return flag && shown;
}

/** matchMedia as a store. Server snapshot is false (mobile-first). */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)");

/** navigator.onLine as a store. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener("online", cb);
      window.addEventListener("offline", cb);
      return () => {
        window.removeEventListener("online", cb);
        window.removeEventListener("offline", cb);
      };
    },
    () => navigator.onLine,
    () => true,
  );
}

/* A shared 1s clock. Snapshot is stable between ticks. Server = 0. */
let clock = 0;
let timer: ReturnType<typeof setInterval> | undefined;
const subs = new Set<() => void>();

function subscribeClock(cb: () => void) {
  subs.add(cb);
  if (!timer) {
    clock = Date.now();
    timer = setInterval(() => {
      clock = Date.now();
      subs.forEach((f) => f());
    }, 1000);
  }
  return () => {
    subs.delete(cb);
    if (!subs.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function useNow(): number {
  return useSyncExternalStore(
    subscribeClock,
    () => {
      if (!clock) clock = Date.now();
      return clock;
    },
    () => 0,
  );
}

/* Checkout → confirmation handoff: the print animation runs only on the
   client transition right after Pay, never on a direct visit or refresh. */
let printPending: string | null = null;
export const markPrint = (orderId: string) => {
  printPending = orderId;
};
export const isPrintPending = (orderId: string) => printPending === orderId;
export const clearPrint = () => {
  printPending = null;
};
