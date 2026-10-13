"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Check, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Photo, Rule } from "@/components/ui/primitives";
import { accentVars, type EventAccent } from "@/lib/accent";
import { computeAccent } from "@/lib/accent-client";
import { fromZonedTime } from "date-fns-tz";
import * as f from "@/lib/format";
import { fileToDataUrl } from "../shared";
import { PHOTO_CHOICES, type Values } from "./schema";

type AccentStatus = "idle" | "working" | "done" | "neutral" | "failed";

function parsePos(pos: string): [number, number] {
  const m = pos.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  return m ? [Number(m[1]), Number(m[2])] : [50, 50];
}

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function FocalPicker({ url, position, onChange, dateIso }: { url: string; position: string; onChange: (p: string) => void; dateIso: string | null }) {
  const [x, y] = parsePos(position);
  const set = (nx: number, ny: number) => onChange(`${clamp(nx)}% ${clamp(ny)}%`);
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    set(((e.clientX - r.left) / r.width) * 100, ((e.clientY - r.top) / r.height) * 100);
  };
  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const d = e.shiftKey ? 10 : 5;
    const moves: Record<string, [number, number]> = { ArrowLeft: [-d, 0], ArrowRight: [d, 0], ArrowUp: [0, -d], ArrowDown: [0, d] };
    const m = moves[e.key];
    if (!m) return;
    e.preventDefault();
    set(x + m[0], y + m[1]);
  };
  return (
    <button
      type="button"
      onClick={onClick}
      onKeyDown={onKey}
      aria-label={`Focal point at ${clamp(x)}% across, ${clamp(y)}% down. Click the photo or use arrow keys to move it.`}
      className="relative block aspect-[3/2] w-full cursor-crosshair overflow-hidden rounded-lg bg-surface-sunken"
    >
      <Photo src={url} alt="" sizes="(min-width: 1024px) 640px, 100vw" />
      {dateIso && (
        <span className="sticker" aria-hidden>
          <b className="num">{f.date(dateIso).split(" ")[0]}</b>
          {f.date(dateIso).split(" ")[1]}
        </span>
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-[var(--gray-0)] outline outline-1 outline-[var(--gray-1000)]"
        style={{ left: `${x}%`, top: `${y}%` }}
      />
    </button>
  );
}

function CropPreviews({ url, position }: { url: string; position: string }) {
  const crops = [
    { label: "Phone", cls: "aspect-[4/5] w-24" },
    { label: "Desktop", cls: "aspect-[4/3] w-32" },
    { label: "Ticket", cls: "aspect-[3/1] w-32" },
  ];
  return (
    <div className="flex flex-wrap items-end gap-4">
      {crops.map((c) => (
        <figure key={c.label} className="flex flex-col gap-1">
          <div className={`relative overflow-hidden rounded-sm bg-surface-sunken ${c.cls}`}>
            <Photo src={url} alt="" sizes="128px" position={position} />
          </div>
          <figcaption className="label">{c.label}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function AccentPreview({ accent, status }: { accent: EventAccent | null; status: AccentStatus }) {
  const note: Record<AccentStatus, string> = {
    idle: "Pick a cover to see its accent.",
    working: "Reading the photo's color…",
    done: "Pulled from your cover. Buttons and the ticket stub use it.",
    neutral: "This photo has no strong color, so the page stays neutral.",
    failed: "Couldn't read this photo's color, so the page stays neutral.",
  };
  return (
    <section aria-labelledby="accent-title" className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h3 id="accent-title" className="text-sm font-medium">
          Accent
        </h3>
        <p className="text-sm text-text-tertiary" aria-live="polite">
          {note[status]}
        </p>
      </div>
      <div className="event-scope flex flex-wrap items-center gap-6" style={accentVars(accent)}>
        <Button variant="event" tabIndex={-1} aria-hidden>
          Get tickets
        </Button>
        <span className="tint inline-flex min-h-11 items-center gap-2 rounded-pill px-4 text-sm font-medium" aria-hidden>
          Admit 1 <span className="num font-mono text-text-secondary">No. 0001</span>
        </span>
      </div>
    </section>
  );
}

export function MediaStep() {
  const {
    control,
    setValue,
    formState: { errors },
  } = useFormContext<Values>();
  const coverUrl = useWatch({ control, name: "coverUrl" });
  const position = useWatch({ control, name: "coverPosition" });
  const gallery = useWatch({ control, name: "gallery" });
  const accent = useWatch({ control, name: "accent" });
  const startDate = useWatch({ control, name: "startDate" });
  const dateIso = startDate ? fromZonedTime(`${startDate}T12:00:00`, f.TZ).toISOString() : null;
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<AccentStatus>(coverUrl ? (accent ? "done" : "neutral") : "idle");
  const lastUrl = useRef(coverUrl);

  useEffect(() => {
    if (!coverUrl || coverUrl === lastUrl.current) return;
    lastUrl.current = coverUrl;
    let live = true;
    const start = setTimeout(() => live && setStatus("working"), 0);
    computeAccent(coverUrl)
      .then((a) => {
        if (!live) return;
        setValue("accent", a, { shouldDirty: true });
        setStatus(a ? "done" : "neutral");
      })
      .catch(() => {
        if (!live) return;
        setValue("accent", null, { shouldDirty: true });
        setStatus("failed");
      });
    return () => {
      live = false;
      clearTimeout(start);
    };
  }, [coverUrl, setValue]);

  const pickCover = (url: string, alt: string) => {
    setValue("coverUrl", url, { shouldDirty: true, shouldValidate: true });
    setValue("coverAlt", alt, { shouldDirty: true });
    setValue("coverPosition", "50% 50%", { shouldDirty: true });
  };

  const toggleGallery = (url: string) => {
    const next = gallery.includes(url) ? gallery.filter((g) => g !== url) : gallery.length >= 6 ? gallery : [...gallery, url];
    setValue("gallery", next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Media</h2>
        <p className="text-sm text-text-secondary">The cover sets the look of your event page.</p>
      </header>

      <section aria-labelledby="cover-title" className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-4">
          <h3 id="cover-title" className="text-sm font-medium">
            Cover photo
          </h3>
          <Button variant="secondary" size="sm" iconLeft={<Upload size={16} aria-hidden />} onClick={() => fileRef.current?.click()}>
            Upload photo
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="sr-only"
            tabIndex={-1}
            aria-label="Upload cover photo"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                pickCover(await fileToDataUrl(file), file.name.replace(/\.[^.]+$/, ""));
              } catch {
                toast("That file couldn't be read. Try a JPG or PNG.");
              }
              e.target.value = "";
            }}
          />
        </div>
        <div className="scroll-x -mx-4 flex gap-2 px-4 md:mx-0 md:px-0" role="radiogroup" aria-label="Sample covers">
          {PHOTO_CHOICES.map((p) => {
            const on = coverUrl === p.url;
            return (
              <button
                key={p.id + p.alt}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={p.alt}
                onClick={() => pickCover(p.url, p.alt)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-sm border-2 ${on ? "border-text-primary" : "border-transparent"}`}
              >
                <Photo src={p.url} alt="" sizes="96px" />
              </button>
            );
          })}
        </div>
        {errors.coverUrl?.message && <p className="text-sm text-danger">{errors.coverUrl.message}</p>}
      </section>

      {coverUrl && (
        <>
          <section aria-labelledby="crop-title" className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <h3 id="crop-title" className="text-sm font-medium">
                Crop
              </h3>
              <p className="text-sm text-text-tertiary">Click the part of the photo that should always stay in view.</p>
            </div>
            <FocalPicker url={coverUrl} position={position} dateIso={dateIso} onChange={(p) => setValue("coverPosition", p, { shouldDirty: true })} />
            <CropPreviews url={coverUrl} position={position} />
          </section>
          <AccentPreview accent={accent} status={status} />
        </>
      )}

      <Rule />

      <section aria-labelledby="gallery-title" className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <h3 id="gallery-title" className="text-sm font-medium">
            Gallery <span className="font-normal text-text-tertiary">(optional)</span>
          </h3>
          <p className="num text-sm text-text-tertiary">{gallery.length} of 6 picked</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {PHOTO_CHOICES.filter((p) => p.url !== coverUrl)
            .slice(0, 12)
            .map((p) => {
            const on = gallery.includes(p.url);
            return (
              <button
                key={p.id + p.alt}
                type="button"
                aria-pressed={on}
                aria-label={p.alt}
                onClick={() => toggleGallery(p.url)}
                disabled={!on && gallery.length >= 6}
                className={`relative aspect-[3/2] overflow-hidden rounded-sm border-2 disabled:opacity-50 ${on ? "border-text-primary" : "border-transparent"}`}
              >
                <Photo src={p.url} alt="" sizes="160px" />
                {on && (
                  <span className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-sm bg-surface-raised text-text-primary">
                    <Check size={14} aria-hidden />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
