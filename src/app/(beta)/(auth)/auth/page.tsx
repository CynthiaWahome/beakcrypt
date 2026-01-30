"use client";

import Link from "next/link";
import { Github } from "lucide-react";
import { signIn } from "~/lib/auth-client";
import { Button } from "~/components/ui/button";

export default function AuthPage() {
  return (
    <main className="flex flex-col gap-6 items-center justify-center min-h-screen max-w-xl mx-auto p-6">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center border border-[#5eead4]/50">
          <div className="h-2 w-2 rotate-45 bg-[#5eead4]" />
        </div>
        <span className="text-sm font-medium tracking-tight">beakcrypt</span>
      </Link>

      <Button
        size="lg"
        variant="outline"
        className="w-full max-w-sm"
        onClick={() =>
          signIn.social({ provider: "github", callbackURL: "/dashboard" })
        }
      >
        <Github className="h-4 w-4" />
        Continue With GitHub
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </main>
  );
}
