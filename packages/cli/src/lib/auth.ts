import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { URL } from "node:url";
import open from "open";
import ora from "ora";
import pc from "picocolors";
import { saveAuthConfig, type AuthConfig } from "./global-config";
import { CliError } from "./errors";
import * as output from "./output";

interface AuthResult {
  sessionToken: string;
}

function startCallbackServer(): Promise<{
  port: number;
  waitForToken: () => Promise<AuthResult>;
}> {
  return new Promise((resolve, reject) => {
    let resolveToken: (result: AuthResult) => void;
    const tokenPromise = new Promise<AuthResult>((res) => {
      resolveToken = res;
    });

    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://localhost`);

      if (url.pathname === "/callback") {
        const sessionToken = url.searchParams.get("session_token");
        if (sessionToken) {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end(`
						<html>
							<body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:system-ui;background:#0a0a0a;color:#fafafa">
								<div style="text-align:center">
									<h1>Authenticated!</h1>
									<p>You can close this tab and return to the terminal.</p>
								</div>
							</body>
						</html>
					`);
          resolveToken!({ sessionToken });
          setTimeout(() => server.close(), 500);
        } else {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Missing session_token parameter");
        }
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not found");
      }
    });

    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        reject(new Error("Failed to start callback server"));
        return;
      }
      resolve({
        port: addr.port,
        waitForToken: () => tokenPromise,
      });
    });

    server.on("error", reject);
  });
}

export async function loginFlow(
  siteUrl: string,
  convexUrl: string,
  convexSiteUrl: string,
): Promise<AuthConfig> {
  const { port, waitForToken } = await startCallbackServer();
  const callbackUrl = `http://localhost:${port}/callback`;
  const loginUrl = `${siteUrl}/auth/cli?callback=${encodeURIComponent(callbackUrl)}`;

  const isTTY = process.stdin.isTTY;

  if (isTTY) {
    output.info(`Opening browser to log in...`);
    console.log(`${pc.dim("If the browser doesn't open, visit:")}`);
    console.log(`${output.link(loginUrl)}\n`);

    try {
      await open(loginUrl);
    } catch {
      // Browser failed to open — URL already printed above
    }
  } else {
    console.log(`Visit this URL to log in:\n${output.link(loginUrl)}\n`);
  }

  const spinner = ora("Waiting for authentication...").start();

  const result = await waitForToken();
  spinner.stop();

  const config: AuthConfig = {
    sessionToken: result.sessionToken,
    convexUrl,
    convexSiteUrl,
    siteUrl,
  };

  await saveAuthConfig(config);
  return config;
}

export function getDefaultUrls(): {
  siteUrl: string;
  convexUrl: string;
  convexSiteUrl: string;
} {
  return {
    siteUrl: process.env.BEAKCRYPT_SITE_URL ?? "https://app.beakcrypt.com",
    convexUrl: process.env.BEAKCRYPT_CONVEX_URL ?? "",
    convexSiteUrl: process.env.BEAKCRYPT_CONVEX_SITE_URL ?? "",
  };
}

export function validateUrls(urls: {
  convexUrl: string;
  convexSiteUrl: string;
}): void {
  if (!urls.convexUrl) {
    throw new CliError(
      "BEAKCRYPT_CONVEX_URL is not configured.",
      "Set the BEAKCRYPT_CONVEX_URL environment variable or configure it in ~/.beakcrypt/auth.json",
    );
  }
  if (!urls.convexSiteUrl) {
    throw new CliError(
      "BEAKCRYPT_CONVEX_SITE_URL is not configured.",
      "Set the BEAKCRYPT_CONVEX_SITE_URL environment variable or configure it in ~/.beakcrypt/auth.json",
    );
  }
}
