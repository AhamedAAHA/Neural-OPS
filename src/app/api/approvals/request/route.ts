import { withAuth, json, parseBody } from "@/lib/api/handler";
import { approvalRequestSchema } from "@/lib/api/schemas";
import { requestApproval } from "@/lib/services/approval-service";

export const POST = withAuth("approvals:request", async (request) => {
  const body = await parseBody(request, approvalRequestSchema);
  const approval = await requestApproval(body);
  return json({ approval }, 201);
});
