"use client";

import Link from "next/link";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "conv/_generated/api";
import { isFailure, isSuccess } from "conv/types";
import { useParams } from "next/navigation";
import { FolderOpen } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "~/components/ui/sidebar";
import ProjectListSkeleton from "./project-list-skeleton";

export default function NavProjects() {
  const { slug, project: activeProject } = useParams<{
    slug: string;
    project?: string;
  }>();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const orgsResult = useQuery(
    api.organizations.getBySlug,
    isAuthenticated ? { slug } : "skip",
  );

  const orgId =
    orgsResult && isSuccess(orgsResult) ? orgsResult.data._id : undefined;

  const projectsResult = useQuery(
    api.projects.list,
    orgId ? { orgId } : "skip",
  );

  const projects =
    projectsResult && isSuccess(projectsResult) ? projectsResult.data : null;

  const isAuthLoading = isLoading;
  const isOrgsLoading = isAuthenticated && orgsResult === undefined;
  const isProjectsLoading = !!orgId && projectsResult === undefined;

  const hasAuthOrOrgError =
    !isAuthLoading &&
    (!isAuthenticated || (orgsResult !== undefined && isFailure(orgsResult)));

  const hasProjectsError =
    !!orgId && projectsResult !== undefined && isFailure(projectsResult);

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {(isAuthLoading || isOrgsLoading || isProjectsLoading) && (
            <ProjectListSkeleton />
          )}

          {!isAuthLoading && hasAuthOrOrgError && (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <span className="text-muted-foreground text-xs">
                  {!isAuthenticated
                    ? "Sign in to view projects"
                    : "Unable to load organization"}
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {!isAuthLoading && !hasAuthOrOrgError && hasProjectsError && (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <span className="text-muted-foreground text-xs">
                  Unable to load projects
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {projects !== null &&
            projects.length > 0 &&
            projects.map((p) => {
              const isActive =
                activeProject === p.name ||
                decodeURIComponent(activeProject ?? "") === p.name;

              return (
                <SidebarMenuItem key={p._id}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={p.name}
                  >
                    <Link href={`/${slug}/${encodeURIComponent(p.name)}`}>
                      <FolderOpen />
                      <span>{p.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

          {projects !== null && projects.length === 0 && !hasProjectsError && (
            <SidebarMenuItem>
              <SidebarMenuButton disabled>
                <span className="text-muted-foreground text-xs">
                  No projects yet
                </span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
