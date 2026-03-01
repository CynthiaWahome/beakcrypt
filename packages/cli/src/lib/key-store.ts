import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getConfigDir } from "./global-config";

export interface StoredKeyData {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
  keyId: string;
  wrappedOrgKey?: string;
}

function getKeysDir(): string {
  return join(getConfigDir(), "keys");
}

function getKeyFile(orgId: string): string {
  return join(getKeysDir(), `${orgId}.json`);
}

export async function getStoredKey(
  orgId: string,
): Promise<StoredKeyData | null> {
  const file = getKeyFile(orgId);
  if (!existsSync(file)) return null;
  try {
    const data = await readFile(file, "utf-8");
    return JSON.parse(data) as StoredKeyData;
  } catch {
    return null;
  }
}

export async function saveKey(
  orgId: string,
  data: StoredKeyData,
): Promise<void> {
  const dir = getKeysDir();
  await mkdir(dir, { recursive: true });
  await writeFile(getKeyFile(orgId), JSON.stringify(data, null, 2), {
    mode: 0o600,
  });
}

export async function updateWrappedOrgKey(
  orgId: string,
  wrappedOrgKey: string,
): Promise<void> {
  const existing = await getStoredKey(orgId);
  if (!existing) throw new Error(`No key stored for org ${orgId}`);
  existing.wrappedOrgKey = wrappedOrgKey;
  await saveKey(orgId, existing);
}

export async function removeKey(orgId: string): Promise<void> {
  const file = getKeyFile(orgId);
  if (existsSync(file)) {
    await rm(file);
  }
}

export async function clearAllKeys(): Promise<void> {
  const dir = getKeysDir();
  if (existsSync(dir)) {
    await rm(dir, { recursive: true });
  }
}
