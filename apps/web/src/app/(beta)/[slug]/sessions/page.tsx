import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@beakcrypt/ui/components/skeleton";
import { Separator } from "@beakcrypt/ui/components/separator";
import { SidebarTrigger } from "@beakcrypt/ui/components/sidebar";
import SessionsHandler from "./handler";

export const metadata: Metadata = {
  title: "Sessions - Beakcrypt",
  description: "Manage your device sessions for this organization.",
};

function SessionsSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 px-6 py-4">
        <SidebarTrigger className="-ml-1" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Manage your device sessions for this organization.
          </p>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-3 p-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SessionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<SessionsSkeleton />}>
      <SessionsHandler paramsPromise={params} />
    </Suspense>
  );
}
