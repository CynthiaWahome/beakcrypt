"use client";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupContent,
} from "~/components/ui/sidebar";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { LayoutDashboard, Users, Monitor, Settings } from "lucide-react";

const navItems = [
  {
    label: "Overview",
    icon: LayoutDashboard,
    href: (slug: string) => `/${slug}`,
    exact: true,
  },
  {
    label: "Teams",
    icon: Users,
    href: (slug: string) => `/${slug}/teams`,
    exact: false,
  },
  {
    label: "Sessions",
    icon: Monitor,
    href: (slug: string) => `/${slug}/sessions`,
    exact: false,
  },
  {
    label: "Settings",
    icon: Settings,
    href: (slug: string) => `/${slug}/settings`,
    exact: false,
  },
] as const;

export default function NavMain() {
  const { slug } = useParams<{ slug: string }>();
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {navItems.map((item) => {
            const href = item.href(slug);
            const isActive = item.exact
              ? pathname === href
              : pathname.startsWith(href);

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                >
                  <Link href={href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
