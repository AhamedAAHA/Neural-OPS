import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["three"],
};

export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
