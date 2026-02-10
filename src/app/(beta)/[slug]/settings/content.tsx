"use client";

import { useMutation } from "convex/react";
import { api } from "conv/_generated/api";
import { isFailure } from "conv/types";
import type { Doc } from "conv/_generated/dataModel";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

interface Props {
  organization: Doc<"organizations">;
}

export default function SettingsContent({ organization }: Props) {
  const updateMutation = useMutation(api.organizations.update);
  const router = useRouter();

  const [name, setName] = useState(organization.name);
  const [nameSaved, setNameSaved] = useState(false);
  const [nameError, setNameError] = useState("");
  const [namePending, startNameTransition] = useTransition();

  const [slug, setSlug] = useState(organization.slug);
  const [slugSaved, setSlugSaved] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [slugPending, startSlugTransition] = useTransition();
  const [slugConfirmOpen, setSlugConfirmOpen] = useState(false);

  const nameChanged = name !== organization.name;
  const slugChanged = slug !== organization.slug;

  const handleSaveName = () => {
    if (!name.trim() || !nameChanged) return;
    setNameError("");
    setNameSaved(false);
    startNameTransition(async () => {
      try {
        const result = await updateMutation({
          id: organization._id,
          name: name.trim(),
        });
        if (isFailure(result)) {
          setNameError(result.error);
          return;
        }
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
      } catch {
        setNameError("Something went wrong.");
      }
    });
  };

  const handleSaveSlug = () => {
    if (!slug.trim() || !slugChanged) return;
    setSlugError("");
    setSlugSaved(false);
    startSlugTransition(async () => {
      try {
        const result = await updateMutation({
          id: organization._id,
          slug: slug.trim().toLowerCase(),
        });
        if (isFailure(result)) {
          setSlugError(result.error);
          return;
        }
        setSlugSaved(true);
        setSlugConfirmOpen(false);
        router.replace(`/${result.data.slug}/settings`);
      } catch {
        setSlugError("Something went wrong.");
      }
    });
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 px-6 py-4">
        <SidebarTrigger className="-ml-1" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground">
            Manage your organization settings.
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex-1 p-6">
        <div className="flex flex-col gap-8 max-w-2xl">
          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium">Organization Name</h2>
              <p className="text-xs text-muted-foreground mt-1">
                The display name of your organization.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Organization"
                className="max-w-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSaveName();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleSaveName}
                disabled={namePending || !nameChanged || !name.trim()}
              >
                {namePending ? (
                  <Loader2 className="animate-spin" />
                ) : nameSaved ? (
                  <>
                    <Check />
                    Saved
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            {nameError && (
              <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                {nameError}
              </p>
            )}
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium">Organization URL</h2>
              <p className="text-xs text-muted-foreground mt-1">
                The URL-friendly identifier for your organization. Changing this
                will break existing links.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground h-9">
                /
              </div>
              <Input
                value={slug}
                onChange={(e) =>
                  setSlug(
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  )
                }
                placeholder="my-org"
                className="max-w-sm font-mono"
              />
              <Button
                size="sm"
                onClick={() => setSlugConfirmOpen(true)}
                disabled={slugPending || !slugChanged || !slug.trim()}
              >
                {slugPending ? (
                  <Loader2 className="animate-spin" />
                ) : slugSaved ? (
                  <>
                    <Check />
                    Saved
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
            {slugError && (
              <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                {slugError}
              </p>
            )}
          </section>

          <Separator />

          <section className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-destructive">
                Danger Zone
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Irreversible and destructive actions.
              </p>
            </div>
            <div className="rounded-lg border border-destructive/20 p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium">Delete Organization</p>
                <p className="text-xs text-muted-foreground">
                  Permanently delete {organization.name} and all of its
                  projects, environments, and secrets. This action cannot be
                  undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0"
                disabled
              >
                Delete
              </Button>
            </div>
          </section>
        </div>
      </div>

      <Dialog open={slugConfirmOpen} onOpenChange={setSlugConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Organization URL</DialogTitle>
            <DialogDescription>
              Are you sure you want to change the URL from{" "}
              <span className="font-mono font-medium text-foreground">
                /{organization.slug}
              </span>{" "}
              to{" "}
              <span className="font-mono font-medium text-foreground">
                /{slug}
              </span>
              ? All existing links and bookmarks will break.
            </DialogDescription>
          </DialogHeader>

          {slugError && (
            <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
              {slugError}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSlugConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSlug} disabled={slugPending}>
              {slugPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <AlertTriangle />
                  Confirm Change
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
