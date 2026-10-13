import { Suspense } from "react";
import type { Metadata } from "next";
import { AttendeesScreen } from "@/features/host/attendees";

export const metadata: Metadata = { title: "Attendees" };

export default async function AttendeesPage(props: PageProps<"/host/events/[id]/attendees">) {
  const { id } = await props.params;
  return (
    <Suspense>
      <AttendeesScreen id={id} />
    </Suspense>
  );
}
