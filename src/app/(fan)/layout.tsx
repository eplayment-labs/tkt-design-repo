import { FanShell } from "@/components/shell/fan-shell";
import { SiteFooter } from "@/components/shell/site-footer";

export default function FanLayout({ children }: LayoutProps<"/">) {
  return (
    <FanShell>
      {children}
      <SiteFooter />
    </FanShell>
  );
}
