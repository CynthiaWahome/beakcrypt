import Link from "next/link";
import { Suspense } from "react";
import AuthButton from "./auth-button";

export default function AuthPage() {
  return (
    <main className="flex flex-col gap-6 items-center justify-center min-h-screen max-w-xl mx-auto p-6">
      <Link href="/" className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center border border-[#5eead4]/50">
          <div className="h-2 w-2 rotate-45 bg-[#5eead4]" />
        </div>
        <span className="text-sm font-medium tracking-tight">beakcrypt</span>
      </Link>

      <Suspense
        fallback={
          <div className="h-10 w-full max-w-sm bg-muted animate-pulse rounded-md" />
        }
      >
        <AuthButton />
      </Suspense>

      <p className="text-sm text-center text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy.
      </p>
    </main>
  );
}
