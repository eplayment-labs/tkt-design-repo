import { Suspense } from "react";
import type { Metadata } from "next";
import { EventPromoScreen } from "@/features/host/promo";

export const metadata: Metadata = { title: "Promo codes" };

export default async function EventPromoPage(props: PageProps<"/host/events/[id]/promo">) {
  const { id } = await props.params;
  return (
    <Suspense>
      <EventPromoScreen id={id} />
    </Suspense>
  );
}
