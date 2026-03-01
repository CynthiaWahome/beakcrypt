import { resolve } from "node:path";
import { existsSync } from "node:fs";
import ora from "ora";
import { api } from "@beakcrypt/convex";
import { encryptSecret } from "@beakcrypt/crypto";
import { mutation } from "../lib/convex-client";
import { resolveContext } from "../lib/context";
import { ensureOrgKey } from "../lib/key-manager";
import { readEnvFile } from "../lib/env-file";
import { unwrapResult, CliError } from "../lib/errors";
import * as interactive from "../lib/interactive";
import * as output from "../lib/output";

export async function pushCommand(
  file: string | undefined,
  opts: { org?: string; project?: string; env?: string; yes?: boolean },
): Promise<void> {
  const filePath = resolve(file ?? ".env.local");

  if (!existsSync(filePath)) {
    throw new CliError(`File not found: ${filePath}`);
  }

  const ctx = await resolveContext(opts);
  const env = await readEnvFile(filePath);
  const keys = Object.keys(env);

  if (keys.length === 0) {
    output.info("No secrets found in file.");
    return;
  }

  if (!opts.yes) {
    output.info(
      `Pushing ${keys.length} secret${keys.length === 1 ? "" : "s"} to ${ctx.orgSlug}/${ctx.projectName} (${ctx.envName})`,
    );
    const confirmed = await interactive.confirm("Continue?", true);
    if (!confirmed) return;
  }

  const spinner = ora("Encrypting and pushing secrets...").start();

  const orgKey = await ensureOrgKey(ctx.orgId);

  const encryptedSecrets: { key: string; encryptedValue: string }[] = [];
  for (const [key, value] of Object.entries(env)) {
    const encrypted = await encryptSecret(value, orgKey);
    encryptedSecrets.push({ key, encryptedValue: encrypted });
  }

  const result = await mutation(api.secrets.bulkCreate, {
    environmentId: ctx.environmentId as never,
    secrets: encryptedSecrets,
    overwrite: true,
  });
  const summary = unwrapResult(result);

  spinner.stop();
  output.success(
    `Pushed ${summary.created} created, ${summary.updated} updated, ${summary.skipped} skipped`,
  );
}
