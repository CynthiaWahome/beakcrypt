"use client";

import { useQuery, useConvexAuth } from "convex/react";
import { api } from "conv/_generated/api";
import { isSuccess } from "conv/types";
import { useParams } from "next/navigation";
import { useDeviceKeySetup } from "~/hooks/use-device-key-setup";
import type { Id } from "conv/_generated/dataModel";

function DeviceKeySync({ orgId }: { orgId: Id<"organizations"> }) {
  useDeviceKeySetup(orgId);
  return null;
}

export default function DeviceKeyProvider() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useConvexAuth();

  const orgResult = useQuery(
    api.organizations.getBySlug,
    isAuthenticated ? { slug } : "skip",
  );

  const orgId =
    orgResult && isSuccess(orgResult) ? orgResult.data._id : undefined;

  if (!orgId) return null;

  return <DeviceKeySync orgId={orgId} />;
}
