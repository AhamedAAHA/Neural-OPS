import { cache } from "react";
import { createPrismaClient } from "@/lib/prisma-client-factory";

export const getPrismaRuntime = cache(() => createPrismaClient());
