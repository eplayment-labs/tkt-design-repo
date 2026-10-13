import type { Metadata } from "next";
import { Suspense } from "react";
import { Checkout } from "@/features/fan/checkout";

export const metadata: Metadata = { title: "Checkout" };

export default async function Page(props: PageProps<"/checkout/[holdId]">) {
  const { holdId } = await props.params;
  return (
    <Suspense>
      <Checkout holdId={holdId} />
    </Suspense>
  );
}
