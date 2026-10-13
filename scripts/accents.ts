/**
 * Precomputes per-event accent tokens from cover photos (DESIGN_PLAN §3.2).
 * Run: npm run accents  → writes src/mocks/accents.json
 *
 * Vivid-hue pick first (lib/accent.ts pickVivid); fast-average-color's
 * dominant color is the fallback, then the chroma floor decides.
 */
import { writeFileSync } from "node:fs";
import sharp from "sharp";
import { getAverageColor } from "fast-average-color-node";
import { photos, img } from "../src/mocks/photos.ts";
import { deriveAccent, pickVivid } from "../src/lib/accent.ts";

const out: Record<string, unknown> = {};
for (const p of Object.values(photos)) {
  const buf = Buffer.from(await (await fetch(img(p, 200))).arrayBuffer());
  const { data } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const vivid = pickVivid(data, 1);
  const raw = vivid ?? (await getAverageColor(buf, { algorithm: "dominant" })).hex;
  const accent = deriveAccent(raw);
  out[p.id] = accent;
  console.log(p.id.padEnd(30), (vivid ? "vivid " : "fac   ") + raw, accent ? accent.light.accent : "monochrome");
}
writeFileSync(new URL("../src/mocks/accents.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
