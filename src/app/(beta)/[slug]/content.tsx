"use client";

import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess } from "conv/types";
import type { Doc } from "conv/_generated/dataModel";
import Link from "next/link";
import { FolderOpen, Plus, Github, Clock } from "lucide-react";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "~/components/ui/empty";
import CreateProjectDialog from "./create-project-dialog";
import { useState } from "react";

interface Props {
  organization: Doc<"organizations">;
  preloadedProjects: Preloaded<typeof api.projects.list>;
}

export default function DashboardContent({
  organization,
  preloadedProjects,
}: Props) {
  const projectsResult = usePreloadedQuery(preloadedProjects);
  const [createOpen, setCreateOpen] = useState(false);

  const projects = isSuccess(projectsResult) ? projectsResult.data : [];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Projects</h1>
            <p className="text-sm text-muted-foreground">
              Manage your projects and their environment variables.
            </p>
          </div>
        </div>
        <CreateProjectDialog
          orgId={organization._id}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      </div>

      <Separator />

      <div className="flex-1 p-6">
        {projects.length === 0 ? (
          <Empty className="min-h-[60vh]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <FolderOpen />
              </EmptyMedia>
              <EmptyTitle>No projects yet</EmptyTitle>
              <EmptyDescription>
                Create your first project to start managing environment
                variables across your team.
              </EmptyDescription>
            </EmptyHeader>
            <Button onClick={() => setCreateOpen(true)}>
              <Plus />
              New Project
            </Button>
          </Empty>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                orgSlug={organization.slug}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  orgSlug,
}: {
  project: Doc<"projects">;
  orgSlug: string;
}) {
  return (
    <Link
      href={`/${orgSlug}/${project.name}`}
      className="group relative flex flex-col gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-md bg-muted">
            <FolderOpen className="size-4 text-muted-foreground" />
          </div>
          <span className="font-medium">{project.name}</span>
        </div>
        {project.githubRepoName && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Github className="size-3" />
            {project.githubRepoName.split("/").pop()}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Clock className="size-3" />
          {new Date(project.updatedAt).toLocaleDateString()}
        </div>
      </div>
    </Link>
  );
}
