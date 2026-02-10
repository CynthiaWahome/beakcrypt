import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  SidebarSeparator,
} from "~/components/ui/sidebar";
import { Suspense } from "react";
import { LayoutDashboard, Users, Settings } from "lucide-react";
import OrgSwitcher from "./org-switcher";
import OrgSwitcherSkeleton from "./org-switcher-skeleton";
import NavMain from "./nav-main";
import NavProjects from "./nav-projects";
import ProjectListSkeleton from "./project-list-skeleton";

/**
 * Static fallback for NavMain.
 * Shows "Overview" text with icon (not a link) until the slug resolves.
 */
function NavMainSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <LayoutDashboard />
              <span>Overview</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <Users />
              <span>Teams</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton disabled>
              <Settings />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/**
 * Static fallback for NavProjects.
 * Shows the "Projects" label immediately with deterministic skeleton items.
 */
function NavProjectsSkeleton() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          <ProjectListSkeleton />
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Suspense fallback={<OrgSwitcherSkeleton />}>
          <OrgSwitcher />
        </Suspense>
      </SidebarHeader>
      <SidebarContent>
        <Suspense fallback={<NavMainSkeleton />}>
          <NavMain />
        </Suspense>
        <SidebarSeparator />
        <Suspense fallback={<NavProjectsSkeleton />}>
          <NavProjects />
        </Suspense>
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
