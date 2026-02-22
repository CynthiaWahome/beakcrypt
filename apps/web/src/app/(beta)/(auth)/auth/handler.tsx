import AuthContent from "./content";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@beakcrypt/convex/auth";

export default async function AuthHandler({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ callbackURL?: string; error?: string }>;
}) {
  const params = await searchParamsPromise;

  const authenticated = await isAuthenticated();
  if (authenticated) {
    redirect(params.callbackURL || "/");
  }

  return <AuthContent callbackURL={params.callbackURL} error={params.error} />;
}
