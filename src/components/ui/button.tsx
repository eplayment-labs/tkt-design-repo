import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import styles from "./button.module.css";

type Variant = "primary" | "event" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

type Common = {
  variant?: Variant;
  size?: Size;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
  /** Square, no visible label: `aria-label` is required. */
  iconOnly?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
};

const iconSize = { sm: 16, md: 18, lg: 20 } as const;

function classes({ variant = "primary", size = "md", iconOnly, fullWidth }: Common, extra = "") {
  return [styles.button, styles[variant], styles[size], iconOnly && styles.iconOnly, fullWidth && styles.full, extra]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant,
  size = "md",
  iconLeft,
  iconRight,
  iconOnly,
  loading,
  fullWidth,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & Common) {
  return (
    <button
      type={type}
      className={classes({ variant, size, iconOnly, fullWidth }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <LoaderCircle size={iconSize[size]} className={styles.spinner} aria-hidden /> : iconLeft}
      {!iconOnly && children}
      {!loading && iconRight}
    </button>
  );
}

export function ButtonLink({
  href,
  variant,
  size = "md",
  iconLeft,
  iconRight,
  iconOnly,
  fullWidth,
  className,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & Common & { href: string }) {
  return (
    <Link href={href} className={classes({ variant, size, iconOnly, fullWidth }, className)} {...props}>
      {iconLeft}
      {!iconOnly && children}
      {iconRight}
    </Link>
  );
}
