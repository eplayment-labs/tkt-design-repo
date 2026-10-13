import { Suspense } from "react";
import type { Metadata } from "next";
import { Dashboard } from "@/features/host/dashboard";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage(props: PageProps<"/host/events/[id]">) {
  const { id } = await props.params;
  return (
    <Suspense>
      <Dashboard id={id} />
    </Suspense>
  );
}
