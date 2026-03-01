import ora from "ora";
import { api } from "@beakcrypt/convex";
import { mutation } from "../../lib/convex-client";
import { resolveContext } from "../../lib/context";
import { unwrapResult } from "../../lib/errors";
import * as interactive from "../../lib/interactive";
import * as output from "../../lib/output";

export async function secretsClearCommand(opts: {
  org?: string;
  project?: string;
  env?: string;
  yes?: boolean;
}): Promise<void> {
  const ctx = await resolveContext(opts);

  if (!opts.yes) {
    const confirmed = await interactive.confirm(
      `Delete ALL secrets in ${ctx.orgSlug}/${ctx.projectName} (${ctx.envName})?`,
    );
    if (!confirmed) return;
  }

  const spinner = ora("Clearing secrets...").start();

  const result = await mutation(api.secrets.removeAll, {
    environmentId: ctx.environmentId as never,
  });
  const summary = unwrapResult(result);

  spinner.stop();
  output.success(
    `Deleted ${summary.deleted} secret${summary.deleted === 1 ? "" : "s"}`,
  );
}
