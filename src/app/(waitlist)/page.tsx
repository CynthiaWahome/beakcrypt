import { Suspense } from "react";
import type { Metadata } from "next";
import WaitlistHandler from "./handler";
import AppLoader from "~/components/loader";

export const metadata: Metadata = {
  title: "Join the Waitlist - Beakcrypt",
  description:
    "Be first to join the vault. The open-source standard for managing and sharing environment variables securely.",
};

export default function WaitlistPage({
  searchParams,
}: {
  searchParams: Promise<{ beta?: string }>;
}) {
  return (
    <Suspense fallback={<AppLoader />}>
      <WaitlistHandler searchParamsPromise={searchParams} />
    </Suspense>
  );
}
