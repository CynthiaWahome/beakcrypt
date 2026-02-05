import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarRail,
} from "~/components/ui/sidebar";
import { Suspense } from "react";
import OrgSwitcher from "./org-switcher";
import OrgSwitcherSkeleton from "./org-switcher-skeleton";

export default function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader>
        <Suspense fallback={<OrgSwitcherSkeleton />}>
          <OrgSwitcher />
        </Suspense>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup />
      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
