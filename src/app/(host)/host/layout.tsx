import { HostShell } from "@/components/shell/host-shell";

export default function HostLayout({ children }: LayoutProps<"/host">) {
  return <HostShell>{children}</HostShell>;
}
