import { Suspense } from "react";
import InviteHandler from "./handler";
import AppLoader from "~/components/loader";

export default function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={<AppLoader />}>
      <InviteHandler searchParamsPromise={searchParams} />
    </Suspense>
  );
}
