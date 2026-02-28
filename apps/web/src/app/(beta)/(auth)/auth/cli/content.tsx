"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle } from "lucide-react";

export default function CliAuthContent({
	callback,
	isAuthenticated,
}: {
	callback: string;
	isAuthenticated: boolean;
}) {
	const [status, setStatus] = useState<"loading" | "done" | "error">(
		isAuthenticated ? "loading" : "error",
	);

	useEffect(() => {
		if (!isAuthenticated) return;

		async function handoff() {
			try {
				const res = await fetch("/api/auth/cli/token");
				if (!res.ok) {
					setStatus("error");
					return;
				}

				const data = await res.json();
				const url = new URL(callback);
				url.searchParams.set("session_token", data.sessionToken);
				window.location.href = url.toString();
				setStatus("done");
			} catch {
				setStatus("error");
			}
		}

		handoff();
	}, [callback, isAuthenticated]);

	if (status === "error") {
		return (
			<p className="text-sm text-destructive">
				Failed to authenticate CLI. Please try again.
			</p>
		);
	}

	if (status === "done") {
		return (
			<div className="flex flex-col items-center gap-2">
				<CheckCircle className="h-8 w-8 text-green-500" />
				<p className="text-sm text-muted-foreground">
					Authenticated! You can close this tab.
				</p>
			</div>
		);
	}

	return (
		<div className="flex items-center gap-2">
			<Loader2 className="h-4 w-4 animate-spin" />
			<p className="text-sm text-muted-foreground">
				Authenticating CLI...
			</p>
		</div>
	);
}
