import type { Metadata } from "next";
import { Suspense } from "react";
import { Wallet } from "@/features/fan/wallet";

export const metadata: Metadata = { title: "My tickets" };

export default function Page() {
  return (
    <Suspense>
      <Wallet />
    </Suspense>
  );
}
