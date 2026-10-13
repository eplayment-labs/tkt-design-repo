"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { CalendarDays, Menu as MenuIcon, Tag, User } from "lucide-react";
import { AccountMenu, Wordmark } from "./account-menu";
import { ThemeToggle } from "./theme-toggle";
import { Sheet } from "@/components/ui/controls";
import { ButtonLink } from "@/components/ui/button";
import { useStore } from "@/features/store";
import { hostById } from "@/mocks/hosts";
import { useHydrated } from "@/components/providers";

const nav = [
  { href: "/host", label: "Events", icon: CalendarDays, match: (p: string) => p === "/host" || p.startsWith("/host/events") },
  { href: "/host/promo", label: "Promo codes", icon: Tag, match: (p: string) => p.startsWith("/host/promo") },
  { href: "/host/profile", label: "Profile", icon: User, match: (p: string) => p.startsWith("/host/profile") || p.startsWith("/host/onboarding") },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="flex flex-col gap-1">
      {nav.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-pill px-3 text-sm font-medium transition-colors duration-150 ${
                active ? "bg-surface-sunken text-text-primary" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <Icon size={18} aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function HostShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const hydrated = useHydrated();
  const { role, signedIn, setRole, hostId } = useStore();
  const host = hostById(hostId);

  return (
    <div className="min-h-svh md:grid" style={{ gridTemplateColumns: "var(--rail-width) 1fr" }}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-sm focus:bg-surface-raised focus:px-3 focus:py-2">
        Skip to content
      </a>
      <aside className="sticky top-0 hidden h-svh flex-col gap-8 border-r border-border-subtle px-4 py-4 md:flex">
        <div className="flex h-10 items-center px-3">
          <Wordmark href="/host" />
        </div>
        <div className="px-3">
          <div className="label">Hosting as</div>
          <div className="mt-1 truncate text-sm font-medium">{host?.name}</div>
        </div>
        <nav aria-label="Host">
          <NavLinks pathname={pathname} />
        </nav>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-border-subtle bg-surface">
          <div className="flex items-center gap-3 px-[var(--gutter)]" style={{ height: "var(--bar-height)" }}>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="-ml-2 flex h-11 w-11 items-center justify-center rounded-pill hover:bg-surface-sunken md:hidden"
              aria-label="Open menu"
            >
              <MenuIcon size={20} aria-hidden />
            </button>
            <span className="md:hidden">
              <Wordmark href="/host" />
            </span>
            <div className="ml-auto flex items-center gap-1">
              <ThemeToggle />
              <AccountMenu />
            </div>
          </div>
        </header>
        <main id="main" className="flex-1">
          {hydrated && (!signedIn || role !== "host") ? (
            <div className="flex flex-col items-start gap-4 px-[var(--gutter)] py-12">
              <h1 className="text-2xl font-semibold">You&rsquo;re browsing as a fan</h1>
              <p className="max-w-[48ch] text-sm text-text-secondary">Switch to hosting to manage events, sales, and check-in.</p>
              {signedIn ? (
                <button type="button" onClick={() => setRole("host")} className="min-h-11 rounded-pill bg-accent px-4 text-sm font-medium text-[var(--text-on-accent)]">
                  Switch to hosting
                </button>
              ) : (
                <ButtonLink href="/login">Sign in</ButtonLink>
              )}
            </div>
          ) : (
            children
          )}
        </main>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen} title={host?.name ?? "Menu"} description="Hosting">
        <nav aria-label="Host">
          <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
        </nav>
      </Sheet>
    </div>
  );
}
