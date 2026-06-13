import { withAuth, json, parseBody } from "@/lib/api/handler";
import { agentMessageSchema } from "@/lib/api/schemas";
import { sendAgentMessage } from "@/lib/services/agent-service";

export const POST = withAuth("incidents:read", async (request) => {
  const body = await parseBody(request, agentMessageSchema);
  const bandMessageId = await sendAgentMessage(body);
  return json({ bandMessageId }, 201);
});
