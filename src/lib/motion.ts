import type { Transition } from "motion/react";
import { duration, easeOut, easeOutCss } from "./tokens";

/** App-wide default, applied through <MotionConfig>. Tween, never spring. */
export const baseTransition: Transition = {
  duration: duration.normal,
  ease: easeOut,
};

export const fast: Transition = { duration: duration.fast, ease: easeOut };
export const slow: Transition = { duration: duration.slow, ease: easeOut };

/** NumberFlow timings (Web Animations EffectTiming). Default is ~900ms. */
export const numberTiming = {
  transformTiming: { duration: 250, easing: easeOutCss },
  spinTiming: { duration: 250, easing: easeOutCss },
  opacityTiming: { duration: 150, easing: "ease-out" },
} as const;

/** Wizard step slide: direction 1 = next, -1 = back. */
export const stepSlide = {
  enter: (dir: number) => ({ x: dir * 24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir * -24, opacity: 0 }),
};

/** Scanner invalid: ±6px, 2 cycles in 250ms. */
export const shake = {
  x: [0, -6, 6, -6, 6, 0],
  transition: { duration: duration.slow, ease: "linear" as const },
};
