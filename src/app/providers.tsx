"use client";

import { env } from "~/env";
import { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(env.NEXT_PUBLIC_CONVEX_URL);

const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider
      enableSystem
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <ConvexProvider client={convex}>{children}</ConvexProvider>
    </ThemeProvider>
  );
};

export default Providers;
