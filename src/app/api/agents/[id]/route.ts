import { withAuth, json } from "@/lib/api/handler";
import { ApiNotFoundError } from "@/lib/auth/rbac";
import { getAgent } from "@/lib/services/agent-service";

export const GET = withAuth("incidents:read", async (_request, { params }) => {
  const agent = await getAgent(params.id);
  if (!agent) throw new ApiNotFoundError("Agent not found");
  return json({ agent });
});
