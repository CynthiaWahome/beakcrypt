import { Suspense } from "react";
import { Skeleton } from "@beakcrypt/ui/components/skeleton";
import { Separator } from "@beakcrypt/ui/components/separator";
import { SidebarTrigger } from "@beakcrypt/ui/components/sidebar";
import SettingsHandler from "./handler";

function SettingsSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 px-6 py-4">
        <SidebarTrigger className="-ml-1" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization settings.
          </p>
        </div>
      </div>
      <Separator />
      <div className="flex flex-col gap-6 p-6 max-w-2xl">
        <div className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-9 w-full rounded-md" />
        </div>
        <div className="space-y-3 rounded-lg border p-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full rounded-md" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsHandler paramsPromise={params} />
    </Suspense>
  );
}
