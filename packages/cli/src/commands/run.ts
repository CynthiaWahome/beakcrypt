import { spawn } from "node:child_process";
import ora from "ora";
import { api } from "@beakcrypt/convex";
import { decryptSecret } from "@beakcrypt/crypto";
import { query } from "../lib/convex-client";
import { resolveContext } from "../lib/context";
import { ensureOrgKey } from "../lib/key-manager";
import { unwrapResult, CliError } from "../lib/errors";

export async function runCommand(
	args: string[],
	opts: { org?: string; project?: string; env?: string },
): Promise<void> {
	if (args.length === 0) {
		throw new CliError("No command provided. Usage: beakcrypt run -- <command>");
	}

	const ctx = await resolveContext(opts);

	const spinner = ora("Loading secrets...").start();

	const orgKey = await ensureOrgKey(ctx.orgId);

	const secretsResult = await query(api.secrets.list, {
		environmentId: ctx.environmentId as never,
	});
	const secrets = unwrapResult(secretsResult);

	const decrypted: Record<string, string> = {};
	for (const secret of secrets) {
		decrypted[secret.key] = await decryptSecret(secret.encryptedValue, orgKey);
	}

	spinner.stop();

	const [command, ...commandArgs] = args;
	const child = spawn(command!, commandArgs, {
		stdio: "inherit",
		env: { ...process.env, ...decrypted },
	});

	child.on("close", (code) => {
		process.exit(code ?? 0);
	});

	child.on("error", (err) => {
		throw new CliError(`Failed to run command: ${err.message}`);
	});
}
