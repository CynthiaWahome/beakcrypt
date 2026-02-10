"use client";

import Link from "next/link";
import { useQuery, useConvexAuth } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess } from "conv/types";
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

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {(isLoading || projects === null) && <ProjectListSkeleton />}

          {projects !== null &&
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
                    <Link href={`/${slug}/${p.name}`}>
                      <FolderOpen />
                      <span>{p.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}

          {projects !== null && projects.length === 0 && (
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
