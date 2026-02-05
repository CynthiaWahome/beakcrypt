import { ChevronsUpDown } from "lucide-react";
import { Skeleton } from "~/components/ui/skeleton";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "~/components/ui/sidebar";

export default function OrgSwitcherSkeleton() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          size="lg"
          className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
        >
          <div className="flex items-center justify-center">
            <Skeleton className="size-8 rounded-full" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <Skeleton className="h-4 w-24 rounded" />
          </div>
          <ChevronsUpDown className="ml-auto text-muted-foreground" />
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
