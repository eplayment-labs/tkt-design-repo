import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileForm } from "@/features/host/profile-form";

export const metadata: Metadata = { title: "Profile" };

export default function HostProfilePage() {
  return (
    <Suspense>
      <ProfileForm mode="profile" />
    </Suspense>
  );
}
