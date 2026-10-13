import type { Metadata } from "next";
import { eventBySlug } from "@/mocks/events";

export async function generateMetadata(props: PageProps<"/e/[slug]/tickets">): Promise<Metadata> {
  const { slug } = await props.params;
  const title = eventBySlug(slug)?.title;
  return { title: title ? `Tickets for ${title}` : "Tickets" };
}

/** The layout's EventRoute opens ticket select when the path ends in /tickets. */
export default function TicketSelectPage() {
  return null;
}
