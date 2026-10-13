import type { ReactNode } from "react";
import Image, { type ImageLoader } from "next/image";
import { Ban, CircleAlert, CircleCheck, Clock, TriangleAlert } from "lucide-react";

/* ---------- Photo ---------- */

const unsplashLoader: ImageLoader = ({ src, width, quality }) =>
  `${src}?w=${width}&q=${quality ?? 75}&auto=format&fit=max`;

type PhotoProps = {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  position?: string;
  /** Desaturate (past events). */
  muted?: boolean;
};

/** Fills its positioned parent. Parent sets aspect ratio. */
export function Photo({ src, alt, sizes, priority, className = "", position, muted }: PhotoProps) {
  return (
    <Image
      loader={unsplashLoader}
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={`object-cover ${muted ? "grayscale" : ""} ${className}`}
      style={{ objectPosition: position ?? "center" }}
    />
  );
}

/* ---------- Avatar ---------- */

export function Avatar({ src, name, size = 40 }: { src?: string; name: string; size?: number }) {
  return (
    <span
      className="relative inline-block shrink-0 overflow-hidden bg-surface-sunken"
      style={{ width: size, height: size, borderRadius: "50%" }}
    >
      {src ? (
        <Image loader={unsplashLoader} src={src} alt="" fill sizes={`${size * 2}px`} className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-sm font-medium text-text-secondary">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );
}

/* ---------- Status label: icon + word, never color alone ---------- */

type Tone = "neutral" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  neutral: "text-text-secondary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

const toneIcon: Record<Tone, ReactNode> = {
  neutral: <Clock size={14} aria-hidden />,
  success: <CircleCheck size={14} aria-hidden />,
  warning: <TriangleAlert size={14} aria-hidden />,
  danger: <Ban size={14} aria-hidden />,
};

export function Status({ tone = "neutral", children, icon }: { tone?: Tone; children: ReactNode; icon?: ReactNode | false }) {
  return (
    <span className={`inline-flex items-center gap-1 text-sm font-medium ${toneClass[tone]}`}>
      {icon === false ? null : (icon ?? toneIcon[tone])}
      {children}
    </span>
  );
}

/* ---------- Skeleton slot: a sized value placeholder inside a real layout ---------- */

export function Slot({ w, h = "1em", className = "" }: { w: string; h?: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={`inline-block rounded-sm bg-surface-sunken align-middle ${className}`}
      style={{ width: w, height: h }}
    />
  );
}

/* ---------- Empty + error: never a dead end ---------- */

type Action = { label: string; href?: string; onClick?: () => void };

type EndStateProps = {
  title: string;
  body?: string;
  icon?: ReactNode;
  className?: string;
  /** Rendered actions (buttons/links). At least one is required by design. */
  actions: ReactNode;
};

/** Left-aligned, not a centered illustration card. What's missing + the next step. */
export function EndState({ title, body, icon, actions, className = "" }: EndStateProps) {
  return (
    <div className={`flex flex-col items-start gap-4 py-12 ${className}`}>
      {icon ? <span className="text-text-tertiary">{icon}</span> : null}
      <div className="flex max-w-[40ch] flex-col gap-1">
        <h2 className="text-2xl font-extrabold tracking-[-0.03em]">{title}</h2>
        {body ? <p className="text-sm text-text-secondary">{body}</p> : null}
      </div>
      <div className="flex flex-wrap gap-3">{actions}</div>
    </div>
  );
}

export function ErrorState({ title = "This didn't load", body = "Check your connection, then try again.", actions }: Partial<EndStateProps> & { actions: ReactNode }) {
  return <EndState icon={<CircleAlert size={24} aria-hidden />} title={title} body={body} actions={actions} />;
}

export type { Action };

/* ---------- Section heading ---------- */

export function SectionTitle({ children, aside, id }: { children: ReactNode; aside?: ReactNode; id?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <h2 id={id} className="text-2xl font-extrabold tracking-[-0.03em]">
        {children}
      </h2>
      {aside}
    </div>
  );
}

/* ---------- Divider ---------- */

export function Rule({ className = "" }: { className?: string }) {
  return <hr className={`border-0 border-t border-border-subtle ${className}`} />;
}
