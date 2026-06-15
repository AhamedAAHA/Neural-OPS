import { config } from "dotenv";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

const root = process.cwd();
config({ path: path.resolve(root, ".env") });
config({ path: path.resolve(root, ".env.local") });
config({ path: path.resolve(root, ".env.development.local") });
config({ path: path.resolve(root, ".env.production.local") });

function withAppSchema(url: string) {
  if (!url) return url;
  if (url.includes("schema=")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}schema=neural_ops`;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: withAppSchema(env("DIRECT_URL")),
  },
});
