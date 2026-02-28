import ora from "ora";
import { api } from "@beakcrypt/convex";
import { encryptSecret } from "@beakcrypt/crypto";
import { mutation } from "../../lib/convex-client";
import { resolveContext } from "../../lib/context";
import { ensureOrgKey } from "../../lib/key-manager";
import { unwrapResult, CliError } from "../../lib/errors";
import * as output from "../../lib/output";

export async function secretsSetCommand(
	pairs: string[],
	opts: { org?: string; project?: string; env?: string },
): Promise<void> {
	if (pairs.length === 0) {
		throw new CliError("No key=value pairs provided. Usage: beakcrypt secrets set KEY=VALUE");
	}

	const parsed: { key: string; value: string }[] = [];
	for (const pair of pairs) {
		const eqIndex = pair.indexOf("=");
		if (eqIndex === -1) {
			throw new CliError(`Invalid format: "${pair}". Use KEY=VALUE.`);
		}
		parsed.push({
			key: pair.slice(0, eqIndex),
			value: pair.slice(eqIndex + 1),
		});
	}

	const ctx = await resolveContext(opts);
	const spinner = ora("Setting secrets...").start();

	const orgKey = await ensureOrgKey(ctx.orgId);

	const encryptedSecrets: { key: string; encryptedValue: string }[] = [];
	for (const { key, value } of parsed) {
		const encrypted = await encryptSecret(value, orgKey);
		encryptedSecrets.push({ key, encryptedValue: encrypted });
	}

	const result = await mutation(api.secrets.bulkCreate, {
		environmentId: ctx.environmentId as never,
		secrets: encryptedSecrets,
		overwrite: true,
	});
	unwrapResult(result);

	spinner.stop();
	output.success(
		`Set ${parsed.length} secret${parsed.length === 1 ? "" : "s"} in ${ctx.envName}`,
	);
}
