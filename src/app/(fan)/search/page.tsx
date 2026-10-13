import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchPage } from "@/features/fan/search-page";

// Mock dates are relative to "today": render per request so a static build never goes stale.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Search events" };

export default function Page() {
  return (
    <Suspense>
      <SearchPage />
    </Suspense>
  );
}
