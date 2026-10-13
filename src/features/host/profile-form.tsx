"use client";

import Link from "next/link";
import { useRef } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ExternalLink, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";
import { Avatar, Rule, Slot } from "@/components/ui/primitives";
import { useHydrated } from "@/components/providers";
import { useDemoState } from "@/features/events";
import { useStore } from "@/features/store";
import { photos } from "@/mocks/photos";
import type { Host } from "@/mocks/types";
import { Delayed, RetryError, fileToDataUrl, useHost } from "./shared";

const schema = z.object({
  name: z.string().trim().min(2, "Enter a name of at least 2 characters").max(60, "Keep it under 60 characters"),
  avatar: z.string().min(1, "Pick a photo"),
  bio: z.string().trim().max(280, "Keep it under 280 characters"),
});

type Values = z.infer<typeof schema>;

const avatarChoices = [photos.avatarMusic, photos.avatarWorkshop, photos.microphone, photos.brushes, photos.stringLights];

function PhotoPicker({ value, onChange, name }: { value: string; onChange: (v: string) => void; name: string }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const isCustom = value && !avatarChoices.some((p) => p.url === value);
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-2 text-sm font-medium">Photo</legend>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-3" role="radiogroup" aria-label="Photo choices">
          {[...(isCustom ? [{ id: "upload", url: value, alt: "Your upload" }] : []), ...avatarChoices].map((p) => {
            const on = value === p.url;
            return (
              <button
                key={p.id + p.url}
                type="button"
                role="radio"
                aria-checked={on}
                aria-label={p.alt}
                onClick={() => onChange(p.url)}
                // Round swatches; the selected one gets an ink ring.
                className={`flex h-12 w-12 items-center justify-center rounded-pill transition-shadow duration-150 ${
                  on ? "ring-2 ring-text-primary ring-offset-2 ring-offset-surface-raised" : "hover:ring-2 hover:ring-border-strong"
                }`}
              >
                <Avatar src={p.url} name={name || p.alt} size={48} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="secondary" size="sm" iconLeft={<Upload size={16} aria-hidden />} onClick={() => fileRef.current?.click()}>
          Upload photo
        </Button>
        {isCustom && <span className="text-sm text-text-tertiary">Using your upload</span>}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="sr-only"
          tabIndex={-1}
          aria-label="Upload photo"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              onChange(await fileToDataUrl(file, 320));
            } catch {
              toast("That file couldn't be read. Try a JPG or PNG.");
            }
          }}
        />
      </div>
    </fieldset>
  );
}

export function PayoutPlaceholder({ host }: { host: Host }) {
  return (
    <section aria-labelledby="payout-title" className="flex flex-col gap-2">
      <h2 id="payout-title" className="text-sm font-medium">
        Payouts
      </h2>
      <div className="flex items-center justify-between gap-4 rounded-sm border border-border-default bg-surface-sunken px-3 py-3">
        <span className="text-sm text-text-secondary">Sample account</span>
        <span className="num font-mono text-sm">{host.payoutMasked}</span>
      </div>
      {/* TODO: real payouts. No account-number input in the prototype. */}
      <p className="text-sm text-text-tertiary">Payouts are set up later. This is a masked sample.</p>
    </section>
  );
}

function FormSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading profile">
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Name</span>
        <Slot w="100%" h="2.75rem" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Photo</span>
        <Slot w="4rem" h="4rem" className="rounded-[50%]" />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Bio</span>
        <Slot w="100%" h="6rem" />
      </div>
    </div>
  );
}

function Form({ host, mode }: { host: Host; mode: "onboarding" | "profile" }) {
  const router = useRouter();
  const setHostProfile = useStore((s) => s.setHostProfile);
  const finishOnboarding = useStore((s) => s.finishOnboarding);
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: host.name, avatar: host.avatar, bio: host.bio },
  });

  const onSubmit = (v: Values) => {
    setHostProfile({ name: v.name, avatar: v.avatar, bio: v.bio });
    reset(v);
    toast("Saved your profile");
    if (mode === "onboarding") {
      finishOnboarding();
      router.push("/host");
    }
  };

  const bio = useWatch({ control, name: "bio" }) ?? "";
  const name = useWatch({ control, name: "name" }) ?? "";

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-6">
      <Field label="Name" error={errors.name?.message} hint="Shown on your events and public page.">
        {({ id, describedBy, invalid }) => (
          <Input id={id} aria-describedby={describedBy} aria-invalid={invalid} autoComplete="organization" {...register("name")} />
        )}
      </Field>
      <Controller
        control={control}
        name="avatar"
        render={({ field }) => <PhotoPicker value={field.value} onChange={(v) => field.onChange(v)} name={name} />}
      />
      <Field label="Bio" optional error={errors.bio?.message} hint={`${bio.length} / 280`}>
        {({ id, describedBy, invalid }) => <Textarea id={id} aria-describedby={describedBy} aria-invalid={invalid} rows={4} {...register("bio")} />}
      </Field>
      <Rule />
      <PayoutPlaceholder host={host} />
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border-subtle bg-surface px-4 py-3 md:static md:border-0 md:bg-transparent md:p-0">
        <Button type="submit" fullWidth loading={isSubmitting} disabled={mode === "profile" && !isDirty} className="md:w-auto">
          Save profile
        </Button>
      </div>
    </form>
  );
}

export function ProfileForm({ mode }: { mode: "onboarding" | "profile" }) {
  const demo = useDemoState();
  const hydrated = useHydrated();
  const host = useHost();

  return (
    // Phone: bottom padding clears the fixed Save bar.
    <div className="content pt-8 pb-24 md:pb-8">
      <div className="flex max-w-(--form-max) flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-(--tracking-display)">{mode === "onboarding" ? "Set up your profile" : "Profile"}</h1>
        <p className="text-sm text-text-secondary">
          {mode === "onboarding" ? "Fans see this on every event you host." : "Your public host page shows these details."}
        </p>
        {mode === "profile" && host && (
          <Link
            href={`/h/${host.handle}`}
            className="inline-flex min-h-11 w-fit items-center gap-2 text-sm font-medium underline underline-offset-4"
          >
            View public page <ExternalLink size={14} aria-hidden />
          </Link>
        )}
      </header>
      {demo === "error" ? (
        <RetryError title="Profile didn't load" />
      ) : !hydrated || !host || demo === "loading" ? (
        <Delayed>
          <div className="rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-8">
            <FormSkeleton />
          </div>
        </Delayed>
      ) : (
        <div className="rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-8">
          <Form host={host} mode={mode} />
        </div>
      )}
      </div>
    </div>
  );
}
