import { withAuth, json, parseBody } from "@/lib/api/handler";
import { complianceReviewSchema } from "@/lib/api/schemas";
import { reviewCompliance } from "@/lib/services/compliance-service";

export const POST = withAuth("incidents:read", async (request) => {
  const body = await parseBody(request, complianceReviewSchema);
  const findings = await reviewCompliance(body.incidentId, body.regulations);
  return json({ findings }, 201);
});
