"use client";

import { useQuery } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess } from "conv/types";
import { useState, useEffect, useRef } from "react";
import type { Id } from "conv/_generated/dataModel";
import { unwrapOrgKey, getPrivateKey } from "~/lib/crypto";

export type OrgKeyStatus =
  | "loading"
  | "ready"
  | "pending_approval"
  | "no_private_key"
  | "error";


export function useOrgKey(orgId: Id<"organizations">) {
  const myKeyResult = useQuery(api.keys.getMyKey, { orgId });
  const [orgKey, setOrgKey] = useState<string | null>(null);
  const [status, setStatus] = useState<OrgKeyStatus>("loading");
  const unwrapAttempted = useRef(false);

  useEffect(() => {
    unwrapAttempted.current = false;
    setOrgKey(null);
    setStatus("loading");
  }, [orgId]);

  useEffect(() => {
    if (!myKeyResult || unwrapAttempted.current) return;

    if (!isSuccess(myKeyResult)) {
      setStatus("error");
      return;
    }

    const memberKey = myKeyResult.data;

    if (!memberKey) {
      setStatus("pending_approval");
      return;
    }

    if (memberKey.status === "pending") {
      setStatus("pending_approval");
      return;
    }

    if (memberKey.status === "revoked") {
      setStatus("error");
      return;
    }

    if (!memberKey.wrappedOrgKey) {
      setStatus("pending_approval");
      return;
    }

    const privateKey = getPrivateKey(orgId);
    if (!privateKey) {
      setStatus("no_private_key");
      return;
    }

    unwrapAttempted.current = true;

    unwrapOrgKey(memberKey.wrappedOrgKey, privateKey)
      .then((key) => {
        setOrgKey(key);
        setStatus("ready");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [myKeyResult, orgId]);

  return { orgKey, status };
}
