import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";
import { SidebarTrigger } from "~/components/ui/sidebar";
import ProjectHandler from "./handler";

export const metadata: Metadata = {
  title: "Project - Beakcrypt",
  description: "Manage environment variables for your project.",
};

function ProjectSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-20" />
            <p className="text-sm text-muted-foreground">
              Manage environment variables for this project.
            </p>
          </div>
        </div>
        <Skeleton className="h-8 w-32 rounded-md" />
      </div>
      <Separator />
      <div className="flex items-center gap-2 px-6 pt-4">
        {["local", "development", "staging", "production"].map((name) => (
          <Skeleton key={name} className="h-8 w-24 rounded-md" />
        ))}
      </div>
      <div className="flex flex-col gap-4 px-6 pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </div>
        <div className="rounded-lg border">
          <div className="divide-y">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 flex-1 max-w-xs" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string; project: string }>;
}) {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectHandler paramsPromise={params} />
    </Suspense>
  );
}
