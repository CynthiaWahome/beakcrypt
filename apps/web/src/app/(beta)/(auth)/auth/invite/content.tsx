"use client";

import { api } from "@beakcrypt/convex";
import { isSuccess } from "@beakcrypt/shared";
import { Button } from "@beakcrypt/ui/components/button";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@beakcrypt/ui/components/card";
import Link from "next/link";
import { useState, useTransition } from "react";
import { authClient, useSession, signOut } from "~/lib/auth-client";
import { Separator } from "@beakcrypt/ui/components/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@beakcrypt/ui/components/avatar";
import {
  Loader2,
  Check,
  X,
  ShieldCheck,
  Mail,
  ShieldAlert,
} from "lucide-react";
import { Preloaded, usePreloadedQuery } from "convex/react";
import AppLoader from "~/components/loader";
import { getInitials } from "~/lib/utils";
import { generateKeyPair, storeKeyPair, storeKeyId } from "~/lib/crypto";

interface InviteContentProps {
  preloadedInvite: Preloaded<typeof api.invites.getInvite>;
  token: string;
}

export default function InviteContent({
  preloadedInvite,
  token,
}: InviteContentProps) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = useSession();

  const inviteResult = usePreloadedQuery(preloadedInvite);
  const invite = isSuccess(inviteResult) ? inviteResult.data.invite : null;
  const organization = isSuccess(inviteResult)
    ? inviteResult.data.organization
    : null;
  const acceptMutation = useMutation(api.invites.accept);
  const declineMutation = useMutation(api.invites.decline);
  const registerKeyMutation = useMutation(api.keys.registerKey);

  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"accept" | "decline" | null>(
    null,
  );
  const [accepted, setAccepted] = useState(false);

  const [isSignOutPending, setIsSignOutPending] = useState(false);

  if (isSessionPending) {
    return <AppLoader />;
  }

  if (session?.user?.email && invite && invite.email !== session.user.email) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-center p-4">
        <div className="rounded-full bg-zinc-900 p-3 mb-4">
          <ShieldAlert className="h-6 w-6 text-red-500" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">
          Wrong Email Address
        </h1>
        <p className="text-zinc-400 mb-8 max-w-md">
          This invite was sent to{" "}
          <span className="text-white">{invite.email}</span>,
          <br />
          but you are signed in as{" "}
          <span className="text-white">{session.user.email}</span>.
        </p>
        <Button
          variant="secondary"
          disabled={isSignOutPending}
          onClick={async () => {
            setIsSignOutPending(true);
            await signOut({
              fetchOptions: {
                onSuccess: () => {
                  router.push(
                    `/auth?callbackURL=${encodeURIComponent(`/auth/invite?token=${token}`)}`,
                  );
                },
              },
            });
          }}
        >
          {isSignOutPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Switching...
            </>
          ) : (
            "Switch Account"
          )}
        </Button>
      </div>
    );
  }

  if (accepted) {
    return <AppLoader />;
  }

  if (!invite || !organization) {
    if (actionType === "accept" && isPending) {
      return <AppLoader />;
    }
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-black text-center p-4">
        <div className="rounded-full bg-zinc-900 p-3 mb-4">
          <X className="h-6 w-6 text-red-500" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">
          Invite No Longer Available
        </h1>
        <p className="text-zinc-400 max-w-xs mb-8">
          This invite may have expired, been revoked, or is no longer valid.
        </p>
        <Button asChild variant="secondary">
          <Link href="/">Return Home</Link>
        </Button>
      </div>
    );
  }

  const handleAccept = () => {
    setActionType("accept");
    startTransition(async () => {
      try {
        const result = await acceptMutation({ token });
        if (isSuccess(result)) {
          try {
            const keyPair = await generateKeyPair();
            const { data: sessionData } = await authClient.getSession();
            const sessionToken = sessionData?.session?.token;
            if (!sessionToken) throw new Error("No session token");

            const keyResult = await registerKeyMutation({
              orgId: result.data._id,
              publicKey: JSON.stringify(keyPair.publicKey),
              sessionToken,
            });
            storeKeyPair(result.data._id, keyPair);
            if (isSuccess(keyResult)) {
              storeKeyId(result.data._id, keyResult.data._id);
            }
          } catch {
            console.error(
              "Key registration failed, user will need admin approval later",
            );
          }
          router.push(`/${result.data.slug}`);
          setAccepted(true);
        } else {
          console.error("Failed to accept invite:", result.error);
          setActionType(null);
        }
      } catch (error) {
        console.error("Failed to accept invite:", error);
        setActionType(null);
      }
    });
  };

  const handleDecline = () => {
    setActionType("decline");
    startTransition(async () => {
      try {
        const result = await declineMutation({ token });
        if (isSuccess(result)) {
          router.push("/");
        } else {
          console.error("Failed to decline invite:", result.error);
          setActionType(null);
        }
      } catch (error) {
        console.error("Failed to decline invite:", error);
        setActionType(null);
      }
    });
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-black/95">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black pointer-events-none" />
      <Link href="/" className="flex items-center gap-2.5 mb-8">
        <div className="flex h-7 w-7 items-center justify-center border border-[#5eead4]/50">
          <div className="h-2 w-2 rotate-45 bg-[#5eead4]" />
        </div>
        <span className="text-sm font-medium tracking-tight">beakcrypt</span>
      </Link>

      <Card className="w-full max-w-md border-zinc-800 bg-zinc-950/50 backdrop-blur-xl">
        <CardHeader className="text-center flex flex-col items-center">
          <Avatar>
            <AvatarImage src={organization.avatar} />
            <AvatarFallback>{getInitials(organization.name)}</AvatarFallback>
          </Avatar>
          <CardTitle className="text-2xl">Join Organization</CardTitle>
          <CardDescription>
            You have been invited to join the{" "}
            <span className="text-white font-medium capitalize">
              {organization.name}
            </span>{" "}
            organization.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <ShieldCheck className="h-4 w-4" />
                <span>Role</span>
              </div>
              <span className="text-sm font-medium text-zinc-200 capitalize">
                {invite.role}
              </span>
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Mail className="h-4 w-4" />
                <span>Email</span>
              </div>
              <span className="text-sm font-medium text-zinc-200 truncate">
                {invite.email}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className="w-full"
              disabled={isPending}
              variant="destructive"
              onClick={handleDecline}
            >
              {isPending && actionType === "decline" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <X />
              )}
              Decline Invitation
            </Button>
            <Button
              className="w-full"
              disabled={isPending}
              onClick={handleAccept}
            >
              {isPending && actionType === "accept" ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Check />
              )}
              Accept Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 text-center px-4">
        <p className="text-zinc-600 text-xs">
          By joining, you agree to our{" "}
          <Link
            href="/terms"
            className="underline underline-offset-2 hover:text-zinc-400"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="underline underline-offset-2 hover:text-zinc-400"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
