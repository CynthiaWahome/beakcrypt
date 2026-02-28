import pc from "picocolors";

export function success(message: string): void {
	console.log(`${pc.green("✓")} ${message}`);
}

export function info(message: string): void {
	console.log(`${pc.blue("ℹ")} ${message}`);
}

export function warn(message: string): void {
	console.log(`${pc.yellow("⚠")} ${message}`);
}

export function error(message: string): void {
	console.error(`${pc.red("✗")} ${message}`);
}

export function dim(message: string): string {
	return pc.dim(message);
}

export function bold(message: string): string {
	return pc.bold(message);
}

export function link(url: string): string {
	return pc.cyan(pc.underline(url));
}

export function table(rows: string[][], headers?: string[]): void {
	const allRows = headers ? [headers, ...rows] : rows;
	const colWidths: number[] = [];

	for (const row of allRows) {
		for (let i = 0; i < row.length; i++) {
			colWidths[i] = Math.max(colWidths[i] ?? 0, (row[i] ?? "").length);
		}
	}

	for (let i = 0; i < allRows.length; i++) {
		const row = allRows[i]!;
		const line = row
			.map((cell, j) => (cell ?? "").padEnd(colWidths[j] ?? 0))
			.join("  ");

		if (i === 0 && headers) {
			console.log(pc.bold(line));
			console.log(
				colWidths.map((w) => "─".repeat(w)).join("──"),
			);
		} else {
			console.log(line);
		}
	}
}
