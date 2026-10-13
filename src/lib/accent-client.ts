"use client";

import { deriveAccent, pickVivid, type EventAccent } from "./accent";
import { img } from "@/mocks/photos";

/**
 * Browser-side accent for a cover (DESIGN_PLAN §3.2): reads the image on a
 * small canvas, picks its vivid hue, and derives AA-safe tokens. Used by the
 * wizard's Media step and the landing's "Try it" builder.
 * Resolves null when the photo has no vivid area; rejects if it can't load.
 */
export function computeAccent(url: string): Promise<EventAccent | null> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      try {
        const w = 120;
        const h = Math.max(1, Math.round((image.height / image.width) * w));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(image, 0, 0, w, h);
        const raw = pickVivid(ctx.getImageData(0, 0, w, h).data, 1);
        resolve(raw ? deriveAccent(raw) : null);
      } catch (err) {
        reject(err);
      }
    };
    image.onerror = () => reject(new Error("load"));
    image.src = url.startsWith("data:") || url.startsWith("blob:") ? url : img(url, 240);
  });
}
