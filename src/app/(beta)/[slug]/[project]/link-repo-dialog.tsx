"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Spinner } from "~/components/ui/spinner";
import {
  Loader2,
  Github,
  Search,
  Lock,
  Globe,
  Check,
  Unlink,
} from "lucide-react";
import type { Id } from "conv/_generated/dataModel";
import { useMutation, useAction } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess, isFailure } from "conv/types";
import { useState, useEffect, useTransition } from "react";

type GitHubRepo = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  ownerAvatar: string;
  url: string;
  isPrivate: boolean;
  updatedAt: string;
  defaultBranch: string;
};

interface Props {
  projectId: Id<"projects">;
  currentRepoName: string | undefined;
}

export default function LinkRepoDialog({ projectId, currentRepoName }: Props) {
  const linkMutation = useMutation(api.projects.linkRepo);
  const unlinkMutation = useMutation(api.projects.unlinkRepo);
  const searchRepos = useAction(api.github.searchRepos);
  const listRepos = useAction(api.github.listRepos);

  const [open, setOpen] = useState(false);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [repoLoading, startRepoTransition] = useTransition();
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [reposLoaded, setReposLoaded] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const isLinked = !!currentRepoName;

  useEffect(() => {
    if (open && !reposLoaded) {
      startRepoTransition(async () => {
        try {
          const result = await listRepos({ perPage: 20 });
          if (isSuccess(result)) {
            setRepos(result.data);
          }
          setReposLoaded(true);
        } catch {
          setReposLoaded(true);
        }
      });
    }
  }, [open, reposLoaded, listRepos]);

  useEffect(() => {
    if (!open || !repoSearch.trim()) return;

    const handler = setTimeout(() => {
      startRepoTransition(async () => {
        try {
          const result = await searchRepos({ query: repoSearch });
          if (isSuccess(result)) {
            setRepos(result.data);
          }
        } catch {}
      });
    }, 400);

    return () => clearTimeout(handler);
  }, [repoSearch, open, searchRepos]);

  const handleLink = () => {
    if (!selectedRepo) return;
    setError("");
    startTransition(async () => {
      try {
        const result = await linkMutation({
          id: projectId,
          githubRepoId: selectedRepo.id,
          githubRepoUrl: selectedRepo.url,
          githubRepoName: selectedRepo.fullName,
        });
        if (isFailure(result)) {
          setError(result.error);
          return;
        }
        setOpen(false);
        setSelectedRepo(null);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const handleUnlink = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await unlinkMutation({ id: projectId });
        if (isFailure(result)) {
          setError(result.error);
          return;
        }
        setOpen(false);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSelectedRepo(null);
      setRepoSearch("");
      setError("");
      setReposLoaded(false);
      setRepos([]);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {isLinked ? (
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Github className="size-3.5" />
            {currentRepoName}
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5">
            <Github className="size-3.5" />
            Link Repository
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isLinked ? "Linked Repository" : "Link GitHub Repository"}
          </DialogTitle>
          <DialogDescription>
            {isLinked
              ? "Manage the linked repository for this project."
              : "Connect a GitHub repository to this project."}
          </DialogDescription>
        </DialogHeader>

        {isLinked && (
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm">
              <Github className="size-4 text-muted-foreground" />
              <span className="font-medium">{currentRepoName}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnlink}
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              {isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <Unlink className="size-3.5" />
                  Unlink
                </>
              )}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search repositories..."
              value={repoSearch}
              onChange={(e) => setRepoSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          <div className="max-h-[200px] overflow-y-auto rounded-md border">
            {repoLoading && repos.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner className="size-5" />
              </div>
            ) : repos.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {reposLoaded ? "No repositories found." : "Loading..."}
              </p>
            ) : (
              <div className="divide-y">
                {repos.map((repo) => (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => setSelectedRepo(repo)}
                    className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-accent/50 ${
                      selectedRepo?.id === repo.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex flex-1 items-center gap-2 min-w-0">
                      {repo.isPrivate ? (
                        <Lock className="size-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                      )}
                      <span className="truncate font-medium">
                        {repo.fullName}
                      </span>
                    </div>
                    {selectedRepo?.id === repo.id && (
                      <Check className="size-4 shrink-0 text-emerald-500" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleLink} disabled={isPending || !selectedRepo}>
            {isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Linking...
              </>
            ) : (
              <>
                <Github />
                Link Repository
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
