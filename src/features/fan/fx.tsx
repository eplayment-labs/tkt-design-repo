"use client";

import { useRef, type PointerEvent, type ReactNode } from "react";
import { animate, motion, useMotionValue, useReducedMotion } from "motion/react";

/**
 * Micro-interactions (DESIGN_PLAN §000.1). Pointer-driven, fine pointers only,
 * MotionValues (no React state per frame), ≤250ms returns, reduced motion → off.
 */

const finePointer = () => typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** Tilt toward the pointer, at most `max` degrees. No scale, no glare. */
export function useTilt(max = 6) {
  const reduced = useReducedMotion();
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const frame = useRef(0);

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (reduced || !finePointer()) return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      ry.set(px * 2 * max);
      rx.set(-py * 2 * max);
    });
  };
  const onPointerLeave = () => {
    cancelAnimationFrame(frame.current);
    animate(rx, 0, { duration: 0.2, ease: [0.2, 0, 0, 1] });
    animate(ry, 0, { duration: 0.2, ease: [0.2, 0, 0, 1] });
  };
  return { style: { rotateX: rx, rotateY: ry, transformPerspective: 800 }, handlers: { onPointerMove, onPointerLeave } };
}

/** Pulls its child up to `max` px toward the pointer, inside the child's own bounds. */
export function Magnetic({ children, max = 6, className = "" }: { children: ReactNode; max?: number; className?: string }) {
  const reduced = useReducedMotion();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const frame = useRef(0);
  return (
    <motion.span
      className={`inline-flex ${className}`}
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduced || !finePointer()) return;
        const r = e.currentTarget.getBoundingClientRect();
        const dx = ((e.clientX - r.left) / r.width - 0.5) * 2 * max;
        const dy = ((e.clientY - r.top) / r.height - 0.5) * 2 * max;
        cancelAnimationFrame(frame.current);
        frame.current = requestAnimationFrame(() => {
          x.set(dx);
          y.set(dy);
        });
      }}
      onPointerLeave={() => {
        cancelAnimationFrame(frame.current);
        animate(x, 0, { duration: 0.2, ease: [0.2, 0, 0, 1] });
        animate(y, 0, { duration: 0.2, ease: [0.2, 0, 0, 1] });
      }}
    >
      {children}
    </motion.span>
  );
}
