import { api } from "@beakcrypt/convex";
import { isFailure, HttpStatus } from "@beakcrypt/shared";
import { fetchAuthQuery, preloadAuthQuery } from "@beakcrypt/convex/auth";
import { notFound, redirect } from "next/navigation";
import DashboardContent from "./content";

export default async function OrganizationHandler({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string }>;
}) {
  const { slug } = await paramsPromise;

  const organization = await fetchAuthQuery(api.organizations.getBySlug, {
    slug,
  });

  if (isFailure(organization)) {
    if (organization.status === HttpStatus.NOT_FOUND) {
      return notFound();
    }

    if (
      organization.status === HttpStatus.UNAUTHORIZED ||
      organization.status === HttpStatus.FORBIDDEN
    ) {
      const callbackUrl = `/${slug}`;
      redirect(`/auth?callbackURL=${encodeURIComponent(callbackUrl)}`);
    }

    return notFound();
  }

  const preloadedProjects = await preloadAuthQuery(api.projects.list, {
    orgId: organization.data._id,
  });

  return (
    <DashboardContent
      organization={organization.data}
      preloadedProjects={preloadedProjects}
    />
  );
}
