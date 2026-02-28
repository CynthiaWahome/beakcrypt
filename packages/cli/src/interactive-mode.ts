import pc from "picocolors";
import { getAuthConfig } from "./lib/global-config";
import { getProjectConfig } from "./lib/project-config";
import * as interactive from "./lib/interactive";
import * as output from "./lib/output";
import { loginCommand } from "./commands/login";
import { linkCommand } from "./commands/link";
import { pullCommand } from "./commands/pull";
import { pushCommand } from "./commands/push";
import { secretsListCommand } from "./commands/secrets/list";

export async function interactiveMode(): Promise<void> {
	interactive.requireInteractive("(no args)");

	console.log(`\n${pc.bold("Beakcrypt")} ${pc.dim("v0.1.0")}\n`);

	// Check auth
	const auth = await getAuthConfig();
	if (!auth) {
		const shouldLogin = await interactive.confirm(
			"You're not logged in. Log in now?",
			true,
		);
		if (!shouldLogin) process.exit(0);
		await loginCommand();
	}

	// Check project link
	const config = await getProjectConfig();
	if (!config) {
		output.info("No project linked in this directory.");
		const shouldLink = await interactive.confirm(
			"Link to a project now?",
			true,
		);
		if (!shouldLink) process.exit(0);
		await linkCommand();
		return;
	}

	// Show linked project and action menu
	console.log(
		`Linked to ${output.bold(`${config.orgSlug}/${config.projectName}`)} ${output.dim(`(${config.defaultEnv}`)})`,
	);
	console.log();

	const action = await interactive.select({
		message: "What would you like to do?",
		choices: [
			{ title: "Pull secrets (.env.local)", value: "pull" as const },
			{ title: "Push secrets (.env.local)", value: "push" as const },
			{ title: "List secrets", value: "list" as const },
			{ title: "Change project link", value: "link" as const },
		],
	});

	switch (action) {
		case "pull":
			await pullCommand(undefined, {});
			break;
		case "push":
			await pushCommand(undefined, {});
			break;
		case "list":
			await secretsListCommand({});
			break;
		case "link":
			await linkCommand();
			break;
	}
}
