import type { Metadata } from "next";
import { Suspense } from "react";
import { TicketFull } from "@/features/fan/ticket-full";

export const metadata: Metadata = { title: "Ticket" };

export default async function Page(props: PageProps<"/tickets/[ticketId]">) {
  const { ticketId } = await props.params;
  return (
    <Suspense>
      <TicketFull ticketId={ticketId} />
    </Suspense>
  );
}
