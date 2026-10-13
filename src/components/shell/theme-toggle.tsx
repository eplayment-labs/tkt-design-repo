"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";
import { THEME_KEY } from "@/components/providers";

type Theme = "light" | "dark";

/** The theme currently applied (the user's choice, or the system's until they pick). */
function read(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

function subscribe(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => obs.disconnect();
}

function set(t: Theme) {
  try {
    localStorage.setItem(THEME_KEY, t);
  } catch {
    // Private mode: the theme still applies for this page view.
  }
  window.dispatchEvent(new Event("tkt-theme"));
}

/** Two-state light/dark switch. Starts on the system theme until the user picks one. */
export function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";
  const I = theme === "dark" ? Moon : Sun;
  return (
    <button
      type="button"
      onClick={() => set(next)}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-pill px-3 text-sm font-medium text-text-secondary hover:bg-surface-sunken hover:text-text-primary"
    >
      <I size={18} aria-hidden />
      {withLabel && <span>{theme === "dark" ? "Dark" : "Light"}</span>}
    </button>
  );
}
