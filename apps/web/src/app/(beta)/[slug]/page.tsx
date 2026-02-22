import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@beakcrypt/ui/components/skeleton";
import { Separator } from "@beakcrypt/ui/components/separator";
import { SidebarTrigger } from "@beakcrypt/ui/components/sidebar";
import { Button } from "@beakcrypt/ui/components/button";
import { Plus } from "lucide-react";
import OrganizationHandler from "./handler";

export const metadata: Metadata = {
  title: "Projects - Beakcrypt",
  description: "Manage your projects and their environment variables.",
};

function DashboardSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Manage your projects and their environment variables.
            </p>
          </div>
        </div>
        <Button size="sm" disabled>
          <Plus />
          New Project
        </Button>
      </div>
      <Separator />
      <div className="grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-lg border bg-card p-4"
          >
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-md" />
              <Skeleton className="h-4 w-28" />
            </div>
            <Skeleton className="h-3 w-36" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <OrganizationHandler paramsPromise={params} />
    </Suspense>
  );
}
