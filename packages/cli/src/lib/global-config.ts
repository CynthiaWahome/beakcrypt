import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface AuthConfig {
  sessionToken: string;
  convexUrl: string;
  convexSiteUrl: string;
  siteUrl: string;
}

const CONFIG_DIR = join(homedir(), ".beakcrypt");
const AUTH_FILE = join(CONFIG_DIR, "auth.json");

export function getConfigDir(): string {
  return CONFIG_DIR;
}

export async function ensureConfigDir(): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
}

export async function getAuthConfig(): Promise<AuthConfig | null> {
  if (!existsSync(AUTH_FILE)) return null;
  try {
    const data = await readFile(AUTH_FILE, "utf-8");
    return JSON.parse(data) as AuthConfig;
  } catch {
    return null;
  }
}

export async function saveAuthConfig(config: AuthConfig): Promise<void> {
  await ensureConfigDir();
  await writeFile(AUTH_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

export async function clearAuthConfig(): Promise<void> {
  if (existsSync(AUTH_FILE)) {
    await rm(AUTH_FILE);
  }
}

export async function clearAllConfig(): Promise<void> {
  if (existsSync(CONFIG_DIR)) {
    await rm(CONFIG_DIR, { recursive: true });
  }
}

export function isLoggedIn(): boolean {
  return existsSync(AUTH_FILE);
}
