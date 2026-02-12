"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess, isFailure } from "conv/types";
import type { Doc } from "conv/_generated/dataModel";
import { useState, useTransition } from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "~/components/ui/empty";
import { SidebarTrigger } from "~/components/ui/sidebar";
import {
  Monitor,
  Check,
  Loader2,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  Clock,
} from "lucide-react";
import { isCurrentDeviceSession } from "~/lib/crypto";
import { useOrgKey } from "~/hooks/use-org-key";
import { wrapOrgKey } from "~/lib/crypto";

interface Props {
  organization: Doc<"organizations">;
}

export default function SessionsContent({ organization }: Props) {
  const sessionsResult = useQuery(api.keys.listMySessions, {
    orgId: organization._id,
  });
  const { orgKey } = useOrgKey(organization._id);

  const sessions =
    sessionsResult && isSuccess(sessionsResult) ? sessionsResult.data : null;
  const sessionsError =
    sessionsResult && isFailure(sessionsResult) ? sessionsResult.error : "";

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 px-6 py-4">
        <SidebarTrigger className="-ml-1" />
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Manage your device sessions for {organization.name}.
          </p>
        </div>
      </div>

      <Separator />

      <div className="flex-1 p-6 space-y-4">
        {sessionsError ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
            <p className="text-sm text-red-400">{sessionsError}</p>
          </div>
        ) : sessions === null ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-18 rounded-lg border animate-pulse bg-muted/30"
              />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <Empty className="min-h-[40vh]">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Monitor />
              </EmptyMedia>
              <EmptyTitle>No sessions</EmptyTitle>
              <EmptyDescription>
                No device sessions registered for this organization yet.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-2">
            {sessions.map((session) => (
              <SessionRow
                key={session._id}
                session={session}
                orgKey={orgKey}
                orgId={organization._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionRow({
  session,
  orgKey,
  orgId,
}: {
  session: Doc<"memberKeys">;
  orgKey: string | null;
  orgId: Doc<"organizations">["_id"];
}) {
  const approveMutation = useMutation(api.keys.approveMySession);
  const revokeMutation = useMutation(api.keys.revokeMySession);
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"approve" | "revoke" | null>(
    null,
  );
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [error, setError] = useState("");

  const isThisDevice = isCurrentDeviceSession(orgId, session.publicKey);
  const isActive = session.status === "active";
  const isPendingApproval = session.status === "pending";
  const isRevoked = session.status === "revoked";

  const browser = session.deviceInfo?.browser ?? "Unknown browser";
  const os = session.deviceInfo?.os ?? "Unknown OS";
  const deviceLabel = `${browser} · ${os}`;

  const createdAt = session.createdAt
    ? new Date(session.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  const handleApprove = () => {
    setError("");
    setActionType("approve");
    startTransition(async () => {
      try {
        if (!orgKey) {
          setError("Your encryption key is not available. Try refreshing.");
          return;
        }

        const publicKeyJwk = JSON.parse(session.publicKey) as JsonWebKey;
        const wrappedKey = await wrapOrgKey(orgKey, publicKeyJwk);

        const result = await approveMutation({
          keyId: session._id,
          wrappedOrgKey: wrappedKey,
        });

        if (isFailure(result)) {
          setError(result.error);
        }
      } catch {
        setError("Something went wrong during approval.");
      } finally {
        setActionType(null);
      }
    });
  };

  const handleRevoke = () => {
    setError("");
    setActionType("revoke");
    startTransition(async () => {
      try {
        const result = await revokeMutation({ keyId: session._id });
        if (isFailure(result)) {
          setError(result.error);
        } else {
          setConfirmRevoke(false);
        }
      } catch {
        setError("Something went wrong.");
      } finally {
        setActionType(null);
      }
    });
  };

  return (
    <>
      <div
        className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
          isRevoked ? "opacity-50" : ""
        } ${isPendingApproval ? "border-amber-500/20 bg-amber-500/5" : ""}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`flex size-9 items-center justify-center rounded-full ${
              isActive
                ? "bg-emerald-500/10"
                : isPendingApproval
                  ? "bg-amber-500/10"
                  : "bg-muted"
            }`}
          >
            <Monitor
              className={`size-4 ${
                isActive
                  ? "text-emerald-400"
                  : isPendingApproval
                    ? "text-amber-400"
                    : "text-muted-foreground"
              }`}
            />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium truncate">{deviceLabel}</p>
              {isThisDevice && isActive && (
                <Badge className="gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-1.5 py-0">
                  This device
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              Registered {createdAt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Badge
            variant={isRevoked ? "destructive" : "secondary"}
            className="gap-1 text-xs capitalize"
          >
            {isActive ? (
              <ShieldCheck className="size-3" />
            ) : isPendingApproval ? (
              <Clock className="size-3" />
            ) : (
              <ShieldAlert className="size-3" />
            )}
            {session.status}
          </Badge>

          {isPendingApproval && orgKey && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleApprove}
              disabled={isPending}
            >
              {isPending && actionType === "approve" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check />
                  Approve
                </>
              )}
            </Button>
          )}

          {!isRevoked && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setError("");
                setConfirmRevoke(true);
              }}
              disabled={isPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>

      {error && (
        <p className="px-4 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}

      <Dialog open={confirmRevoke} onOpenChange={setConfirmRevoke}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Revoke Session</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the session for{" "}
              <span className="font-medium text-foreground">{deviceLabel}</span>
              ? That device will no longer be able to decrypt secrets.
              {isThisDevice && isActive && (
                <span className="block mt-2 text-amber-400">
                  ⚠️ This is your current device. Revoking it will lock you out
                  on this browser.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRevoke(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRevoke}
              disabled={isPending}
            >
              {isPending && actionType === "revoke" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <Trash2 />
                  Revoke
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
