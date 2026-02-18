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
import { Separator } from "~/components/ui/separator";
import { Spinner } from "~/components/ui/spinner";
import {
  Loader2,
  Plus,
  Github,
  Search,
  Lock,
  Globe,
  Check,
} from "lucide-react";
import type { Id } from "conv/_generated/dataModel";
import type { Doc } from "conv/_generated/dataModel";
import type { Response } from "~/types/response";
import { createProject } from "./actions";
import {
  useActionState,
  useEffect,
  useState,
  useTransition,
  useRef,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { useAction } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess } from "conv/types";

type CreateProjectInputs = {
  name: string;
  orgId: string;
  githubRepoId: string;
  githubRepoUrl: string;
  githubRepoName: string;
};

const initialState: Response<Doc<"projects">, CreateProjectInputs> = {
  timestamp: Date.now(),
  error: "",
  inputs: {
    name: "",
    orgId: "",
    githubRepoId: "",
    githubRepoUrl: "",
    githubRepoName: "",
  },
};

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
  orgId: Id<"organizations">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateProjectDialog({
  orgId,
  open,
  onOpenChange,
}: Props) {
  const router = useRouter();
  const { slug } = useParams<{ slug: string }>();
  const [state, formAction, pending] = useActionState(
    createProject,
    initialState,
  );

  const [showError, setShowError] = useState(false);

  const [mode, setMode] = useState<"name" | "github">("name");

  const searchRepos = useAction(api.github.searchRepos);
  const listRepos = useAction(api.github.listRepos);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [repoSearch, setRepoSearch] = useState("");
  const [repoLoading, startRepoTransition] = useTransition();
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [reposLoaded, setReposLoaded] = useState(false);

  const hasError = "error" in state && !!state.error;
  const hasSuccess = "data" in state && !!state.data;

  useEffect(() => {
    if (hasError) {
      setShowError(true);
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [state.timestamp, hasError]);

  const navigatedRef = useRef(false);

  useEffect(() => {
    if (hasSuccess && state.data && !navigatedRef.current) {
      navigatedRef.current = true;
      onOpenChange(false);
      router.push(`/${slug}/${state.data.name}`);
    }
  }, [hasSuccess, state.data, slug, router, onOpenChange]);

  useEffect(() => {
    if (mode === "github" && !reposLoaded) {
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
  }, [mode, reposLoaded, listRepos]);

  useEffect(() => {
    if (mode !== "github" || !repoSearch.trim()) return;

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
  }, [repoSearch, mode, searchRepos]);

  const handleReset = () => {
    setMode("name");
    setSelectedRepo(null);
    setRepoSearch("");
    setReposLoaded(false);
    setRepos([]);
    setShowError(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) handleReset();
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Project</DialogTitle>
          <DialogDescription>
            A project groups your environment variables by service or
            application.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => {
              setMode("name");
              setSelectedRepo(null);
            }}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "name"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            By Name
          </button>
          <button
            type="button"
            onClick={() => setMode("github")}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              mode === "github"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Github className="mr-1.5 inline size-3.5" />
            Import Repo
          </button>
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <input type="hidden" name="orgId" value={orgId} />
          <input
            type="hidden"
            name="githubRepoId"
            value={selectedRepo?.id ?? ""}
          />
          <input
            type="hidden"
            name="githubRepoUrl"
            value={selectedRepo?.url ?? ""}
          />
          <input
            type="hidden"
            name="githubRepoName"
            value={selectedRepo?.fullName ?? ""}
          />

          {mode === "name" ? (
            <div className="space-y-2">
              <label
                htmlFor="project-name"
                className="text-sm font-medium leading-none"
              >
                Project Name
              </label>
              <Input
                id="project-name"
                name="name"
                required
                minLength={1}
                maxLength={64}
                placeholder="my-app"
                defaultValue={state.inputs.name}
                className={
                  showError
                    ? "border-red-500/50 focus-visible:ring-red-500/20"
                    : ""
                }
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and hyphens.
              </p>
            </div>
          ) : (
            <>
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

                <div className="max-h-50 overflow-y-auto rounded-md border">
                  {repoLoading && repos.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner className="size-5" />
                    </div>
                  ) : repos.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                      No repositories found.
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

              {selectedRepo && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <Separator />
                  <label
                    htmlFor="project-name-github"
                    className="text-sm font-medium leading-none"
                  >
                    Project Name
                  </label>
                  <Input
                    key={selectedRepo.id}
                    id="project-name-github"
                    name="name"
                    required
                    minLength={1}
                    maxLength={64}
                    defaultValue={selectedRepo.name.toLowerCase()}
                    className={
                      showError
                        ? "border-red-500/50 focus-visible:ring-red-500/20"
                        : ""
                    }
                  />
                </div>
              )}
            </>
          )}

          {showError && (
            <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending || (mode === "github" && !selectedRepo)}
            >
              {pending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Project"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
