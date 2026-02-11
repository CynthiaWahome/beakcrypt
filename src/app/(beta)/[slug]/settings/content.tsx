"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "conv/_generated/api";
import { isFailure, isSuccess } from "conv/types";
import type { Doc } from "conv/_generated/dataModel";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, AlertTriangle, KeyRound, RefreshCw } from "lucide-react";
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
import { useOrgKey } from "~/hooks/use-org-key";
import {
  generateOrgKey,
  wrapOrgKey,
  decryptSecret,
  encryptSecret,
  storePrivateKey,
  getPrivateKey,
} from "~/lib/crypto";

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

  const { orgKey, status: keyStatus } = useOrgKey(organization._id);
  const activeKeysResult = useQuery(api.keys.listActiveKeys, {
    orgId: organization._id,
  });
  const allSecretsResult = useQuery(api.secrets.listAllOrgSecrets, {
    orgId: organization._id,
  });
  const rotateKeyMutation = useMutation(api.keys.rotateOrgKey);
  const registerKeyMutation = useMutation(api.keys.registerKey);

  const [rotateConfirmOpen, setRotateConfirmOpen] = useState(false);
  const [rotateError, setRotateError] = useState("");
  const [rotatePending, startRotateTransition] = useTransition();
  const [rotateSuccess, setRotateSuccess] = useState(false);

  const activeKeys =
    activeKeysResult && isSuccess(activeKeysResult)
      ? activeKeysResult.data
      : [];
  const allSecrets =
    allSecretsResult && isSuccess(allSecretsResult)
      ? allSecretsResult.data
      : [];

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

  const handleRotateKey = () => {
    setRotateError("");
    setRotateSuccess(false);
    startRotateTransition(async () => {
      try {
        if (!orgKey) {
          setRotateError("Your encryption key is not available.");
          return;
        }

        const newOrgKey = await generateOrgKey();

        const wrappedKeys = await Promise.all(
          activeKeys.map(async (mk) => {
            const publicKeyJwk = JSON.parse(mk.publicKey) as JsonWebKey;
            const wrappedOrgKey = await wrapOrgKey(newOrgKey, publicKeyJwk);
            return { keyId: mk._id, wrappedOrgKey };
          }),
        );
        const reEncryptedSecrets = await Promise.all(
          allSecrets.map(async (s) => {
            const plaintext = await decryptSecret(s.encryptedValue, orgKey);
            const newCiphertext = await encryptSecret(plaintext, newOrgKey);
            return {
              secretId: s.secretId as import("conv/_generated/dataModel").Id<"secrets">,
              encryptedValue: newCiphertext,
            };
          }),
        );
        const result = await rotateKeyMutation({
          orgId: organization._id,
          wrappedKeys,
          reEncryptedSecrets,
        });

        if (isFailure(result)) {
          setRotateError(result.error);
          return;
        }

        setRotateSuccess(true);
        setRotateConfirmOpen(false);
        setTimeout(() => setRotateSuccess(false), 3000);
      } catch {
        setRotateError("Key rotation failed. Please try again.");
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
              <h2 className="text-sm font-medium">Encryption</h2>
              <p className="text-xs text-muted-foreground mt-1">
                Manage your organization's encryption key. Rotating the key will
                generate a new encryption key, re-encrypt all secrets, and
                re-wrap the key for all active members.
              </p>
            </div>
            <div className="rounded-lg border p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted shrink-0">
                  <KeyRound className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Rotate Encryption Key</p>
                  <p className="text-xs text-muted-foreground">
                    {activeKeys.length} active member{activeKeys.length !== 1 ? "s" : ""}
                    {" · "}
                    {allSecrets.length} secret{allSecrets.length !== 1 ? "s" : ""} to re-encrypt
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRotateConfirmOpen(true)}
                disabled={
                  keyStatus !== "ready" ||
                  rotatePending
                }
              >
                {rotatePending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Rotating...
                  </>
                ) : rotateSuccess ? (
                  <>
                    <Check />
                    Rotated
                  </>
                ) : (
                  <>
                    <RefreshCw />
                    Rotate Key
                  </>
                )}
              </Button>
            </div>
            {rotateError && (
              <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                {rotateError}
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
      <Dialog open={rotateConfirmOpen} onOpenChange={setRotateConfirmOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rotate Encryption Key</DialogTitle>
            <DialogDescription>
              This will generate a new encryption key, re-encrypt all{" "}
              <span className="font-medium text-foreground">
                {allSecrets.length}
              </span>{" "}
              secret{allSecrets.length !== 1 ? "s" : ""} and update keys for{" "}
              <span className="font-medium text-foreground">
                {activeKeys.length}
              </span>{" "}
              member{activeKeys.length !== 1 ? "s" : ""}. This may take a moment.
            </DialogDescription>
          </DialogHeader>

          {rotateError && (
            <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
              {rotateError}
            </p>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRotateConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleRotateKey} disabled={rotatePending}>
              {rotatePending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Rotating...
                </>
              ) : (
                <>
                  <RefreshCw />
                  Confirm Rotation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
