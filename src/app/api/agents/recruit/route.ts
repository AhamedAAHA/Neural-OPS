import { withAuth, json, parseBody } from "@/lib/api/handler";
import { recruitAgentSchema } from "@/lib/api/schemas";
import { recruitAgent } from "@/lib/services/agent-service";

export const POST = withAuth("agents:manage", async (request) => {
  const body = await parseBody(request, recruitAgentSchema);
  const agent = await recruitAgent(body.roomId, body.agentRole, body.incidentId);
  return json({ agent }, 201);
});
