import { api } from "@beakcrypt/convex";
import { isFailure, HttpStatus } from "@beakcrypt/shared";
import { fetchAuthQuery } from "@beakcrypt/convex/auth";
import { notFound, redirect } from "next/navigation";
import SessionsContent from "./content";

export default async function SessionsHandler({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;

  const organization = await fetchAuthQuery(api.organizations.getBySlug, {
    slug,
  });

  if (isFailure(organization)) {
    if (organization.status === HttpStatus.UNAUTHORIZED) {
      const callbackUrl = `/${slug}/sessions`;
      redirect(`/auth?callbackURL=${encodeURIComponent(callbackUrl)}`);
    }
    if (
      organization.status === HttpStatus.NOT_FOUND ||
      organization.status === HttpStatus.FORBIDDEN
    ) {
      return notFound();
    }
    return notFound();
  }

  return <SessionsContent organization={organization.data} />;
}
