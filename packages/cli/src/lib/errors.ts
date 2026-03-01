import pc from "picocolors";
import type { Result } from "@beakcrypt/shared";

export class CliError extends Error {
  constructor(
    message: string,
    public readonly hint?: string,
  ) {
    super(message);
    this.name = "CliError";
  }
}

export function handleResultError(result: {
  ok: false;
  code: string;
  error: string;
}): never {
  throw new CliError(result.error, `Error code: ${result.code}`);
}

export function unwrapResult<T>(result: Result<T>): T {
  if (!result.ok) {
    handleResultError(result);
  }
  return result.data;
}

export function handleError(error: unknown): void {
  if (error instanceof CliError) {
    console.error(`\n${pc.red("Error:")} ${error.message}`);
    if (error.hint) {
      console.error(`${pc.dim(error.hint)}`);
    }
  } else if (error instanceof Error) {
    console.error(`\n${pc.red("Error:")} ${error.message}`);
  } else {
    console.error(`\n${pc.red("Error:")} An unexpected error occurred.`);
  }
  process.exit(1);
}
