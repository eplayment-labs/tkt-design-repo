import { Suspense } from "react";
import type { Metadata } from "next";
import { EventsList } from "@/features/host/events-list";

export const metadata: Metadata = { title: "Events" };

export default function HostEventsPage() {
  return (
    <Suspense>
      <EventsList />
    </Suspense>
  );
}
