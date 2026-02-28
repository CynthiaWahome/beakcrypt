import { ConvexHttpClient } from "convex/browser";
import { type FunctionReference, type FunctionArgs, type FunctionReturnType } from "convex/server";
import { getAuthConfig, type AuthConfig } from "./global-config";
import { CliError } from "./errors";

let clientInstance: ConvexHttpClient | null = null;
let cachedAuth: AuthConfig | null = null;

async function getConvexToken(auth: AuthConfig): Promise<string> {
	const res = await fetch(`${auth.convexSiteUrl}/api/auth/convex/token`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Cookie: `better-auth.session_token=${auth.sessionToken}`,
		},
	});

	if (!res.ok) {
		throw new CliError(
			"Session expired. Please run `beakcrypt login` again.",
		);
	}

	const data = (await res.json()) as { token: string };
	return data.token;
}

export async function getClient(): Promise<ConvexHttpClient> {
	const auth = await getAuthConfig();
	if (!auth) {
		throw new CliError(
			"Not logged in. Run `beakcrypt login` first.",
		);
	}
	cachedAuth = auth;

	if (!clientInstance) {
		clientInstance = new ConvexHttpClient(auth.convexUrl);
	}

	const token = await getConvexToken(auth);
	clientInstance.setAuth(token);
	return clientInstance;
}

export async function query<F extends FunctionReference<"query">>(
	fn: F,
	args: FunctionArgs<F>,
): Promise<FunctionReturnType<F>> {
	const client = await getClient();
	return client.query(fn, args);
}

export async function mutation<F extends FunctionReference<"mutation">>(
	fn: F,
	args: FunctionArgs<F>,
): Promise<FunctionReturnType<F>> {
	const client = await getClient();
	return client.mutation(fn, args);
}

export function getSessionToken(): string | null {
	return cachedAuth?.sessionToken ?? null;
}

export function getSiteUrl(): string {
	if (!cachedAuth) throw new CliError("Not logged in.");
	return cachedAuth.siteUrl;
}
