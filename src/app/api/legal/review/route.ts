import { withAuth, json, parseBody } from "@/lib/api/handler";
import { legalReviewSchema } from "@/lib/api/schemas";
import { reviewLegal } from "@/lib/services/compliance-service";

export const POST = withAuth("incidents:read", async (request) => {
  const body = await parseBody(request, legalReviewSchema);
  const finding = await reviewLegal(body.incidentId);
  return json({ finding }, 201);
});
