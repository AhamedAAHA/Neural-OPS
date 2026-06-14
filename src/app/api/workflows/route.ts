import { withAuth, json, parseBody } from "@/lib/api/handler";
import { workflowCreateSchema } from "@/lib/api/schemas";
import { createWorkflow, listWorkflows } from "@/lib/services/workflow-automation-service";

export const GET = withAuth("audit:read", async (_request, { user }) => {
  const workflows = await listWorkflows(user.organizationId);
  return json({ workflows });
});

export const POST = withAuth("incidents:manage", async (request, { user }) => {
  const body = await parseBody(request, workflowCreateSchema);
  const workflow = await createWorkflow(user, body);
  return json({ workflow }, 201);
});
