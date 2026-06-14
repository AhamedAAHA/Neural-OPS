import { withAuth, json } from "@/lib/api/handler";
import { getOperationsDashboardSnapshot } from "@/lib/observability/store";

export const GET = withAuth("audit:read", async (_request, { organizationId }) => {
  const dashboard = await getOperationsDashboardSnapshot(organizationId);
  return json({ dashboard });
}, { rateLimitKey: "operations:dashboard", rateLimitMax: 60 });
