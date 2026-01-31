"use client";

import { env } from "~/env";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { authClient } from "~/lib/auth-client";
import { ConvexReactClient } from "convex/react";
import { Analytics } from "@vercel/analytics/next";
import { RootProvider } from "fumadocs-ui/provider/next";
import { ConvexBetterAuthProvider } from "@convex-dev/better-auth/react";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

interface ProvidersProps {
  children: ReactNode;
  initialToken?: string | null;
}

const Providers = ({ children, initialToken }: ProvidersProps) => {
  return (
    <RootProvider theme={{ enabled: false }}>
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
