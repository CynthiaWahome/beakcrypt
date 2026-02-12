"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess, isFailure } from "conv/types";
import { useState, useEffect, useRef, useCallback } from "react";
import type { Id } from "conv/_generated/dataModel";
import { generateKeyPair, storePrivateKey, hasPrivateKey } from "~/lib/crypto";
import { getDeviceInfo } from "~/lib/device-info";

export type DeviceKeySetupStatus =
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

  useEffect(() => {
    attemptedRef.current = false;
    setStatus("idle");
    setError("");
  }, [orgId]);

  useEffect(() => {
    if (attemptedRef.current) return;
    if (hasPrivateKey(orgId)) {
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
        const deviceInfo = getDeviceInfo();

        const result = await registerKeyMutation({
          orgId,
          publicKey: JSON.stringify(keyPair.publicKey),
          deviceInfo,
        });

        if (isSuccess(result)) {
          storePrivateKey(orgId, keyPair.privateKey);
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
        setError("Failed to register device.");
        setStatus("error");
        attemptedRef.current = false;
      }
    })();
  }, [orgId, sessionsResult, registerKeyMutation, retryCount]);

  const retry = useCallback(() => {
    attemptedRef.current = false;
    setStatus("idle");
    setError("");
    setRetryCount((c) => c + 1);
  }, []);

  return { status, error, retry };
}
