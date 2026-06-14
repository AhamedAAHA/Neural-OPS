import { withAuth, json, parseBody } from "@/lib/api/handler";
import { workflowUpdateSchema } from "@/lib/api/schemas";
import { deleteWorkflow, updateWorkflow } from "@/lib/services/workflow-automation-service";

export const PATCH = withAuth("incidents:manage", async (request, { user, params }) => {
  const body = await parseBody(request, workflowUpdateSchema);
  const workflow = await updateWorkflow(user.organizationId, params.id, body);
  return json({ workflow });
});

export const DELETE = withAuth("incidents:manage", async (_request, { params }) => {
  await deleteWorkflow(params.id);
  return json({ ok: true });
});
