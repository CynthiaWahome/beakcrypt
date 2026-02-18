"use client";

import {
  type Preloaded,
  usePreloadedQuery,
  useMutation,
  useQuery,
} from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess, isFailure } from "conv/types";
import type { Doc, Id } from "conv/_generated/dataModel";
import { useState, useTransition, useRef, useEffect, useCallback } from "react";
import {
  Users,
  Mail,
  Shield,
  ShieldCheck,
  Crown,
  MoreVertical,
  Trash2,
  Loader2,
  X,
  Clock,
  RefreshCw,
  KeyRound,
  Check,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Separator } from "~/components/ui/separator";
import { Badge } from "~/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "~/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "~/components/ui/empty";
import { SidebarTrigger } from "~/components/ui/sidebar";
import { getInitials } from "~/lib/utils";
import { useOrgKey } from "~/hooks/use-org-key";
import { wrapOrgKey } from "~/lib/crypto";
import { useSearchParams, useRouter } from "next/navigation";

type MemberItem = {
  member: Doc<"organizationMembers">;
  user: {
    _id: string;
    name: string;
    email: string;
    image?: string | null;
    [key: string]: unknown;
  } | null;
};

interface Props {
  organization: Doc<"organizations">;
  preloadedMembers: Preloaded<typeof api.members.list>;
  preloadedInvites: Preloaded<typeof api.invites.listByOrg>;
  preloadedMyMembership: Preloaded<typeof api.members.getMyMembership>;
}

export default function TeamsContent({
  organization,
  preloadedMembers,
  preloadedInvites,
  preloadedMyMembership,
}: Props) {
  const membersResult = usePreloadedQuery(preloadedMembers);
  const invitesResult = usePreloadedQuery(preloadedInvites);
  const myMembershipResult = usePreloadedQuery(preloadedMyMembership);

  const membersError = isFailure(membersResult) ? membersResult.error : "";
  const invitesError = isFailure(invitesResult) ? invitesResult.error : "";
  const members = isSuccess(membersResult) ? membersResult.data : [];
  const invites = isSuccess(invitesResult) ? invitesResult.data : [];

  const myMembership = isSuccess(myMembershipResult)
    ? myMembershipResult.data
    : null;
  const isOrgAdmin =
    myMembership?.role === "owner" || myMembership?.role === "admin";

  const pendingKeysResult = useQuery(
    api.keys.listPendingKeys,
    isOrgAdmin ? { orgId: organization._id } : "skip",
  );
  const pendingKeys =
    pendingKeysResult && isSuccess(pendingKeysResult)
      ? pendingKeysResult.data
      : [];

  const { orgKey } = useOrgKey(organization._id);

  const searchParams = useSearchParams();
  const router = useRouter();
  const approveKeyId = searchParams.get("approveKey");
  const approveKeyResult = useQuery(
    api.keys.getKeyById,
    approveKeyId ? { keyId: approveKeyId as Id<"memberKeys"> } : "skip",
  );
  const approveKeyMutation = useMutation(api.keys.approveKey);
  const [autoApproveOpen, setAutoApproveOpen] = useState(false);
  const [autoApproveStatus, setAutoApproveStatus] = useState<
    "loading" | "success" | "error"
  >("loading");
  const [autoApproveError, setAutoApproveError] = useState("");
  const autoApproveAttempted = useRef(false);

  useEffect(() => {
    if (approveKeyId) {
      setAutoApproveOpen(true);
    }
  }, [approveKeyId]);

  useEffect(() => {
    if (
      !autoApproveOpen ||
      !approveKeyId ||
      !orgKey ||
      autoApproveAttempted.current
    )
      return;
    if (approveKeyResult === undefined) return;

    if (isFailure(approveKeyResult)) {
      setAutoApproveError(approveKeyResult.error);
      setAutoApproveStatus("error");
      return;
    }

    const key = approveKeyResult.data;
    if (key.status !== "pending") {
      setAutoApproveStatus("success");
      return;
    }

    autoApproveAttempted.current = true;

    (async () => {
      try {
        const publicKeyJwk = JSON.parse(key.publicKey) as JsonWebKey;
        const wrappedKey = await wrapOrgKey(orgKey, publicKeyJwk);
        const result = await approveKeyMutation({
          keyId: key._id,
          wrappedOrgKey: wrappedKey,
        });
        if (isFailure(result)) {
          setAutoApproveError(result.error);
          setAutoApproveStatus("error");
        } else {
          setAutoApproveStatus("success");
        }
      } catch {
        setAutoApproveError("Something went wrong during key approval.");
        setAutoApproveStatus("error");
      }
    })();
  }, [
    autoApproveOpen,
    approveKeyId,
    orgKey,
    approveKeyResult,
    approveKeyMutation,
  ]);

  const handleAutoApproveClose = useCallback(() => {
    setAutoApproveOpen(false);
    autoApproveAttempted.current = false;
    setAutoApproveStatus("loading");
    setAutoApproveError("");
    const params = new URLSearchParams(window.location.search);
    params.delete("approveKey");
    const newPath = params.toString()
      ? `${window.location.pathname}?${params.toString()}`
      : window.location.pathname;
    router.replace(newPath);
  }, [router]);

  const inviteMutation = useMutation(api.invites.create);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviteError, setInviteError] = useState("");
  const [invitePending, startInviteTransition] = useTransition();

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    setInviteError("");
    startInviteTransition(async () => {
      try {
        const result = await inviteMutation({
          orgId: organization._id,
          email: inviteEmail.trim().toLowerCase(),
          role: inviteRole,
        });
        if (isFailure(result)) {
          setInviteError(result.error);
          return;
        }
        handleInviteClose();
      } catch {
        setInviteError("Something went wrong.");
      }
    });
  };

  const handleInviteClose = () => {
    setInviteOpen(false);
    setInviteEmail("");
    setInviteRole("member");
    setInviteError("");
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="-ml-1" />
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Team</h1>
            <p className="text-sm text-muted-foreground">
              Manage members and invitations for {organization.name}.
            </p>
          </div>
        </div>
        {isOrgAdmin && (
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <Mail />
            Invite Member
          </Button>
        )}
      </div>

      <Separator />

      <div className="flex-1 p-6 space-y-8">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-muted-foreground">
              Members ({members.length})
            </h2>
          </div>

          {membersError ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
              <p className="text-sm text-red-400">{membersError}</p>
            </div>
          ) : members.length === 0 ? (
            <Empty className="min-h-[30vh]">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>No members</EmptyTitle>
                <EmptyDescription>
                  Invite people to join your organization.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="flex flex-col gap-2">
              {members.map((item) => (
                <MemberRow
                  key={item.member._id}
                  item={item}
                  isOwner={item.member.userId === organization.ownerId}
                  canManage={isOrgAdmin}
                  orgId={organization._id}
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-medium text-muted-foreground">
            Invites ({invites.length})
          </h2>

          {invitesError ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
              <p className="text-sm text-red-400">{invitesError}</p>
            </div>
          ) : invites.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed p-8">
              <p className="text-sm text-muted-foreground">
                No invites yet. Use the button above to invite someone.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {invites.map((invite) => (
                <InviteRow
                  key={invite._id}
                  invite={invite}
                  canManage={isOrgAdmin}
                />
              ))}
            </div>
          )}
        </section>

        {isOrgAdmin && pendingKeys.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Pending Key Approvals ({pendingKeys.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              These members have joined but need their encryption key approved
              before they can access secrets.
            </p>
            <div className="flex flex-col gap-2">
              {pendingKeys.map((pk) => (
                <PendingKeyRow
                  key={pk._id}
                  memberKey={pk}
                  orgKey={orgKey}
                  members={members}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      <Dialog open={inviteOpen} onOpenChange={handleInviteClose}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Invite Member</DialogTitle>
            <DialogDescription>
              Send an email invitation to join {organization.name}.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <label
                htmlFor="invite-email"
                className="text-sm font-medium leading-none"
              >
                Email address
              </label>
              <Input
                id="invite-email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleInvite();
                  }
                }}
              />
            </div>

            <div className="space-y-2">
              <span className="text-sm font-medium leading-none">Role</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setInviteRole("member")}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    inviteRole === "member"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  <Shield className="size-3.5" />
                  Member
                </button>
                <button
                  type="button"
                  onClick={() => setInviteRole("admin")}
                  className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors ${
                    inviteRole === "admin"
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border text-muted-foreground hover:bg-accent/50"
                  }`}
                >
                  <ShieldCheck className="size-3.5" />
                  Admin
                </button>
              </div>
            </div>

            {inviteError && (
              <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
                {inviteError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleInviteClose}>
              Cancel
            </Button>
            <Button
              onClick={handleInvite}
              disabled={invitePending || !inviteEmail.trim()}
            >
              {invitePending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail />
                  Send Invite
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                ? "Key Approved"
                : autoApproveStatus === "error"
                  ? "Approval Failed"
                  : "Approving Key..."}
            </DialogTitle>
            <DialogDescription>
              {autoApproveStatus === "success"
                ? "The member's encryption key has been approved successfully. They can now access shared secrets."
                : autoApproveStatus === "error"
                  ? autoApproveError || "An unknown error occurred."
                  : "Decrypting org key and encrypting for the new member..."}
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

function MemberRow({
  item,
  isOwner,
  canManage,
  orgId,
}: {
  item: MemberItem;
  isOwner: boolean;
  canManage: boolean;
  orgId: Id<"organizations">;
}) {
  const { member, user } = item;
  const displayName = user?.name ?? "Unknown";
  const displayEmail = user?.email ?? "";
  const displayImage = user?.image ?? undefined;

  const updateRoleMutation = useMutation(api.members.updateRole);
  const removeMutation = useMutation(api.members.remove);

  const [isPending, startTransition] = useTransition();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [manageKeysOpen, setManageKeysOpen] = useState(false);
  const [error, setError] = useState("");

  const handleRoleChange = (role: "admin" | "member") => {
    startTransition(async () => {
      try {
        const result = await updateRoleMutation({
          memberId: member._id,
          role,
        });
        if (isFailure(result)) {
          setError(result.error);
        }
      } catch {
        setError("Something went wrong.");
      }
    });
  };

  const handleRemove = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await removeMutation({ memberId: member._id });
        if (isFailure(result)) {
          setError(result.error);
          return;
        }
        setConfirmRemove(false);
      } catch {
        setError("Something went wrong.");
      }
    });
  };

  const roleIcon =
    member.role === "owner" ? (
      <Crown className="size-3" />
    ) : member.role === "admin" ? (
      <ShieldCheck className="size-3" />
    ) : (
      <Shield className="size-3" />
    );

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            {displayImage && (
              <AvatarImage src={displayImage} alt={displayName} />
            )}
            <AvatarFallback className="text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">
              {displayEmail}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Badge variant="secondary" className="gap-1 text-xs capitalize">
            {roleIcon}
            {member.role}
          </Badge>
          {!isOwner && canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-xs" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <MoreVertical className="size-3.5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {member.role !== "admin" && (
                  <DropdownMenuItem onClick={() => handleRoleChange("admin")}>
                    <ShieldCheck />
                    Make Admin
                  </DropdownMenuItem>
                )}
                {member.role !== "member" && (
                  <DropdownMenuItem onClick={() => handleRoleChange("member")}>
                    <Shield />
                    Make Member
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setManageKeysOpen(true)}>
                  <KeyRound />
                  Manage Keys
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setConfirmRemove(true)}
                >
                  <Trash2 />
                  Remove
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {error && (
        <p className="px-4 text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}

      <Dialog open={confirmRemove} onOpenChange={setConfirmRemove}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium text-foreground">{displayName}</span>{" "}
              from the organization? They will lose access to all projects and
              secrets.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
              {error}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmRemove(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemove}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 />
                  Remove
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ManageKeysDialog
        open={manageKeysOpen}
        onOpenChange={setManageKeysOpen}
        orgId={orgId}
        userId={member.userId}
        displayName={displayName}
      />
    </>
  );
}

function InviteRow({
  invite,
  canManage,
}: {
  invite: Doc<"invites">;
  canManage: boolean;
}) {
  const isPending = invite.status === "pending";
  const isRevoked = invite.status === "revoked";
  const isDeclined = invite.status === "declined";
  const isExpired = isPending && invite.expiresAt <= Date.now();
  const isInactive = isRevoked || isDeclined;
  const revokeMutation = useMutation(api.invites.revoke);
  const updateRoleMutation = useMutation(api.invites.updateRole);
  const resendMutation = useMutation(api.invites.resend);
  const [isTransitioning, startTransition] = useTransition();
  const [actionType, setActionType] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [error, setError] = useState("");

  const handleRevoke = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await revokeMutation({ inviteId: invite._id });
        if (isFailure(result)) {
          setError(result.error);
          return;
        }
        setConfirmRevoke(false);
      } catch {
        setError("Something went wrong.");
      }
    });
  };

  const handleRoleChange = (role: "admin" | "member") => {
    setError("");
    setActionType("role");
    startTransition(async () => {
      try {
        const result = await updateRoleMutation({
          inviteId: invite._id,
          role,
        });
        if (isFailure(result)) {
          setError(result.error);
        }
      } catch {
        setError("Something went wrong.");
      } finally {
        setActionType(null);
      }
    });
  };

  const handleResend = () => {
    setError("");
    setActionType("resend");
    startTransition(async () => {
      try {
        const result = await resendMutation({ inviteId: invite._id });
        if (isFailure(result)) {
          setError(result.error);
        }
      } catch {
        setError("Something went wrong.");
      } finally {
        setActionType(null);
      }
    });
  };

  const roleIcon =
    invite.role === "admin" ? (
      <ShieldCheck className="size-3" />
    ) : (
      <Shield className="size-3" />
    );

  return (
    <>
      <div
        className={`flex flex-col gap-3 rounded-lg border border-dashed p-4 sm:flex-row sm:items-center sm:justify-between ${isInactive || isExpired ? "opacity-60" : ""}`}
      >
        <div className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-full bg-muted">
            <Mail className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{invite.email}</p>
            <p
              className={`text-xs flex items-center gap-1 ${isExpired || isInactive ? "text-red-400" : "text-muted-foreground"}`}
            >
              <Clock className="size-3" />
              {isExpired
                ? "Expired"
                : isInactive
                  ? `${invite.status.charAt(0).toUpperCase()}${invite.status.slice(1)}`
                  : "Expires"}{" "}
              {new Date(invite.expiresAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {(isExpired || isInactive) && (
            <Badge variant="destructive" className="gap-1 text-xs capitalize">
              {isExpired ? "Expired" : invite.status}
            </Badge>
          )}
          <Badge variant="secondary" className="gap-1 text-xs capitalize">
            {roleIcon}
            {invite.role}
          </Badge>
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  disabled={isTransitioning}
                >
                  {isTransitioning ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <MoreVertical className="size-3.5" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isPending && !isExpired && (
                  <DropdownMenuItem onClick={handleResend}>
                    <RefreshCw />
                    Resend Invite
                  </DropdownMenuItem>
                )}
                {isPending && !isExpired && invite.role !== "admin" && (
                  <DropdownMenuItem onClick={() => handleRoleChange("admin")}>
                    <ShieldCheck />
                    Change to Admin
                  </DropdownMenuItem>
                )}
                {isPending && !isExpired && invite.role !== "member" && (
                  <DropdownMenuItem onClick={() => handleRoleChange("member")}>
                    <Shield />
                    Change to Member
                  </DropdownMenuItem>
                )}
                {isPending && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setConfirmRevoke(true)}
                    >
                      <X />
                      Revoke Invite
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
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
            <DialogTitle>Revoke Invite</DialogTitle>
            <DialogDescription>
              Are you sure you want to revoke the invitation for{" "}
              <span className="font-medium text-foreground">
                {invite.email}
              </span>
              ? They will no longer be able to join using this invite link.
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
              disabled={isTransitioning}
            >
              {isTransitioning ? (
                <>
                  <Loader2 className="animate-spin" />
                  Revoking...
                </>
              ) : (
                <>
                  <X />
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

function PendingKeyRow({
  memberKey,
  orgKey,
  members,
}: {
  memberKey: Doc<"memberKeys">;
  orgKey: string | null;
  members: MemberItem[];
}) {
  const approveMutation = useMutation(api.keys.approveKey);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [approved, setApproved] = useState(false);

  const matchedMember = members.find(
    (m) => m.member.userId === memberKey.userId,
  );
  const displayName = matchedMember?.user?.name ?? memberKey.userId.slice(0, 8);
  const displayEmail = matchedMember?.user?.email ?? "";
  const displayImage = matchedMember?.user?.image ?? undefined;

  const handleApprove = () => {
    setError("");
    startTransition(async () => {
      try {
        if (!orgKey) {
          setError("Your encryption key is not available. Try refreshing.");
          return;
        }

        const publicKeyJwk = JSON.parse(memberKey.publicKey) as JsonWebKey;
        const wrappedKey = await wrapOrgKey(orgKey, publicKeyJwk);
        const result = await approveMutation({
          keyId: memberKey._id,
          wrappedOrgKey: wrappedKey,
        });

        if (isSuccess(result)) {
          setApproved(true);
        } else if (isFailure(result)) {
          setError(result.error);
        }
      } catch {
        setError("Something went wrong during key approval.");
      }
    });
  };

  return (
    <>
      <div className="flex flex-col gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="size-9">
            {displayImage && (
              <AvatarImage src={displayImage} alt={displayName} />
            )}
            <AvatarFallback className="text-xs">
              {getInitials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{displayName}</p>
            {displayEmail && (
              <p className="text-xs text-muted-foreground truncate">
                {displayEmail}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Badge variant="secondary" className="gap-1 text-xs">
            <KeyRound className="size-3" />
            Pending
          </Badge>
          {approved ? (
            <Badge className="gap-1 text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
              <Check className="size-3" />
              Approved
            </Badge>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleApprove}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="animate-spin" />
                  Approving...
                </>
              ) : (
                <>
                  <Check />
                  Approve Key
                </>
              )}
            </Button>
          )}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </>
  );
}

function ManageKeysDialog({
  open,
  onOpenChange,
  orgId,
  userId,
  displayName,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: Id<"organizations">;
  userId: string;
  displayName: string;
}) {
  const keysResult = useQuery(
    api.keys.listMemberKeys,
    open ? { orgId, userId } : "skip",
  );
  const revokeKeyMutation = useMutation(api.keys.revokeKey);
  const [isPending, startTransition] = useTransition();
  const [revokingKeyId, setRevokingKeyId] = useState<Id<"memberKeys"> | null>(
    null,
  );
  const [error, setError] = useState("");

  const keys = keysResult && isSuccess(keysResult) ? keysResult.data : [];
  const keysError = keysResult && isFailure(keysResult) ? keysResult.error : "";
  const loading = keysResult === undefined;

  const activeKeys = keys.filter((k) => k.status === "active");
  const pendingKeys = keys.filter((k) => k.status === "pending");
  const revokedKeys = keys.filter((k) => k.status === "revoked");

  const handleRevoke = (keyId: Id<"memberKeys">) => {
    setError("");
    setRevokingKeyId(keyId);
    startTransition(async () => {
      try {
        const result = await revokeKeyMutation({ keyId });
        if (isFailure(result)) {
          setError(result.error);
          return;
        }
        setRevokingKeyId(null);
      } catch {
        setError("Something went wrong.");
      } finally {
        setRevokingKeyId(null);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Encryption Keys</DialogTitle>
          <DialogDescription>
            Manage encryption keys for{" "}
            <span className="font-medium text-foreground">{displayName}</span>.
            Revoking a key removes their ability to decrypt secrets on that
            device.
          </DialogDescription>
        </DialogHeader>

        {keysError && <p className="text-sm text-red-400">{keysError}</p>}

        {error && (
          <p className="text-sm text-red-400 animate-in fade-in slide-in-from-top-1">
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-lg border animate-pulse bg-muted/30"
                />
              ))}
            </div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No encryption keys registered for this member.
            </p>
          ) : (
            <>
              {activeKeys.map((key) => (
                <KeyRow
                  key={key._id}
                  memberKey={key}
                  onRevoke={handleRevoke}
                  isRevoking={isPending && revokingKeyId === key._id}
                />
              ))}
              {pendingKeys.map((key) => (
                <KeyRow
                  key={key._id}
                  memberKey={key}
                  onRevoke={handleRevoke}
                  isRevoking={isPending && revokingKeyId === key._id}
                />
              ))}
              {revokedKeys.map((key) => (
                <KeyRow
                  key={key._id}
                  memberKey={key}
                  onRevoke={handleRevoke}
                  isRevoking={false}
                />
              ))}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KeyRow({
  memberKey,
  onRevoke,
  isRevoking,
}: {
  memberKey: Pick<
    Doc<"memberKeys">,
    "_id" | "status" | "createdAt" | "updatedAt"
  >;
  onRevoke: (keyId: Id<"memberKeys">) => void;
  isRevoking: boolean;
}) {
  const isActive = memberKey.status === "active";
  const isPendingApproval = memberKey.status === "pending";
  const isRevoked = memberKey.status === "revoked";

  const createdAt = memberKey.createdAt
    ? new Date(memberKey.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Unknown";

  return (
    <div
      className={`flex items-center justify-between rounded-lg border p-3 ${
        isRevoked ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex size-8 items-center justify-center rounded-full ${
            isActive
              ? "bg-emerald-500/10"
              : isPendingApproval
                ? "bg-amber-500/10"
                : "bg-muted"
          }`}
        >
          <KeyRound
            className={`size-3.5 ${
              isActive
                ? "text-emerald-400"
                : isPendingApproval
                  ? "text-amber-400"
                  : "text-muted-foreground"
            }`}
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={`gap-1 text-[10px] capitalize ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : ""
              }`}
            >
              {memberKey.status}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            <Clock className="inline size-3 mr-1" />
            Registered {createdAt}
          </p>
        </div>
      </div>
      {!isRevoked && (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => onRevoke(memberKey._id)}
          disabled={isRevoking}
        >
          {isRevoking ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <Trash2 className="size-3.5" />
          )}
        </Button>
      )}
    </div>
  );
}
