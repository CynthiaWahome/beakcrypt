import { Suspense } from "react";
import { Skeleton } from "~/components/ui/skeleton";
import { Separator } from "~/components/ui/separator";
import SettingsHandler from "./handler";

function SettingsSkeleton() {
  return (
    <div className="flex flex-1 flex-col">
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
