import { env } from "~/env";
import { convexBetterAuthNextJs } from "@convex-dev/better-auth/nextjs";

export const {
  handler,
  getToken,
  fetchAuthQuery,
  isAuthenticated,
  fetchAuthAction,
  preloadAuthQuery,
  fetchAuthMutation,
} = convexBetterAuthNextJs({
  convexUrl: env.NEXT_PUBLIC_CONVEX_URL,
  convexSiteUrl: env.NEXT_PUBLIC_CONVEX_SITE_URL,
});
