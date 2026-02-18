"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess, isFailure } from "conv/types";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Id } from "conv/_generated/dataModel";
import { generateKeyPair, storeKeyPair, hasKeyPair } from "~/lib/crypto";
import { authClient } from "~/lib/auth-client";

type DeviceKeySetupStatus =
  | "idle"
  | "registering"
  | "pending_approval"
  | "done"
  | "error";

export function useDeviceKeySetup(orgId: Id<"organizations">) {
  const [status, setStatus] = useState<DeviceKeySetupStatus>("idle");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const registerKeyMutation = useMutation(api.keys.registerKey);
  const sessionsResult = useQuery(api.keys.listMySessions, { orgId });
  const attemptedRef = useRef(false);

  const [prevOrgId, setPrevOrgId] = useState(orgId);
  if (orgId !== prevOrgId) {
    setPrevOrgId(orgId);
    setStatus("idle");
    setError("");
    attemptedRef.current = false;
  }

  useEffect(() => {
    let cancelled = false;

    if (attemptedRef.current) return;
    if (hasKeyPair(orgId)) {
      setStatus("done");
      return;
    }

    if (sessionsResult === undefined) return;
    if (isFailure(sessionsResult)) return;

    const sessions = sessionsResult.data;
    const hasPending = sessions.some((s) => s.status === "pending");
    if (hasPending) {
      setStatus("pending_approval");
      return;
    }

    attemptedRef.current = true;
    setStatus("registering");

    (async () => {
      try {
        const keyPair = await generateKeyPair();

        const { data } = await authClient.getSession();
        const sessionToken = data?.session?.token;
        if (!sessionToken) {
          setStatus("error");
          setError("Failed to get session token. Try refreshing.");
          return;
        }

        const result = await registerKeyMutation({
          orgId,
          publicKey: JSON.stringify(keyPair.publicKey),
          sessionToken,
        });

        if (cancelled) return;

        if (isSuccess(result)) {
          storeKeyPair(orgId, keyPair);
          if (result.data.status === "active") {
            setStatus("done");
          } else {
            setStatus("pending_approval");
          }
        } else {
          setError(result.error);
          setStatus("error");
        }
      } catch {
        if (cancelled) return;
        setError("Failed to register device.");
        setStatus("error");
        attemptedRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [orgId, sessionsResult, registerKeyMutation, retryCount]);

  const retry = useCallback(() => {
    attemptedRef.current = false;
    setStatus("idle");
    setError("");
    setRetryCount((c) => c + 1);
  }, []);

  return { status, error, retry };
}
