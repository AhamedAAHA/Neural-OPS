import { withAuth, json, parseBody } from "@/lib/api/handler";
import { approvalRespondSchema } from "@/lib/api/schemas";
import { respondToApproval } from "@/lib/services/approval-service";

export const POST = withAuth("approvals:respond", async (request, { user, params }) => {
  const body = await parseBody(request, approvalRespondSchema);
  const approval = await respondToApproval(params.id, user, body.decision, body.decisionNote);
  return json({ approval });
});
