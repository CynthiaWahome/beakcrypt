import type { Metadata } from "next";
import { Suspense } from "react";
import { Skeleton } from "@beakcrypt/ui/components/skeleton";
import { Separator } from "@beakcrypt/ui/components/separator";
import { SidebarTrigger } from "@beakcrypt/ui/components/sidebar";
import { Button } from "@beakcrypt/ui/components/button";
import { Mail } from "lucide-react";
import TeamsHandler from "./handler";

export const metadata: Metadata = {
  title: "Team - Beakcrypt",
  description: "Manage members and invitations for your organization.",
};

function TeamsSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Team</h1>
            <p className="text-sm text-muted-foreground">
              Manage members and invitations for your organization.
            </p>
          </div>
        </div>
        <Button size="sm" disabled>
          <Mail />
          Invite Member
        </Button>
      </div>
      <Separator />
      <div className="flex flex-col gap-3 p-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="size-9 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TeamsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<TeamsSkeleton />}>
      <TeamsHandler paramsPromise={params} />
    </Suspense>
  );
}
