import { prisma } from "@/lib/db";
import { ApiForbiddenError, ApiNotFoundError } from "./rbac";

export async function assertIncidentInOrganization(incidentId: string, organizationId: string) {
  const incident = await prisma.incident.findFirst({ where: { id: incidentId, organizationId } });
  if (!incident) throw new ApiNotFoundError("Incident not found in active organization");
  return incident;
}

export async function assertOrganizationAccess(requestedOrganizationId: string, activeOrganizationId: string, role: string) {
  if (role === "admin") return;
  if (requestedOrganizationId !== activeOrganizationId) {
    throw new ApiForbiddenError("Access denied for organization scope");
  }
}
