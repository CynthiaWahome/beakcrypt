import type { NextConfig } from "next";
import { createMDX } from "fumadocs-mdx/next";
import { withMicrofrontends } from "@vercel/microfrontends/next/config";

const withMDX = createMDX();

const nextConfig: NextConfig = {
  basePath: "/docs",
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/:path*.mdx",
        destination: "/llms.mdx/docs/:path*",
      },
    ];
  },
};

export default withMicrofrontends(withMDX(nextConfig));
