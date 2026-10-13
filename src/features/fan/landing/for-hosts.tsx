"use client";

import { useEffect, useId, useState } from "react";
import { Check } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { Photo } from "@/components/ui/primitives";
import { useStore } from "@/features/store";
import { accentVars, type EventAccent } from "@/lib/accent";
import * as f from "@/lib/format";
import { photos } from "@/mocks/photos";
import { at, nextSaturdayOffset } from "@/mocks/time";
import type { Photo as PhotoT } from "@/mocks/types";
import { DateBlock } from "../event-card";
import { Magnetic } from "../fx";
import { computeAccent } from "@/lib/accent-client";

const COVERS: PhotoT[] = [photos.stagePurple, photos.lasers, photos.neonSign, photos.grill, photos.brushes, photos.yoga];

/**
 * "Hosting something?" with a live mini builder (DESIGN_PLAN §000.1): name
 * an event, pick a cover, and the preview card takes the cover's color, the
 * same way a published event page does. No testimonials, logos, or stats.
 */
export function ForHosts() {
  const role = useStore((s) => s.role);
  const signedIn = useStore((s) => s.signedIn);
  const isHost = signedIn && role === "host";
  const groupId = useId();
  const [title, setTitle] = useState("");
  const [cover, setCover] = useState<PhotoT>(COVERS[0]);
  const [accent, setAccent] = useState<EventAccent | null>(null);
  const [when] = useState(() => at(nextSaturdayOffset() + 7, "20:00"));

  useEffect(() => {
    let live = true;
    computeAccent(cover.url)
      .then((a) => live && setAccent(a))
      .catch(() => live && setAccent(null));
    return () => {
      live = false;
    };
  }, [cover]);

  const name = title.trim() || "Your event";

  return (
    <section aria-labelledby="hosts-title" className="content grid items-center gap-12 py-16 md:py-24 lg:grid-cols-12">
      <div className="flex flex-col gap-6 lg:col-span-5">
        <h2 id="hosts-title" className="display">
          Hosting something?
        </h2>
        <p className="max-w-[40ch] text-lg text-text-secondary">
          Create an event, sell tickets or take RSVPs, and check people in at the door with your phone. Your cover photo sets the colors on your event page.
        </p>
        <div>
          <Magnetic>
            <ButtonLink href={isHost ? "/host" : "/login"} size="lg">
              Start hosting
            </ButtonLink>
          </Magnetic>
        </div>
      </div>

      <div aria-label="Try the event builder" role="group" className="grid gap-6 rounded-lg border border-border-subtle bg-surface-raised p-4 md:grid-cols-2 md:p-6 lg:col-span-7">
        <div className="flex flex-col gap-4">
          <p className="text-sm font-semibold text-text-secondary">Try it</p>
          <Field label="Event name">
            {({ id }) => <Input id={id} value={title} maxLength={48} placeholder="Friday rooftop set" onChange={(e) => setTitle(e.target.value)} />}
          </Field>
          <div className="flex flex-col gap-2">
            <span id={groupId} className="text-sm font-medium">
              Cover
            </span>
            <div role="radiogroup" aria-labelledby={groupId} className="grid grid-cols-3 gap-2">
              {COVERS.map((p) => {
                const on = p.id === cover.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    aria-label={p.alt}
                    onClick={() => setCover(p)}
                    className={`relative aspect-square overflow-hidden rounded-sm bg-surface-sunken outline-2 outline-offset-2 transition-[outline-color] duration-150 active:scale-[0.97] ${on ? "outline-[var(--text-primary)]" : "outline-transparent"}`}
                  >
                    <Photo src={p.url} alt="" sizes="96px" position={p.position} />
                    {on && (
                      <span className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-pill bg-[var(--gray-0)] text-[var(--gray-ink)]">
                        <Check size={14} aria-hidden />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live preview: the real card look, colored by the picked cover. */}
        <div className="event-scope flex flex-col gap-3" style={accentVars(accent)}>
          <p className="text-sm font-semibold text-text-secondary">Preview</p>
          <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface-sunken">
            <Photo src={cover.url} alt="" sizes="(min-width: 768px) 20rem, 90vw" position={cover.position} />
            <DateBlock iso={when} className="absolute top-3 left-3" />
          </div>
          <p className="font-display line-clamp-2 text-lg leading-tight font-extrabold tracking-tight">{name}</p>
          <p className="num text-sm text-text-secondary">
            {f.dayShort(when)} · {f.time(when)}
          </p>
          <div className="flex flex-wrap items-center gap-2" aria-hidden>
            <span className="tint rounded-pill px-3 py-1 text-xs font-semibold text-text-primary">On sale</span>
            <span className="inline-flex min-h-11 items-center rounded-pill bg-event px-5 text-sm font-semibold text-[var(--event-on-accent)] transition-colors duration-200">
              Get tickets
            </span>
          </div>
          <div className="mt-2">
            <ButtonLink href={isHost ? "/host/events/new" : "/login"} variant="secondary">
              Make it real
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
