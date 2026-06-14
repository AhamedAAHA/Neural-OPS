import { config } from "dotenv";
import path from "node:path";
import { defineConfig, env } from "prisma/config";

config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

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
