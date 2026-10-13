"use client";

import NumberFlow from "@number-flow/react";
import { numberTiming } from "@/lib/motion";

type Props = {
  value: number;
  /** Centavos → ₱ with 2 decimals. */
  money?: boolean;
  className?: string;
  /** Skip the roll (e.g. first paint). */
  animated?: boolean;
};

/**
 * The only way to render NumberFlow in this app: it pins timings to the
 * token range (library default is ~900ms) and always uses tabular figures.
 */
export function Num({ value, money, className = "", animated = true }: Props) {
  return (
    <NumberFlow
      value={money ? value / 100 : value}
      locales="en-PH"
      format={money ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : undefined}
      prefix={money ? "₱" : undefined}
      animated={animated}
      className={`num ${className}`}
      {...numberTiming}
    />
  );
}
