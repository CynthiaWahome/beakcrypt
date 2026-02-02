import AuthContent from "./content";

export default async function AuthHandler({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ callbackURL?: string; error?: string }>;
}) {
  const params = await searchParamsPromise;

  return <AuthContent callbackURL={params.callbackURL} error={params.error} />;
}
