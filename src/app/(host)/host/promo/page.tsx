import { Suspense } from "react";
import type { Metadata } from "next";
import { AllPromoScreen } from "@/features/host/promo";

export const metadata: Metadata = { title: "Promo codes" };

export default function PromoPage() {
  return (
    <Suspense>
      <AllPromoScreen />
    </Suspense>
  );
}
