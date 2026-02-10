import TeamsContent from "./content";
import { api } from "conv/_generated/api";
import { isFailure, HttpStatus } from "conv/types";
import { notFound, redirect } from "next/navigation";
import { fetchAuthQuery, preloadAuthQuery } from "~/lib/auth-server";

export default async function TeamsHandler({
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
      const callbackUrl = `/${slug}/teams`;
      redirect(`/auth?callbackURL=${encodeURIComponent(callbackUrl)}`);
    }
    return notFound();
  }

  const preloadedMembers = await preloadAuthQuery(api.members.list, {
    orgId: organization.data._id,
  });

  const preloadedInvites = await preloadAuthQuery(api.invites.listByOrg, {
    orgId: organization.data._id,
  });

  const preloadedMyMembership = await preloadAuthQuery(
    api.members.getMyMembership,
    { orgId: organization.data._id },
  );

  return (
    <TeamsContent
      organization={organization.data}
      preloadedMembers={preloadedMembers}
      preloadedInvites={preloadedInvites}
      preloadedMyMembership={preloadedMyMembership}
    />
  );
}
