import type { Metadata } from "next";
import { Suspense } from "react";
import { Profile } from "@/features/fan/profile";

export const metadata: Metadata = { title: "Profile" };

export default function Page() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
