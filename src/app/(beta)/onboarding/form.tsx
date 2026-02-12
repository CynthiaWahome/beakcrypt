"use client";

import {
  X,
  Check,
  Loader2,
  UserPlus,
  Building2,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "~/components/ui/card";
import {
  InputGroup,
  InputGroupText,
  InputGroupAddon,
  InputGroupInput,
} from "~/components/ui/input-group";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess } from "conv/types";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import type { Response } from "~/types/response";
import { Spinner } from "~/components/ui/spinner";
import { Confetti } from "~/components/ui/confetti";
import type { Doc, Id } from "conv/_generated/dataModel";
import { validateSlug } from "shared/reserved-slugs";
import { createOrganization, inviteUser } from "./actions";
import {
  useActionState,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  generateKeyPair,
  generateOrgKey,
  wrapOrgKey,
  storePrivateKey,
} from "~/lib/crypto";
import { getDeviceInfo } from "~/lib/device-info";

const initialOrgState: Response<
  Doc<"organizations">,
  { name: string; slug: string }
> = {
  timestamp: Date.now(),
  error: "",
  inputs: {
    name: "",
    slug: "",
  },
};

const initialInviteState: Response<
  Doc<"invites">,
  { email: string; role: string; orgId: string; orgName: string }
> = {
  timestamp: Date.now(),
  error: "",
  inputs: {
    email: "",
    role: "member",
    orgId: "",
    orgName: "",
  },
};

export default function OnboardingForm() {
  const [orgState, orgAction, orgPending] = useActionState(
    createOrganization,
    initialOrgState,
  );
  const [inviteState, inviteAction, invitePending] = useActionState(
    inviteUser,
    initialInviteState,
  );

  const [showError, setShowError] = useState(false);
  const [lastTimestamp, setLastTimestamp] = useState(0);

  const [name, setName] = useState(orgState.inputs.name || "");
  const [slug, setSlug] = useState(orgState.inputs.slug || "");
  const [debouncedSlug, setDebouncedSlug] = useState(slug);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSlug(slug), 500);
    return () => clearTimeout(handler);
  }, [slug]);

  const shouldValidateSlug = debouncedSlug.length > 0;
  const slugValidation = shouldValidateSlug
    ? validateSlug(debouncedSlug)
    : { valid: false, error: null };
  const isSlugInvalid = shouldValidateSlug && !slugValidation.valid;
  const slugError = isSlugInvalid ? slugValidation.error : null;

  const isSlugTakenQuery = useQuery(
    api.organizations.checkSlug,
    slugValidation.valid ? { slug: debouncedSlug } : "skip",
  );

  const isSlugCheckLoading =
    slugValidation.valid && isSlugTakenQuery === undefined;
  const isSlugTakenResult =
    isSlugTakenQuery && isSuccess(isSlugTakenQuery)
      ? isSlugTakenQuery.data
      : undefined;
  const isSlugTaken =
    shouldValidateSlug && (isSlugInvalid || isSlugTakenResult === true);

  const [isSkipped, setIsSkipped] = useState(false);
  const [keySetupDone, setKeySetupDone] = useState(false);
  const [keySetupError, setKeySetupError] = useState("");
  const [keySetupLoading, setKeySetupLoading] = useState(false);
  const keySetupStarted = useRef(false);
  const registerKeyMutation = useMutation(api.keys.registerKey);

  const isOrgCreated = !!orgState.data?._id;
  const isInviteSent = !!inviteState.data?._id;

  const setupKeys = useCallback(
    async (orgId: Id<"organizations">) => {
      setKeySetupLoading(true);
      setKeySetupError("");

      try {
        const keyPair = await generateKeyPair();
        const orgKey = await generateOrgKey();
        const wrappedKey = await wrapOrgKey(orgKey, keyPair.publicKey);

        const result = await registerKeyMutation({
          orgId,
          publicKey: JSON.stringify(keyPair.publicKey),
          wrappedOrgKey: wrappedKey,
          deviceInfo: getDeviceInfo(),
        });

        if (isSuccess(result)) {
          storePrivateKey(orgId, keyPair.privateKey);
          setKeySetupDone(true);
        } else {
          setKeySetupError("Failed to register encryption key.");
        }
      } catch {
        setKeySetupError("Failed to set up encryption.");
        keySetupStarted.current = false;
      } finally {
        setKeySetupLoading(false);
      }
    },
    [registerKeyMutation],
  );

  useEffect(() => {
    if (!isOrgCreated || keySetupDone || keySetupStarted.current) return;

    keySetupStarted.current = true;
    if (orgState.data?._id) {
      setupKeys(orgState.data._id);
    }
  }, [isOrgCreated, keySetupDone, orgState.data, setupKeys]);

  const activeState = isOrgCreated ? inviteState : orgState;
  const hasError = "error" in activeState && !!activeState.error;

  if (activeState.timestamp !== lastTimestamp) {
    setLastTimestamp(activeState.timestamp);
    if (hasError) {
      setShowError(true);
    }
  }

  useEffect(() => {
    if (showError) {
      const timer = setTimeout(() => setShowError(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showError]);

  if (isInviteSent || isSkipped) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-100 animate-in fade-in zoom-in-95 duration-500">
        <Confetti
          className="pointer-events-none fixed inset-0 z-50 w-full h-full"
          options={{
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
          }}
        />
        <div className="flex flex-col items-center gap-6 text-center max-w-md p-8">
          <div className="rounded-full bg-emerald-500/10 p-6 ring-1 ring-emerald-500/20 backdrop-blur-sm">
            <Check className="w-10 h-10 text-emerald-400" strokeWidth={3} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              You&apos;re all set!
            </h2>
            <p className="text-muted-foreground">
              Your organization{" "}
              <span className="text-white font-medium">
                {orgState.data?.name}
              </span>{" "}
              {isSkipped
                ? "has been created. Invite members later to collaborate!"
                : "has been created and invitations have been sent."}
            </p>
          </div>
          <Button className="mt-4 min-w-50" asChild>
            <Link href={`/${orgState.data?.slug}`}>
              Go to Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 flex items-center justify-center gap-2">
        <div
          className={`h-2 w-16 rounded-full transition-colors duration-300 ${!isOrgCreated ? "bg-[#5eead4]" : "bg-zinc-800"}`}
        />
        <div
          className={`h-2 w-16 rounded-full transition-colors duration-300 ${isOrgCreated ? "bg-[#5eead4]" : "bg-zinc-800"}`}
        />
      </div>

      <Card
        className={`border-zinc-800 bg-zinc-950/50 backdrop-blur-xl transition-all duration-300 ${showError ? "animate-shake ring-1 ring-red-500/50" : ""}`}
      >
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            {!isOrgCreated ? (
              <>
                <Building2 className="w-5 h-5 text-[#5eead4]" />
                Create Organization
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-[#5eead4]" />
                Invite Member
              </>
            )}
          </CardTitle>
          <CardDescription>
            {!isOrgCreated
              ? "Start by setting up your organization's identity."
              : "Add your first org member to start collaborating."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isOrgCreated ? (
            <form action={orgAction} className="flex flex-col gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300"
                >
                  Organization Name *
                </label>
                <Input
                  id="name"
                  name="name"
                  required
                  value={name}
                  minLength={3}
                  maxLength={32}
                  placeholder="Acme Corp"
                  onChange={(e) => setName(e.target.value)}
                  className={
                    hasError
                      ? "border-red-500/50 focus-visible:ring-red-500/20"
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="slug"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300"
                >
                  Organization URL *
                </label>
                <InputGroup>
                  <InputGroupAddon>
                    <InputGroupText className="text-sm text-muted-foreground">
                      beakcrypt.com/
                    </InputGroupText>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="slug"
                    name="slug"
                    required
                    value={slug}
                    minLength={3}
                    maxLength={48}
                    placeholder="acme-corp"
                    onChange={(e) => setSlug(e.target.value)}
                    className="pl-px!"
                  />
                  <InputGroupAddon align="inline-end">
                    {slugValidation.valid && isSlugTakenQuery === undefined ? (
                      <Spinner />
                    ) : isSlugInvalid || isSlugTakenResult === true ? (
                      <X className="w-4 h-4 text-red-500" />
                    ) : slugValidation.valid && isSlugTakenResult === false ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : null}
                  </InputGroupAddon>
                </InputGroup>
                <p
                  className={`text-[0.8rem] ${slugError ? "text-red-400" : "text-zinc-500"}`}
                >
                  {slugError ||
                    (isSlugTakenResult === true
                      ? "This URL is already taken"
                      : "This will be your workspace URL identifier.")}
                </p>
              </div>

              {hasError && (
                <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                  {orgState.error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full mt-2"
                disabled={
                  orgPending ||
                  name.trim().length === 0 ||
                  slug.trim().length === 0 ||
                  isSlugCheckLoading ||
                  isSlugTaken === true
                }
              >
                {orgPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Continue"
                )}
              </Button>
            </form>
          ) : (
            <form
              action={inviteAction}
              className="flex flex-col gap-4 animate-in slide-in-from-right-8 fade-in duration-300"
            >
              <input
                type="hidden"
                name="orgId"
                value={orgState.data?._id || ""}
              />
              <input
                type="hidden"
                name="orgName"
                value={orgState.data?.name || ""}
              />

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-zinc-300"
                >
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="colleague@example.com"
                  required
                  defaultValue={inviteState.inputs.email}
                  className={
                    hasError
                      ? "border-red-500/50 focus-visible:ring-red-500/20"
                      : ""
                  }
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-zinc-300">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="member"
                      className="peer sr-only"
                      defaultChecked={true}
                    />
                    <div className="rounded-md border-2 border-zinc-800 bg-zinc-900/50 p-3 hover:bg-zinc-900 peer-checked:border-blue-500 peer-checked:bg-blue-500/10 transition-all text-center">
                      <span className="text-sm font-medium text-zinc-300 peer-checked:text-blue-400">
                        Member
                      </span>
                    </div>
                  </label>
                  <label className="cursor-pointer">
                    <input
                      type="radio"
                      name="role"
                      value="admin"
                      className="peer sr-only"
                    />
                    <div className="rounded-md border-2 border-zinc-800 bg-zinc-900/50 p-3 hover:bg-zinc-900 peer-checked:border-blue-500 peer-checked:bg-blue-500/10 transition-all text-center">
                      <span className="text-sm font-medium text-zinc-300 peer-checked:text-blue-400">
                        Admin
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {hasError && (
                <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                  {inviteState.error}
                </p>
              )}

              {keySetupError && (
                <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                  {keySetupError}
                </p>
              )}

              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className={`flex-1 ${keySetupError ? "text-red-400 hover:text-red-300 hover:bg-red-500/10" : "text-zinc-400 hover:text-white"}`}
                  onClick={() => {
                    if (keySetupError && orgState.data?._id) {
                      setupKeys(orgState.data._id);
                    } else {
                      setIsSkipped(true);
                    }
                  }}
                  disabled={
                    (!keySetupDone && !keySetupError) || keySetupLoading
                  }
                >
                  {keySetupLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : keySetupError ? (
                    "Retry Setup"
                  ) : (
                    "Skip"
                  )}
                </Button>
                <Button
                  type="submit"
                  className="flex-2"
                  disabled={invitePending || !keySetupDone}
                >
                  {invitePending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : !keySetupDone && !keySetupError ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Setting up security...
                    </>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
