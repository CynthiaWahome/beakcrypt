import ora from "ora";
import { api } from "@beakcrypt/convex";
import { query, mutation } from "../../lib/convex-client";
import { resolveContext } from "../../lib/context";
import { unwrapResult, CliError } from "../../lib/errors";
import * as output from "../../lib/output";

export async function secretsRemoveCommand(
	keys: string[],
	opts: { org?: string; project?: string; env?: string },
): Promise<void> {
	if (keys.length === 0) {
		throw new CliError("No keys provided. Usage: beakcrypt secrets remove KEY [KEY2...]");
	}

	const ctx = await resolveContext(opts);
	const spinner = ora("Removing secrets...").start();

	const secretsResult = await query(api.secrets.list, {
		environmentId: ctx.environmentId as never,
	});
	const secrets = unwrapResult(secretsResult);

	let removed = 0;
	const notFound: string[] = [];

	for (const key of keys) {
		const secret = secrets.find((s: { key: string }) => s.key === key);
		if (secret) {
			const result = await mutation(api.secrets.remove, {
				id: secret._id as never,
			});
			unwrapResult(result);
			removed++;
		} else {
			notFound.push(key);
		}
	}

	spinner.stop();

	if (removed > 0) {
		output.success(`Removed ${removed} secret${removed === 1 ? "" : "s"} from ${ctx.envName}`);
	}
	if (notFound.length > 0) {
		output.warn(`Not found: ${notFound.join(", ")}`);
	}
}
