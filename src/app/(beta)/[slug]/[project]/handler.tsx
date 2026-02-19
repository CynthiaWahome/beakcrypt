import { api } from "conv/_generated/api";
import { isFailure, HttpStatus } from "conv/types";
import {
  fetchAuthQuery,
  fetchAuthMutation,
  preloadAuthQuery,
} from "~/lib/auth-server";
import { notFound, redirect } from "next/navigation";
import ProjectContent from "./content";

export default async function ProjectHandler({
  paramsPromise,
}: {
  paramsPromise: Promise<{ slug: string; project: string }>;
}) {
  const { slug, project: projectName } = await paramsPromise;

  const projectResult = await fetchAuthQuery(api.projects.getBySlugAndName, {
    orgSlug: slug,
    name: projectName,
  });

  if (isFailure(projectResult)) {
    if (projectResult.status === HttpStatus.NOT_FOUND) {
      return notFound();
    }

    if (
      projectResult.status === HttpStatus.UNAUTHORIZED ||
      projectResult.status === HttpStatus.FORBIDDEN
    ) {
      redirect(
        `/auth?callbackURL=${encodeURIComponent(`/${slug}/${projectName}`)}`,
      );
    }

    return notFound();
  }

  await fetchAuthMutation(api.environments.ensurePersonalLocal, {
    projectId: projectResult.data._id,
    syncFromDev: true,
  });

  const preloadedEnvironments = await preloadAuthQuery(api.environments.list, {
    projectId: projectResult.data._id,
  });

  return (
    <ProjectContent
      project={projectResult.data}
      preloadedEnvironments={preloadedEnvironments}
    />
  );
}
