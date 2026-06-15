import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  output: "standalone",
  serverExternalPackages: ["@prisma/client", ".prisma/client", "@prisma/adapter-pg", "pg"],
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/.prisma/client/**/*",
      "./node_modules/@prisma/client/**/*",
      "./node_modules/pg/**/*",
      "./node_modules/@prisma/adapter-pg/**/*",
    ],
  },
};

export default nextConfig;

if (process.env.OPENNEXT_CLOUDFLARE_DEV === "true") {
  void import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
