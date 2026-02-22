"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "@beakcrypt/convex";
import { isSuccess, isFailure } from "@beakcrypt/shared";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import type { Id } from "@beakcrypt/convex/dataModel";
import {
  generateKeyPair,
  storeKeyPair,
  getKeyPair,
  storeKeyId,
  getKeyId,
} from "~/lib/crypto";
import { authClient } from "~/lib/auth-client";

type DeviceKeySetupStatus =
  | "idle"
  | "registering"
  | "syncing_token"
  | "pending_approval"
  | "done"
  | "error";

export function useDeviceKeySetup(orgId: Id<"organizations">) {
  const [status, setStatus] = useState<DeviceKeySetupStatus>("idle");
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const registerKeyMutation = useMutation(api.keys.registerKey);
  const updateTokenMutation = useMutation(api.keys.updateKeySessionToken);
  const sessionsResult = useQuery(api.keys.listMySessions, { orgId });
  const attemptedRef = useRef(false);

  const [prevOrgId, setPrevOrgId] = useState(orgId);
  if (orgId !== prevOrgId) {
    setPrevOrgId(orgId);
    setStatus("idle");
    setError("");
    attemptedRef.current = false;
  }

  const migrationPublicKey = useMemo(() => {
    const kp = getKeyPair(orgId);
    const kid = getKeyId(orgId);
    if (kp && !kid) {
      return JSON.stringify(kp.publicKey);
    }
    return null;
  }, [orgId]);

  const migrationKeyResult = useQuery(
    api.keys.getMyKey,
    migrationPublicKey !== null
      ? { orgId, publicKey: migrationPublicKey }
      : "skip",
  );

  useEffect(() => {
    let cancelled = false;

    if (attemptedRef.current) return;

    const existingKeyPair = getKeyPair(orgId);
    const storedKeyId = getKeyId(orgId);

    if (existingKeyPair && storedKeyId) {
      attemptedRef.current = true;
      setStatus("syncing_token");

      (async () => {
        try {
          const { data } = await authClient.getSession();
          const sessionToken = data?.session?.token;
          if (cancelled) return;
          if (!sessionToken) {
            setStatus("done");
            return;
          }

          const result = await updateTokenMutation({
            keyId: storedKeyId as Id<"memberKeys">,
            sessionToken,
          });

          if (cancelled) return;

          if (isFailure(result)) {
            console.error("Failed to sync session token:", result.error);
          }

          setStatus("done");
        } catch {
          if (cancelled) return;
          console.error("Failed to sync session token");
          setStatus("done");
        }
      })();

      return () => {
        cancelled = true;
      };
    }

    if (existingKeyPair && !storedKeyId) {
      if (migrationKeyResult === undefined) {
        return;
      }

      if (isSuccess(migrationKeyResult) && migrationKeyResult.data !== null) {
        storeKeyId(orgId, migrationKeyResult.data._id);
        return;
      }

      console.warn(
        "Migration: no backend record found for stored public key; generating a new key pair.",
        isFailure(migrationKeyResult) ? migrationKeyResult.error : "not found",
      );
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
        if (cancelled) return;
        if (!sessionToken) {
          attemptedRef.current = false;
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
          storeKeyId(orgId, result.data._id);
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
  }, [
    orgId,
    sessionsResult,
    registerKeyMutation,
    updateTokenMutation,
    migrationKeyResult,
    retryCount,
  ]);

  const retry = useCallback(() => {
    attemptedRef.current = false;
    setStatus("idle");
    setError("");
    setRetryCount((c) => c + 1);
  }, []);

  return { status, error, retry };
}
