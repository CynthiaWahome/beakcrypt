import prompts from "prompts";
import { CliError } from "./errors";

export function isInteractive(): boolean {
	return Boolean(process.stdin.isTTY);
}

export function requireInteractive(command: string): void {
	if (!isInteractive()) {
		throw new CliError(
			`Cannot run interactive prompts in non-interactive mode.`,
			`Run \`beakcrypt ${command}\` in an interactive terminal, or provide required flags.`,
		);
	}
}

export async function select<T extends string>(opts: {
	message: string;
	choices: { title: string; value: T; description?: string }[];
}): Promise<T> {
	const { value } = await prompts(
		{
			type: "select",
			name: "value",
			message: opts.message,
			choices: opts.choices,
		},
		{ onCancel: () => process.exit(0) },
	);
	return value as T;
}

export async function confirm(message: string, initial = false): Promise<boolean> {
	const { value } = await prompts(
		{
			type: "confirm",
			name: "value",
			message,
			initial,
		},
		{ onCancel: () => process.exit(0) },
	);
	return value as boolean;
}

export async function text(opts: {
	message: string;
	placeholder?: string;
	validate?: (value: string) => string | true;
}): Promise<string> {
	const { value } = await prompts(
		{
			type: "text",
			name: "value",
			message: opts.message,
			...(opts.placeholder ? { initial: opts.placeholder } : {}),
			validate: opts.validate
				? (v: string) => {
						const result = opts.validate!(v);
						return result === true ? true : result;
					}
				: undefined,
		},
		{ onCancel: () => process.exit(0) },
	);
	return value as string;
}
