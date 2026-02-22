"use client";

import { env } from "~/env";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { authClient } from "~/lib/auth-client";
import { ConvexReactClient } from "convex/react";
import { Analytics } from "@vercel/analytics/next";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

interface ProvidersProps {
  children: ReactNode;
  initialToken?: string | null;
}

const Providers = ({ children, initialToken }: ProvidersProps) => {
  return (
    <ThemeProvider
      enableSystem
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <ConvexBetterAuthProvider
        client={convex}
        authClient={authClient}
        initialToken={initialToken}
      >
        {children}
        <Analytics />
      </ConvexBetterAuthProvider>
    </ThemeProvider>
  );
};

export default Providers;
