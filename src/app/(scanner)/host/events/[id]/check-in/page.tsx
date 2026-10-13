import { Suspense } from "react";
import type { Metadata } from "next";
import { Scanner } from "@/features/host/scanner";

export const metadata: Metadata = { title: "Check-in" };

export default async function CheckInPage(props: PageProps<"/host/events/[id]/check-in">) {
  const { id } = await props.params;
  return (
    <Suspense>
      <Scanner id={id} />
    </Suspense>
  );
}
