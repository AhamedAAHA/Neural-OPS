import { withAuth, json } from "@/lib/api/handler";
import { prisma } from "@/lib/db";

export const GET = withAuth(null, async (_request, { user }) => {
  const organizations = user.role === "admin"
    ? await prisma.organization.findMany({ orderBy: { name: "asc" }, take: 100 })
    : await prisma.organization.findMany({ where: { id: user.organizationId }, orderBy: { name: "asc" }, take: 1 });

  return json({ organizations, activeOrganizationId: user.organizationId });
});
