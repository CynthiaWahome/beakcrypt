import { redirect } from "next/navigation";
import { isAuthenticated } from "@beakcrypt/convex/auth";
import CliAuthContent from "./content";

export default async function CliAuthHandler({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ callback?: string; error?: string }>;
}) {
  const params = await searchParamsPromise;

  if (params.callback && !isValidCliCallback(params.callback)) {
    return (
      <p className="text-sm text-destructive">
        Invalid callback URL. Only localhost callbacks are allowed.
      </p>
    );
  }

  const authenticated = await isAuthenticated();

  if (authenticated && params.callback) {
    return <CliAuthContent callback={params.callback} isAuthenticated />;
  }

  const callbackURL = `/auth/cli${params.callback ? `?callback=${encodeURIComponent(params.callback)}` : ""}`;
  redirect(`/auth?callbackURL=${encodeURIComponent(callbackURL)}`);
}

function isValidCliCallback(callback: string): boolean {
  try {
    const url = new URL(callback);
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}
