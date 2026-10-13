import { Suspense } from "react";
import { EventRoute } from "@/features/fan/event-route";

/** The event page lives here so opening /tickets keeps it mounted underneath. */
export default async function EventLayout(props: LayoutProps<"/e/[slug]">) {
  const { slug } = await props.params;
  return (
    <>
      <Suspense>
        <EventRoute slug={slug} />
      </Suspense>
      {props.children}
    </>
  );
}
