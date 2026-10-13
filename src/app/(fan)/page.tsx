import { Landing } from "@/features/fan/landing/landing";

// Mock dates are relative to "today": render per request so a static build never goes stale.
export const dynamic = "force-dynamic";

export default function LandingPage() {
  return <Landing />;
}
