import { api } from "conv/_generated/api";
import { isFailure, HttpStatus } from "conv/types";
import { fetchAuthQuery } from "~/lib/auth-server";
import { notFound, redirect } from "next/navigation";
import SettingsContent from "./content";

export default async function SettingsHandler({
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
      const callbackUrl = `/${slug}/settings`;
      redirect(`/auth?callbackURL=${encodeURIComponent(callbackUrl)}`);
    }
    if (
      organization.status === HttpStatus.NOT_FOUND ||
      organization.status === HttpStatus.FORBIDDEN
    ) {
      return notFound();
    }
    if (!organization.data) {
      return notFound();
    }
  }

  return <SettingsContent organization={organization.data} />;
}
