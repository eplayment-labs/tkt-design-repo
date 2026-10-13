/**
 * JS-side view of src/styles/tokens.css. Colors are referenced by CSS
 * variable name, never duplicated as raw values, so the rebrand stays a
 * one-file change. Only numbers JS genuinely needs (durations, breakpoints)
 * live here, and they mirror tokens.css exactly.
 */

export const brand = {
  /** Mirrors --brand-name. Placeholder until a brand exists. */
  name: "Tickets",
} as const;

export const cssVar = (name: string) => `var(--${name})`;

export const color = {
  surface: cssVar("surface"),
  surfaceRaised: cssVar("surface-raised"),
  surfaceSunken: cssVar("surface-sunken"),
  textPrimary: cssVar("text-primary"),
  textSecondary: cssVar("text-secondary"),
  textTertiary: cssVar("text-tertiary"),
  border: cssVar("border-default"),
  borderSubtle: cssVar("border-subtle"),
  accent: cssVar("accent"),
  eventAccent: cssVar("event-accent"),
  success: cssVar("success"),
  danger: cssVar("danger"),
  warning: cssVar("warning"),
  chartLine: cssVar("chart-line"),
  chartGrid: cssVar("chart-grid"),
  chartAxis: cssVar("chart-axis"),
} as const;

/** Seconds, for `motion`. Mirrors --duration-* in tokens.css. */
export const duration = {
  fast: 0.15,
  normal: 0.2,
  slow: 0.25,
} as const;

/** Mirrors --ease-out. */
export const easeOut = [0.2, 0, 0, 1] as const;
export const easeOutCss = "cubic-bezier(0.2, 0, 0, 1)";

export const breakpoint = {
  md: 768,
  xl: 1280,
} as const;
