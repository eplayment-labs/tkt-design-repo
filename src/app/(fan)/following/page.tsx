import type { Metadata } from "next";
import { Suspense } from "react";
import { Following } from "@/features/fan/following";

export const metadata: Metadata = { title: "Following" };

export default function Page() {
  return (
    <Suspense>
      <Following />
    </Suspense>
  );
}
