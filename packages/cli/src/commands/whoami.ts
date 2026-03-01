import { api } from "@beakcrypt/convex";
import { query } from "../lib/convex-client";
import { CliError } from "../lib/errors";
import { ensureAuth } from "../lib/context";
import * as output from "../lib/output";

export async function whoamiCommand(): Promise<void> {
  await ensureAuth();

  const user = await query(api.auth.getCurrentUser, {});
  if (!user) {
    throw new CliError(
      "Could not retrieve user info. Try `beakcrypt login` again.",
    );
  }

  console.log();
  console.log(`  ${output.bold("Email:")}  ${user.email}`);
  console.log(`  ${output.bold("Name:")}   ${user.name}`);
  console.log();
}
