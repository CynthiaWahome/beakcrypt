import { clearAllConfig, isLoggedIn } from "../lib/global-config";
import * as interactive from "../lib/interactive";
import * as output from "../lib/output";

export async function logoutCommand(opts: { yes?: boolean }): Promise<void> {
	if (!isLoggedIn()) {
		output.info("Not currently logged in.");
		return;
	}

	if (!opts.yes) {
		const confirmed = await interactive.confirm(
			"This will remove all credentials and device keys. Continue?",
		);
		if (!confirmed) return;
	}

	await clearAllConfig();
	output.success("Logged out. All credentials and keys removed.");
}
