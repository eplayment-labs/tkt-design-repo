"use client";

import { useEffect, useRef, useSyncExternalStore, type RefObject } from "react";
import { useInView, useMotionValue, useMotionValueEvent, useScroll, useSpring, type MotionValue, type UseScrollOptions } from "motion/react";

/**
 * Scroll-following smoothing (DESIGN_PLAN §000.2): a critically damped spring
 * (damping ratio ≈ 1.1, no overshoot). Allowed ONLY for values that follow
 * the scroll position, never for data or UI state.
 * ratio = damping / (2·√(stiffness·mass)) = 26 / (2·√(350·0.4)) ≈ 1.10
 */
export const SCROLL_SPRING = { stiffness: 350, damping: 26, mass: 0.4, restDelta: 0.0005 } as const;

/**
 * Scene progress for a pinned section, gated by visibility: while the
 * section is far from the viewport the smoothed value stops following, so no
 * transforms are recomputed for offscreen scenes. On re-entry it jumps to the
 * current position (no sweep). Returns the smoothed progress and `active`.
 */
export function useSceneProgress(target: RefObject<HTMLElement | null>, offset: UseScrollOptions["offset"] = ["start start", "end end"]) {
  const active = useInView(target, { margin: "50% 0px 50% 0px" });
  const activeRef = useRef(active);
  const { scrollYProgress } = useScroll({ target, offset });
  const gated = useMotionValue(0);
  const smooth = useSpring(gated, SCROLL_SPRING);

  useEffect(() => {
    activeRef.current = active;
    if (active) {
      const v = scrollYProgress.get();
      gated.set(v);
      smooth.jump(v);
    }
  }, [active, gated, smooth, scrollYProgress]);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    if (activeRef.current) gated.set(v);
  });

  return { progress: smooth as MotionValue<number>, active };
}

/** Tab visibility as a store (pauses intervals when the tab is hidden). */
export function usePageVisible(): boolean {
  return useSyncExternalStore(
    (cb) => {
      document.addEventListener("visibilitychange", cb);
      return () => document.removeEventListener("visibilitychange", cb);
    },
    () => document.visibilityState === "visible",
    () => true,
  );
}

/** Scene container style: isolate layout/paint; will-change only while active. */
export const sceneStyle = (active: boolean) => ({ contain: "layout paint", willChange: active ? "transform" : "auto" }) as const;
