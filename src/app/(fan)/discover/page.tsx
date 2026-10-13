import type { Metadata } from "next";
import { Suspense } from "react";
import { Home } from "@/features/fan/home";

// Mock dates are relative to "today": render per request so a static build never goes stale.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Discover" };

export default function DiscoverPage() {
  return (
    <Suspense>
      <Home />
    </Suspense>
  );
}
