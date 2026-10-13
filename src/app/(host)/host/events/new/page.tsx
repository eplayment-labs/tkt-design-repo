import { Suspense } from "react";
import type { Metadata } from "next";
import { Wizard } from "@/features/host/wizard/wizard";

export const metadata: Metadata = { title: "Create event" };

export default function NewEventPage() {
  return (
    <Suspense>
      <Wizard />
    </Suspense>
  );
}
