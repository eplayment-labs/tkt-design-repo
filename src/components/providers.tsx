"use client";

import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { MotionConfig } from "motion/react";
import { Toaster } from "sonner";
import { baseTransition } from "@/lib/motion";
import { useStore } from "@/features/store";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    useStore.persist.rehydrate();
  }, []);
  return (
    <MotionConfig transition={baseTransition} reducedMotion="user">
      {children}
      <Toaster
        position="bottom-center"
        offset={88}
        mobileOffset={88}
        toastOptions={{
          unstyled: true,
          classNames: {
            toast:
              "shadow-[var(--shadow-overlay)] flex w-full items-center gap-3 rounded-lg border border-border-subtle bg-surface-raised px-4 py-3 text-sm text-text-primary",
            description: "text-text-tertiary",
            actionButton: "ml-auto font-medium underline underline-offset-4",
          },
        }}
      />
    </MotionConfig>
  );
}

/** True once persisted demo state has loaded on the client. */
export function useHydrated() {
  return useSyncExternalStore(
    (cb) => useStore.persist.onFinishHydration(cb),
    () => useStore.persist.hasHydrated(),
    () => false,
  );
}

/**
 * Theme: light, dark, or system (default). The choice is a per-viewer
 * convenience kept in localStorage; this runs before paint to avoid a flash.
 */
export const THEME_KEY = "tkt-theme";
export const themeScript = `(function(){try{var k='${THEME_KEY}';var m=window.matchMedia('(prefers-color-scheme: dark)');var a=function(){var p=localStorage.getItem(k)||'system';var d=p==='dark'||(p==='system'&&m.matches);document.documentElement.dataset.theme=d?'dark':'light';document.documentElement.dataset.themePref=p};a();m.addEventListener('change',a);window.addEventListener('tkt-theme',a)}catch(e){}})();`;
