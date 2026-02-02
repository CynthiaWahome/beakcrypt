import { Suspense } from "react";
import AppLoader from "~/components/loader";
import OrganizationHandler from "./handler";

export default function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<AppLoader />}>
      <OrganizationHandler paramsPromise={params} />
    </Suspense>
  );
}
