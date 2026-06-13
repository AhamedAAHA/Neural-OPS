import { withAuth, json } from "@/lib/api/handler";
import { startInvestigationWorkflow } from "@/lib/services/workflow-service";

export const POST = withAuth("incidents:manage", async (_request, { params }) => {
  const result = await startInvestigationWorkflow(params.id);
  return json(result);
});
