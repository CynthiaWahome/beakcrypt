"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";

const BETA_COOKIE_NAME = "private-beta";
const BETA_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export default function BetaCookie() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const beta = searchParams.get("beta");
    if (beta !== "true") return;

    document.cookie = `${BETA_COOKIE_NAME}=true; path=/; max-age=${BETA_COOKIE_MAX_AGE}; SameSite=Lax`;
    const params = new URLSearchParams(searchParams.toString());
    params.delete("beta");
    const newPath = params.toString() ? `/?${params.toString()}` : "/";

    router.push(newPath);
  }, [searchParams, router]);

  return null;
}
