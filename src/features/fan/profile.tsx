"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, LogOut } from "lucide-react";
import { toast } from "sonner";
import { Button, ButtonLink } from "@/components/ui/button";
import { Switch } from "@/components/ui/controls";
import { Field, Input, InputGroup, Select } from "@/components/ui/field";
import { Avatar, EndState, ErrorState, Slot } from "@/components/ui/primitives";
import { useDelayedFlag } from "./hooks";
import { useHydrated } from "@/components/providers";
import { useDemoState } from "@/features/events";
import { useStore } from "@/features/store";
import * as f from "@/lib/format";
import { fan } from "@/mocks/people";
import type { City } from "@/mocks/types";

const CITIES: City[] = ["Manila", "Quezon City", "Cebu", "Davao"];

export function Profile() {
  const router = useRouter();
  const demo = useDemoState();
  const hydrated = useHydrated();
  const signedIn = useStore((s) => s.signedIn);
  const setRole = useStore((s) => s.setRole);
  const signOut = useStore((s) => s.signOut);
  const [form, setForm] = useState({ name: fan.name, email: fan.email, mobile: f.mobile(fan.mobile).replace("+63 ", ""), city: fan.city });
  const [notify, setNotify] = useState({ reminders: true, hosts: true });
  const showSkeleton = useDelayedFlag(!hydrated || demo === "loading");

  if (demo === "error") {
    return (
      <div className="content">
        <ErrorState title="Your profile didn't load" actions={<Button onClick={() => router.replace("/profile")}>Try again</Button>} />
      </div>
    );
  }
  if (!hydrated || demo === "loading") {
    return showSkeleton ? (
      <div aria-busy className="content flex max-w-[var(--form-max)] flex-col gap-8 py-6 lg:py-12">
        <span className="sr-only">Loading profile</span>
        <div className="flex items-center gap-4">
          <span className="h-14 w-14 rounded-[50%] bg-surface-sunken" />
          <span className="text-2xl">
            <Slot w="8rem" />
          </span>
        </div>
        {["Full name", "Email", "Mobile", "City"].map((l) => (
          <div key={l} className="flex flex-col gap-2">
            <span className="text-sm font-medium">{l}</span>
            <Slot w="100%" h="2.75rem" />
          </div>
        ))}
      </div>
    ) : null;
  }
  if (!signedIn) {
    return (
      <div className="content">
        <EndState title="You're signed out" body="Sign in to see your tickets and settings." actions={<ButtonLink href="/login?next=/profile">Sign in</ButtonLink>} />
      </div>
    );
  }

  const save = (e: FormEvent) => {
    e.preventDefault();
    // TODO: mock only. Profile edits aren't persisted.
    toast("Saved your profile");
  };
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div className="content flex max-w-[var(--form-max)] flex-col gap-6 py-6 lg:py-12">
      <div className="flex items-center gap-4">
        <Avatar src={fan.avatar} name={fan.name} size={56} />
        <div className="flex flex-col">
          <h1 className="text-4xl font-extrabold tracking-tight">{form.name || "Profile"}</h1>
        </div>
      </div>

      <form onSubmit={save} className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-6">
        <h2 className="text-lg font-extrabold tracking-tight">Details</h2>
        <Field label="Full name">{({ id }) => <Input id={id} value={form.name} onChange={set("name")} autoComplete="name" />}</Field>
        <Field label="Email">{({ id }) => <Input id={id} type="email" value={form.email} onChange={set("email")} autoComplete="email" />}</Field>
        <Field label="Mobile">{({ id }) => <InputGroup addon="+63" id={id} type="tel" value={form.mobile} onChange={set("mobile")} autoComplete="tel-national" />}</Field>
        <Field label="City">
          {({ id, describedBy }) => (
            <Select id={id} aria-describedby={describedBy} value={form.city} onChange={set("city")}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          )}
        </Field>
        <Button type="submit" className="self-start">
          Save profile
        </Button>
      </form>

      <section className="flex flex-col gap-4 rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-6">
        <h2 className="text-lg font-extrabold tracking-tight">Notifications</h2>
        <Switch label="Event reminders" hint="A day before, and on the day." checked={notify.reminders} onChange={(v) => setNotify((s) => ({ ...s, reminders: v }))} />
        <Switch label="Hosts you follow" hint="When they publish a new event." checked={notify.hosts} onChange={(v) => setNotify((s) => ({ ...s, hosts: v }))} />
      </section>

      <section className="flex flex-col items-start gap-3 rounded-lg border border-border-subtle bg-surface-raised p-4 md:p-6">
        <h2 className="text-lg font-extrabold tracking-tight">Account</h2>
        <Button
          variant="secondary"
          iconLeft={<ArrowLeftRight size={16} aria-hidden />}
          onClick={() => {
            setRole("host");
            router.push("/host");
          }}
        >
          Switch to hosting
        </Button>
        <Button
          variant="ghost"
          className="-ml-4"
          iconLeft={<LogOut size={16} aria-hidden />}
          onClick={() => {
            signOut();
            router.push("/login");
          }}
        >
          Sign out
        </Button>
      </section>
    </div>
  );
}
