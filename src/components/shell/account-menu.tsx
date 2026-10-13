"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, LogOut, Settings } from "lucide-react";
import { Menu, MenuItem, MenuLabel } from "@/components/ui/controls";
import { Avatar } from "@/components/ui/primitives";
import { useStore, type Role } from "@/features/store";
import { fan } from "@/mocks/people";
import { hostById } from "@/mocks/hosts";
import { brand } from "@/lib/tokens";

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="text-lg font-semibold tracking-tight">
      {brand.name}
    </Link>
  );
}

/** Role switch lands on the closest equivalent page (DESIGN_PLAN §9). */
export const roleHome: Record<Role, string> = { fan: "/profile", host: "/host" };

export function AccountMenu() {
  const router = useRouter();
  const { signedIn, role, setRole, signOut, hostId } = useStore();
  const host = hostById(hostId);
  if (!signedIn) {
    return (
      <Link href="/login" className="flex min-h-11 items-center rounded-pill px-3 text-sm font-medium hover:bg-surface-sunken">
        Sign in
      </Link>
    );
  }
  const other: Role = role === "fan" ? "host" : "fan";
  return (
    <Menu label="Account" trigger={<Avatar src={role === "host" ? host?.avatar : fan.avatar} name={fan.name} size={32} />}>
      {(close) => (
        <>
          <MenuLabel>{role === "host" ? `Hosting as ${host?.name}` : fan.name}</MenuLabel>
          <MenuItem
            icon={<ArrowLeftRight size={16} />}
            onSelect={() => {
              close();
              setRole(other);
              router.push(roleHome[other]);
            }}
          >
            {other === "host" ? "Switch to hosting" : "Switch to attending"}
          </MenuItem>
          <MenuItem
            icon={<Settings size={16} />}
            onSelect={() => {
              close();
              router.push(role === "host" ? "/host/profile" : "/profile");
            }}
          >
            {role === "host" ? "Host profile" : "Settings"}
          </MenuItem>
          <MenuItem
            icon={<LogOut size={16} />}
            onSelect={() => {
              close();
              signOut();
              router.push("/login");
            }}
          >
            Sign out
          </MenuItem>
        </>
      )}
    </Menu>
  );
}
