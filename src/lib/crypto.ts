interface ExportedKeyPair {
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}
const RSA_ALGORITHM: RsaHashedKeyGenParams = {
  name: "RSA-OAEP",
  modulusLength: 4096,
  publicExponent: new Uint8Array([1, 0, 1]),
  hash: "SHA-256",
};

const AES_ALGORITHM = "AES-GCM";
const AES_KEY_LENGTH = 256;
const IV_BYTE_LENGTH = 12;

const KEY_PAIR_PREFIX = "beakcrypt_kp_";

export async function generateKeyPair(): Promise<ExportedKeyPair> {
  const keyPair = await crypto.subtle.generateKey(RSA_ALGORITHM, true, [
    "wrapKey",
    "unwrapKey",
  ]);

  const [publicKey, privateKey] = await Promise.all([
    crypto.subtle.exportKey("jwk", keyPair.publicKey),
    crypto.subtle.exportKey("jwk", keyPair.privateKey),
  ]);

  return { publicKey, privateKey };
}

export async function generateOrgKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );

  const raw = await crypto.subtle.exportKey("raw", key);
  return bufferToBase64(raw);
}

export async function wrapOrgKey(
  orgKeyBase64: string,
  publicKeyJwk: JsonWebKey,
): Promise<string> {
  const publicKey = await crypto.subtle.importKey(
    "jwk",
    publicKeyJwk,
    RSA_ALGORITHM,
    false,
    ["wrapKey"],
  );

  const orgKey = await crypto.subtle.importKey(
    "raw",
    base64ToBuffer(orgKeyBase64),
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );

  const wrapped = await crypto.subtle.wrapKey("raw", orgKey, publicKey, {
    name: "RSA-OAEP",
  });

  return bufferToBase64(wrapped);
}

export async function unwrapOrgKey(
  wrappedKeyBase64: string,
  privateKeyJwk: JsonWebKey,
): Promise<string> {
  const privateKey = await crypto.subtle.importKey(
    "jwk",
    privateKeyJwk,
    RSA_ALGORITHM,
    false,
    ["unwrapKey"],
  );

  const orgKey = await crypto.subtle.unwrapKey(
    "raw",
    base64ToBuffer(wrappedKeyBase64),
    privateKey,
    { name: "RSA-OAEP" },
    { name: AES_ALGORITHM, length: AES_KEY_LENGTH },
    true,
    ["encrypt", "decrypt"],
  );

  const raw = await crypto.subtle.exportKey("raw", orgKey);
  return bufferToBase64(raw);
}

export async function encryptSecret(
  plaintext: string,
  orgKeyBase64: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBuffer(orgKeyBase64),
    { name: AES_ALGORITHM },
    false,
    ["encrypt"],
  );

  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
  const encoded = new TextEncoder().encode(plaintext);

  const ciphertext = await crypto.subtle.encrypt(
    { name: AES_ALGORITHM, iv },
    key,
    encoded,
  );

  return `${bufferToBase64(iv.buffer)}:${bufferToBase64(ciphertext)}`;
}
export async function decryptSecret(
  encryptedValue: string,
  orgKeyBase64: string,
): Promise<string> {
  const [ivBase64, ciphertextBase64] = encryptedValue.split(":");
  if (!ivBase64 || !ciphertextBase64) {
    throw new Error(
      "Invalid encrypted value format — expected 'iv:ciphertext'",
    );
  }

  const key = await crypto.subtle.importKey(
    "raw",
    base64ToBuffer(orgKeyBase64),
    { name: AES_ALGORITHM },
    false,
    ["decrypt"],
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: AES_ALGORITHM, iv: base64ToBuffer(ivBase64) },
    key,
    base64ToBuffer(ciphertextBase64),
  );

  return new TextDecoder().decode(decrypted);
}

export function storeKeyPair(orgId: string, keyPair: ExportedKeyPair): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${KEY_PAIR_PREFIX}${orgId}`, JSON.stringify(keyPair));
}

export function getKeyPair(orgId: string): ExportedKeyPair | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(`${KEY_PAIR_PREFIX}${orgId}`);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ExportedKeyPair;
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

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
