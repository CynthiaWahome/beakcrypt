import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { Migrations } from "@convex-dev/migrations";

export const migrations = new Migrations<DataModel>(components.migrations);

export const run = migrations.runner();

export const removeSharedLocalEnvironments = migrations.define({
  table: "environments",
  customRange: (query) =>
    query.withIndex("by_name", (q) => q.eq("name", "local")),
  migrateOne: async (ctx, doc) => {
    if (doc.isPersonal) return;

    const secrets = await ctx.db
      .query("secrets")
      .withIndex("by_environment", (q) => q.eq("environmentId", doc._id))
      .collect();

    for (const secret of secrets) {
      await ctx.db.delete(secret._id);
    }

    await ctx.db.delete(doc._id);
  },
});
