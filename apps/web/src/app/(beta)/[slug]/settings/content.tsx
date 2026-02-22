"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@beakcrypt/convex";
import { isFailure, isSuccess } from "@beakcrypt/shared";
import type { Doc, Id } from "@beakcrypt/convex/dataModel";
import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  AlertTriangle,
  KeyRound,
  RefreshCw,
  X,
} from "lucide-react";
import { SidebarTrigger } from "@beakcrypt/ui/components/sidebar";
import { Button } from "@beakcrypt/ui/components/button";
import { Input } from "@beakcrypt/ui/components/input";
import { Separator } from "@beakcrypt/ui/components/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@beakcrypt/ui/components/dialog";
import { useOrgKey } from "~/hooks/use-org-key";
import {
  generateOrgKey,
  wrapOrgKey,
  decryptSecret,
  encryptSecret,
} from "~/lib/crypto";
import {
  InputGroup,
  InputGroupText,
  InputGroupAddon,
  InputGroupInput,
} from "@beakcrypt/ui/components/input-group";
import { validateSlug } from "shared/reserved-slugs";
import { Spinner } from "@beakcrypt/ui/components/spinner";

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
  const [debouncedSlug, setDebouncedSlug] = useState(slug);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSlug(slug), 500);
    return () => clearTimeout(handler);
  }, [slug]);

  const shouldValidateSlug =
    debouncedSlug.length > 0 && debouncedSlug !== organization.slug;
  const slugValidation = shouldValidateSlug
    ? validateSlug(debouncedSlug)
    : { valid: false, error: null };
  const isSlugInvalid = shouldValidateSlug && !slugValidation.valid;
  const slugValidationError = isSlugInvalid ? slugValidation.error : null;

  const isSlugTakenQuery = useQuery(
    api.organizations.checkSlug,
    slugValidation.valid && shouldValidateSlug
      ? { slug: debouncedSlug }
      : "skip",
  );

  const isSlugCheckLoading =
    slugValidation.valid &&
    shouldValidateSlug &&
    isSlugTakenQuery === undefined;
  const isSlugTakenResult =
    isSlugTakenQuery && isSuccess(isSlugTakenQuery)
      ? isSlugTakenQuery.data
      : undefined;
  const isSlugTaken =
    shouldValidateSlug && (isSlugInvalid || isSlugTakenResult === true);

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
        router.push(`/${result.data.slug}/settings`);
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

        if (
          !activeKeysResult ||
          !isSuccess(activeKeysResult) ||
          !allSecretsResult ||
          !isSuccess(allSecretsResult)
        ) {
          setRotateError("Data is still loading. Please try again.");
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
              secretId: s.secretId as Id<"secrets">,
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText className="text-muted-foreground">
                    beakcrypt.com/
                  </InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                    )
                  }
                  className="pl-px!"
                />
                <InputGroupAddon align="inline-end">
                  {slugChanged && slug.length > 0 && (
                    <>
                      {isSlugCheckLoading ? (
                        <Spinner />
                      ) : isSlugInvalid || isSlugTaken === true ? (
                        <X className="w-4 h-4 text-red-500" />
                      ) : slugValidation.valid &&
                        isSlugTakenResult === false ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : null}
                    </>
                  )}
                </InputGroupAddon>
              </InputGroup>
              <Button
                size="sm"
                onClick={() => setSlugConfirmOpen(true)}
                disabled={
                  slugPending ||
                  !slugChanged ||
                  !slug.trim() ||
                  slug !== debouncedSlug ||
                  isSlugCheckLoading ||
                  isSlugTaken === true ||
                  isSlugInvalid
                }
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
            {(slugError ||
              (slugChanged && isSlugTaken === true) ||
              (slugChanged && isSlugInvalid)) && (
              <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                {slugError ||
                  (isSlugTakenResult === true
                    ? "This URL is already taken"
                    : slugValidationError)}
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
            <div className="rounded-lg border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 items-center justify-center rounded-full bg-muted shrink-0">
                  <KeyRound className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium">Rotate Encryption Key</p>
                  <p className="text-xs text-muted-foreground">
                    {activeKeys.length} active member
                    {activeKeys.length !== 1 ? "s" : ""}
                    {" · "}
                    {allSecrets.length} secret
                    {allSecrets.length !== 1 ? "s" : ""} to re-encrypt
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRotateConfirmOpen(true)}
                disabled={
                  keyStatus !== "ready" ||
                  rotatePending ||
                  !activeKeysResult ||
                  !isSuccess(activeKeysResult) ||
                  !allSecretsResult ||
                  !isSuccess(allSecretsResult)
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
            <div className="rounded-lg border border-destructive/20 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
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
              member{activeKeys.length !== 1 ? "s" : ""}. This may take a
              moment.
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
