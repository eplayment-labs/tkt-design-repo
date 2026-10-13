"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { sceneStyle, useSceneProgress } from "./scene";
import { Photo } from "@/components/ui/primitives";
import type { Photo as PhotoT } from "@/mocks/types";

const LINE = "Every kind of night, in one place.";

/**
 * Poster wall (DESIGN_PLAN §000.1). A wall of covers starts tilted back in
 * 3D and flattens as you scroll, the line fades in mid-scene, then the wall
 * zooms past into the time reel. Tablet and desktop pin; phones get a lighter,
 * unpinned wall that flattens as it scrolls into view. The photos are
 * decorative here: every event is reachable from the reel right after.
 */
export function PosterWall({ photos }: { photos: PhotoT[] }) {
  if (photos.length < 9) return null;
  return (
    <>
      <div className="hidden md:motion-safe:block">
        <Pinned photos={photos.slice(0, 15)} />
      </div>
      <div className="md:motion-safe:hidden">
        <Light photos={photos.slice(0, 9)} />
      </div>
    </>
  );
}

function Tile({ p, sizes }: { p: PhotoT; sizes: string }) {
  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-lg bg-surface-sunken">
      <Photo src={p.url} alt="" sizes={sizes} position={p.position} />
    </div>
  );
}

function Pinned({ photos }: { photos: PhotoT[] }) {
  const wrap = useRef<HTMLDivElement>(null);
  const { progress: p, active } = useSceneProgress(wrap);
  // Piecewise-linear: flatten over the first 60%, hold, then zoom past and fade for the hand-off.
  const rotateX = useTransform(p, [0, 0.6], [48, 0]);
  const rotateZ = useTransform(p, [0, 0.6], [-8, 0]);
  const z = useTransform(p, [0, 0.6], [-240, 0]);
  const scale = useTransform(p, [0, 0.6, 0.8, 1], [0.72, 1, 1, 1.15]);
  // Stays opaque: the zoomed wall scrolls away whole and the tunnel title follows right
  // behind it. Fading it out left a blank white screen between the two scenes.
  const lineOpacity = useTransform(p, [0.3, 0.45, 0.8, 0.95], [0, 1, 1, 0]);
  const lineY = useTransform(p, [0.3, 0.45], [16, 0]);

  return (
    <section aria-label={LINE} ref={wrap} className="relative h-[130svh] lg:h-[160svh]">
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden" style={{ ...sceneStyle(active), perspective: 1200 }}>
        <motion.div
          aria-hidden
          className="grid w-[min(116vw,96rem)] grid-cols-5 gap-4"
          style={{ rotateX, rotateZ, z, scale, transformStyle: "preserve-3d" }}
        >
          {photos.map((ph) => (
            <Tile key={ph.id} p={ph} sizes="(min-width: 1440px) 24rem, 25vw" />
          ))}
        </motion.div>
        {/* A solid plate behind the line keeps it readable on any photo, no scrim. */}
        <motion.p
          className="font-display absolute max-w-[18ch] rounded-lg bg-surface px-8 py-6 text-center text-4xl leading-tight font-extrabold tracking-tight md:text-[clamp(2.25rem,4vw,3.5rem)]"
          style={{ opacity: lineOpacity, y: lineY }}
        >
          {LINE}
        </motion.p>
      </div>
    </section>
  );
}

function Light({ photos }: { photos: PhotoT[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start end", "center center"] });
  const rotateX = useTransform(p, [0, 1], [28, 0]);
  const scale = useTransform(p, [0, 1], [0.9, 1]);
  return (
    <section aria-label={LINE} className="flex flex-col gap-8 overflow-hidden py-16 md:py-24">
      <p className="font-display content text-4xl leading-tight font-extrabold tracking-tight">{LINE}</p>
      <div ref={ref} style={{ perspective: 900 }} className="px-[var(--gutter)]">
        <motion.div aria-hidden className="grid grid-cols-3 gap-3" style={{ rotateX, scale, transformOrigin: "50% 100%" }}>
          {photos.map((ph) => (
            <Tile key={ph.id} p={ph} sizes="33vw" />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
