import { api } from "@beakcrypt/convex";
import { query } from "../../lib/convex-client";
import { ensureAuth } from "../../lib/context";
import { unwrapResult } from "../../lib/errors";
import * as output from "../../lib/output";

export async function orgListCommand(): Promise<void> {
  await ensureAuth();

  const result = await query(api.organizations.list, {});
  const orgs = unwrapResult(result);

  if (orgs.length === 0) {
    output.info("You don't belong to any organizations.");
    return;
  }

  console.log();
  output.table(
    orgs.map((o: { name: string; slug: string }) => [o.name, o.slug]),
    ["Name", "Slug"],
  );
  console.log();
}
