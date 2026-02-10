"use client";

import { type Preloaded, usePreloadedQuery, useMutation } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess, isFailure } from "conv/types";
import type { Doc, Id } from "conv/_generated/dataModel";
import { useState, useTransition, useRef } from "react";
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
      <div className="flex items-center justify-between px-6 py-4">
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
              <label className="text-sm font-medium leading-none">Role</label>
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
    </div>
  );
}

function MemberRow({
  item,
  isOwner,
  canManage,
}: {
  item: MemberItem;
  isOwner: boolean;
  canManage: boolean;
}) {
  const { member, user } = item;
  const displayName = user?.name ?? "Unknown";
  const displayEmail = user?.email ?? "";
  const displayImage = user?.image ?? undefined;

  const updateRoleMutation = useMutation(api.members.updateRole);
  const removeMutation = useMutation(api.members.remove);

  const [isPending, startTransition] = useTransition();
  const [confirmRemove, setConfirmRemove] = useState(false);
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
      <div className="flex items-center justify-between rounded-lg border p-4">
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

        <div className="flex items-center gap-2">
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
        className={`flex items-center justify-between rounded-lg border border-dashed p-4 ${isInactive || isExpired ? "opacity-60" : ""}`}
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

        <div className="flex items-center gap-2">
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
                <DropdownMenuItem onClick={handleResend}>
                  <RefreshCw />
                  Resend Invite
                </DropdownMenuItem>
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
