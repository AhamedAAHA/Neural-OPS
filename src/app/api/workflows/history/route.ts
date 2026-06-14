import { withAuth, json } from "@/lib/api/handler";
import { listWorkflowExecutions } from "@/lib/services/workflow-automation-service";

export const GET = withAuth("audit:read", async (_request, { user }) => {
  const executions = await listWorkflowExecutions(user.organizationId, 200);
  return json({ executions });
});
