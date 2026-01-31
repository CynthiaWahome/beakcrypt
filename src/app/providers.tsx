"use client";

import { env } from "~/env";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { RootProvider } from "fumadocs-ui/provider/next";
import { Analytics } from "@vercel/analytics/next";
import { ConvexReactClient } from "convex/react";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";
import { authClient } from "~/lib/auth-client";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

interface ProvidersProps {
  children: ReactNode;
  initialToken?: string | null;
}

const Providers = ({ children, initialToken }: ProvidersProps) => {
  return (
    <RootProvider>
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
    </RootProvider>
  );
};

export default Providers;
