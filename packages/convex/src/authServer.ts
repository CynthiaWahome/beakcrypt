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
  convexUrl: process.env.CONVEX_URL!,
  convexSiteUrl: process.env.CONVEX_SITE_URL!,
});
