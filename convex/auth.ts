import authConfig from "./auth.config";
import { query } from "./_generated/server";
import { betterAuth } from "better-auth/minimal";
import { DataModel } from "./_generated/dataModel";
import { components, internal } from "./_generated/api";
import { convex } from "@convex-dev/better-auth/plugins";
import { requireActionCtx } from "@convex-dev/better-auth/utils";
import { createClient, type GenericCtx } from "@convex-dev/better-auth";

const siteUrl = process.env.SITE_URL!;

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        scope: ["user:email", "read:user", "repo"],
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
    plugins: [convex({ authConfig })],
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            if (!user.email) {
              return;
            }
            const actionCtx = requireActionCtx(ctx);
            await actionCtx.scheduler.runAfter(
              0,
              internal.mail.sendWelcomeMail,
              {
                email: user.email,
              },
            );
          },
        },
      },
    },
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
