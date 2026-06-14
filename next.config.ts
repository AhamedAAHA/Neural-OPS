import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
  output: "standalone",
};

export default nextConfig;

if (process.env.OPENNEXT_CLOUDFLARE_DEV === "true") {
  void import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());
}
