import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // A separate dist dir lets the Playwright web server run next to `pnpm dev`.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  images: {
    // Car photos are CC-licensed files hot-linked from Wikimedia Commons.
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org", pathname: "/wikipedia/commons/**" },
      { protocol: "https", hostname: "thumb.wikimedia.org", pathname: "/wikipedia/commons/**" },
    ],
  },
};

export default nextConfig;
