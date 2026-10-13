import type { Metadata } from "next";
import { Suspense } from "react";
import { Confirmation } from "@/features/fan/confirmation";

export const metadata: Metadata = { title: "You're going" };

export default async function Page(props: PageProps<"/orders/[orderId]">) {
  const { orderId } = await props.params;
  return (
    <Suspense>
      <Confirmation orderId={orderId} />
    </Suspense>
  );
}
