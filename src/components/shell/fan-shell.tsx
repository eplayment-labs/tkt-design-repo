"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { motion, useScroll } from "motion/react";
import { Compass, Heart, Search, Ticket, User } from "lucide-react";
import { AccountMenu, Wordmark } from "./account-menu";
import { ThemeToggle } from "./theme-toggle";
import { SearchPalette } from "@/features/fan/search-palette";

const tabs = [
  { href: "/discover", label: "Discover", icon: Compass },
  { href: "/tickets", label: "My tickets", icon: Ticket },
  { href: "/following", label: "Following", icon: Heart },
  { href: "/profile", label: "Profile", icon: User },
];

/** Routes where a sticky CTA bar replaces the bottom tabs (DESIGN_PLAN §6.1). */
const NO_TABS = [/^\/e\//, /^\/checkout\//, /^\/orders\//, /^\/tickets\/[^/]+$/];

function isActive(pathname: string, href: string) {
  return pathname.startsWith(href);
}

/**
 * Landing (`/`): the header floats transparent over the dark hero and turns
 * solid once the hero has scrolled past. Fixed there, sticky elsewhere, so
 * nothing below shifts. State flips only at the threshold, not per frame.
 */
function useOverHero(enabled: boolean) {
  const [over, setOver] = useState(enabled);
  useEffect(() => {
    if (!enabled) return;
    const check = () => setOver(window.scrollY < window.innerHeight - 56);
    check();
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [enabled]);
  return enabled && over;
}

export function FanShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [searchOpen, setSearchOpen] = useState(false);
  const hideTabs = NO_TABS.some((r) => r.test(pathname));
  const landing = pathname === "/";
  const overHero = useOverHero(landing);
  const { scrollYProgress } = useScroll();

  return (
    <div className="flex min-h-svh flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[60] focus:rounded-sm focus:bg-surface-raised focus:px-3 focus:py-2">
        Skip to content
      </a>
      <header
        // Over the hero the header reads as dark (white text on photo); after it, the page theme.
        data-theme={overHero ? "dark" : undefined}
        className={`top-0 z-30 border-b text-text-primary transition-colors duration-200 ${landing ? "fixed inset-x-0" : "sticky"} ${
          overHero ? "border-transparent bg-transparent [&_nav_a]:text-text-secondary" : "border-border-subtle bg-surface"
        }`}
      >
        <div className="content flex items-center gap-6" style={{ height: "var(--bar-height)" }}>
          <Wordmark />
          <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
            {tabs.slice(0, 3).map((t) => (
              <Link
                key={t.href}
                href={t.href}
                aria-current={isActive(pathname, t.href) ? "page" : undefined}
                className={`flex min-h-11 items-center rounded-pill px-3 text-sm font-medium whitespace-nowrap transition-colors duration-150 ${
                  isActive(pathname, t.href) ? "bg-surface-raised font-semibold text-text-primary" : "text-text-tertiary hover:text-text-primary"
                }`}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {/* Hidden over the landing hero, which has its own search; ⌘K still opens the palette. */}
            {!overHero && (
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                aria-label="Search events"
                className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-pill px-2 text-sm text-text-tertiary hover:bg-surface-sunken hover:text-text-primary lg:min-w-64 lg:justify-start lg:border lg:border-border-subtle lg:bg-surface-raised lg:px-4"
              >
                <Search size={18} aria-hidden />
                <span className="hidden lg:inline">Search events</span>
                <kbd className="ml-auto hidden font-mono text-xs text-text-tertiary lg:inline">⌘K</kbd>
              </button>
            )}
            <ThemeToggle />
            <div className="hidden md:block">
              <AccountMenu />
            </div>
          </div>
        </div>
        {/* Page progress on the landing, once the header is solid. scaleX on a MotionValue, no re-renders. */}
        {landing && !overHero && <motion.div aria-hidden className="absolute inset-x-0 -bottom-px h-0.5 origin-left bg-text-primary" style={{ scaleX: scrollYProgress }} />}
      </header>

      <main id="main" className={`flex-1 ${hideTabs ? "" : "pb-24 md:pb-0"}`}>
        {children}
      </main>

      {!hideTabs && (
        <nav aria-label="Main" className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border-subtle bg-surface md:hidden">
          <ul className="grid grid-cols-4">
            {tabs.map(({ href, label, icon: Icon }) => {
              const active = isActive(pathname, href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex h-14 flex-col items-center justify-center gap-1 text-xs font-medium ${
                      active ? "text-text-primary" : "text-text-tertiary"
                    }`}
                  >
                    <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}

      <SearchPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
