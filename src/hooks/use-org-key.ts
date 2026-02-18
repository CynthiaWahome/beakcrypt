"use client";

import { useQuery } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess } from "conv/types";
import { useState, useEffect, useRef } from "react";
import type { Id } from "conv/_generated/dataModel";
import { unwrapOrgKey, getKeyPair } from "~/lib/crypto";

type OrgKeyStatus =
  | "loading"
  | "ready"
  | "pending_approval"
  | "no_key_pair"
  | "error";

export function useOrgKey(orgId: Id<"organizations">) {
  const keyPair = getKeyPair(orgId);
  const publicKey = keyPair ? JSON.stringify(keyPair.publicKey) : null;

  const myKeyResult = useQuery(
    api.keys.getMyKey,
    publicKey ? { orgId, publicKey } : "skip",
  );
  const [orgKey, setOrgKey] = useState<string | null>(null);
  const [status, setStatus] = useState<OrgKeyStatus>(() =>
    !publicKey ? "no_key_pair" : "loading",
  );
  const unwrapAttempted = useRef(false);

  useEffect(() => {
    unwrapAttempted.current = false;
    setOrgKey(null);
    setStatus(!publicKey ? "no_key_pair" : "loading");
  }, [orgId, publicKey]);

  useEffect(() => {
    if (!publicKey) {
      return;
    }

    if (myKeyResult === undefined || unwrapAttempted.current) return;

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

    // keyPair is guaranteed if publicKey exists (derived from it)
    if (!keyPair) {
      // Should result in "no_key_pair" but unreachable if publicKey is present
      return;
    }

    unwrapAttempted.current = true;
    let isCancelled = false;

    unwrapOrgKey(memberKey.wrappedOrgKey, keyPair.privateKey)
      .then((key) => {
        if (!isCancelled) {
          setOrgKey(key);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setStatus("error");
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [myKeyResult, orgId, publicKey]); // Removed keyPair, it's unstable object but stable related to publicKey string

  return { orgKey, status };
}
