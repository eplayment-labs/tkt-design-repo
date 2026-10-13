import { clampChroma, formatHex, oklch, parse, wcagContrast, type Oklch } from "culori";

/**
 * Turns a raw photo color into AA-safe accent tokens (docs/DESIGN_PLAN.md §3.2).
 * Runs ahead of time (scripts/accents.ts, wizard Media step), never at view time.
 *
 * Surfaces mirror tokens.css: light raised #ffffff, light page #ffffff,
 * dark raised #111113.
 */

const LIGHT_RAISED = "#ffffff";
const LIGHT_PAGE = "#ffffff";
const DARK_RAISED = "#111113";
const WHITE = "#ffffff";
const INK = "#0a0a0b";

/** Below this OKLCH chroma the color reads as gray or muddy: use monochrome. */
const CHROMA_FLOOR = 0.04;

export type AccentSet = { accent: string; text: string; on: string };
export type EventAccent = { light: AccentSet; dark: AccentSet };

function hexAt(base: Oklch, l: number): string {
  return formatHex(clampChroma({ ...base, l }, "oklch"));
}

/** Nearest lightness to the original that satisfies `ok`, searching both ways. */
function nearest(base: Oklch, ok: (hex: string) => boolean): string | null {
  for (let step = 0; step <= 100; step++) {
    for (const dir of [1, -1]) {
      const l = base.l + dir * step * 0.01;
      if (l < 0 || l > 1) continue;
      const hex = hexAt(base, l);
      if (ok(hex)) return hex;
    }
  }
  return null;
}

function bestOn(fill: string): string {
  return wcagContrast(WHITE, fill) >= wcagContrast(INK, fill) ? WHITE : INK;
}

function setFor(base: Oklch, raised: string, textSurface: string): AccentSet | null {
  const accent = nearest(
    base,
    (hex) => wcagContrast(hex, raised) >= 3 && wcagContrast(bestOn(hex), hex) >= 4.5,
  );
  const text = nearest(base, (hex) => wcagContrast(hex, textSurface) >= 4.5);
  if (!accent || !text) return null;
  return { accent, text, on: bestOn(accent) };
}

export function deriveAccent(raw: string): EventAccent | null {
  const parsed = parse(raw);
  if (!parsed) return null;
  const base = oklch(parsed);
  if (!base || (base.c ?? 0) < CHROMA_FLOOR) return null;
  const withHue = { ...base, h: base.h ?? 0 };
  const light = setFor(withHue, LIGHT_RAISED, LIGHT_PAGE);
  const dark = setFor(withHue, DARK_RAISED, DARK_RAISED);
  return light && dark ? { light, dark } : null;
}

/**
 * Picks the photo's most present *vivid* hue from raw RGBA pixels. Average
 * or "dominant" color on stage photos lands on the dark crowd and comes out
 * muddy, so we only count pixels with real chroma and mid lightness, bucket
 * them by hue, and average the heaviest bucket. Returns null when the photo
 * has no vivid area (the chroma floor then keeps it monochrome).
 */
export function pickVivid(rgba: ArrayLike<number>, stride = 4): string | null {
  const BUCKETS = 12;
  const weight = new Array<number>(BUCKETS).fill(0);
  const sums = Array.from({ length: BUCKETS }, () => ({ r: 0, g: 0, b: 0, n: 0 }));
  let vivid = 0;
  let total = 0;
  for (let i = 0; i < rgba.length; i += stride * 4) {
    const r = rgba[i] / 255;
    const g = rgba[i + 1] / 255;
    const b = rgba[i + 2] / 255;
    total++;
    const c = oklch({ mode: "rgb", r, g, b });
    if (!c || c.c < 0.08 || c.l < 0.3 || c.l > 0.88 || c.h === undefined) continue;
    vivid++;
    const k = Math.floor(c.h / (360 / BUCKETS)) % BUCKETS;
    weight[k] += c.c;
    sums[k].r += r;
    sums[k].g += g;
    sums[k].b += b;
    sums[k].n++;
  }
  // Ignore stray vivid specks: need at least 3% of the frame.
  if (total === 0 || vivid / total < 0.03) return null;
  const k = weight.indexOf(Math.max(...weight));
  const s = sums[k];
  return formatHex({ mode: "rgb", r: s.r / s.n, g: s.g / s.n, b: s.b / s.n });
}

/** Inline CSS vars for an `.event-scope` element. */
export function accentVars(a: EventAccent | null | undefined): Record<string, string> {
  if (!a) return {};
  return {
    "--ea-l": a.light.accent,
    "--eat-l": a.light.text,
    "--eon-l": a.light.on,
    "--ea-d": a.dark.accent,
    "--eat-d": a.dark.text,
    "--eon-d": a.dark.on,
  };
}
