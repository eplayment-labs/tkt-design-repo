"use client";

/**
 * Inline script that runs during HTML parsing, before first paint (Next 16
 * guide: preventing-flash-before-hydration). On the client the type flips
 * to text/plain so React doesn't warn about rendering a script tag;
 * suppressHydrationWarning accepts that difference.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
