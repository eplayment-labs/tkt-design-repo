"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Photo } from "@/components/ui/primitives";
import { useStore, type Role } from "@/features/store";
import { photos } from "@/mocks/photos";
import { brand } from "@/lib/tokens";

const choices: { role: Role; label: string; body: string; home: string }[] = [
  { role: "fan", label: "Continue as fan", body: "Find events and keep your tickets in one place.", home: "/" },
  { role: "host", label: "Continue as host", body: "Sell tickets, track sales, and check people in.", home: "/host" },
];

function LoginInner() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const signIn = useStore((s) => s.signIn);

  const choose = (role: Role, home: string) => {
    signIn(role);
    router.push(next && next.startsWith("/") ? next : home);
  };

  return (
    <div className="grid min-h-svh md:grid-cols-[1.2fr_1fr]">
      <div className="relative aspect-[4/3] bg-surface-sunken md:aspect-auto">
        <Photo src={photos.crowdHeart.url} alt={photos.crowdHeart.alt} sizes="(min-width: 768px) 55vw, 100vw" priority />
      </div>
      <div className="flex flex-col justify-between gap-12 px-[var(--gutter)] py-8 md:px-12 md:py-12">
        <span className="text-lg font-semibold tracking-tight">{brand.name}</span>
        <div className="flex flex-col gap-8">
          <h1 className="text-4xl font-semibold tracking-tight">Sign in</h1>
          <p className="-mt-4 text-sm text-text-tertiary">Demo sign-in. No password or real account. Switch roles anytime in the account menu.</p>
          <ul className="flex flex-col gap-3">
            {choices.map((c) => (
              <li key={c.role}>
                <button
                  type="button"
                  onClick={() => choose(c.role, c.home)}
                  className="group flex w-full items-center gap-4 rounded-sm border border-border-default bg-surface-raised px-4 py-4 text-left transition-colors duration-150 hover:border-border-strong"
                >
                  <span className="flex flex-1 flex-col gap-1">
                    <span className="text-base font-semibold">{c.label}</span>
                    <span className="text-sm text-text-tertiary">{c.body}</span>
                  </span>
                  <ArrowRight size={18} className="text-text-tertiary transition-colors duration-150 group-hover:text-text-primary" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
        <span aria-hidden />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}
