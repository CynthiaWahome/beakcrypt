import Link from "next/link";
import { X } from "lucide-react";
import InviteContent from "./content";
import { redirect } from "next/navigation";
import { api } from "conv/_generated/api";
import { Button } from "~/components/ui/button";
import { preloadedQueryResult } from "convex/nextjs";
import { isAuthenticated, preloadAuthQuery } from "~/lib/auth-server";

function InvitePageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-center p-4">
      {children}
    </div>
  );
}

function InvalidTokenState() {
  return (
    <InvitePageShell>
      <div className="rounded-full bg-zinc-900 p-3 mb-4">
        <X className="h-6 w-6 text-red-500" />
      </div>
      <h1 className="text-xl font-semibold text-white mb-2">
        Invalid Invite Link
      </h1>
      <p className="text-zinc-400 mb-8">
        The invite link you used is invalid or malformed.
        <br />
        Please check the URL and try again.
      </p>
      <Button asChild variant="secondary">
        <Link href="/">Return Home</Link>
      </Button>
    </InvitePageShell>
  );
}

function InviteNotFoundState() {
  return (
    <InvitePageShell>
      <div className="rounded-full bg-zinc-900 p-3 mb-4">
        <X className="h-6 w-6 text-red-500" />
      </div>
      <h1 className="text-xl font-semibold text-white mb-2">
        Invite Not Found
      </h1>
      <p className="text-zinc-400 max-w-xs mb-8">
        This invite may have expired, been revoked, or does not exist.
      </p>
      <Button asChild variant="secondary">
        <Link href="/">Return Home</Link>
      </Button>
    </InvitePageShell>
  );
}

export default async function InviteHandler({
  searchParamsPromise,
}: {
  searchParamsPromise: Promise<{ token?: string }>;
}) {
  const { token } = await searchParamsPromise;

  if (!token) {
    return <InvalidTokenState />;
  }

  const authenticated = await isAuthenticated();
  if (!authenticated) {
    const callbackUrl = `/auth/invite?token=${token}`;
    redirect(`/auth?callbackURL=${encodeURIComponent(callbackUrl)}`);
  }

  const preloadedInvite = await preloadAuthQuery(api.invites.getInvite, {
    token,
  });

  const invite = preloadedQueryResult(preloadedInvite);

  if (invite === null) {
    return <InviteNotFoundState />;
  }

  return <InviteContent preloadedInvite={preloadedInvite} token={token} />;
}
