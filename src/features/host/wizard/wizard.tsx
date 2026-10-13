"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { FormProvider, useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slot } from "@/components/ui/primitives";
import { useHydrated } from "@/components/providers";
import { useAllEvents, useDemoState } from "@/features/events";
import { useStore } from "@/features/store";
import { stepSlide } from "@/lib/motion";
import { accentVars } from "@/lib/accent";
import type { TktEvent } from "@/mocks/types";
import { Delayed, RetryError, useHost } from "../shared";
import { MediaStep } from "./media-step";
import { ReviewStep } from "./review-step";
import { STEPS, STEP_FIELDS, blankValues, fromEvent, schema, toEvent, type StepSlug, type Values } from "./schema";
import { BasicsStep, SettingsStep, TicketsStep, WhenStep } from "./steps";

const stepIndex = (s: string | null) => {
  const i = STEPS.findIndex((x) => x.slug === s);
  return i < 0 ? 0 : i;
};

/* ---------- Step list: active indicator shares one layoutId ---------- */

function StepList({ active, reached, onGo }: { active: number; reached: number; onGo: (i: number) => void }) {
  const activeRef = useRef<HTMLLIElement>(null);
  // Phone: the step row scrolls sideways, so keep the active step in view.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [active]);
  return (
    <nav aria-label="Steps" className="scroll-x -mx-4 px-4 lg:mx-0 lg:px-0">
      <ol className="flex w-max gap-2 pr-4 lg:w-auto lg:flex-col lg:gap-1 lg:pr-0">
        {STEPS.map((s, i) => {
          const isActive = i === active;
          const done = i < reached && !isActive;
          const enabled = i <= reached;
          return (
            <li key={s.slug} ref={isActive ? activeRef : undefined} className="relative shrink-0">
              <button
                type="button"
                onClick={() => enabled && onGo(i)}
                disabled={!enabled}
                aria-current={isActive ? "step" : undefined}
                className={`relative z-10 flex min-h-11 items-center gap-3 rounded-pill px-4 text-sm font-medium whitespace-nowrap transition-colors duration-150 lg:w-full ${
                  isActive
                    ? "text-[var(--text-on-accent)]"
                    : enabled
                      ? "text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
                      : "text-text-tertiary"
                }`}
              >
                <span className={`num flex w-4 justify-center ${isActive ? "" : "text-text-tertiary"}`} aria-hidden>
                  {done ? <Check size={14} /> : i + 1}
                </span>
                {s.label}
                {done && <span className="sr-only">(done)</span>}
              </button>
              {isActive && (
                <motion.span
                  layoutId="wizard-step"
                  aria-hidden
                  className="absolute inset-0 rounded-pill bg-accent"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ---------- Form ---------- */

function WizardForm({ initial, existing }: { initial: Values; existing?: TktEvent }) {
  const router = useRouter();
  const params = useSearchParams();
  const host = useHost();
  const hostId = useStore((s) => s.hostId);
  const saveDraft = useStore((s) => s.saveDraft);
  const all = useAllEvents();

  const methods = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: initial,
    mode: "onTouched",
  });
  const { trigger, getValues, control } = methods;
  const values = useWatch({ control }) as Values;

  const idx = stepIndex(params.get("step"));
  const step = STEPS[idx].slug;
  const [reached, setReached] = useState(existing ? STEPS.length - 1 : idx);
  const [shown, setShown] = useState(idx);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState<"save" | "publish" | null>(null);

  // Direction-aware slides, derived when the URL step changes.
  if (idx !== shown) {
    setDir(idx > shown ? 1 : -1);
    setShown(idx);
    if (idx > reached) setReached(idx);
  }

  const go = (i: number) => {
    const next = new URLSearchParams(params);
    next.set("step", STEPS[i].slug);
    router.push(`/host/events/new?${next}`, { scroll: false });
    window.scrollTo({ top: 0 });
  };

  const taken = all.filter((e) => e.id !== initial.id).map((e) => e.slug);
  const build = (status: TktEvent["status"]) => toEvent(getValues(), { hostId, status, taken, existing });

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[step] as FieldPath<Values>[], { shouldFocus: true });
    if (ok) go(idx + 1);
  };

  const save = () => {
    setBusy("save");
    const e = build("draft");
    saveDraft(e);
    toast(`Saved "${e.title}" as a draft`);
    const q = new URLSearchParams(params);
    q.set("draft", e.id);
    router.replace(`/host/events/new?${q}`, { scroll: false });
    setBusy(null);
  };

  const publish = async () => {
    setBusy("publish");
    const ok = await trigger();
    if (!ok) {
      setBusy(null);
      const errs = methods.formState.errors;
      const bad = STEPS.findIndex((s) => STEP_FIELDS[s.slug].some((k) => errs[k]));
      if (bad >= 0) go(bad);
      return;
    }
    const e = build("live");
    saveDraft(e);
    toast(`Published "${e.title}"`);
    router.push(`/host/events/${e.id}`);
  };

  const preview = toEvent(values, { hostId, status: "live", taken, existing });

  const body: Record<StepSlug, React.ReactNode> = {
    basics: <BasicsStep />,
    when: <WhenStep />,
    media: <MediaStep />,
    tickets: <TicketsStep />,
    settings: <SettingsStep />,
    review: <ReviewStep event={preview} host={host} onEdit={go} />,
  };

  return (
    <FormProvider {...methods}>
      <div className="content event-scope flex flex-col gap-6 py-8 lg:grid lg:grid-cols-[var(--rail-width)_1fr] lg:items-start" style={accentVars(values.accent)}>
        <div className="flex flex-col gap-6 lg:sticky lg:top-[calc(var(--bar-height)+var(--space-8))]">
          <div className="flex flex-col gap-2">
            <Link href="/host" className="-ml-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-sm px-2 text-sm text-text-secondary hover:text-text-primary">
              <ArrowLeft size={16} aria-hidden /> Events
            </Link>
            <h1 className="text-4xl font-extrabold tracking-(--tracking-display)">{existing ? "Edit event" : "Create event"}</h1>
          </div>
          <StepList active={idx} reached={reached} onGo={go} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (step === "review") publish();
            else next();
          }}
          noValidate
          className="min-w-0"
        >
          <div className={step === "review" ? "w-full" : "w-full max-w-[40rem]"}>
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                variants={stepSlide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
                className={step === "review" ? "" : "rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-8"}
              >
                {body[step]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Phone: full-bleed hairline. Wider: the hairline sits on the inner row so it lines up with the form column. */}
          <div className="safe-bottom sticky bottom-0 z-10 mt-12 -mx-4 border-t border-border-subtle bg-surface px-4 py-3 md:mx-0 md:border-t-0 md:px-0 md:pt-0">
            <div className={`flex items-center gap-3 md:border-t md:border-border-subtle md:pt-3 ${step === "review" ? "" : "max-w-[40rem]"}`}>
              {idx > 0 && (
                <Button variant="secondary" onClick={() => go(idx - 1)}>
                  Back
                </Button>
              )}
              <Button variant="ghost" onClick={save} loading={busy === "save"} className="ml-auto">
                Save draft
              </Button>
              {step === "review" ? (
                <Button type="submit" loading={busy === "publish"}>
                  Publish event
                </Button>
              ) : (
                <Button type="submit">Next</Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function Skeleton() {
  return (
    <div className="content flex flex-col gap-8 py-8 lg:grid lg:grid-cols-[var(--rail-width)_1fr]" aria-busy="true" aria-label="Loading editor">
      <div className="flex flex-col gap-6">
        <h1 className="text-4xl font-extrabold tracking-(--tracking-display)">Create event</h1>
        <ol className="flex gap-4 lg:flex-col">
          {STEPS.map((s) => (
            <li key={s.slug} className="text-sm text-text-tertiary">
              {s.label}
            </li>
          ))}
        </ol>
      </div>
      <div className="flex w-full max-w-[40rem] flex-col gap-6">
        <Slot w="8rem" h="1.5rem" />
        {Array.from({ length: 3 }, (_, i) => (
          <Slot key={i} w="100%" h="2.75rem" />
        ))}
      </div>
    </div>
  );
}

export function Wizard() {
  const demo = useDemoState();
  const hydrated = useHydrated();
  const params = useSearchParams();
  const all = useAllEvents();
  const hostId = useStore((s) => s.hostId);
  const draftId = params.get("draft");
  const [initial, setInitial] = useState<{ values: Values; existing?: TktEvent } | null>(null);

  if (demo === "error")
    return (
      <div className="content py-8">
        <RetryError title="The editor didn't load" />
      </div>
    );

  // Seed the form once, after persisted drafts have loaded.
  if (hydrated && !initial && demo !== "loading") {
    const existing = draftId ? all.find((e) => e.id === draftId && e.hostId === hostId) : undefined;
    setInitial(existing ? { values: fromEvent(existing), existing } : { values: blankValues() });
  }

  if (!initial || demo === "loading")
    return (
      <Delayed>
        <Skeleton />
      </Delayed>
    );
  return <WizardForm initial={initial.values} existing={initial.existing} />;
}
