import { api } from "@beakcrypt/convex";
import { query } from "../../lib/convex-client";
import { resolveContext } from "../../lib/context";
import { unwrapResult } from "../../lib/errors";
import * as output from "../../lib/output";

export async function envListCommand(opts: {
	org?: string;
	project?: string;
}): Promise<void> {
	const ctx = await resolveContext({ ...opts, env: "development" });

	const result = await query(api.environments.list, {
		projectId: ctx.projectId as never,
	});
	const envs = unwrapResult(result);

	if (envs.length === 0) {
		output.info("No environments found.");
		return;
	}

	console.log(
		`\n${output.bold(`${ctx.orgSlug}/${ctx.projectName}`)} environments:\n`,
	);

	output.table(
		envs.map((e: { name: string; isPersonal?: boolean }) => [
			e.name,
			e.isPersonal ? "personal" : "shared",
		]),
		["Name", "Type"],
	);
	console.log();
}
