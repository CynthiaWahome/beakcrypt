import { api } from "@beakcrypt/convex";
import { getAuthConfig } from "../lib/global-config";
import { loginFlow, getDefaultUrls, validateUrls } from "../lib/auth";
import { query } from "../lib/convex-client";
import * as output from "../lib/output";

export async function loginCommand(): Promise<void> {
  const existing = await getAuthConfig();
  if (existing) {
    output.info("Already logged in. Refreshing session...");
  }

  const urls = existing
    ? {
        siteUrl: existing.siteUrl,
        convexUrl: existing.convexUrl,
        convexSiteUrl: existing.convexSiteUrl,
      }
    : getDefaultUrls();

  validateUrls(urls);
  await loginFlow(urls.siteUrl, urls.convexUrl, urls.convexSiteUrl);
  try {
    const user = await query(api.auth.getCurrentUser, {});
    if (user) {
      output.success(`Logged in as ${output.bold(user.email)}`);
    } else {
      output.success("Logged in successfully.");
    }
  } catch {
    output.success("Logged in successfully.");
  }
}
