import { mkdir, readFile, writeFile, appendFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";

export interface ProjectConfig {
	orgId: string;
	orgSlug: string;
	projectId: string;
	projectName: string;
	defaultEnv: string;
}

const CONFIG_DIR_NAME = ".beakcrypt";
const CONFIG_FILE_NAME = "project.json";

export function findProjectConfigDir(startDir?: string): string | null {
	let dir = startDir ?? process.cwd();
	const root = dirname(dir) === dir ? dir : "/";

	while (true) {
		const configPath = join(dir, CONFIG_DIR_NAME, CONFIG_FILE_NAME);
		if (existsSync(configPath)) {
			return join(dir, CONFIG_DIR_NAME);
		}
		const parent = dirname(dir);
		if (parent === dir || dir === root) break;
		dir = parent;
	}
	return null;
}

export async function getProjectConfig(startDir?: string): Promise<ProjectConfig | null> {
	const configDir = findProjectConfigDir(startDir);
	if (!configDir) return null;
	try {
		const data = await readFile(join(configDir, CONFIG_FILE_NAME), "utf-8");
		return JSON.parse(data) as ProjectConfig;
	} catch {
		return null;
	}
}

export async function saveProjectConfig(
	config: ProjectConfig,
	dir?: string,
): Promise<string> {
	const baseDir = dir ?? process.cwd();
	const configDir = join(baseDir, CONFIG_DIR_NAME);
	await mkdir(configDir, { recursive: true });
	await writeFile(
		join(configDir, CONFIG_FILE_NAME),
		JSON.stringify(config, null, 2),
	);
	await ensureGitignore(baseDir);
	return configDir;
}

async function ensureGitignore(baseDir: string): Promise<void> {
	const gitignorePath = join(baseDir, ".gitignore");

	if (existsSync(gitignorePath)) {
		const content = await readFile(gitignorePath, "utf-8");
		if (content.includes(CONFIG_DIR_NAME)) return;
		const suffix = content.endsWith("\n") ? "" : "\n";
		await appendFile(
			gitignorePath,
			`${suffix}\n# Beakcrypt CLI\n${CONFIG_DIR_NAME}\n`,
		);
	} else {
		await writeFile(
			gitignorePath,
			`# Beakcrypt CLI\n${CONFIG_DIR_NAME}\n`,
		);
	}
}
