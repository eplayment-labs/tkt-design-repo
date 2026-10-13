"use client";

/*
 * Motion effects adapted from Magic UI (https://magicui.design, MIT License,
 * Copyright (c) Magic UI). Retimed to our motion tokens: reveals run once,
 * 250ms, small offset, and respect reduced motion via the global MotionConfig.
 */

import { useRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { motion, useInView } from "motion/react";
import { easeOut } from "@/lib/tokens";

/* ---------- Marquee ---------- */

type MarqueeProps = ComponentPropsWithoutRef<"div"> & {
  reverse?: boolean;
  pauseOnHover?: boolean;
  /** Seconds for one loop. */
  duration?: number;
  repeat?: number;
  children: ReactNode;
};

/** Infinite horizontal strip. Decorative duplicates are hidden from assistive tech. */
export function Marquee({ reverse, pauseOnHover = true, duration = 40, repeat = 3, className = "", children, style, ...props }: MarqueeProps) {
  return (
    <div
      {...props}
      className={`group flex overflow-hidden ${className}`}
      style={{ ["--gap" as string]: "var(--space-3)", gap: "var(--gap)", ...style }}
    >
      {Array.from({ length: repeat }, (_, i) => (
        <div
          key={i}
          aria-hidden={i > 0 || undefined}
          inert={i > 0 || undefined}
          className={`animate-marquee flex shrink-0 items-center justify-around ${pauseOnHover ? "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]" : ""}`}
          style={{
            gap: "var(--gap)",
            animation: `marquee ${duration}s linear infinite`,
            animationDirection: reverse ? "reverse" : "normal",
          }}
        >
          {children}
        </div>
      ))}
    </div>
  );
}

/* ---------- Reveal (Magic UI BlurFade, retimed) ---------- */

export function Reveal({
  children,
  className,
  delay = 0,
  offset = 8,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  offset?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: offset, filter: "blur(4px)" }}
      animate={inView ? { opacity: 1, y: 0, filter: "blur(0px)" } : undefined}
      transition={{ duration: 0.25, delay: Math.min(delay, 0.2), ease: [...easeOut] }}
    >
      {children}
    </motion.div>
  );
}
