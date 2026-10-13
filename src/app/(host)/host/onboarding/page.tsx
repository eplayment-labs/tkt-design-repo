import { Suspense } from "react";
import type { Metadata } from "next";
import { ProfileForm } from "@/features/host/profile-form";

export const metadata: Metadata = { title: "Set up your profile" };

export default function OnboardingPage() {
  return (
    <Suspense>
      <ProfileForm mode="onboarding" />
    </Suspense>
  );
}
