import { api } from "@beakcrypt/convex";
import { query } from "../../lib/convex-client";
import { resolveContext } from "../../lib/context";
import { unwrapResult } from "../../lib/errors";
import * as output from "../../lib/output";

export async function secretsListCommand(opts: {
	org?: string;
	project?: string;
	env?: string;
}): Promise<void> {
	const ctx = await resolveContext(opts);

	const result = await query(api.secrets.list, {
		environmentId: ctx.environmentId as never,
	});
	const secrets = unwrapResult(result);

	if (secrets.length === 0) {
		output.info(`No secrets in ${ctx.orgSlug}/${ctx.projectName} (${ctx.envName})`);
		return;
	}

	console.log(
		`\n${output.bold(`${ctx.orgSlug}/${ctx.projectName}`)} ${output.dim(`(${ctx.envName})`)}\n`,
	);

	output.table(
		secrets.map((s: { key: string }) => [s.key, "••••••••"]),
		["Key", "Value"],
	);

	console.log(`\n${output.dim(`${secrets.length} secret${secrets.length === 1 ? "" : "s"}`)}\n`);
}
