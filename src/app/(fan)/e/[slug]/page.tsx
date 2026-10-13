import type { Metadata } from "next";
import { eventBySlug } from "@/mocks/events";

export async function generateMetadata(props: PageProps<"/e/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  return { title: eventBySlug(slug)?.title ?? "Event" };
}

/** Rendered by the layout (EventRoute). */
export default function EventPage() {
  return null;
}
