"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { brand } from "@/lib/tokens";
import { ThemeToggle } from "./theme-toggle";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Discover",
    links: [
      { label: "All events", href: "/discover" },
      { label: "This weekend", href: "/search?when=weekend" },
      { label: "Free events", href: "/search?price=free" },
    ],
  },
  {
    title: "Help",
    // TODO: placeholder pages, not built yet.
    links: [
      { label: "How tickets work", href: "#" },
      { label: "Refunds", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    title: "For hosts",
    links: [
      { label: "Sell tickets", href: "/login" },
      { label: "Host dashboard", href: "/host" },
    ],
  },
];

/** Focused flows (checkout, full-screen QR) skip the footer. */
const HIDE = [/^\/checkout\//, /^\/tickets\/[^/]+$/];

/** Shared storefront footer. Brandless: wordmark placeholder, no social logos, no badges. */
export function SiteFooter() {
  const pathname = usePathname();
  if (HIDE.some((r) => r.test(pathname))) return null;
  return (
    <footer className="border-t border-border-subtle bg-surface-sunken">
      {/* Extra bottom room on phones so sticky CTA bars never cover the last line. */}
      <div className="content flex flex-col gap-12 pt-12 pb-24 md:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-1">
            <Link href="/" className="font-display self-start text-2xl font-extrabold tracking-tight">
              {brand.name}
            </Link>
            <p className="max-w-[28ch] text-sm text-text-secondary">Find something to do tonight, this weekend, or next month.</p>
          </div>
          {columns.map((c) => (
            <nav key={c.title} aria-label={c.title} className="flex flex-col gap-2">
              <h2 className="text-sm font-semibold">{c.title}</h2>
              <ul className="flex flex-col">
                {c.links.map((l) => (
                  <li key={l.label}>
                    <Link href={l.href} className="flex min-h-11 items-center text-sm text-text-secondary hover:text-text-primary hover:underline hover:underline-offset-4">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="flex flex-col-reverse items-start gap-4 border-t border-border-subtle pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-sm text-text-secondary">Demo prototype. No real tickets are sold.</p>
          <div className="-ml-3 md:ml-0">
            <ThemeToggle withLabel />
          </div>
        </div>
      </div>
    </footer>
  );
}
