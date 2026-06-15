import type { NextConfig } from "next";
import path from "path";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

// Monorepo root (two levels up from apps/web) — fixes workspace-root inference
// and ensures the standalone Docker output traces workspace dependencies.
const monorepoRoot = path.join(__dirname, "..", "..");

const nextConfig: NextConfig = {
  // standalone output is for self-hosting/Docker (Fly.io). Netlify uses its own
  // Next adapter and must NOT receive standalone output.
  ...(process.env.NETLIFY ? {} : { output: "standalone" as const }),
  outputFileTracingRoot: monorepoRoot,
  turbopack: { root: monorepoRoot },
  transpilePackages: ["@tokenforge/ui", "@tokenforge/shared", "@tokenforge/db"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
