import type { Metadata } from "next";
import { Suspense } from "react";
import { HostProfile } from "@/features/fan/host-profile";

export const metadata: Metadata = { title: "Host" };

export default async function Page(props: PageProps<"/h/[handle]">) {
  const { handle } = await props.params;
  return (
    <Suspense>
      <HostProfile handle={handle} />
    </Suspense>
  );
}
