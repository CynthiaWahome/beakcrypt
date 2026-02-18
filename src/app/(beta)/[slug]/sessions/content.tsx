"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess, isFailure } from "conv/types";
import type { Doc } from "conv/_generated/dataModel";
import { useState, useEffect, useTransition } from "react";
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
  LogOut,
} from "lucide-react";
import { useOrgKey } from "~/hooks/use-org-key";
import { wrapOrgKey, getKeyPair } from "~/lib/crypto";
import { authClient, useSession } from "~/lib/auth-client";
import { useRouter } from "next/navigation";

interface Props {
  organization: Doc<"organizations">;
}

interface AuthSession {
  id: string;
  token: string;
  userId: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date | string;
  expiresAt: Date | string;
}

interface UnifiedSession {
  authSession: AuthSession | null;
  memberKey: Doc<"memberKeys"> | null;
  isCurrentSession: boolean;
}

function parseUserAgent(ua: string | null | undefined): {
  browser: string;
  os: string;
} {
  if (!ua) return { browser: "Unknown browser", os: "Unknown OS" };

  let browser = "Unknown browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  let os = "Unknown OS";
  if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { browser, os };
}

function buildUnifiedSessions(
  authSessions: AuthSession[],
  memberKeys: Doc<"memberKeys">[],
  currentSessionToken: string | undefined,
): UnifiedSession[] {
  const keysByToken = new Map<string, Doc<"memberKeys">>();
  const unmatchedKeys: Doc<"memberKeys">[] = [];

  for (const key of memberKeys) {
    if (key.sessionToken) {
      keysByToken.set(key.sessionToken, key);
    } else {
      unmatchedKeys.push(key);
    }
  }

  const unified: UnifiedSession[] = [];
  const matchedTokens = new Set<string>();

  for (const session of authSessions) {
    const key = keysByToken.get(session.token);
    if (key) matchedTokens.add(session.token);

    unified.push({
      authSession: session,
      memberKey: key ?? null,
      isCurrentSession: session.token === currentSessionToken,
    });
  }

  for (const key of memberKeys) {
    const isMatched = key.sessionToken && matchedTokens.has(key.sessionToken);
    if (!isMatched && !unmatchedKeys.includes(key)) {
      unified.push({
        authSession: null,
        memberKey: key,
        isCurrentSession: false,
      });
    }
  }

  for (const key of unmatchedKeys) {
    unified.push({
      authSession: null,
      memberKey: key,
      isCurrentSession: false,
    });
  }

  unified.sort((a, b) => {
    if (a.isCurrentSession) return -1;
    if (b.isCurrentSession) return 1;
    const dateA = a.authSession?.createdAt
      ? new Date(a.authSession.createdAt).getTime()
      : (a.memberKey?.createdAt ?? 0);
    const dateB = b.authSession?.createdAt
      ? new Date(b.authSession.createdAt).getTime()
      : (b.memberKey?.createdAt ?? 0);
    return dateB - dateA;
  });

  return unified;
}

export default function SessionsContent({ organization }: Props) {
  const sessionsResult = useQuery(api.keys.listMySessions, {
    orgId: organization._id,
  });
  const { orgKey } = useOrgKey(organization._id);
  const { data: sessionData } = useSession();
  const [authSessions, setAuthSessions] = useState<AuthSession[] | null>(null);
  const [authError, setAuthError] = useState("");

  const fetchSessions = async () => {
    try {
      const result = await authClient.listSessions();
      if (result.data) {
        setAuthSessions(result.data);
      }
    } catch {
      setAuthError("Failed to load login sessions.");
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const memberKeys =
    sessionsResult && isSuccess(sessionsResult) ? sessionsResult.data : null;
  const keysError =
    sessionsResult && isFailure(sessionsResult) ? sessionsResult.error : "";

  const currentSessionToken = sessionData?.session?.token;
  const loading = memberKeys === null || authSessions === null;
  const error = authError || keysError;

  const unified =
    authSessions && memberKeys
      ? buildUnifiedSessions(authSessions, memberKeys, currentSessionToken)
      : null;

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
        {error ? (
          <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        ) : loading ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="h-18 rounded-lg border animate-pulse bg-muted/30"
              />
            ))}
          </div>
        ) : unified && unified.length === 0 ? (
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
            {unified?.map((s, i) => (
              <SessionRow
                key={s.memberKey?._id ?? s.authSession?.id ?? i}
                unified={s}
                orgKey={orgKey}
                orgId={organization._id}
                onRefreshSessions={fetchSessions}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionRow({
  unified,
  orgKey,
  onRefreshSessions,
}: {
  unified: UnifiedSession;
  orgKey: string | null;
  orgId: Doc<"organizations">["_id"];
  onRefreshSessions: () => Promise<void>;
}) {
  const approveMutation = useMutation(api.keys.approveMySession);
  const revokeMutation = useMutation(api.keys.revokeMySession);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"approve" | "revoke" | null>(
    null,
  );
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [error, setError] = useState("");

  const { authSession, memberKey, isCurrentSession } = unified;

  const keyStatus = memberKey?.status ?? null;
  const isActive = keyStatus === "active";
  const isPendingApproval = keyStatus === "pending";
  const isRevoked = keyStatus === "revoked";
  const isOrphanedKey = !authSession && !!memberKey;

  const { browser, os } = parseUserAgent(authSession?.userAgent);
  const deviceLabel = authSession
    ? `${browser} · ${os}`
    : "Unknown device (session expired)";

  const createdAt = authSession?.createdAt
    ? new Date(authSession.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : memberKey?.createdAt
      ? new Date(memberKey.createdAt).toLocaleDateString(undefined, {
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
        if (!orgKey || !memberKey) {
          setError("Your encryption key is not available. Try refreshing.");
          return;
        }

        const publicKeyJwk = JSON.parse(memberKey.publicKey) as JsonWebKey;
        const wrappedKey = await wrapOrgKey(orgKey, publicKeyJwk);

        const result = await approveMutation({
          keyId: memberKey._id,
          wrappedOrgKey: wrappedKey,
        });

        if (isFailure(result)) {
          setError(result.error);
          return;
        }

        await onRefreshSessions();
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
        let result;
        if (memberKey) {
          result = await revokeMutation({ keyId: memberKey._id });
        } else if (authSession) {
          result = await revokeMutation({ sessionToken: authSession.token });
        }

        if (result && isFailure(result)) {
          setError(result.error);
          return;
        }

        setConfirmRevoke(false);
        await onRefreshSessions();

        if (isCurrentSession) {
          router.push("/auth");
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
          isRevoked || isOrphanedKey ? "opacity-50" : ""
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
              {isCurrentSession && isActive && (
                <Badge className="gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 px-1.5 py-0">
                  This device
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" />
              Registered {createdAt}
              {isOrphanedKey && (
                <span className="text-amber-400 ml-1">· Session expired</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {keyStatus && (
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
              {keyStatus}
            </Badge>
          )}

          {!keyStatus && authSession && (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Clock className="size-3" />
              No key
            </Badge>
          )}

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

          {!isRevoked && (authSession || memberKey) && (
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
              {authSession ? <LogOut /> : <Trash2 />}
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
              ? That device will be logged out and lose access to encrypted
              secrets.
              {isCurrentSession && (
                <span className="block mt-2 text-amber-400">
                  ⚠️ This is your current device. Revoking it will log you out
                  immediately.
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
                  <LogOut />
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
