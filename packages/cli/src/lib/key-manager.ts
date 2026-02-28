import ora from "ora";
import { generateKeyPair, unwrapOrgKey as cryptoUnwrapOrgKey } from "@beakcrypt/crypto";
import { api } from "@beakcrypt/convex";
import { query, mutation, getSessionToken } from "./convex-client";
import { getStoredKey, saveKey, updateWrappedOrgKey, type StoredKeyData } from "./key-store";
import { unwrapResult } from "./errors";
import * as output from "./output";

export async function ensureOrgKey(orgId: string): Promise<string> {
	const stored = await getStoredKey(orgId);

	if (stored?.wrappedOrgKey) {
		return await cryptoUnwrapOrgKey(stored.wrappedOrgKey, stored.privateKey);
	}

	if (stored?.keyId) {
		// Key exists but no wrapped org key — check backend for approval
		const keyResult = await query(api.keys.getMyKey, {
			orgId: orgId as never,
			publicKey: JSON.stringify(stored.publicKey),
		});
		const keyRecord = unwrapResult(keyResult);

		if (keyRecord?.status === "active" && keyRecord.wrappedOrgKey) {
			await updateWrappedOrgKey(orgId, keyRecord.wrappedOrgKey);
			return await cryptoUnwrapOrgKey(keyRecord.wrappedOrgKey, stored.privateKey);
		}

		if (keyRecord?.status === "pending") {
			return await waitForApproval(orgId, stored);
		}

		throw new Error(
			"Device key is not active. An admin may need to approve this device.",
		);
	}

	// No key pair — register new device
	return await registerNewDevice(orgId);
}

async function registerNewDevice(orgId: string): Promise<string> {
	const spinner = ora("Generating device keys...").start();
	const keyPair = await generateKeyPair();

	const sessionToken = getSessionToken();
	if (!sessionToken) throw new Error("Not logged in");

	spinner.text = "Registering device with organization...";

	const result = await mutation(api.keys.registerKey, {
		orgId: orgId as never,
		publicKey: JSON.stringify(keyPair.publicKey),
		sessionToken,
	});

	const keyRecord = unwrapResult(result);
	spinner.stop();

	const stored: StoredKeyData = {
		publicKey: keyPair.publicKey,
		privateKey: keyPair.privateKey,
		keyId: keyRecord._id,
		wrappedOrgKey: keyRecord.wrappedOrgKey,
	};

	await saveKey(orgId, stored);

	if (keyRecord.status === "active" && keyRecord.wrappedOrgKey) {
		output.success("Device registered and activated.");
		return await cryptoUnwrapOrgKey(keyRecord.wrappedOrgKey, keyPair.privateKey);
	}

	// Pending approval
	return await waitForApproval(orgId, stored);
}

async function waitForApproval(orgId: string, stored: StoredKeyData): Promise<string> {
	const spinner = ora("Waiting for admin to approve this device...").start();
	spinner.indent = 2;

	while (true) {
		await new Promise((r) => setTimeout(r, 5000));

		const result = await query(api.keys.getMyKey, {
			orgId: orgId as never,
			publicKey: JSON.stringify(stored.publicKey),
		});
		const keyRecord = unwrapResult(result);

		if (keyRecord?.status === "active" && keyRecord.wrappedOrgKey) {
			spinner.stop();
			await updateWrappedOrgKey(orgId, keyRecord.wrappedOrgKey);
			output.success("Device approved!");
			return await cryptoUnwrapOrgKey(keyRecord.wrappedOrgKey, stored.privateKey);
		}

		if (keyRecord?.status === "revoked") {
			spinner.stop();
			throw new Error("Device key was revoked. Re-run `beakcrypt login`.");
		}
	}
}
