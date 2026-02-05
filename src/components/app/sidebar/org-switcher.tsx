"use client";

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuShortcut,
  DropdownMenuSeparator,
} from "~/components/ui/dropdown-menu";
import {
  useSidebar,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";
import Link from "next/link";
import { api } from "conv/_generated/api";
import { getInitials } from "~/lib/utils";
import { ChevronsUpDown, Plus } from "lucide-react";
import { useConvexAuth, useQuery } from "convex/react";
import OrgSwitcherSkeleton from "./org-switcher-skeleton";
import { isFailure, isSuccess, HttpStatus } from "conv/types";
import { redirect, useParams, notFound } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";

export default function OrgSwitcher() {
  const { isMobile } = useSidebar();
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const activeOrgResult = useQuery(
    api.organizations.getBySlug,
    isAuthenticated ? { slug } : "skip",
  );
  const orgsResult = useQuery(
    api.organizations.list,
    isAuthenticated ? {} : "skip",
  );

  if (isLoading || activeOrgResult === undefined || orgsResult === undefined) {
    return <OrgSwitcherSkeleton />;
  }

  if (!isAuthenticated) {
    redirect("/auth");
  }

  if (isFailure(activeOrgResult)) {
    if (
      activeOrgResult.status === HttpStatus.NOT_FOUND ||
      activeOrgResult.status === HttpStatus.FORBIDDEN
    ) {
      notFound();
    }

    return null;
  }

  if (isFailure(orgsResult)) {
    return null;
  }

  const activeOrg = activeOrgResult.data;
  const orgs = orgsResult.data;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex items-center justify-center">
                <Avatar>
                  <AvatarImage src={activeOrg.avatar} />
                  <AvatarFallback>{getInitials(activeOrg.name)}</AvatarFallback>
                </Avatar>
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{activeOrg.name}</span>
              </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
              <ChevronsUpDown className="ml-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              Organizations
            </DropdownMenuLabel>
            {orgs.map((org, index) => (
              <DropdownMenuItem key={org._id} asChild className="gap-2 p-2">
                <Link href={`/${org.slug}`}>
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Avatar>
                      <AvatarImage src={org.avatar} />
                      <AvatarFallback>{getInitials(org.name)}</AvatarFallback>
                    </Avatar>
                  </div>
                  {org.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </Link>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href="/onboarding">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Plus className="size-4" />
                </div>
                <div className="text-muted-foreground font-medium">
                  Add Organization
                </div>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
            </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
