"use client";

import { useState } from "react";
import { signIn } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";
import { useSearchParams } from "next/navigation";
import { Github, Loader2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";

export default function AuthButton() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isPending, setIsPending] = useState(false);
  const callbackURL = searchParams.get("callbackURL") || "/";

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      <Button
        size="lg"
        variant="outline"
        disabled={isPending}
        className="w-full"
        onClick={async () => {
          setIsPending(true);
          await signIn.social({
            callbackURL,
            provider: "github",
            newUserCallbackURL: "/onboarding",
            errorCallbackURL: "/auth",
          });
        }}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <Github className="h-4 w-4" />
            Continue With GitHub
          </>
        )}
      </Button>
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertTitle>Authentication Failed</AlertTitle>
          <AlertDescription>
            {error === "AccessDenied"
              ? "Access denied. You cancelled the sign in."
              : "Something went wrong. Please try again."}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
