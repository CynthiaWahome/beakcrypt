export {
	generateKeyPair,
	generateOrgKey,
	wrapOrgKey,
	unwrapOrgKey,
	encryptSecret,
	decryptSecret,
	type ExportedKeyPair,
} from "@beakcrypt/crypto";

const KEY_PAIR_PREFIX = "beakcrypt_kp_";

export function storeKeyPair(
	orgId: string,
	keyPair: import("@beakcrypt/crypto").ExportedKeyPair,
): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(`${KEY_PAIR_PREFIX}${orgId}`, JSON.stringify(keyPair));
}

export function getKeyPair(
	orgId: string,
): import("@beakcrypt/crypto").ExportedKeyPair | null {
	if (typeof window === "undefined") return null;
	const stored = localStorage.getItem(`${KEY_PAIR_PREFIX}${orgId}`);
	if (!stored) return null;

	try {
		return JSON.parse(stored) as import("@beakcrypt/crypto").ExportedKeyPair;
	} catch {
		return null;
	}
}

export function removeKeyPair(orgId: string): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(`${KEY_PAIR_PREFIX}${orgId}`);
}

export function hasKeyPair(orgId: string): boolean {
	if (typeof window === "undefined") return false;
	return localStorage.getItem(`${KEY_PAIR_PREFIX}${orgId}`) !== null;
}

const KEY_ID_PREFIX = "beakcrypt_kid_";

export function storeKeyId(orgId: string, keyId: string): void {
	if (typeof window === "undefined") return;
	localStorage.setItem(`${KEY_ID_PREFIX}${orgId}`, keyId);
}

export function getKeyId(orgId: string): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(`${KEY_ID_PREFIX}${orgId}`);
}

export function removeKeyId(orgId: string): void {
	if (typeof window === "undefined") return;
	localStorage.removeItem(`${KEY_ID_PREFIX}${orgId}`);
}
