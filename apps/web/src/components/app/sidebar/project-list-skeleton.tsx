import { Skeleton } from "@beakcrypt/ui/components/skeleton";
import { SidebarMenuItem } from "@beakcrypt/ui/components/sidebar";

const WIDTHS = [50, 60, 75];

export default function ProjectListSkeleton() {
  return (
    <>
      {WIDTHS.map((width) => (
        <SidebarMenuItem key={width}>
          <div className="flex h-8 items-center gap-2 rounded-md px-2">
            <Skeleton className="size-4 rounded-md" />
            <Skeleton
              className="h-4 flex-1"
              style={{ maxWidth: `${width}%` }}
            />
          </div>
        </SidebarMenuItem>
      ))}
    </>
  );
}
