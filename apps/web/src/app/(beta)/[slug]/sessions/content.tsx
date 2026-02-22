"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@beakcrypt/convex";
import { isSuccess, isFailure } from "@beakcrypt/shared";
import type { Doc, Id } from "@beakcrypt/convex/dataModel";
import { useState, useEffect, useTransition, useCallback, useRef } from "react";
import { Button } from "@beakcrypt/ui/components/button";
import { Badge } from "@beakcrypt/ui/components/badge";
import { Separator } from "@beakcrypt/ui/components/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@beakcrypt/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@beakcrypt/ui/components/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@beakcrypt/ui/components/empty";
import { SidebarTrigger } from "@beakcrypt/ui/components/sidebar";
import {
  Monitor,
  Check,
  Loader2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  LogOut,
  KeyRound,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { useOrgKey } from "~/hooks/use-org-key";
import { wrapOrgKey, removeKeyPair, removeKeyId } from "~/lib/crypto";
import { authClient, useSession } from "~/lib/auth-client";
import type { Session } from "~/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";

interface Props {
  organization: Doc<"organizations">;
}

interface UnifiedSession {
  authSession: Session["session"] | null;
  memberKey: Doc<"memberKeys"> | null;
  isCurrentSession: boolean;
}

type RevokeAction = "key" | "session" | "both";

function parseUserAgent(ua: string | null | undefined): {
  browser: string;
  os: string;
} {
  if (!ua) return { browser: "Unknown browser", os: "Unknown OS" };

  let browser = "Unknown browser";
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";

  let os = "Unknown OS";
  if (ua.includes("Mac OS")) os = "macOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";

  return { browser, os };
}

function buildUnifiedSessions(
  authSessions: Session["session"][],
  memberKeys: Doc<"memberKeys">[],
  currentSessionToken: string | undefined,
): UnifiedSession[] {
  const keysByToken = new Map<string, Doc<"memberKeys">>();

  for (const key of memberKeys) {
    keysByToken.set(key.sessionToken, key);
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
    if (matchedTokens.has(key.sessionToken)) continue;

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
  const [authSessions, setAuthSessions] = useState<Session["session"][] | null>(
    null,
  );
  const [authError, setAuthError] = useState("");

  const fetchSessions = useCallback(async () => {
    try {
      const result = await authClient.listSessions();
      if (result.data) {
        setAuthSessions(result.data);
      }
    } catch {
      setAuthError("Failed to load login sessions.");
    }
  }, []);

  const memberKeys =
    sessionsResult && isSuccess(sessionsResult) ? sessionsResult.data : null;
  const keysError =
    sessionsResult && isFailure(sessionsResult) ? sessionsResult.error : "";

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, memberKeys]);

  const currentSessionToken = sessionData?.session?.token;
  const loading = memberKeys === null || authSessions === null;
  const error = authError || keysError;

  const searchParams = useSearchParams();
  const router = useRouter();
  const approveSessionId = searchParams.get("approveSession");
  const approveSessionResult = useQuery(
    api.keys.getKeyById,
    approveSessionId ? { keyId: approveSessionId as Id<"memberKeys"> } : "skip",
  );
  const approveSessionMutation = useMutation(api.keys.approveMySession);
  const [autoApproveOpen, setAutoApproveOpen] = useState(false);
  const [autoApproveStatus, setAutoApproveStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [autoApproveError, setAutoApproveError] = useState("");
  const autoApproveAttempted = useRef(false);

  useEffect(() => {
    if (approveSessionId) {
      setAutoApproveOpen(true);
    }
  }, [approveSessionId]);

  useEffect(() => {
    if (
      !autoApproveOpen ||
      !approveSessionId ||
      !orgKey ||
      autoApproveAttempted.current
    )
      return;
    if (approveSessionResult === undefined) return;

    if (isFailure(approveSessionResult)) {
      setAutoApproveError(approveSessionResult.error);
      setAutoApproveStatus("error");
      return;
    }

    const key = approveSessionResult.data;
    if (key.status !== "pending") {
      setAutoApproveStatus("success");
      return;
    }

    autoApproveAttempted.current = true;

    (async () => {
      try {
        const publicKeyJwk = JSON.parse(key.publicKey) as JsonWebKey;
        const wrappedKey = await wrapOrgKey(orgKey, publicKeyJwk);
        const result = await approveSessionMutation({
          keyId: key._id,
          wrappedOrgKey: wrappedKey,
        });
        if (isFailure(result)) {
          setAutoApproveError(result.error);
          setAutoApproveStatus("error");
        } else {
          setAutoApproveStatus("success");
          await fetchSessions();
        }
      } catch {
        setAutoApproveError("Something went wrong during session approval.");
        setAutoApproveStatus("error");
      }
    })();
  }, [
    autoApproveOpen,
    approveSessionId,
    orgKey,
    approveSessionResult,
    approveSessionMutation,
    fetchSessions,
  ]);

  const handleAutoApproveClose = useCallback(() => {
    setAutoApproveOpen(false);
    autoApproveAttempted.current = false;
    setAutoApproveStatus("loading");
    setAutoApproveError("");
    const params = new URLSearchParams(window.location.search);
    params.delete("approveSession");
    const newPath = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    router.replace(newPath);
  }, [router]);

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

      <Dialog
        open={autoApproveOpen}
        onOpenChange={(open) => {
          if (!open) handleAutoApproveClose();
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {autoApproveStatus === "success"
                ? "Session Approved"
                : autoApproveStatus === "error"
                  ? "Approval Failed"
                  : "Approving Session..."}
            </DialogTitle>
            <DialogDescription>
              {autoApproveStatus === "success"
                ? "The new device session has been approved successfully. It can now access shared secrets."
                : autoApproveStatus === "error"
                  ? autoApproveError || "An unknown error occurred."
                  : "Decrypting org key and encrypting for the new device..."}
            </DialogDescription>
          </DialogHeader>
          {autoApproveStatus === "loading" && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          )}
          {autoApproveStatus === "success" && (
            <div className="flex items-center justify-center py-4">
              <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
                <Check className="size-6 text-emerald-400" />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleAutoApproveClose}>
              {autoApproveStatus === "loading" ? "Cancel" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SessionRow({
  unified,
  orgKey,
  orgId,
  onRefreshSessions,
}: {
  unified: UnifiedSession;
  orgKey: string | null;
  orgId: Doc<"organizations">["_id"];
  onRefreshSessions: () => Promise<void>;
}) {
  const approveMutation = useMutation(api.keys.approveMySession);
  const revokeKeyMutation = useMutation(api.keys.revokeMyKey);
  const revokeAuthMutation = useMutation(api.keys.revokeMyAuthSession);
  const revokeSessionAndKeyMutation = useMutation(
    api.keys.revokeMySessionAndKey,
  );
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionType, setActionType] = useState<"approve" | "revoke" | null>(
    null,
  );
  const [confirmRevoke, setConfirmRevoke] = useState<RevokeAction | null>(null);
  const [error, setError] = useState("");

  const { authSession, memberKey, isCurrentSession } = unified;

  const keyStatus = memberKey?.status ?? null;
  const isActive = keyStatus === "active";
  const isPendingApproval = keyStatus === "pending";
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

  const handleRevoke = (action: RevokeAction) => {
    setError("");
    setActionType("revoke");
    startTransition(async () => {
      try {
        let result;
        const willLogOut =
          isCurrentSession && (action === "session" || action === "both");

        if (action === "key" && memberKey) {
          result = await revokeKeyMutation({ keyId: memberKey._id });
        } else if (action === "session" && authSession) {
          result = await revokeAuthMutation({
            sessionToken: authSession.token,
          });
        } else if (action === "both" && memberKey) {
          result = await revokeSessionAndKeyMutation({ keyId: memberKey._id });
        }

        if (result && isFailure(result)) {
          setError(result.error);
          return;
        }

        if (isCurrentSession) {
          removeKeyPair(orgId);
          removeKeyId(orgId);
        }

        setConfirmRevoke(null);

        if (willLogOut) {
          router.push("/auth");
          return;
        }

        await onRefreshSessions();
      } catch {
        setError("Something went wrong.");
      } finally {
        setActionType(null);
      }
    });
  };

  const revokeDialogTitle =
    confirmRevoke === "key"
      ? "Revoke Encryption Key"
      : confirmRevoke === "session"
        ? "Revoke Login Session"
        : "Revoke Session & Key";

  const revokeDialogDescription =
    confirmRevoke === "key"
      ? "This will remove the encryption key for this device. The device will remain logged in but will no longer be able to view encrypted secrets."
      : confirmRevoke === "session"
        ? "This will log out the device. The encryption key record will remain but will become orphaned."
        : "This will log out the device and remove its encryption key. The device will lose all access.";

  const willLogOut = isCurrentSession && confirmRevoke !== "key";

  const hasKey = !!memberKey;
  const hasSession = !!authSession;
  const canRevokeKey = hasKey;
  const canRevokeSession = hasSession;
  const canRevokeBoth = hasKey && hasSession;

  return (
    <>
      <div
        className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
          isOrphanedKey ? "opacity-50" : ""
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
              {isCurrentSession && (
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
              variant="secondary"
              className={`gap-1 text-xs capitalize ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : ""
              }`}
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

          {(canRevokeKey || canRevokeSession) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="size-8 p-0"
                  disabled={isPending}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canRevokeKey && (
                  <DropdownMenuItem
                    onClick={() => {
                      setError("");
                      setConfirmRevoke("key");
                    }}
                  >
                    <KeyRound className="size-4" />
                    Revoke encryption key
                  </DropdownMenuItem>
                )}
                {canRevokeSession && (
                  <DropdownMenuItem
                    onClick={() => {
                      setError("");
                      setConfirmRevoke("session");
                    }}
                  >
                    <LogOut className="size-4" />
                    Revoke login session
                  </DropdownMenuItem>
                )}
                {canRevokeBoth && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      onClick={() => {
                        setError("");
                        setConfirmRevoke("both");
                      }}
                    >
                      <Trash2 className="size-4" />
                      Revoke both
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {error && !confirmRevoke && (
        <p className="px-4 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}

      <Dialog
        open={confirmRevoke !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmRevoke(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{revokeDialogTitle}</DialogTitle>
            <DialogDescription>
              {revokeDialogDescription}
              {willLogOut && (
                <span className="block mt-2 text-amber-400">
                  ⚠️ This is your current device. You will be logged out
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
            <Button variant="outline" onClick={() => setConfirmRevoke(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmRevoke && handleRevoke(confirmRevoke)}
              disabled={isPending}
            >
              {isPending && actionType === "revoke" ? (
                <>
                  <Loader2 className="animate-spin" />
                  Revoking...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
